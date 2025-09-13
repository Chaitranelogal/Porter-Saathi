import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import PorterSaathiVoiceComponent from './PorterSaathiVoiceComponent';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <PorterSaathiVoiceComponent />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }
});
10