import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  FlatList,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PHP_API_URL } from '../config/apiConfig';
import SimpleFixedNav from '../components/SimpleFixedNav';
import ForceScrollView from '../components/ForceScrollView';
import CreateTicketScreen from './CreateTicketScreen';
import ProfileScreen from './ProfileScreen';
import TicketDetailScreen from './TicketDetailScreen';
import AskMeScreen from './AskMeScreen';
import AppHeader from '../components/AppHeader';
import AmazonProgressBar from '../components/AmazonProgressBar';
import FloatingActionButton from '../components/FloatingActionButton';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: 'Open' | 'Assigned' | 'In progress' | 'Resolved' | 'Closed';
  assignedTo?: string;
  createdAt: string;
  progress?: any[];
  progressPercentage?: number;
  attachment?: string; // Added attachment field
}

interface TicketStats {
  total: number;
  open: number;
  assigned: number;
  inProgress: number;
  resolved: number;
  closed: number;
}

interface ClientDashboardProps {
  clientData: {
    licenseNumber: string;
    mobileNumber: string;
  };
  onLogout: () => void;
}

const ClientDashboard: React.FC<ClientDashboardProps> = ({
  clientData,
  onLogout,
}) => {
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [showTicketConfirmation, setShowTicketConfirmation] = useState(false);
  const [generatedTicketId, setGeneratedTicketId] = useState('');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [loggedInClient, setLoggedInClient] = useState<any>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [stats, setStats] = useState<TicketStats>({
    total: 0,
    open: 0,
    assigned: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0
  });
  const [ticketFilter, setTicketFilter] = useState<'All' | 'Open' | 'Assigned' | 'In progress' | 'Resolved' | 'Closed'>('All');
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [pendingFilter, setPendingFilter] = useState<'All' | 'Open' | 'Assigned' | 'In progress' | 'Resolved' | 'Closed'>(ticketFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Form states for raising new ticket
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    attachments: [] as DocumentPicker.DocumentPickerAsset[],
  });
  
  // Focus states for placeholders
  const [focusStates, setFocusStates] = useState({
    title: false,
    description: false,
  });

  const clientInfo = {
    name: 'Demo User',
    licenseNumber: clientData.licenseNumber,
  };

  // Load client data on mount
  useEffect(() => {
    loadClientData();
    // Restore last UI state so refresh keeps the user on the same screen
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('dashboard_state');
        if (saved) {
          const st = JSON.parse(saved);
          if (st?.activeTab) setActiveTab(st.activeTab);
          if (st?.selectedTicketId) setSelectedTicketId(st.selectedTicketId);
          if (typeof st?.showTicketConfirmation === 'boolean') setShowTicketConfirmation(st.showTicketConfirmation);
        }
      } catch (e) {
        // ignore restore errors
      } finally {
        loadTickets();
      }
    })();
  }, []);

  // Load client data from storage
  const loadClientData = async () => {
    try {
      let clientData = await AsyncStorage.getItem('client_data');
      if (!clientData) {
        clientData = await AsyncStorage.getItem('user_data');
      }
      
      console.log('=== MY TICKETS DEBUG ===');
      console.log('Raw client_data from storage:', clientData);
      
      if (clientData) {
        const client = JSON.parse(clientData);
        console.log('Parsed client data:', client);
        console.log('License from data:', client.license_no || client.licenseNumber);
        console.log('Mobile from data:', client.mobile_no || client.mobileNumber);
        console.log('Expiry date (edate):', client.edate);
        console.log('Expiry date (expiry_date):', client.expiry_date);
        setLoggedInClient(client);
      } else {
        console.log('No client data found in AsyncStorage');
      }
    } catch (error) {
      console.error('Error loading client data:', error);
    }
  };

  // Load tickets from PHP API
  const loadTickets = async () => {
    setLoading(true);
    try {
      // Get client data from storage (from your existing OTP login)
      let clientData = await AsyncStorage.getItem('client_data');
      if (!clientData) {
        clientData = await AsyncStorage.getItem('user_data');
      }
      
      let client = null;
      if (clientData) {
        try {
          client = JSON.parse(clientData);
          setLoggedInClient(client); // Store the logged-in client data
        } catch (e) {
          console.log('Error parsing client data:', e);
        }
      }

      // Call client-specific API with client info from OTP login
      const response = await fetch(`${PHP_API_URL}client_get_tickets.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: client?.cid || client?.client_id || '',
          license_no: client?.license_no || client?.licenseNumber || ''
        })
      });
      
      const text = await response.text();
      if (!text) {
        throw new Error('EMPTY_RESPONSE');
      }
      let result: any;
      try {
        result = JSON.parse(text);
      } catch (e) {
        throw new Error('INVALID_JSON');
      }
      
      if (result.success) {
        const convertedTickets: Ticket[] = result.data.tickets.map((t: any) => ({
          id: t.ticket_id,
          title: t.issue_title,
          description: t.issue_description || '',
          status: t.status as 'Open' | 'Assigned' | 'In progress' | 'Resolved' | 'Closed',
          createdAt: t.created_at,
          progress: t.progress_timeline || [],
          progressPercentage: typeof t.progress_percentage === 'number' ? t.progress_percentage : 0,
          attachment: t.attachment || '',
        }));
        setTickets(convertedTickets);
        
        // Update stats from API response with all 5 statuses
        const apiStats = result.data.statistics;
        setStats({
          total: apiStats.total_tickets || 0,
          open: apiStats.by_status?.['Open'] || 0,
          assigned: apiStats.by_status?.['Assigned'] || 0,
          inProgress: apiStats.by_status?.['In Progress'] || 0,
          resolved: apiStats.by_status?.['Resolved'] || 0,
          closed: apiStats.by_status?.['Closed'] || 0
        });
      } else {
        Alert.alert('Error', result.message || 'Failed to load tickets');
      }
    } catch (error: any) {
      console.error('Load tickets error:', error);
      const msg = (error?.message === 'EMPTY_RESPONSE' || error?.message === 'INVALID_JSON')
        ? '❌ Something went wrong on the server. Please try again later.'
        : (error.message || 'Failed to load tickets');
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  // Derived values for header subtitle
  const displayName = loggedInClient?.organization || loggedInClient?.client_name || loggedInClient?.contact_person || 'User';
  const isRegistered = loggedInClient?.is_registered === 1 || loggedInClient?.is_registered === true;
  const licenseNo = loggedInClient?.license_no || loggedInClient?.licenseNumber || '';

  const handleRefresh = async () => {
    setRefreshing(true);
    const start = Date.now();
    try {
      // Reload based on current view
      if (selectedTicketId) {
        // Reload tickets so when user goes back, they see updated list
        await loadTickets();
      } else if (activeTab === 'dashboard' || activeTab === 'tickets') {
        await loadTickets();
      }
    } finally {
      const elapsed = Date.now() - start;
      const remain = 1500 - elapsed;
      if (remain > 0) {
        await new Promise(r => setTimeout(r, remain));
      }
      setRefreshing(false);
    }
  };

  // Reverted detailed helpers
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return '#f59e0b';
      case 'Assigned': return '#8b5cf6';
      case 'In progress': return '#3b82f6';
      case 'Resolved': return '#10b981';
      case 'Closed': return '#ef4444';
      default: return '#6b7280';
    }
  };

  // Normalize backend status strings to canonical labels used in UI
  const normalizeStatus = (s?: string) => {
    const v = (s || '').toString().trim().toLowerCase();
    if (v === 'open') return 'Open';
    if (v === 'assigned') return 'Assigned';
    if (v === 'in progress' || v === 'in-progress' || v === 'in_progress') return 'In progress';
    if (v === 'resolved' || v === 'completed' || v === 'complete') return 'Resolved';
    if (v === 'closed' || v === 'rejected') return 'Closed';
    return s || 'Open';
  };

  const computeStatus = (t: Ticket) => {
    const ns = normalizeStatus(t.status);
    const pct = Math.max(0, Math.min(100, t.progressPercentage || 0));
    // If server says Closed, always show Closed
    if (ns === 'Closed') return 'Closed';
    // If server says Open and progress is 0, show Open
    if (ns === 'Open' && pct === 0) return 'Open';
    // Otherwise bucket by percentage
    if (pct <= 33) return 'Assigned';
    if (pct <= 66) return 'In progress';
    return 'Resolved';
  };

  const renderAskMe = () => (
    <ForceScrollView>
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>Ask me</Text>
        <Text style={styles.welcomeSubtitle}>
          This space is reserved for your assistant or chatbot. You can ask questions about your tickets or get help here.
        </Text>
      </View>
    </ForceScrollView>
  );

  const renderStatsCard = (
    title: string,
    value: number,
    color: string,
    iconName: keyof typeof Ionicons.glyphMap
  ) => (
    <View style={[styles.statsCard, { backgroundColor: color }]}>
      <Ionicons name={iconName} size={24} color="#ffffff" style={styles.statsIcon} />
      <Text style={styles.statsValue}>{value}</Text>
      <Text style={styles.statsTitle}>{title}</Text>
    </View>
  );

  const renderTicketCard = ({ item: ticket, index }: { item: Ticket, index: number }) => {
    const ns = computeStatus(ticket);
    const orig = normalizeStatus(ticket.status);
    return (
      <TouchableOpacity
        style={[styles.listRow, index % 2 === 1 && styles.listRowAlt]}
        onPress={() => setSelectedTicketId(ticket.id)}
        activeOpacity={0.8}
      >
        <View style={[styles.leftAccent, { backgroundColor: getStatusColor(orig === 'Closed' ? 'Closed' : ns) }]} />
        {/* Status badge - absolute positioned in top right */}
        <View style={[styles.statusBadgeAbsolute, { backgroundColor: getStatusColor(orig === 'Closed' ? 'Closed' : ns) }]}>
          <Text style={styles.statusText}>{orig === 'Closed' ? 'Closed' : (ns === 'Resolved' ? 'Completed' : ns)}</Text>
        </View>
        <View style={styles.listRowLeft}>
          <View style={styles.listRowTop}>
            <View style={styles.srBadge}>
              <Text style={styles.srText}>{index + 1}</Text>
            </View>
            <Text style={styles.listRowTitle} numberOfLines={1}>{ticket.title}</Text>
          </View>
          <Text style={styles.listRowSub} numberOfLines={1}>{ticket.id} · {new Date(ticket.createdAt).toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric'})}</Text>
          {!!ticket.description && (
            <Text style={styles.listRowDesc} numberOfLines={1}>{ticket.description}</Text>
          )}
          <View style={styles.listItemMetaRow}>
            <View style={styles.metaItem}>
              <Ionicons name='attach' size={14} color={ticket.attachment ? '#4f46e5' : '#9ca3af'} />
              <Text style={[styles.metaText, { color: ticket.attachment ? '#1f2937' : '#9ca3af' }]}>
                {ticket.attachment ? 'Attachment' : 'No attachment'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.listRowRight}>
          <Text style={styles.progressChip}>{(ticket.progressPercentage || 0)}%</Text>
          <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
        </View>
      </TouchableOpacity>
    );
  };

  const renderDashboard = () => (
    <ForceScrollView>
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>My Dashboard</Text>
        <Text style={styles.welcomeSubtitle}>
          Welcome back, {displayName}! Here's your ticket overview
        </Text>
      </View>
      
      {/* License Expiry Warning */}
      {(() => {
        // Check multiple possible field names for expiry date
        const edate = loggedInClient?.edate || loggedInClient?.expiry_date || loggedInClient?.expiryDate;
        
        console.log('=== LICENSE EXPIRY CHECK ===');
        console.log('loggedInClient:', loggedInClient);
        console.log('edate value:', edate);
        
        if (!edate) {
          console.log('No expiry date found');
          return null;
        }
        
        const expiryDate = new Date(edate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        expiryDate.setHours(0, 0, 0, 0);
        
        console.log('Expiry date:', expiryDate);
        console.log('Today:', today);
        
        const diffTime = expiryDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        console.log('Days until expiry:', diffDays);
        
        if (diffDays < 0) {
          // License expired
          console.log('License is EXPIRED');
          return (
            <View style={styles.licenseExpiredBanner}>
              <Ionicons name="alert-circle" size={24} color="#dc2626" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.licenseExpiredTitle}>License Expired</Text>
                <Text style={styles.licenseExpiredText}>
                  Your license expired on {new Date(edate).toLocaleDateString()}. Please renew to continue.
                </Text>
              </View>
            </View>
          );
        } else if (diffDays === 0) {
          // License expiring today
          console.log('License EXPIRING TODAY');
          return (
            <View style={styles.licenseExpiringTodayBanner}>
              <Ionicons name="warning" size={24} color="#f59e0b" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.licenseExpiringTodayTitle}>License Expiring Today</Text>
                <Text style={styles.licenseExpiringTodayText}>
                  Your license expires today. Please renew immediately.
                </Text>
              </View>
            </View>
          );
        }
        console.log('License is valid');
        return null;
      })()}
      
      <View style={styles.statsGrid}>
        {renderStatsCard('Total', stats.total, '#4f46e5', 'document-text')}
        {renderStatsCard('Open', stats.open, '#f59e0b', 'time')}
        {renderStatsCard('Assigned', stats.assigned, '#8b5cf6', 'person')}
        {renderStatsCard('Progress', stats.inProgress, '#3b82f6', 'sync')}
        {renderStatsCard('Resolved', stats.resolved, '#10b981', 'checkmark-circle')}
        {renderStatsCard('Closed', stats.closed, '#ef4444', 'close-circle')}
      </View>
      <View style={styles.progressSection}>
        <Text style={styles.sectionTitle}>Latest Ticket Progress</Text>
        {tickets.length > 0 ? (
          <View>
            {(() => {
              const t = tickets[0];
              const pct = Math.max(0, Math.min(100, t.progressPercentage || 0));
              const ns = computeStatus(t);
              const orig = normalizeStatus(t.status);
              // If ticket is closed, show only Assigned (blue) -> Closed (red)
              let stepIndex = pct >= 67 ? 4 : pct >= 34 ? 3 : 2; // default index (not used by component logic)
              let steps = [] as any[];
              if (orig === 'Closed') {
                // Determine which stage was achieved before closing
                // pct === 0  -> closed after Open
                // 1-33       -> closed after Assigned
                // 34-100     -> closed after In Progress
                const achievedIdx = (pct === 0) ? 0 : (pct <= 33 ? 1 : 2); // 0: Open, 1: Assigned, 2: In Progress
                const closedSteps: any[] = [];
                // Always include Open
                closedSteps.push({ title: 'Open', completed: true, current: true });
                if (achievedIdx >= 1) {
                  closedSteps.push({ title: 'Assigned', completed: true, current: true });
                }
                if (achievedIdx >= 2) {
                  closedSteps.push({ title: 'In Progress', completed: true, current: true });
                }
                // Finally Closed
                closedSteps.push({ title: 'Closed', completed: false, current: false, danger: true });
                steps = closedSteps;
                stepIndex = steps.length; // highlight last circle
              } else {
                // Buckets per request: 0-33 Assigned, 34-66 In Progress, 67-100 Resolved
                let dangerAt: number = 0; // no danger when not closed
                steps = [
                  { title: 'Open', completed: pct > 0, current: pct === 0 },
                  { title: 'Assigned', completed: pct > 33, current: pct >= 1 && pct <= 33, danger: dangerAt === 1 },
                  { title: 'In Progress', completed: pct > 66, current: pct >= 34 && pct <= 66, danger: dangerAt === 2 },
                  { title: 'Resolved', completed: pct === 100, current: pct >= 67 && pct < 100, danger: dangerAt === 3 },
                ];
              }
              return (
                <View>
                  <Text style={styles.progressTicketId}>Ticket: {t.id}</Text>
                  <AmazonProgressBar steps={steps} currentStep={stepIndex} />
                  <Text style={styles.completionRate}>{orig === 'Closed' ? 'Closed' : `Progress: ${pct}% Complete • ${ns === 'Resolved' ? 'Completed' : ns}`}</Text>
                </View>
              );
            })()}
          </View>
        ) : (
          <View style={styles.noTicketsMessage}>
            <Text style={styles.noTicketsText}>No tickets yet. Create your first ticket!</Text>
          </View>
        )}
      </View>
      <View style={styles.recentTicketsSection}>
        <Text style={styles.sectionTitle}>Recent Tickets</Text>
        <FlatList
          data={tickets.slice(0, 2)}
          renderItem={renderTicketCard}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
        />
        {tickets.length > 2 && (
          <TouchableOpacity 
            style={styles.viewAllButton}
            onPress={() => setActiveTab('tickets')}
          >
            <Text style={styles.viewAllText}>View All Tickets</Text>
            <Ionicons name="arrow-forward" size={16} color="#4f46e5" />
          </TouchableOpacity>
        )}
      </View>
    </ForceScrollView>
  );

  const renderTicketConfirmation = () => (
    <View style={styles.confirmationContainer}>
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.confirmationContent}
      >
        <View style={styles.confirmationCard}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={80} color="#10b981" />
          </View>
          <Text style={styles.confirmationTitle}>Ticket Created Successfully!</Text>
          <Text style={styles.confirmationSubtitle}>Your support request has been submitted</Text>
          <View style={styles.ticketIdDisplay}>
            <Text style={styles.confirmationTicketIdLabel}>Ticket ID</Text>
            <Text style={styles.ticketIdValue}>{generatedTicketId}</Text>
          </View>
          <View style={styles.confirmationDetails}>
            <View style={styles.detailRow}>
              <Ionicons name="time" size={16} color="#6b7280" />
              <Text style={styles.detailText}>Created: {new Date().toLocaleDateString()}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="person" size={16} color="#6b7280" />
              <Text style={styles.detailText}>Status: Pending Assignment</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="mail" size={16} color="#6b7280" />
              <Text style={styles.detailText}>Updates will be sent to your registered contact</Text>
            </View>
          </View>
          <View style={styles.confirmationActions}>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={() => {
                setShowTicketConfirmation(false);
                setActiveTab('tickets');
                loadTickets();
              }}
            >
              <Text style={styles.primaryButtonText}>View My Tickets</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => {
                setShowTicketConfirmation(false);
                setActiveTab('raise');
              }}
            >
              <Text style={styles.secondaryButtonText}>Raise Another Ticket</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );

  const renderMyTickets = () => {
    const base = ticketFilter === 'All' ? tickets : tickets.filter((t) => computeStatus(t) === ticketFilter);
    const q = searchQuery.trim().toLowerCase();
    const filteredTickets = q
      ? base.filter((t) => (t.title?.toLowerCase()?.includes(q)) || (t.description?.toLowerCase()?.includes(q)) || (t.id?.toString()?.toLowerCase()?.includes(q)))
      : base;
    return (
      <ForceScrollView>
        <View style={styles.ticketsSection}>
          <View style={styles.topBarRow1}>
            <Text style={styles.topBarTitle}>My Tickets</Text>
          </View>
          <View style={styles.topBarRow2}>
            <View style={[styles.topBarActions, { flex: 1 }]}> 
              <View style={[styles.searchBox, { flex: 1 }]}> 
                <Ionicons name="search" size={14} color="#64748b" style={{marginRight: 6}} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search"
                  placeholderTextColor="#94a3b8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
            </View>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => { setPendingFilter(ticketFilter); setFilterMenuVisible(true); }}
              activeOpacity={0.9}
            >
              <Ionicons name="funnel" size={16} color="#1f2937" style={{marginRight: 8}} />
              <Text style={styles.filterButtonText}>Filter</Text>
              <View style={styles.currentFilterBadge}>
                <Text style={styles.currentFilterText} numberOfLines={1}>
                  {ticketFilter === 'Resolved' ? 'Completed' : ticketFilter === 'Closed' ? 'Rejected' : ticketFilter}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
          <View style={styles.ticketsListContainer}>
            {loading && tickets.length === 0 ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={styles.loadingText}>Loading your tickets...</Text>
              </View>
            ) : (
              <>
                {tickets.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="file-tray" size={40} color="#94a3b8" />
                    <Text style={styles.emptyStateText}>No tickets found</Text>
                  </View>
                ) : (
                  <FlatList
                    data={filteredTickets}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderTicketCard}
                    scrollEnabled={false}
                    contentContainerStyle={{ paddingBottom: 12 }}
                  />
                )}
              </>
            )}
          </View>
        </View>
      </ForceScrollView>
    );
  };

  return (
    <View style={styles.safeContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#4f46e5" />

      {/* Header - Fixed */}
      <AppHeader 
        title="SG Connect"
        subtitle={
          isRegistered
            ? `- ${displayName} (Registered)`
            : `- Unregistered (${licenseNo || 'No License'})`
        }
        showLogout={true}
        onLogout={onLogout}
      />

      {/* Body - Scrollable Content */}
      <ScrollView 
        style={styles.body}
        contentContainerStyle={{ 
          paddingBottom: insets.bottom + 70 + 48,
          paddingHorizontal: 12,
          paddingTop: 12
        }}
        showsVerticalScrollIndicator={true}
        bounces={true}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#4f46e5" colors={["#4f46e5"]} />}
      >
        {selectedTicketId ? (
          <TicketDetailScreen 
            ticketId={selectedTicketId}
            onBack={() => setSelectedTicketId(null)}
          />
        ) : showTicketConfirmation ? renderTicketConfirmation() : (
          <>
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'raise' && (
              <CreateTicketScreen 
                navigation={{ 
                  goBack: () => {
                    setActiveTab('tickets');
                    loadTickets(); // Refresh tickets when going back
                  }
                }}
                activeTab={activeTab}
                onTabChange={(tab: string) => {
                  setActiveTab(tab);
                  if (tab === 'dashboard' || tab === 'tickets') {
                    loadTickets(); // Refresh when switching tabs from create screen
                  }
                }}
              />
            )}
            {activeTab === 'tickets' && renderMyTickets()}
            {activeTab === 'profile' && <ProfileScreen onLogout={onLogout} />}
            {activeTab === 'askMe' && <AskMeScreen />}
          </>
        )}
      </ScrollView>

      {/* Floating Action Button - Only show when not on raise ticket screen */}
      {activeTab !== 'raise' && !showTicketConfirmation && (
        <FloatingActionButton 
          onPress={() => {
            setShowTicketConfirmation(false);
            setSelectedTicketId(null);
            setActiveTab('raise');
          }} 
        />
      )}

      {/* Simple Fixed Bottom Navigation */}
      <SimpleFixedNav 
        activeTab={activeTab} 
        onTabChange={(tab: string) => {
          setShowTicketConfirmation(false);
          setSelectedTicketId(null); // Close ticket detail when navigating
          setActiveTab(tab);
          
          // Auto-refresh tickets when switching to dashboard or tickets tab
          if (tab === 'dashboard' || tab === 'tickets') {
            loadTickets();
          }
        }} 
      />

      {/* Filter Modal */}
      {filterMenuVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Tickets</Text>
              <TouchableOpacity onPress={() => setFilterMenuVisible(false)}>
                <Ionicons name="close" size={20} color="#374151" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSection}>
              {[ 'All','Open','Assigned','In progress','Resolved','Closed' ].map((s) => {
                const active = pendingFilter === (s as any);
                return (
                  <TouchableOpacity
                    key={s}
                    style={[styles.optionRow, active && styles.optionRowActive]}
                    onPress={() => setPendingFilter(s as any)}
                  >
                    <View style={[styles.radio, active && styles.radioActive]} />
                    <Text style={[styles.optionText, active && styles.optionTextActive]}>
                      {s === 'Resolved' ? 'Completed' : s === 'Closed' ? 'Rejected' : s}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => { setPendingFilter('All'); }}>
                <Text style={styles.secondaryBtnText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => { setTicketFilter(pendingFilter); setFilterMenuVisible(false); }}
              >
                <Text style={styles.primaryBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    width: '100%',
    alignSelf: 'stretch',
    minHeight: '100%',
  },
  safeContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  body: {
    flex: 1,
    backgroundColor: '#f8fafc',
    // paddingBottom handled by contentContainerStyle
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#4f46e5',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 32,
    height: 32,
    textAlign: 'center',
    lineHeight: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#c7d2fe',
    marginLeft: 4,
  },
  logoutButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    minWidth: 36,
    alignItems: 'center',
  },
  logoutIcon: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    padding: 20,
    paddingBottom: 100, // Space for fixed bottom navigation
  },
  contentInner: {
    paddingBottom: 20, // Reduced padding since body has bottom padding
    flexGrow: 1,
  },
  welcomeSection: {
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
    width: '100%',
  },
  statsCard: {
    width: '48%',
    borderRadius: 12,
    padding: 12,
    minHeight: 92,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsIcon: {
    fontSize: 20,
    marginBottom: 6,
  },
  statsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  statsTitle: {
    fontSize: 11,
    color: '#ffffff',
    opacity: 0.9,
  },
  progressSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  progressChart: {
    alignItems: 'center',
  },
  progressBars: {
    flexDirection: 'row',
    height: 8,
    width: '100%',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBar: {
    height: '100%',
  },
  progressLabels: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  progressValues: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 12,
  },
  progressValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  completionRate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  formSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 24,
  },
  ticketIdSection: {
    backgroundColor: '#dbeafe',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  ticketIdLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
  },
  ticketIdBox: {
    backgroundColor: '#ffffff',
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
  },
  ticketIdText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e40af',
    textAlign: 'center',
  },
  ticketIdNote: {
    fontSize: 12,
    color: '#3730a3',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  priorityButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  priorityButtonActive: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  priorityButtonText: {
    fontSize: 14,
    color: '#374151',
  },
  priorityButtonTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#4f46e5',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  ticketsSection: {
    flex: 1,
  },
  userInfo: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 2,
  },
  userType: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 2,
  },
  userLicense: {
    fontSize: 12,
    color: '#64748b',
  },
  ticketsSummary: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4f46e5',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  filterTabs: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
    width: '100%',
    justifyContent: 'space-around',
  },
  // New segmented chips styles
  segChips: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  segChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    rowGap: 8 as any,
    columnGap: 8 as any,
  },
  segChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  segChipActive: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  segIcon: {
    marginRight: 6,
  },
  segText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
  },
  segTextActive: {
    color: '#ffffff',
  },
  // View toggle styles
  viewToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 4,
    marginRight: 8,
  },
  viewToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  viewToggleActive: {
    backgroundColor: '#4f46e5',
  },
  viewToggleText: {
    color: '#1f2937',
    fontWeight: '700',
    fontSize: 12,
  },
  viewToggleTextActive: {
    color: '#ffffff',
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  filterTabActive: {
    backgroundColor: '#4f46e5',
  },
  filterTabText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: '#ffffff',
  },
  ticketCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
    position: 'relative',
  },
  leftAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ticketId: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4f46e5',
  },
  ticketBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'center',
    flexShrink: 0,
  },
  statusBadgeAbsolute: {
    position: 'absolute',
    top: 12,
    right: 14,
    minWidth: 80,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  statusPillText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  // New clean list styles
  listItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  listItemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  listItemTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    paddingRight: 8,
  },
  listItemId: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 6,
  },
  listItemDesc: {
    fontSize: 13,
    color: '#4b5563',
    marginBottom: 8,
  },
  listItemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Compact row variant
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 14,
    position: 'relative',
  },
  listRowAlt: {
    backgroundColor: '#f9fafb',
  },
  listRowLeft: {
    flex: 1,
  },
  listRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    paddingRight: 90,
    gap: 8,
  },
  listRowTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginLeft: 8,
    paddingRight: 8,
  },
  listRowSub: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  listRowDesc: {
    fontSize: 13,
    color: '#4b5563',
  },
  listRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#2563eb',
    backgroundColor: 'transparent',
    color: '#2563eb',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  statusTiny: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusTinyText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
    textTransform: 'capitalize',
  },
  srBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  srText: {
    color: '#4338ca',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  listProgressContainer: {
    marginTop: 8,
  },
  listProgressBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  listProgressFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 4,
  },
  listProgressText: {
    marginTop: 6,
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  metaRow2: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: '#6b7280',
  },
  ticketTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  ticketDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
    lineHeight: 20,
  },
  assignedTo: {
    fontSize: 12,
    color: '#10b981',
    marginBottom: 4,
  },
  ticketDate: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 12,
  },
  stickyBottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 25,
    zIndex: 9999,
    width: '100%',
  },
  bottomNavSafeArea: {
    backgroundColor: '#ffffff',
  },
  bottomNavigationContainer: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
  },
  bottomNavigation: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  bottomNavItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  bottomNavItemActive: {
    backgroundColor: '#dbeafe',
  },
  bottomNavIcon: {
    marginBottom: 4,
  },
  bottomNavIconActive: {
    color: '#4f46e5',
  },
  bottomNavText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    marginTop: 4,
  },
  bottomNavTextActive: {
    color: '#4f46e5',
    fontWeight: '600',
  },
  // Recent tickets section
  recentTicketsSection: {
    marginBottom: 24,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    marginTop: 12,
  },
  viewAllText: {
    fontSize: 14,
    color: '#4f46e5',
    fontWeight: '600',
    marginRight: 8,
  },
  // Attachment styles
  attachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    marginBottom: 12,
  },
  attachmentButtonActive: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  attachmentButtonText: {
    fontSize: 14,
    color: '#4f46e5',
    marginLeft: 8,
    fontWeight: '500',
  },
  attachmentButtonTextActive: {
    color: '#10b981',
    fontWeight: '600',
  },
  attachmentsList: {
    marginBottom: 12,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  attachmentInfo: {
    flex: 1,
    marginLeft: 8,
  },
  attachmentName: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  attachmentSize: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  removeAttachmentButton: {
    padding: 4,
  },
  attachmentNote: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
  },
  // Scroll container styles
  horizontalScrollContainer: {
    minWidth: '100%',
    paddingHorizontal: 0,
  },
  dashboardContainer: {
    width: '100%',
    minWidth: 350,
  },
  statsScrollView: {
    marginBottom: 24,
  },
  filterScrollView: {
    marginBottom: 16,
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  // My Tickets top bar
  topBarRow1: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  topBarRow2: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 10,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 6,
    fontSize: 13,
    color: '#0f172a',
    minWidth: 90,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  filterButtonText: {
    color: '#1f2937',
    fontWeight: '700',
    marginRight: 8,
  },
  currentFilterBadge: {
    backgroundColor: '#eef2ff',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  currentFilterText: {
    color: '#4338ca',
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    zIndex: 9999,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    width: '100%',
    maxWidth: 380,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  modalSection: {
    marginBottom: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  optionRowActive: {
    backgroundColor: '#eef2ff',
  },
  radio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#94a3b8',
    marginRight: 10,
  },
  radioActive: {
    borderColor: '#4f46e5',
    backgroundColor: '#4f46e5',
  },
  optionText: {
    color: '#1f2937',
    fontSize: 14,
    fontWeight: '600',
  },
  optionTextActive: {
    color: '#1f2937',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  secondaryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  secondaryBtnText: {
    color: '#111827',
    fontWeight: '700',
  },
  primaryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#4f46e5',
  },
  primaryBtnText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyStateText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '600',
  },
  // Kanban board styles
  boardContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  boardColumn: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 8,
    minWidth: 180,
  },
  boardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  boardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  boardCount: {
    backgroundColor: '#e5e7eb',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  boardCountText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '700',
  },
  boardList: {
    gap: 8,
  },
  boardEmpty: {
    color: '#9ca3af',
    fontSize: 12,
    paddingVertical: 12,
    textAlign: 'center',
  },
  boardCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  boardCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  boardCardTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    paddingRight: 8,
  },
  boardCardId: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 8,
  },
  boardCardDesc: {
    fontSize: 12,
    color: '#4b5563',
    marginBottom: 8,
  },
  boardCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  boardMetaText: {
    fontSize: 12,
    color: '#6b7280',
  },
  boardProgress: {
    fontSize: 12,
    color: '#4338ca',
    fontWeight: '800',
  },
  // Vertical bar chart styles
  verticalBarChart: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    width: '100%',
    height: 120,
    marginBottom: 16,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  verticalBar: {
    width: 30,
    borderRadius: 4,
    marginBottom: 8,
    minHeight: 10,
  },
  barLabel: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 4,
    textAlign: 'center',
  },
  barValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
  },
  // Confirmation screen styles
  confirmationContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  confirmationContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  successIcon: {
    marginBottom: 24,
  },
  confirmationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  confirmationSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
  },
  ticketIdDisplay: {
    backgroundColor: '#f0f9ff',
    borderColor: '#bae6fd',
    borderWidth: 2,
    borderRadius: 12,
    padding: 20,
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
  },
  confirmationTicketIdLabel: {
    fontSize: 14,
    color: '#0369a1',
    marginBottom: 8,
    fontWeight: '600',
  },
  ticketIdValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0c4a6e',
  },
  confirmationDetails: {
    width: '100%',
    marginBottom: 32,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
    flex: 1,
  },
  confirmationActions: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#4f46e5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#4f46e5',
    fontSize: 16,
    fontWeight: '600',
  },
  progressTicketId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4f46e5',
    marginBottom: 12,
    textAlign: 'center',
  },
  noTicketsMessage: {
    alignItems: 'center',
    padding: 20,
  },
  noTicketsText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  clientInfoSection: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  clientInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  clientInfoLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
    marginRight: 8,
    fontWeight: '500',
  },
  clientInfoValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '600',
    flex: 1,
  },
  // New My Tickets styles
  ticketsContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  ticketsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  ticketsHeaderContent: {
    flex: 1,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  ticketsListContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  // License Expiry Warning Styles
  licenseExpiredBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 8,
  },
  licenseExpiredTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 4,
  },
  licenseExpiredText: {
    fontSize: 14,
    color: '#991b1b',
  },
  licenseExpiringTodayBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 8,
  },
  licenseExpiringTodayTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f59e0b',
    marginBottom: 4,
  },
  licenseExpiringTodayText: {
    fontSize: 14,
    color: '#92400e',
    paddingHorizontal: 20,
  },
  createTicketButton: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createTicketButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  ticketSeparator: {
    height: 12,
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  viewDetailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewDetailsText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '600',
  },
});

export default ClientDashboard;
