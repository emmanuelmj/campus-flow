import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    ActivityIndicator, Alert, SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchBooks, rentBook } from '../services/api';

export default function LibraryScreen({ navigation }) {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadBooks();
    }, []);

    const loadBooks = async () => {
        try {
            const data = await fetchBooks();
            setBooks(data);
        } catch (e) {
            setBooks([
                { id: 'b1', title: 'Modern Physics', author: 'Resnick Halliday', category: 'Science', available_copies: 5 },
                { id: 'b2', title: 'Data Structures', author: 'Narasimha Karumanchi', category: 'CS', available_copies: 3 }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleRent = async (book) => {
        Alert.alert(
            'Rent Book',
            `Confirm renting "${book.title}" for 14 days?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Rent',
                    onPress: async () => {
                        try {
                            await rentBook(book.id);
                            Alert.alert('Success', 'Book rented successfully!');
                            navigation.goBack();
                        } catch (e) {
                            Alert.alert('Error', e.message);
                        }
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Library</Text>
                <View style={{ width: 24 }} />
            </View>
            {loading ? (
                <View style={styles.center}><ActivityIndicator color="#4F46E5" /></View>
            ) : (
                <FlatList
                    data={books}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{ padding: 16 }}
                    renderItem={({ item }) => (
                        <View style={styles.bookCard}>
                            <View style={styles.bookIcon}>
                                <Ionicons name="book" size={24} color="#1E40AF" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.bookTitle} numberOfLines={1}>{item.title}</Text>
                                <Text style={styles.bookAuthor}>{item.author}</Text>
                                <View style={styles.metaRow}>
                                    <View style={styles.categoryPill}>
                                        <Text style={styles.categoryText}>{item.category}</Text>
                                    </View>
                                    <Text style={styles.stockText}>{item.available_copies} left</Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                style={[styles.rentBtn, item.available_copies === 0 && { opacity: 0.5 }]}
                                onPress={() => item.available_copies > 0 && handleRent(item)}
                                disabled={item.available_copies === 0}
                            >
                                <Text style={styles.rentBtnText}>Rent</Text>
                            </TouchableOpacity>
                        </View>
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
    bookCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
        padding: 16, borderRadius: 16, marginBottom: 12,
        borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOpacity: 0.02,
        shadowRadius: 10, elevation: 1
    },
    bookIcon: {
        width: 48, height: 64, borderRadius: 8, backgroundColor: '#DBEAFE',
        alignItems: 'center', justifyContent: 'center', marginRight: 16,
        borderWidth: 1, borderColor: '#BFDBFE'
    },
    bookTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
    bookAuthor: { fontSize: 12, color: '#64748B', marginTop: 2 },
    metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 12 },
    categoryPill: {
        backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 2,
        borderRadius: 6
    },
    categoryText: { fontSize: 10, fontWeight: '700', color: '#64748B', textTransform: 'uppercase' },
    stockText: { fontSize: 11, color: '#94A3B8' },
    rentBtn: {
        backgroundColor: '#4F46E5', paddingHorizontal: 16, paddingVertical: 8,
        borderRadius: 10, marginLeft: 12
    },
    rentBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' }
});
