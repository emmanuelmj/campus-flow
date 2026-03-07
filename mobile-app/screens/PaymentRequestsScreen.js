import React, { useState, useEffect } from 'react';
import {
    View, Text, FlatList, TouchableOpacity,
    StyleSheet, ActivityIndicator, Alert, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchPaymentRequests, approvePaymentRequest } from '../services/api';

export default function PaymentRequestsScreen({ navigation }) {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadRequests = async () => {
        try {
            const data = await fetchPaymentRequests();
            setRequests(data);
        } catch (e) {
            Alert.alert('Error', 'Failed to fetch payment requests');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadRequests();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadRequests();
    };

    const handleApprove = (req) => {
        Alert.alert(
            'Approve Payment',
            `Pay ₹${req.amount.toFixed(2)} to ${req.vendor_id}?\n\nDescription: ${req.description || 'No description provided'}`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Pay Now',
                    onPress: async () => {
                        try {
                            // Strip 'req-' prefix if present, backend expects UUID
                            const cleanId = req.request_id.replace('req-', '');
                            await approvePaymentRequest(cleanId);
                            Alert.alert('Success', 'Payment completed successfully');
                            loadRequests();
                        } catch (err) {
                            Alert.alert('Payment Failed', err.message);
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#4F46E5" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={requests}
                keyExtractor={(item) => item.request_id}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="notifications-off-outline" size={64} color="#CBD5E1" />
                        <Text style={styles.emptyText}>No pending payment requests</Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View style={styles.vendorIcon}>
                                <Ionicons name="storefront" size={20} color="#4F46E5" />
                            </View>
                            <View style={styles.headerInfo}>
                                <Text style={styles.vendorName}>{item.vendor_id}</Text>
                                <Text style={styles.description}>{item.description || 'Payment Request'}</Text>
                            </View>
                            <Text style={styles.amount}>₹{item.amount.toFixed(2)}</Text>
                        </View>

                        <TouchableOpacity
                            style={styles.payButton}
                            onPress={() => handleApprove(item)}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.payButtonText}>Approve & Pay</Text>
                        </TouchableOpacity>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F7F7F9' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContainer: { padding: 16, gap: 16 },
    card: {
        backgroundColor: '#fff', borderRadius: 24, padding: 20,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    vendorIcon: {
        width: 44, height: 44, borderRadius: 14,
        backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center',
        marginRight: 12
    },
    headerInfo: { flex: 1 },
    vendorName: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
    description: { fontSize: 12, color: '#64748B', marginTop: 2 },
    amount: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
    payButton: {
        backgroundColor: '#4F46E5', borderRadius: 14,
        paddingVertical: 14, alignItems: 'center',
    },
    payButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { color: '#94A3B8', fontSize: 14, marginTop: 16, fontWeight: '500' },
});
