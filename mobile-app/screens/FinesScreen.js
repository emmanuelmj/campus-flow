import { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchFines, payFine } from '../services/api';

export default function FinesScreen() {
  const [fines, setFines]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying]   = useState(null); // fine_id being paid

  useEffect(() => {
    loadFines();
  }, []);

  const loadFines = async () => {
    try {
      const data = await fetchFines();
      setFines(
        data.map(f => ({
          id: f.fine_id,
          reason: f.reason,
          amount: f.amount,
          date: new Date(f.issued_at).toLocaleDateString('en-US', {
            month: 'short', day: '2-digit', year: 'numeric',
          }),
          status: f.status,
        }))
      );
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePayFine = (fine) => {
    Alert.alert(
      'Pay Fine',
      `Pay ₹${fine.amount.toFixed(2)} for "${fine.reason}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pay Now',
          onPress: async () => {
            setPaying(fine.id);
            try {
              await payFine(fine.id);
              setFines(prev =>
                prev.map(f => f.id === fine.id ? { ...f, status: 'PAID' } : f)
              );
            } catch (e) {
              Alert.alert('Payment Failed', e.message);
            } finally {
              setPaying(null);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#DC2626" />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      data={fines}
      keyExtractor={item => item.id}
      ListEmptyComponent={
        <View style={styles.emptyBox}>
          <Ionicons name="checkmark-circle-outline" size={48} color="#86EFAC" />
          <Text style={styles.emptyText}>No fines — you're all clear!</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.cardTop}>
            <View style={styles.iconBox}>
              <Ionicons name="receipt-outline" size={20} color="#64748B" />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.reason}>{item.reason}</Text>
              <Text style={styles.date}>Issued: {item.date}</Text>
            </View>
            <View style={[styles.badge, item.status === 'PAID' ? styles.badgePaid : styles.badgeUnpaid]}>
              <Text style={[styles.badgeText, item.status === 'PAID' ? styles.badgeTextPaid : styles.badgeTextUnpaid]}>
                {item.status}
              </Text>
            </View>
          </View>

          <View style={styles.cardBottom}>
            <Text style={styles.amount}>₹{item.amount.toFixed(2)}</Text>
            {item.status === 'UNPAID' && (
              <TouchableOpacity
                style={[styles.payBtn, paying === item.id && styles.payBtnDisabled]}
                onPress={() => handlePayFine(item)}
                disabled={paying === item.id}
                activeOpacity={0.85}
              >
                {paying === item.id ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.payBtnText}>Pay Now</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F9' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F7F9' },
  emptyBox: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyText: { fontSize: 15, fontWeight: '600', color: '#64748B' },

  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  iconBox: {
    width: 42, height: 42, borderRadius: 13,
    backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  cardInfo: { flex: 1 },
  reason: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  date: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgePaid: { backgroundColor: '#ECFDF5' },
  badgeUnpaid: { backgroundColor: '#FEF2F2' },
  badgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  badgeTextPaid: { color: '#059669' },
  badgeTextUnpaid: { color: '#DC2626' },

  cardBottom: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 14,
  },
  amount: { fontSize: 22, fontWeight: '800', color: '#1E293B' },
  payBtn: {
    backgroundColor: '#1E293B', paddingHorizontal: 24, paddingVertical: 10,
    borderRadius: 12, minWidth: 80, alignItems: 'center',
  },
  payBtnDisabled: { opacity: 0.6 },
  payBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
