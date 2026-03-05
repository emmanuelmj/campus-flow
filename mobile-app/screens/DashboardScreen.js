import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

export default function DashboardScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.balanceTitle}>Wallet Balance</Text>
      <Text style={styles.balance}>₹1,250.50</Text>
      
      <View style={styles.buttonContainer}>
        <Button title="Transfer (P2P)" onPress={() => navigation.navigate('Transfer')} />
      </View>
      <View style={styles.buttonContainer}>
        <Button title="Pay Vendor" onPress={() => navigation.navigate('VendorPayment')} />
      </View>
      <View style={styles.buttonContainer}>
        <Button title="View Transactions" onPress={() => navigation.navigate('Transactions')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, alignItems: 'center', justifyContent: 'center' },
  balanceTitle: { fontSize: 18, color: '#666' },
  balance: { fontSize: 48, fontWeight: 'bold', marginBottom: 40 },
  buttonContainer: { width: '100%', marginBottom: 15 }
});
