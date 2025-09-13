// PorterSaathiVoiceComponent.tsx
// Prototype React Native (Expo) component for Porter Saathi (TypeScript-like file).
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Platform, Alert } from 'react-native';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';

type SaathiResponse = {
  speechText: string;
  visual: string;
  followupAction?: string;
  ttsAudioUrl?: string;
};

export default function PorterSaathiVoiceComponent() {
  const [recording, setRecording] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastTranscript, setLastTranscript] = useState(null);
  const [saathiReply, setSaathiReply] = useState(null);
  const [language, setLanguage] = useState('hi-IN');

  useEffect(() => {
    (async () => {
      try {
        if (Platform.OS !== 'web') {
          const { status } = await Audio.requestPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Microphone permission required', 'Please enable microphone permissions in settings.');
          }
        }
      } catch (e) {
        console.warn('Permission error', e);
      }
    })();
  }, []);

  const startRecording = async () => {
    try {
      setSaathiReply(null);
      setLastTranscript(null);
      setLoading(true);
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      await rec.startAsync();
      setRecording(rec);
      setLoading(false);
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Recording failed', 'Could not start recording.');
      setLoading(false);
    }
  };

  const stopRecordingAndSend = async () => {
    if (!recording) return;
    setLoading(true);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      if (!uri) throw new Error('No recording URI');

      const formData = new FormData();
      formData.append('audio', {
        uri,
        name: 'voice.wav',
        type: 'audio/wav',
      });
      formData.append('driverId', 'DUMMY_DRIVER_123');
      formData.append('language', language);

      const resp = await fetch('http://10.30.3.147:3000/api/voice/query', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer DEMO_TOKEN',
        },
        body: formData,
      });

      if (!resp.ok) {
        const text = await resp.text();
        console.error('Server error', text);
        Alert.alert('Server error', 'Could not process voice.');
        setLoading(false);
        return;
      }

      const json = await resp.json();
      setSaathiReply(json);
      setLastTranscript('(voice sent)');

      if (json.ttsAudioUrl) {
        // For simplicity, fall back to TTS
        speakText(json.speechText, language);
      } else {
        speakText(json.speechText, language);
      }

    } catch (err) {
      console.error('Upload failed', err);
      Alert.alert('Upload failed', 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  function speakText(text, lang) {
    const options = { language: lang, pitch: 1.0, rate: 0.9 };
    Speech.speak(text, options);
  }

  const onPressMic = async () => {
    if (loading) return;
    if (recording) {
      await stopRecordingAndSend();
    } else {
      await startRecording();
    }
  };

  const onFollowup = async (action) => {
    if (!action) return;
    setLoading(true);
    try {
      const res = await fetch('http://10.30.3.147:3000/api/voice/followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer DEMO_TOKEN' },
        body: JSON.stringify({ driverId: 'DUMMY_DRIVER_123', action }),
      });
      const json = await res.json();
      setSaathiReply(json);
      speakText(json.speechText, language);
    } catch (err) {
      console.error(err);
      Alert.alert('Action failed', 'Could not complete the action.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Porter Saathi</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Assistant</Text>
        {loading ? (
          <ActivityIndicator size="small" />
        ) : saathiReply ? (
          <>
            <Text style={styles.speechText}>{saathiReply.speechText}</Text>
            <Text style={styles.visualText}>{saathiReply.visual}</Text>
            {saathiReply.followupAction ? (
              <TouchableOpacity style={styles.actionButton} onPress={() => onFollowup(saathiReply.followupAction)}>
                <Text style={styles.actionButtonText}>{saathiReply.followupAction}</Text>
              </TouchableOpacity>
            ) : null}
          </>
        ) : (
          <Text style={styles.placeholder}>Bol kar puchiye — "Aaj ki kamaai batao"</Text>
        )}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity onPress={onPressMic} style={styles.micButton}>
          <Text style={styles.micText}>{recording ? 'Stop' : 'Speak'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setLanguage(l => (l === 'hi-IN' ? 'en-IN' : 'hi-IN'));
          }}
          style={styles.langButton}
        >
          <Text style={styles.langText}>{language === 'hi-IN' ? 'हिन्दी' : 'English'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.transcriptLabel}>Transcript</Text>
        <Text style={styles.transcriptText}>{lastTranscript ?? '-'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff', justifyContent: 'flex-start' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  card: { backgroundColor: '#F5F7FA', padding: 16, borderRadius: 12, minHeight: 150 },
  cardTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  speechText: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  visualText: { fontSize: 14, color: '#333' },
  placeholder: { color: '#666' },
  controls: { flexDirection: 'row', marginTop: 20, alignItems: 'center' },
  micButton: { backgroundColor: '#0B6EFD', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10 },
  micText: { color: '#fff', fontWeight: '700' },
  langButton: { marginLeft: 12, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: '#ddd' },
  langText: { fontWeight: '600' },
  footer: { marginTop: 20 },
  transcriptLabel: { color: '#777' },
  transcriptText: { marginTop: 6, fontSize: 16 },
  actionButton: { marginTop: 10, backgroundColor: '#E6F4EA', padding: 8, borderRadius: 8, alignSelf: 'flex-start' },
  actionButtonText: { color: '#0B6EFD', fontWeight: '700' },
});
