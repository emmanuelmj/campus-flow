import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import TransferScreen from './screens/TransferScreen';
import VendorPaymentScreen from './screens/VendorPaymentScreen';
import TransactionsScreen from './screens/TransactionsScreen';
import FinesScreen from './screens/FinesScreen';
import SubscriptionsScreen from './screens/SubscriptionsScreen';
import MyQRScreen from './screens/MyQRScreen';
import ScanQRScreen from './screens/ScanQRScreen';
import PaymentRequestsScreen from './screens/PaymentRequestsScreen';
import CanteenScreen from './screens/CanteenScreen';
import LibraryScreen from './screens/LibraryScreen';

const Stack = createNativeStackNavigator();

const headerStyle = {
  headerStyle: { backgroundColor: '#F7F7F9' },
  headerShadowVisible: false,
  headerTintColor: '#1E293B',
  headerTitleStyle: { fontWeight: '700', fontSize: 17 },
};

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={headerStyle}>
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'CampusFlow' }} />
        <Stack.Screen name="Transfer" component={TransferScreen} options={{ title: 'Send Money' }} />
        <Stack.Screen name="VendorPayment" component={VendorPaymentScreen} options={{ title: 'Pay Vendor' }} />
        <Stack.Screen name="Transactions" component={TransactionsScreen} options={{ title: 'Transactions' }} />
        <Stack.Screen name="Fines" component={FinesScreen} options={{ title: 'Fines & Dues' }} />
        <Stack.Screen name="Subscriptions" component={SubscriptionsScreen} options={{ title: 'Subscriptions' }} />
        <Stack.Screen name="MyQR" component={MyQRScreen} options={{ title: 'My QR Code' }} />
        <Stack.Screen name="ScanQR" component={ScanQRScreen} options={{ title: 'Scan QR Code', headerShown: false }} />
        <Stack.Screen name="PaymentRequests" component={PaymentRequestsScreen} options={{ title: 'Payment Requests' }} />
        <Stack.Screen name="Canteen" component={CanteenScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Library" component={LibraryScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
