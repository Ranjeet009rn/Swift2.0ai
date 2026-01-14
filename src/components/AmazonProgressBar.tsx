import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ProgressStep {
  title: string;
  completed: boolean;
  current: boolean;
  danger?: boolean; // render as red (e.g., Closed/Rejected)
}

interface AmazonProgressBarProps {
  steps: ProgressStep[];
  currentStep: number;
}

const AmazonProgressBar: React.FC<AmazonProgressBarProps> = ({ steps, currentStep }) => {
  return (
    <View style={styles.container}>
      <View style={styles.progressContainer}>
        {steps.map((step, index) => (
          <View key={index} style={styles.stepContainer}>
            {/* Step Circle */}
            <View style={styles.stepWrapper}>
              <View style={[
                styles.stepCircle,
                step.completed && !step.danger && styles.stepCompleted,
                step.current && !step.danger && styles.stepCurrent,
                step.danger && styles.stepDanger,
              ]}>
                {step.danger ? (
                  <Text style={styles.dangerMark}>×</Text>
                ) : step.completed ? (
                  <Text style={styles.checkmark}>✓</Text>
                ) : (
                  <Text style={[
                    styles.stepNumber,
                    step.current && styles.stepNumberCurrent
                  ]}>
                    {index + 1}
                  </Text>
                )}
              </View>
              
              {/* Connecting Line */}
              {index < steps.length - 1 && (
                <View style={[
                  styles.connectingLine,
                  step.completed && styles.lineCompleted
                ]} />
              )}
            </View>
            
            {/* Step Label */}
            <Text style={[
              styles.stepLabel,
              step.completed && !step.danger && styles.stepLabelCompleted,
              step.current && !step.danger && styles.stepLabelCurrent,
              step.danger && styles.stepLabelDanger,
            ]}>
              {step.title}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    padding: 0,
    marginVertical: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  stepContainer: {
    flex: 1,
    alignItems: 'center',
  },
  stepWrapper: {
    alignItems: 'center',
    position: 'relative',
    width: '100%',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
    borderWidth: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  stepCompleted: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  stepCurrent: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  stepDanger: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6b7280',
  },
  stepNumberCurrent: {
    color: '#ffffff',
  },
  checkmark: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  dangerMark: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '900',
    lineHeight: 18,
  },
  connectingLine: {
    position: 'absolute',
    top: 16,
    left: '50%',
    right: '-50%',
    height: 2,
    backgroundColor: '#e5e7eb',
    zIndex: 1,
  },
  lineCompleted: {
    backgroundColor: '#10b981',
  },
  stepLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
  },
  stepLabelCompleted: {
    color: '#10b981',
    fontWeight: '600',
  },
  stepLabelCurrent: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  stepLabelDanger: {
    color: '#ef4444',
    fontWeight: '700',
  },
});

export default AmazonProgressBar;
