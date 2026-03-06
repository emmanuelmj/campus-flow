import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchWallet, fetchTransactions } from '../services/api';

const ACTIONS = [
  { label: 'Send Money',   icon: 'send-outline',       color: '#4F46E5', bg: '#EEF2FF', screen: 'Transfer' },
  { label: 'Pay Vendor',   icon: 'storefront-outline', color: '#059669', bg: '#ECFDF5', screen: 'VendorPayment' },
  { label: 'Fines',        icon: 'receipt-outline',    color: '#DC2626', bg: '#FEF2F2', screen: 'Fines' },
  { label: 'Subscriptions',icon: 'calendar-outline',   color: '#D97706', bg: '#FFFBEB', screen: 'Subscriptions' },
];

export default function DashboardScreen({ navigation, route }) {
  const [balance, setBalance]       = useState(null);
  const [transactions, setTx]       = useState([]);
  const [loading, setLoading]       = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [walletData, txData] = await Promise.all([fetchWallet(), fetchTransactions()]);
      setBalance(walletData.balance);
      setTx(
        txData.slice(0, 5).map(tx => ({
          id: tx.transaction_id,
          type: tx.type,
          entity:
            tx.type === 'VENDOR_PAYMENT' ? 'Vendor Payment' :
            tx.type === 'P2P'            ? 'Student Transfer' :
            tx.type === 'FINE'           ? 'Fine Payment' : tx.type,
          amount: tx.amount,
          date: new Date(tx.timestamp).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
        }))
      );
    } catch (e) {
      Alert.alert('Connection Error', 'Could not fetch wallet data. Check server connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsub = navigation.addListener('focus', loadData);
    return unsub;
  }, [navigation, loadData]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceTop}>
          <View>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <Text style={styles.balanceAmount}>
              ₹{balance !== null ? balance.toFixed(2) : '—'}
            </Text>
          </View>
          <View style={styles.cardIconBox}>
            <Ionicons name="card-outline" size={20} color="#fff" />
          </View>
        </View>
        <View style={styles.balanceFooter}>
          <Text style={styles.balanceFooterText}>CampusFlow Wallet</Text>
          <View style={styles.activePill}>
            <Ionicons name="flash" size={11} color="#fff" />
            <Text style={styles.activePillText}>Active</Text>
          </View>
        </View>
      </View>

      {/* Action Grid */}
      <View style={styles.grid}>
        {ACTIONS.map((a) => (
          <TouchableOpacity
            key={a.screen}
            style={styles.actionCard}
            onPress={() => navigation.navigate(a.screen)}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIcon, { backgroundColor: a.bg }]}>
              <Ionicons name={a.icon} size={22} color={a.color} />
            </View>
            <Text style={styles.actionLabel}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent Transactions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
            <Text style={styles.seeAll}>View All</Text>
          </TouchableOpacity>
        </View>

        {transactions.length === 0 ? (
          <Text style={styles.emptyText}>No transactions yet.</Text>
        ) : (
          transactions.map(tx => (
            <View key={tx.id} style={styles.txRow}>
              <View style={[styles.txIcon, { backgroundColor: tx.amount > 0 ? '#ECFDF5' : '#F8FAFC' }]}>
                <Ionicons
                  name={tx.amount > 0 ? 'arrow-down-outline' : 'arrow-up-outline'}
                  size={16}
                  color={tx.amount > 0 ? '#059669' : '#475569'}
                />
              </View>
              <View style={styles.txInfo}>
                <Text style={styles.txEntity}>{tx.entity}</Text>
                <Text style={styles.txDate}>{tx.date} · {tx.type}</Text>
              </View>
              <Text style={[styles.txAmount, tx.amount > 0 && styles.txPositive]}>
                {tx.amount > 0 ? '+' : ''}₹{Math.abs(tx.amount).toFixed(2)}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F9' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F7F9' },

  balanceCard: {
    margin: 16, borderRadius: 24,
    backgroundColor: '#4F46E5', padding: 24,
    shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  balanceTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  balanceLabel: { color: '#C7D2FE', fontSize: 13, fontWeight: '500' },
  balanceAmount: { color: '#fff', fontSize: 38, fontWeight: '800', letterSpacing: -1, marginTop: 4 },
  cardIconBox: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  balanceFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)', paddingTop: 16 },
  balanceFooterText: { color: '#C7D2FE', fontSize: 12, fontWeight: '500' },
  activePill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  activePillText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8, gap: 8, marginBottom: 8 },
  actionCard: {
    flex: 1, minWidth: '45%', backgroundColor: '#fff',
    borderRadius: 20, padding: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  actionIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  actionLabel: { fontSize: 13, fontWeight: '700', color: '#1E293B' },

  section: {
    marginHorizontal: 16, backgroundColor: '#fff',
    borderRadius: 20, padding: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  seeAll: { fontSize: 12, fontWeight: '500', color: '#94A3B8' },
  emptyText: { textAlign: 'center', color: '#94A3B8', fontSize: 13, paddingVertical: 24 },

  txRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14 },
  txIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  txInfo: { flex: 1 },
  txEntity: { fontSize: 13, fontWeight: '600', color: '#1E293B' },
  txDate: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  txPositive: { color: '#059669' },
});
