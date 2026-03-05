import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import TransferScreen from './screens/TransferScreen';
import VendorPaymentScreen from './screens/VendorPaymentScreen';
import TransactionsScreen from './screens/TransactionsScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="Transfer" component={TransferScreen} />
        <Stack.Screen name="VendorPayment" component={VendorPaymentScreen} options={{ title: 'Pay Vendor' }} />
        <Stack.Screen name="Transactions" component={TransactionsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
