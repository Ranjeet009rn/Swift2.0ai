import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const ScrollTestComponent = () => {
  // Generate test content to ensure scrolling
  const testItems = Array.from({ length: 50 }, (_, i) => i + 1);

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        bounces={true}
        alwaysBounceVertical={true}
      >
        <View style={styles.header}>
          <Text style={styles.headerText}>Scroll Test Screen</Text>
          <Text style={styles.subHeaderText}>This screen should be scrollable</Text>
        </View>
        
        {testItems.map((item) => (
          <View key={item} style={styles.testItem}>
            <Text style={styles.itemText}>Test Item {item}</Text>
            <Text style={styles.itemSubText}>
              This is test content item {item}. If you can see all 50 items by scrolling, 
              then scrolling is working correctly.
            </Text>
          </View>
        ))}
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            If you can see this footer by scrolling down, scrolling works!
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 150,
  },
  header: {
    backgroundColor: '#1e3a8a',
    padding: 20,
    marginBottom: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subHeaderText: {
    fontSize: 16,
    color: '#bfdbfe',
  },
  testItem: {
    backgroundColor: '#ffffff',
    margin: 10,
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 5,
  },
  itemSubText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  footer: {
    backgroundColor: '#10b981',
    padding: 20,
    margin: 10,
    borderRadius: 8,
  },
  footerText: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default ScrollTestComponent;
