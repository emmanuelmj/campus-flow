import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, Alert, SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchCanteens, fetchCanteenMenu, placeCanteenOrder, fetchWallet } from '../services/api';

export default function CanteenScreen({ navigation }) {
    const [canteens, setCanteens] = useState([]);
    const [selectedCanteen, setSelectedCanteen] = useState(null);
    const [menu, setMenu] = useState([]);
    const [cart, setCart] = useState({});
    const [loading, setLoading] = useState(true);
    const [balance, setBalance] = useState(0);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [cData, wData] = await Promise.all([fetchCanteens(), fetchWallet()]);
            setCanteens(cData);
            setBalance(wData.balance);
        } catch (e) {
            setCanteens([{ vendor_id: 'v1', vendor_name: 'Main Canteen', vendor_code: 'CNTN01' }]);
        } finally {
            setLoading(false);
        }
    };

    const loadMenu = async (vendorId) => {
        setLoading(true);
        try {
            const data = await fetchCanteenMenu(vendorId);
            setMenu(data);
        } catch (e) {
            setMenu([
                { id: 'm1', name: 'Veg Burger', price: 80 },
                { id: 'm2', name: 'Cold Coffee', price: 40 }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const addToCart = (item) => {
        setCart(prev => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }));
    };

    const removeFromCart = (item) => {
        setCart(prev => {
            const newCart = { ...prev };
            if (newCart[item.id] > 1) newCart[item.id]--;
            else delete newCart[item.id];
            return newCart;
        });
    };

    const total = Object.entries(cart).reduce((sum, [id, qty]) => {
        const item = menu.find(m => m.id === id);
        return sum + (item?.price || 0) * qty;
    }, 0);

    const handleOrder = async () => {
        if (total > balance) return Alert.alert('Error', 'Insufficient balance');
        try {
            const items = Object.entries(cart).map(([id, qty]) => ({ menu_item_id: id, quantity: qty }));
            await placeCanteenOrder(selectedCanteen.vendor_id, items);
            Alert.alert('Success', 'Order placed successfully!');
            navigation.goBack();
        } catch (e) {
            Alert.alert('Error', e.message);
        }
    };

    if (selectedCanteen) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => setSelectedCanteen(null)}>
                        <Ionicons name="arrow-back" size={24} color="#1E293B" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{selectedCanteen.vendor_name}</Text>
                    <View style={{ width: 24 }} />
                </View>
                <FlatList
                    data={menu}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{ padding: 16 }}
                    renderItem={({ item }) => (
                        <View style={styles.itemCard}>
                            <View>
                                <Text style={styles.itemName}>{item.name}</Text>
                                <Text style={styles.itemPrice}>₹{item.price}</Text>
                            </View>
                            <View style={styles.counter}>
                                {cart[item.id] ? (
                                    <>
                                        <TouchableOpacity onPress={() => removeFromCart(item)} style={styles.countBtn}>
                                            <Text style={styles.countBtnText}>-</Text>
                                        </TouchableOpacity>
                                        <Text style={styles.countText}>{cart[item.id]}</Text>
                                        <TouchableOpacity onPress={() => addToCart(item)} style={[styles.countBtn, { backgroundColor: '#4F46E5' }]}>
                                            <Text style={[styles.countBtnText, { color: '#fff' }]}>+</Text>
                                        </TouchableOpacity>
                                    </>
                                ) : (
                                    <TouchableOpacity onPress={() => addToCart(item)} style={styles.addBtn}>
                                        <Text style={styles.addBtnText}>Add</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    )}
                />
                {total > 0 && (
                    <View style={styles.footer}>
                        <View>
                            <Text style={styles.footerLabel}>Total Amount</Text>
                            <Text style={styles.footerValue}>₹{total}</Text>
                        </View>
                        <TouchableOpacity onPress={handleOrder} style={styles.orderBtn}>
                            <Text style={styles.orderBtnText}>Place Order</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Canteens</Text>
                <View style={{ width: 24 }} />
            </View>
            {loading ? (
                <View style={styles.center}><ActivityIndicator color="#4F46E5" /></View>
            ) : (
                <FlatList
                    data={canteens}
                    keyExtractor={item => item.vendor_id}
                    contentContainerStyle={{ padding: 16 }}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.canteenCard}
                            onPress={() => { setSelectedCanteen(item); loadMenu(item.vendor_id); }}
                        >
                            <View style={styles.canteenIcon}>
                                <Ionicons name="fast-food" size={24} color="#EA580C" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.canteenName}>{item.vendor_name}</Text>
                                <Text style={styles.canteenSub}>Open for orders</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                        </TouchableOpacity>
                    )}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff',
        borderBottomWidth: 1, borderBottomColor: '#F1F5F9'
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
    canteenCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
        padding: 16, borderRadius: 16, marginBottom: 12,
        borderWidth: 1, borderColor: '#F1F5F9'
    },
    canteenIcon: {
        width: 48, height: 48, borderRadius: 12, backgroundColor: '#FFF7ED',
        alignItems: 'center', justifyContent: 'center', marginRight: 16
    },
    canteenName: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
    canteenSub: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
    itemCard: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 12,
        borderWidth: 1, borderColor: '#F1F5F9'
    },
    itemName: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
    itemPrice: { fontSize: 14, color: '#64748B', marginTop: 4 },
    counter: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    countBtn: {
        width: 32, height: 32, borderRadius: 8, backgroundColor: '#F1F5F9',
        alignItems: 'center', justifyContent: 'center'
    },
    countBtnText: { fontSize: 20, fontWeight: '600', color: '#1E293B' },
    countText: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
    addBtn: {
        paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10,
        backgroundColor: '#4F46E5'
    },
    addBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    footer: {
        padding: 20, backgroundColor: '#1E293B', borderTopLeftRadius: 24,
        borderTopRightRadius: 24, flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center'
    },
    footerLabel: { color: '#94A3B8', fontSize: 10, fontWeight: '600' },
    footerValue: { color: '#fff', fontSize: 18, fontWeight: '800' },
    orderBtn: {
        backgroundColor: '#4F46E5', paddingHorizontal: 24, paddingVertical: 12,
        borderRadius: 12
    },
    orderBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' }
});
