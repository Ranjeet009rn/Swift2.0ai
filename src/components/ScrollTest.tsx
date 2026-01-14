import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

const ScrollTest = () => {
  const items = Array.from({ length: 50 }, (_, i) => i + 1);

  if (Platform.OS === 'web') {
    return (
      <div style={{
        height: '100vh',
        overflowY: 'scroll',
        WebkitOverflowScrolling: 'touch',
        backgroundColor: '#f0f0f0',
        padding: '20px'
      }}>
        <div style={{ 
          minHeight: '300vh', 
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '10px'
        }}>
          <h2 style={{ color: '#1e3a8a', marginBottom: '20px' }}>
            🧪 SCROLL TEST - If you can scroll, it works!
          </h2>
          {items.map(item => (
            <div key={item} style={{
              padding: '15px',
              margin: '10px 0',
              backgroundColor: item % 2 === 0 ? '#dbeafe' : '#f3f4f6',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#374151' }}>
                Test Item {item}
              </h3>
              <p style={{ margin: 0, color: '#6b7280' }}>
                This is test content item {item}. If you can scroll through all 50 items, 
                then scrolling is working correctly on your device.
              </p>
            </div>
          ))}
          <div style={{
            padding: '20px',
            backgroundColor: '#10b981',
            color: 'white',
            textAlign: 'center',
            borderRadius: '10px',
            marginTop: '20px'
          }}>
            <h2>🎉 SUCCESS!</h2>
            <p>If you can see this message, scrolling works perfectly!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧪 SCROLL TEST</Text>
      {items.map(item => (
        <View key={item} style={styles.item}>
          <Text style={styles.itemTitle}>Test Item {item}</Text>
          <Text style={styles.itemText}>
            This is test content item {item}. If you can scroll through all items, scrolling works!
          </Text>
        </View>
      ))}
      <View style={styles.success}>
        <Text style={styles.successText}>🎉 SUCCESS!</Text>
        <Text style={styles.successSubtext}>If you can see this, scrolling works!</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 20,
    textAlign: 'center',
  },
  item: {
    padding: 15,
    marginVertical: 5,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 5,
  },
  itemText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  success: {
    padding: 20,
    backgroundColor: '#10b981',
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
  },
  successText: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  successSubtext: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
  },
});

export default ScrollTest;
