import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ProgressStep {
  stage: string;
  description: string;
  percentage: number;
  timestamp: string;
  is_current: boolean;
  completed: boolean;
}

interface TicketProgressTrackerProps {
  progress: ProgressStep[];
  currentPercentage: number;
}

const TicketProgressTracker: React.FC<TicketProgressTrackerProps> = ({
  progress,
  currentPercentage
}) => {
  const getStepIcon = (step: ProgressStep, index: number) => {
    if (step.completed) {
      return '✅';
    } else if (step.is_current) {
      return '🔄';
    } else {
      return '⏳';
    }
  };

  const getStepColor = (step: ProgressStep) => {
    if (step.completed) {
      return '#16a34a'; // Green
    } else if (step.is_current) {
      return '#2563eb'; // Blue
    } else {
      return '#9ca3af'; // Gray
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ticket Progress</Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${currentPercentage}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>{currentPercentage}% Complete</Text>
      </View>

      <View style={styles.timeline}>
        {progress.map((step, index) => (
          <View key={index} style={styles.timelineItem}>
            <View style={styles.timelineLeft}>
              <View style={[
                styles.timelineIcon,
                { backgroundColor: getStepColor(step) }
              ]}>
                <Text style={styles.timelineIconText}>
                  {getStepIcon(step, index)}
                </Text>
              </View>
              {index < progress.length - 1 && (
                <View style={[
                  styles.timelineLine,
                  { backgroundColor: step.completed ? '#16a34a' : '#e5e7eb' }
                ]} />
              )}
            </View>
            
            <View style={styles.timelineContent}>
              <Text style={[
                styles.stepTitle,
                { color: getStepColor(step) }
              ]}>
                {step.stage}
              </Text>
              <Text style={styles.stepDescription}>
                {step.description}
              </Text>
              <Text style={styles.stepTime}>
                {new Date(step.timestamp).toLocaleString()}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  timeline: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: 16,
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineIconText: {
    fontSize: 16,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 8,
  },
  timelineContent: {
    flex: 1,
    paddingTop: 4,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  stepTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
});

export default TicketProgressTracker;
