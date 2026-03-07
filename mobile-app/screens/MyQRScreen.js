import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';

export default function MyQRScreen({ route, navigation }) {
  // Try to get userEmail or studentId from route params. Fallback if not available.
  const emailOrId = route.params?.userEmail || 'student@campusflow.com';
  
  // The QR value format expected by CampusFlow scanners
  const qrValue = JSON.stringify({ app: 'campusflow', id: emailOrId });

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(emailOrId);
    Alert.alert('Copied!', 'Identifier copied to clipboard.');
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.qrContainer}>
          <QRCode
            value={qrValue}
            size={220}
            backgroundColor="#F8FAFC"
            color="#0F172A"
          />
        </View>
        
        <Text style={styles.nameText}>{emailOrId.split('@')[0]}</Text>
        <Text style={styles.idText}>{emailOrId}</Text>
        
        <TouchableOpacity style={styles.copyButton} onPress={copyToClipboard} activeOpacity={0.8}>
          <Ionicons name="copy-outline" size={18} color="#475569" />
          <Text style={styles.copyButtonText}>Copy ID</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F9',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderColor: '#F1F5F9',
    borderWidth: 1,
  },
  qrContainer: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 24,
    marginBottom: 24,
  },
  nameText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: -0.5,
  },
  idText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 4,
    marginBottom: 24,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    width: '100%',
  },
  copyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginLeft: 8,
  },
});
