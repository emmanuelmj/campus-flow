import { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchTransactions } from '../services/api';

const TYPE_LABELS = {
  VENDOR_PAYMENT: 'Vendor Payment',
  P2P:            'Student Transfer',
  FINE:           'Fine Payment',
  TOP_UP:         'Top Up',
  SUB:            'Subscription',
  FEE:            'Fee',
};

export default function TransactionsScreen() {
  const [transactions, setTx] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions()
      .then(data =>
        setTx(
          data.map(tx => ({
            id: tx.transaction_id,
            type: tx.type,
            label: TYPE_LABELS[tx.type] || tx.type,
            amount: tx.amount,
            date: new Date(tx.timestamp).toLocaleDateString('en-US', {
              month: 'short', day: '2-digit', year: 'numeric',
            }),
          }))
        )
      )
      .catch(e => Alert.alert('Error', e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      data={transactions}
      keyExtractor={item => item.id}
      ListEmptyComponent={
        <Text style={styles.emptyText}>No transactions found.</Text>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={[styles.icon, { backgroundColor: item.amount > 0 ? '#ECFDF5' : '#F8FAFC' }]}>
            <Ionicons
              name={item.amount > 0 ? 'arrow-down-outline' : 'arrow-up-outline'}
              size={18}
              color={item.amount > 0 ? '#059669' : '#475569'}
            />
          </View>
          <View style={styles.info}>
            <Text style={styles.label}>{item.label}</Text>
            <Text style={styles.meta}>{item.date} · {item.type}</Text>
          </View>
          <Text style={[styles.amount, item.amount > 0 && styles.positive]}>
            {item.amount > 0 ? '+' : ''}₹{Math.abs(item.amount).toFixed(2)}
          </Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F9' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F7F9' },
  emptyText: { textAlign: 'center', color: '#94A3B8', marginTop: 40, fontSize: 14 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 18, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  icon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  info: { flex: 1 },
  label: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  meta: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  amount: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  positive: { color: '#059669' },
});
