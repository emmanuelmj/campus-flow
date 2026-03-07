import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { transferFunds } from '../services/api';

export default function TransferScreen({ navigation, route }) {
  const [recipient, setRecipient] = useState(route.params?.initialTarget || '');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    const num = parseFloat(amount);
    if (!recipient.trim()) return Alert.alert('Error', 'Enter a recipient student ID or email.');
    if (isNaN(num) || num <= 0) return Alert.alert('Error', 'Enter a valid amount.');

    setLoading(true);
    try {
      await transferFunds(recipient.trim(), num);
      Alert.alert('Success', `₹${num.toFixed(2)} sent!`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Transfer Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

      {/* Amount Input */}
      <View style={styles.card}>
        <Text style={styles.label}>Amount</Text>
        <View style={styles.amountRow}>
          <Text style={styles.currencySymbol}>₹</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="0.00"
            placeholderTextColor="#CBD5E1"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
            autoFocus
          />
        </View>
      </View>

      {/* Recipient */}
      <View style={styles.card}>
        <Text style={styles.label}>Recipient</Text>
        <TextInput
          style={styles.input}
          placeholder="Student ID, email, or name"
          placeholderTextColor="#94A3B8"
          value={recipient}
          onChangeText={setRecipient}
          autoCapitalize="none"
        />
        <Text style={styles.hint}>
          <Ionicons name="information-circle-outline" size={12} color="#94A3B8" />
          {' '}Accepted: student ID (e.g. CS-2024-001), email, or full name
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSend}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <View style={styles.buttonRow}>
            <Ionicons name="send-outline" size={18} color="#fff" />
            <Text style={styles.buttonText}>Send Money</Text>
          </View>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F9' },
  content: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  label: { fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 12 },
  amountRow: { flexDirection: 'row', alignItems: 'center' },
  currencySymbol: { fontSize: 28, color: '#CBD5E1', fontWeight: '600', marginRight: 8 },
  amountInput: { flex: 1, fontSize: 38, fontWeight: '800', color: '#1E293B' },
  input: {
    borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 14, color: '#1E293B',
  },
  hint: { fontSize: 11, color: '#94A3B8', marginTop: 8, lineHeight: 16 },
  button: {
    backgroundColor: '#4F46E5', borderRadius: 16,
    paddingVertical: 16, alignItems: 'center',
    shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 5,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
