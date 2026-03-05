import React from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';

export default function VendorPaymentScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Vendor ID</Text>
      <TextInput style={styles.input} placeholder="e.g. canteen-01" />
      <Text style={styles.label}>Amount (₹)</Text>
      <TextInput style={styles.input} placeholder="0.00" keyboardType="numeric" />
      <Button title="Pay Vendor" onPress={() => alert('Paid!')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  label: { fontSize: 16, marginBottom: 5 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 20, borderRadius: 5 }
});
