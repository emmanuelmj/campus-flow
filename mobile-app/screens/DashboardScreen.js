import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchWallet, fetchTransactions } from '../services/api';

const ACTIONS = [
  { label: 'Send Money', icon: 'send-outline', color: '#4F46E5', bg: '#EEF2FF', screen: 'Transfer' },
  { label: 'Pay Vendor', icon: 'storefront-outline', color: '#059669', bg: '#ECFDF5', screen: 'VendorPayment' },
  { label: 'Scan QR', icon: 'scan-outline', color: '#0284C7', bg: '#E0F2FE', screen: 'ScanQR' },
  { label: 'My QR', icon: 'qr-code-outline', color: '#7C3AED', bg: '#F3E8FF', screen: 'MyQR' },
  { label: 'Requests', icon: 'notifications-outline', color: '#EA580C', bg: '#FFF7ED', screen: 'PaymentRequests' },
  { label: 'Fines', icon: 'receipt-outline', color: '#DC2626', bg: '#FEF2F2', screen: 'Fines' },
  { label: 'Subscriptions', icon: 'calendar-outline', color: '#D97706', bg: '#FFFBEB', screen: 'Subscriptions' },
  { label: 'Canteen', icon: 'fast-food-outline', color: '#EA580C', bg: '#FFF7ED', screen: 'Canteen' },
  { label: 'Library', icon: 'book-outline', color: '#1E40AF', bg: '#DBEAFE', screen: 'Library' },
];

export default function DashboardScreen({ navigation, route }) {
  const [balance, setBalance] = useState(null);
  const [transactions, setTx] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const callGemini = async (prompt) => {
    const apiKey = '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';
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.0-pro-exp-02-05:free',
          messages: [
            { role: 'system', content: 'You are a concise financial assistant. Keep responses under 2 sentences.' },
            { role: 'user', content: prompt }
          ]
        })
      });
      const data = await res.json();
      return data.choices?.[0]?.message?.content || 'No response.';
    } catch (e) {
      return 'AI service offline.';
    }
  };

  const handleGetInsights = async () => {
    if (transactions.length === 0) return Alert.alert('Notice', 'No transactions to analyze.');
    setAiLoading(true);
    setAiModalVisible(true);
    setAiResult('');

    const txList = transactions.slice(0, 5).map(t => `${t.date}: ${t.entity} (₹${Math.abs(t.amount)})`).join('\n');
    const res = await callGemini(`Analyse these recent transactions:\n${txList}\n\nGive a 1-2 sentence professional spending analysis.`);
    setAiResult(res);
    setAiLoading(false);
  };

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
              tx.type === 'P2P' ? 'Student Transfer' :
                tx.type === 'FINE' ? 'Fine Payment' : tx.type,
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

      {/* AI Button */}
      <TouchableOpacity
        style={styles.aiButton}
        onPress={handleGetInsights}
        activeOpacity={0.85}
      >
        <Ionicons name="sparkles" size={20} color="#fff" />
        <Text style={styles.aiButtonText}>Ask AI for Insights</Text>
        <Ionicons name="chevron-forward" size={16} color="#fff" style={{ marginLeft: 'auto' }} />
      </TouchableOpacity>

      {/* AI Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={aiModalVisible}
        onRequestClose={() => setAiModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="sparkles-sharp" size={20} color="#4F46E5" />
              <Text style={styles.modalTitle}>Spending Analysis</Text>
              <TouchableOpacity onPress={() => setAiModalVisible(false)}>
                <Ionicons name="close" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {aiLoading ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="small" color="#4F46E5" />
                <Text style={styles.modalLoadingText}>Analyzing your spending...</Text>
              </View>
            ) : (
              <View style={styles.aiResultBox}>
                <Text style={styles.aiResultText}>{aiResult}</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.closeModalBtn}
              onPress={() => setAiModalVisible(false)}
            >
              <Text style={styles.closeModalBtnText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
    width: '30%', backgroundColor: '#fff',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 18,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    marginBottom: 8,
  },
  actionIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  actionLabel: { fontSize: 12, fontWeight: '700', color: '#1E293B', textAlign: 'center' },

  aiButton: {
    marginHorizontal: 16, marginBottom: 16,
    height: 60, borderRadius: 20,
    backgroundColor: '#7C3AED', flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, gap: 12,
    shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  aiButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: { backgroundColor: '#fff', borderRadius: 28, width: '100%', padding: 24, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B', flex: 1 },
  modalLoading: { paddingVertical: 32, alignItems: 'center', gap: 12, marginVertical: 20 },
  modalLoadingText: { fontSize: 12, fontWeight: '600', color: '#94A3B8', marginTop: 8 },
  aiResultBox: { backgroundColor: '#F8FAFC', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 24 },
  aiResultText: { fontSize: 14, color: '#475569', lineHeight: 22, fontWeight: '500' },
  closeModalBtn: { backgroundColor: '#1E293B', borderRadius: 16, height: 54, alignItems: 'center', justifyContent: 'center' },
  closeModalBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

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
