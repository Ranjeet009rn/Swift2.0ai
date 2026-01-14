import React from 'react';
import { Image, View, StyleSheet } from 'react-native';

export default function HeaderLogo() {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/tally.jpg')}
        resizeMode="contain"
        style={styles.logo}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 40,
    justifyContent: 'center',
  },
  logo: {
    height: 32,
    width: 160,
  },
});
