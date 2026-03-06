import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { subscribe } from '../services/api';

// These match service_id values sent to the backend /subscribe endpoint
const AVAILABLE_PLANS = [
  { id: 'premium-meal-plan',  name: 'Premium Meal Plan',  amount: 800,  cycle: 'Monthly',  desc: 'Access to premium dining hall menu.' },
  { id: 'laundry-service',    name: 'Laundry Service',    amount: 200,  cycle: 'Monthly',  desc: '4 bags of wash & fold laundry.' },
  { id: 'campus-shuttle',     name: 'Campus Shuttle+',    amount: 150,  cycle: 'Semester', desc: 'Unlimited air-conditioned shuttle rides.' },
  { id: 'gym-access',         name: 'Campus Gym',         amount: 300,  cycle: 'Monthly',  desc: 'Full gym and fitness centre access.' },
];

export default function SubscriptionsScreen() {
  const [subscribing, setSubscribing] = useState(null); // plan id being subscribed

  const handleSubscribe = (plan) => {
    Alert.alert(
      'Confirm Subscription',
      `Subscribe to "${plan.name}" for ₹${plan.amount}/${plan.cycle}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Subscribe',
          onPress: async () => {
            setSubscribing(plan.id);
            try {
              await subscribe(plan.id);
              Alert.alert('Subscribed!', `You are now subscribed to ${plan.name}.`);
            } catch (e) {
              Alert.alert('Failed', e.message);
            } finally {
              setSubscribing(null);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Available Plans</Text>

      {AVAILABLE_PLANS.map(plan => (
        <View key={plan.id} style={styles.card}>
          <View style={styles.cardTop}>
            <View style={styles.iconBox}>
              <Ionicons name="calendar-outline" size={20} color="#4F46E5" />
            </View>
            <View style={styles.planInfo}>
              <Text style={styles.planName}>{plan.name}</Text>
              <Text style={styles.planDesc}>{plan.desc}</Text>
            </View>
          </View>

          <View style={styles.cardBottom}>
            <View>
              <Text style={styles.price}>
                ₹{plan.amount}
                <Text style={styles.cycle}> / {plan.cycle}</Text>
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.subBtn, subscribing === plan.id && styles.subBtnDisabled]}
              onPress={() => handleSubscribe(plan)}
              disabled={subscribing === plan.id}
              activeOpacity={0.85}
            >
              {subscribing === plan.id ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.subBtnText}>Subscribe</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F9' },
  content: { padding: 16, paddingBottom: 32 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#64748B', marginBottom: 12 },

  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  iconBox: {
    width: 42, height: 42, borderRadius: 13,
    backgroundColor: '#EEF2FF', borderWidth: 1, borderColor: '#C7D2FE',
    alignItems: 'center', justifyContent: 'center', marginRight: 12, marginTop: 2,
  },
  planInfo: { flex: 1 },
  planName: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  planDesc: { fontSize: 12, color: '#64748B', marginTop: 4, lineHeight: 18 },

  cardBottom: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 14,
  },
  price: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
  cycle: { fontSize: 12, fontWeight: '400', color: '#94A3B8' },
  subBtn: {
    backgroundColor: '#4F46E5', paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 12, minWidth: 90, alignItems: 'center',
    shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2, shadowRadius: 6, elevation: 3,
  },
  subBtnDisabled: { opacity: 0.6 },
  subBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
