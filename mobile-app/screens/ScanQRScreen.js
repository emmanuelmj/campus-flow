import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function ScanQRScreen() {
    const [hasPermission, setHasPermission] = useState(null);
    const [scanned, setScanned] = useState(false);
    const navigation = useNavigation();

    useEffect(() => {
        const getCameraPermissions = async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        };

        getCameraPermissions();
    }, []);

    const handleBarCodeScanned = ({ type, data }) => {
        setScanned(true);
        let parsedData;

        try {
            parsedData = JSON.parse(data);
        } catch (e) {
            // If it's not JSON, pass it raw 
            parsedData = data.trim();
        }

        // Check if CampusFlow format
        if (parsedData?.app === 'campusflow' && parsedData?.id) {
            const idStr = parsedData.id;
            const isVendor = idStr.startsWith('V-') || idStr.includes('vendor') || !idStr.includes('@');

            // This is a naive heuristic for the demo; normally you'd check UUID or query API
            // if the string looks like an email or student ID, send to P2P. Otherwise vendor.
            if (idStr.includes('@campus.edu') || idStr.includes('@uni.edu') || idStr.includes('uuid') || idStr.includes('CS-') || idStr.includes('student')) {
                navigation.navigate('Transfer', { initialTarget: idStr });
            } else {
                navigation.navigate('VendorPayment', { initialTarget: idStr });
            }
        } else if (typeof parsedData === 'string') {
            // Just send raw decoded text to Transfer for the user to confirm
            navigation.navigate('Transfer', { initialTarget: parsedData });
        } else {
            Alert.alert('Invalid QR Code', 'This does not appear to be a valid CampusFlow ID.', [
                { text: 'Scan Again', onPress: () => setScanned(false) }
            ]);
        }
    };

    if (hasPermission === null) {
        return (
            <View style={styles.center}>
                <Text style={styles.text}>Requesting camera permission...</Text>
            </View>
        );
    }
    if (hasPermission === false) {
        return (
            <View style={styles.center}>
                <Ionicons name="camera-outline" size={64} color="#94A3B8" />
                <Text style={styles.errorText}>No access to camera</Text>
                <Text style={styles.subText}>Please enable camera access in your device settings.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView
                style={styles.camera}
                facing="back"
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ["qr"],
                }}
            >
                <View style={styles.overlay}>
                    <View style={styles.topBar}>
                        <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
                            <Ionicons name="close" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.scanArea}>
                        <View style={styles.scanFrame} />
                        <Text style={styles.instructionText}>Positon the QR Code within the frame</Text>
                    </View>
                </View>
            </CameraView>

            {scanned && (
                <View style={styles.bottomBar}>
                    <TouchableOpacity style={styles.rescanBtn} onPress={() => setScanned(false)}>
                        <Text style={styles.rescanText}>Tap to Scan Again</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F7F7F9',
        padding: 24,
    },
    text: {
        fontSize: 16,
        color: '#64748B',
    },
    errorText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1E293B',
        marginTop: 16,
    },
    subText: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        marginTop: 8,
    },
    camera: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'space-between',
    },
    topBar: {
        paddingTop: 60,
        paddingHorizontal: 24,
        alignItems: 'flex-start',
    },
    closeButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scanArea: {
        alignItems: 'center',
        marginBottom: '30%',
    },
    scanFrame: {
        width: 250,
        height: 250,
        borderWidth: 2,
        borderColor: '#4F46E5',
        backgroundColor: 'transparent',
        borderRadius: 24,
    },
    instructionText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
        marginTop: 24,
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 32,
        alignItems: 'center',
    },
    rescanBtn: {
        backgroundColor: '#fff',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 100,
    },
    rescanText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1E293B',
    }
});
