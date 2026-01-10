import React from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

interface LogoutModalProps {
    visible: boolean;
    onClose: () => void;
    onLogout: () => void;
}

const { width, height } = Dimensions.get('window');

export default function LogoutModal({ visible, onClose, onLogout }: LogoutModalProps) {
    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
                {/* Blur Background */}
                <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />

                <TouchableOpacity activeOpacity={1} style={styles.modalContainer}>
                    {/* Handle Bar */}
                    <View style={styles.handleBar} />

                    {/* Icon Header */}
                    <View style={styles.iconContainer}>
                        <Feather name="log-out" size={24} color="#FFFFFF" />
                    </View>

                    {/* Content */}
                    <Text style={styles.title}>Logout?</Text>
                    <Text style={styles.message}>Are you sure you want to sign out of DocLock?</Text>

                    {/* Buttons */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
                            <Text style={styles.logoutButtonText}>Logout</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 24,
        paddingBottom: 40, // Extra padding for bottom safe area
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -4,
        },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
    },
    handleBar: {
        width: 40,
        height: 4,
        backgroundColor: '#E2E8F0',
        borderRadius: 2,
        marginBottom: 24,
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 20,
        backgroundColor: '#EF4444', // Red 500
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 8,
    },
    message: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    buttonContainer: {
        width: '100%',
        gap: 12,
    },
    logoutButton: {
        width: '100%',
        backgroundColor: '#EF4444',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    logoutButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    cancelButton: {
        width: '100%',
        paddingVertical: 12,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#0F172A',
        fontSize: 16,
        fontWeight: '700',
    },
});
