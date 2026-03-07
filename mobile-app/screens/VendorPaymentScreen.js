import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { payVendor } from '../services/api';

export default function VendorPaymentScreen({ navigation, route }) {
  const [vendorCode, setVendorCode] = useState(route.params?.initialTarget || '');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    const num = parseFloat(amount);
    if (!vendorCode.trim()) return Alert.alert('Error', 'Enter a vendor code.');
    if (isNaN(num) || num <= 0) return Alert.alert('Error', 'Enter a valid amount.');

    setLoading(true);
    try {
      await payVendor(vendorCode.trim(), num);
      Alert.alert('Payment Successful', `₹${num.toFixed(2)} paid to ${vendorCode}.`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Payment Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

      {/* Amount */}
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

      {/* Vendor Code */}
      <View style={styles.card}>
        <Text style={styles.label}>Vendor Code</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. canteen-01"
          placeholderTextColor="#94A3B8"
          value={vendorCode}
          onChangeText={setVendorCode}
          autoCapitalize="none"
        />
        <Text style={styles.hint}>
          <Ionicons name="information-circle-outline" size={12} color="#94A3B8" />
          {' '}Ask the vendor for their vendor code
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handlePay}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <View style={styles.buttonRow}>
            <Ionicons name="storefront-outline" size={18} color="#fff" />
            <Text style={styles.buttonText}>Pay Vendor</Text>
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
    backgroundColor: '#059669', borderRadius: 16,
    paddingVertical: 16, alignItems: 'center',
    shadowColor: '#059669', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 5,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
