import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';

const MOCK_DATA = [
  { id: '1', title: 'Main Canteen', amount: '-₹120.00', date: 'Today' },
  { id: '2', title: 'Transfer to John', amount: '-₹250.00', date: 'Yesterday' },
  { id: '3', title: 'Library Fine', amount: '-₹20.00', date: '2 days ago' }
];

export default function TransactionsScreen() {
  return (
    <View style={styles.container}>
      <FlatList 
        data={MOCK_DATA}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.date}>{item.date}</Text>
            </View>
            <Text style={styles.amount}>{item.amount}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  item: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 16 },
  date: { color: '#888', marginTop: 4 },
  amount: { fontSize: 16, fontWeight: 'bold' }
});
