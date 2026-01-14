import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Image,
  RefreshControl,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AmazonProgressBar from '../components/AmazonProgressBar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PHP_API_URL } from '../config/apiConfig';
// using native ScrollView to support RefreshControl

interface TicketDetailProps {
  ticketId: string;
  onBack: () => void;
}

interface ProgressItem {
  id: string;
  message: string;
  timestamp: string;
  status: string;
  updated_by?: string;
}

interface TicketDetail {
  id: string;
  title: string;
  description: string;
  status: 'Open' | 'Assigned' | 'In progress' | 'Resolved' | 'Closed';
  priority: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  assignedToName?: string;
  assignedToRole?: string;
  clientName: string;
  licenseNo: string;
  mobileNo: string;
  progress: ProgressItem[];
  progressPercentage: number;
  attachment?: string;
  attachmentUrl?: string;
  resolutionNote?: string;
  rejectReason?: string;
}

const TicketDetailScreen: React.FC<TicketDetailProps> = ({ ticketId, onBack }) => {
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const scrollRef = useRef<ScrollView | null>(null);
  const lastOffsetY = useRef(0);
  const [isRegisteredClient, setIsRegisteredClient] = useState<boolean>(true);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewUri, setPreviewUri] = useState<string>('');

  useEffect(() => {
    loadTicketDetail();
  }, [ticketId]);

  const loadTicketDetail = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    try {
      const clientData = await AsyncStorage.getItem('client_data');
      if (!clientData) {
        Alert.alert('Error', 'Please login again');
        return;
      }

      const client = JSON.parse(clientData);
      setIsRegisteredClient(!!(client?.is_registered === 1 || client?.is_registered === true));
      const normalizeMobile = (m: string) => {
        if (!m) return '';
        const digits = (m + '').replace(/\D/g, '');
        return digits.slice(-10);
      };
      const mobile10 = normalizeMobile(client.mobile_no || client.mobileNumber || '');

      // First attempt: send with client_id + license_no + mobile_no
      let response = await fetch(`${PHP_API_URL}client_get_ticket_detail.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ticket_id: ticketId,
          client_id: client.cid,
          license_no: client.license_no,
          mobile_no: mobile10
        })
      });

      let result = await response.json();
      
      // If not found, retry assuming unregistered flow: omit client_id and include both key styles
      if (!result.success) {
        try {
          response = await fetch(`${PHP_API_URL}client_get_ticket_detail.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ticket_id: ticketId,
              // omit client_id to force fallback on server
              license_no: client.license_no || client.licenseNumber || '',
              mobile_no: mobile10,
              // also send camelCase in case API expects these keys
              licenseNumber: client.license_no || client.licenseNumber || '',
              mobileNumber: mobile10
            })
          });
          result = await response.json();
        } catch (e) {
          // ignore retry network errors
        }
      }
      
      if (result.success && result.data) {
        const ticketData = result.data.ticket;
        const dbStatus = ticketData.status || 'Open';
        const pct = Math.max(0, Math.min(100, ticketData.progress_percentage || 0));
        
        // Compute display status (same logic as dashboard)
        let displayStatus: 'Open' | 'Assigned' | 'In progress' | 'Resolved' | 'Closed' = 'Open';
        const statusLower = dbStatus.toLowerCase().trim();
        if (statusLower === 'closed' || statusLower === 'rejected') {
          displayStatus = 'Closed';
        } else if (statusLower === 'open' && pct === 0) {
          displayStatus = 'Open';
        } else if (pct <= 33) {
          displayStatus = 'Assigned';
        } else if (pct <= 66) {
          displayStatus = 'In progress';
        } else {
          displayStatus = 'Resolved';
        }
        
        console.log('📋 DB Status:', dbStatus, 'Progress:', pct + '%');
        console.log('📋 Display Status:', displayStatus);
        console.log('🎨 Status Color:', getStatusColor(displayStatus));
        
        setTicket({
          id: ticketData.ticket_id,
          title: ticketData.issue_title,
          description: ticketData.issue_description || '',
          status: displayStatus,
          priority: ticketData.priority || 'Medium',
          createdAt: ticketData.created_at,
          updatedAt: ticketData.updated_at || ticketData.created_at,
          assignedTo: ticketData.assigned_to,
          assignedToName: ticketData.assigned_to_name || '',
          assignedToRole: ticketData.assigned_to_role || '',
          clientName: ticketData.client_name,
          licenseNo: ticketData.license_no,
          mobileNo: ticketData.mobile_no,
          progress: ticketData.progress_timeline || [],
          progressPercentage: ticketData.progress_percentage || 0,
          attachment: ticketData.attachment || '',
          attachmentUrl: ticketData.attachment_url || '',
          resolutionNote: ticketData.resolution_note || ticketData.resolution_notes || '',
          rejectReason: ticketData.reject_reason || ticketData.rejection_reason || ''
        });
      } else {
        Alert.alert('Error', result.message || 'Failed to load ticket details');
      }
    } catch (error) {
      console.error('Load ticket detail error:', error);
      Alert.alert('Error', 'Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const s = (status || '').toLowerCase().trim();
    if (s === 'open') return '#f59e0b'; // Orange - newly created
    if (s === 'assigned') return '#8b5cf6'; // Purple - assigned to team member
    if (s === 'in progress' || s === 'in-progress') return '#3b82f6'; // Blue - communication in process
    if (s === 'resolved' || s === 'completed') return '#10b981'; // Green - resolved with OTP
    if (s === 'closed' || s === 'rejected') return '#ef4444'; // Red - rejected/closed
    return '#6b7280'; // Default gray
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return '#ef4444';
      case 'Medium': return '#f59e0b';
      case 'Low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleRefresh = async () => {
    console.log('🔄 Refreshing ticket details...');
    setRefreshing(true);
    try {
      await loadTicketDetail(false); // Don't show loading spinner during refresh
      console.log('✅ Ticket details refreshed successfully');
    } finally {
      setRefreshing(false);
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTo({ y: lastOffsetY.current, animated: false });
        }
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  if (!ticket) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        onScroll={(e) => { lastOffsetY.current = e.nativeEvent.contentOffset.y || 0; }}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ticket Details</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Ticket Info Card */}
        <View style={styles.ticketCard}>
          <View style={styles.ticketHeader}>
            <Text style={styles.ticketId}>{ticket.id}</Text>
            <View style={[styles.statusBadge, { 
              backgroundColor: getStatusColor(ticket.status),
              elevation: 2,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.2,
              shadowRadius: 2,
            }]}>
              <Text style={styles.statusText}>{ticket.status}</Text>
            </View>
          </View>

          <Text style={styles.ticketTitle}>{ticket.title}</Text>
          <Text style={styles.ticketDescription}>{ticket.description}</Text>

          {!!ticket.attachment && (
            <View style={styles.attachmentContainer}>
              <Text style={styles.attachmentLabel}>Attachment</Text>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => {
                  console.log('🖼️ Attachment tapped');
                  const uri = (() => {
                    const abs = ticket.attachmentUrl || '';
                    if (abs) return abs;
                    let p = ticket.attachment || '';
                    if (p.startsWith('tally/uploads/')) {
                      p = p.replace(/^tally\//, '');
                    }
                    if (!p) return '';
                    if (p.startsWith('http')) return p;
                    const base = PHP_API_URL.endsWith('/') ? PHP_API_URL : PHP_API_URL + '/';
                    const root = base.replace(/\/backend\/?$/i, '');
                    if (Platform.OS === 'web' && typeof window !== 'undefined') {
                      return `${window.location.origin}/${p}`;
                    }
                    return `${root}${p}`;
                  })();
                  if (uri) {
                    setPreviewUri(uri);
                    setPreviewVisible(true);
                  }
                }}
              >
                <Image
                  source={{ uri: (() => {
                    const abs = ticket.attachmentUrl || '';
                    if (abs) return abs;
                    let p = ticket.attachment || '';
                    // Normalize legacy paths stored as 'tally/uploads/...'
                    if (p.startsWith('tally/uploads/')) {
                      p = p.replace(/^tally\//, '');
                    }
                    if (!p) return '';
                    if (p.startsWith('http')) return p;
                    // Build from site root: strip '/backend/' from PHP_API_URL
                    const base = PHP_API_URL.endsWith('/') ? PHP_API_URL : PHP_API_URL + '/';
                    const root = base.replace(/\/backend\/?$/i, '');
                    if (Platform.OS === 'web' && typeof window !== 'undefined') {
                      return `${window.location.origin}/${p}`;
                    }
                    return `${root}${p}`;
                  })() }}
                  style={styles.attachmentImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.ticketMeta}>
            <View style={styles.metaRow}>
              <Ionicons name="calendar" size={16} color="#6b7280" />
              <Text style={styles.metaLabel}>Created:</Text>
              <Text style={styles.metaValue}>{formatDate(ticket.createdAt)}</Text>
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="time" size={16} color="#6b7280" />
              <Text style={styles.metaLabel}>Updated:</Text>
              <Text style={styles.metaValue}>{formatDate(ticket.updatedAt)}</Text>
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="person" size={16} color="#6b7280" />
              <Text style={styles.metaLabel}>Assigned to:</Text>
              <Text style={styles.metaValue}>
                {ticket.assignedToName || 'Not assigned'}
              </Text>
            </View>

            {/* Resolution Note with badge */}
            {(ticket.status || '').toLowerCase().includes('resolved') && !!ticket.resolutionNote ? (
              <View style={styles.metaRow}>
                <View style={[styles.statusBadge, { backgroundColor: '#10b981' }]}>
                  <Text style={styles.statusText}>Resolved</Text>
                </View>
                <Text style={[styles.metaValue, { color: '#059669', flex: 1 }]}>{ticket.resolutionNote}</Text>
              </View>
            ) : null}

            {/* Rejection Reason with badge */}
            {!!ticket.rejectReason ? (
              <View style={styles.metaRow}>
                <Text style={[styles.metaValue, { color: '#dc2626', flex: 1 }]}>{ticket.rejectReason}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Progress Section */}
        <View style={styles.progressCard}>
          {/* Stage circles */}
          {ticket && (() => {
            const pct = Math.max(0, Math.min(100, ticket.progressPercentage || 0));
            const ns = (ticket.status || '').toString().trim().toLowerCase();
            const isClosed = ns === 'closed' || ns === 'rejected';
            let steps: any[] = [];
            let currentStep = 2;
            if (isClosed) {
              // Determine achieved stage before closing
              const achievedIdx = (pct === 0) ? 0 : (pct <= 33 ? 1 : 2);
              steps = [
                { title: 'Open',        completed: achievedIdx >= 0, current: achievedIdx >= 0 },
                { title: 'Assigned',    completed: achievedIdx >= 1, current: achievedIdx >= 1 },
                { title: 'In Progress', completed: achievedIdx >= 2, current: achievedIdx >= 2 },
                { title: 'Closed',      completed: false,            current: false, danger: true },
              ];
              currentStep = 4;
            } else {
              steps = [
                { title: 'Open',        completed: pct > 0,  current: pct === 0 },
                { title: 'Assigned',    completed: pct > 33, current: pct >= 1 && pct <= 33 },
                { title: 'In Progress', completed: pct > 66, current: pct >= 34 && pct <= 66 },
                { title: 'Resolved',    completed: pct === 100, current: pct >= 67 && pct < 100 },
              ];
              currentStep = pct >= 67 ? 4 : pct >= 34 ? 3 : 2; // 1 is open
            }
            return (
              <AmazonProgressBar steps={steps} currentStep={currentStep} />
            );
          })()}

          {ticket.progress.length > 0 ? (
            <View style={styles.timelineContainer}>
              {ticket.progress.map((item, index) => (
                <View key={item.id || index} style={styles.timelineItem}>
                  <View style={styles.timelineDot} />
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineMessage}>{item.message}</Text>
                    <Text style={styles.timelineDate}>{formatDate(item.timestamp)}</Text>
                    {item.updated_by && (
                      <Text style={styles.timelineBy}>by {item.updated_by}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          ) : (ticket.progressPercentage || 0) > 0 ? (
            <></>
          ) : ticket.status === 'Assigned' ? (
            <></>
          ) : (
            <></>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actionsCard}>
          <TouchableOpacity style={styles.refreshButton} onPress={() => loadTicketDetail()}>
            <Ionicons name="refresh" size={20} color="#3b82f6" />
            <Text style={styles.refreshButtonText}>Refresh Details</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Image Preview Modal */}
      {Platform.OS === 'web' ? (
        previewVisible ? (
          <View style={styles.previewBackdrop}>
            <TouchableOpacity style={styles.previewBackdrop} activeOpacity={1} onPress={() => setPreviewVisible(false)}>
              <View style={styles.previewContainer}>
                {!!previewUri && (
                  <Image source={{ uri: previewUri }} style={styles.previewImage} resizeMode="contain" />
                )}
                <TouchableOpacity style={styles.previewClose} onPress={() => setPreviewVisible(false)}>
                  <Ionicons name="close" size={22} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </View>
        ) : null
      ) : (
        <Modal
          visible={previewVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setPreviewVisible(false)}
        >
          <View style={styles.previewBackdrop}>
            <TouchableOpacity style={styles.previewBackdrop} activeOpacity={1} onPress={() => setPreviewVisible(false)}>
              <View style={styles.previewContainer}>
                {!!previewUri && (
                  <Image source={{ uri: previewUri }} style={styles.previewImage} resizeMode="contain" />
                )}
                <TouchableOpacity style={styles.previewClose} onPress={() => setPreviewVisible(false)}>
                  <Ionicons name="close" size={22} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 4,
    paddingVertical: 12,
    gap: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  header: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.15)'
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 30,
  },
  ticketCard: {
    backgroundColor: '#ffffff',
    // use parent padding to avoid side clipping
    marginBottom: 12,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  progressCard: {
    backgroundColor: 'transparent',
    // borderless container to prevent double borders around progress bar
    marginBottom: 12,
    borderRadius: 0,
    padding: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ticketId: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    minHeight: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  attachmentContainer: {
    marginTop: 8,
    marginBottom: 12,
  },
  attachmentLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 6,
    fontWeight: '600',
  },
  attachmentImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  loadingText: {
    marginTop: 16,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  ticketTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 6,
    lineHeight: 24,
  },
  ticketDescription: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 22,
  },
  ticketMeta: {
    marginTop: 8,
    gap: 8,
  },
  reasonBoxSuccess: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    gap: 6,
  },
  reasonBoxDanger: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    gap: 6,
  },
  reasonTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  reasonText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaLabel: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  metaValue: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '600',
  },
  progressCardUnused: {
    backgroundColor: '#ffffff',
    // use parent padding to avoid side clipping
    marginBottom: 12,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  timelineContainer: {
    gap: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3b82f6',
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
  },
  timelineMessage: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
    marginBottom: 4,
  },
  timelineDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  timelineBy: {
    fontSize: 12,
    color: '#8b5cf6',
    fontStyle: 'italic',
  },
  noProgressContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noProgressText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },
  clientCard: {
    backgroundColor: '#ffffff',
    // use parent padding to avoid side clipping
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  clientTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  clientInfo: {
    gap: 12,
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clientLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    minWidth: 60,
  },
  clientValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '600',
  },
  actionsCard: {
    backgroundColor: '#ffffff',
    // use parent padding to avoid side clipping
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3b82f6',
    backgroundColor: '#f0f9ff',
  },
  refreshButtonText: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '600',
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
  },
  bottomSpacer: {
    height: 24,
  },
  // Image preview overlay styles
  previewBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  previewContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '90%',
    height: '80%',
  },
  previewClose: {
    position: 'absolute',
    top: 24,
    right: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 18,
    padding: 8,
  },
});

export default TicketDetailScreen;
