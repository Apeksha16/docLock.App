import { StyleSheet, Text, View, Modal, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

interface DeleteAccountModalProps {
    visible: boolean;
    onClose: () => void;
    onDelete: () => void;
    isLoading?: boolean;
}

const { width } = Dimensions.get('window');

export default function DeleteAccountModal({ visible, onClose, onDelete, isLoading = false }: DeleteAccountModalProps) {
    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={isLoading ? () => { } : onClose}
        >
            <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={isLoading ? undefined : onClose}>
                {/* Blur Background */}
                <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />

                <TouchableOpacity activeOpacity={1} style={styles.modalContainer}>
                    {/* Handle Bar */}
                    <View style={styles.handleBar} />

                    {/* Icon Header */}
                    <View style={styles.iconContainer}>
                        <Feather name="trash-2" size={24} color="#FFFFFF" />
                    </View>

                    {/* Content */}
                    <Text style={styles.title}>The Final Countdown</Text>
                    <Text style={styles.subtitle}>Whoa there, partner! 🤠</Text>

                    <Text style={styles.message}>
                        You are about to <Text style={styles.boldText}>permanently delete</Text> your account.
                        {"\n\n"}
                        All your documents, friends, and data will be wiped from the face of the earth.
                        {"\n\n"}
                        This action is <Text style={styles.boldText}>irreversible</Text> - like a bad haircut, but permanent.
                    </Text>

                    {/* Buttons */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[styles.deleteButton, isLoading && styles.deleteButtonDisabled]}
                            onPress={onDelete}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.deleteButtonText}>Yes, Delete Everything</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={onClose}
                            disabled={isLoading}
                        >
                            <Text style={[styles.cancelButtonText, isLoading && { opacity: 0.5 }]}>
                                Wait, I changed my mind
                            </Text>
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
        fontSize: 22,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
        marginBottom: 16,
    },
    message: {
        fontSize: 14,
        color: '#475569',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    boldText: {
        fontWeight: '700',
        color: '#0F172A',
    },
    buttonContainer: {
        width: '100%',
        gap: 12,
    },
    deleteButton: {
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
    deleteButtonText: {
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
    deleteButtonDisabled: {
        opacity: 0.7,
    },
});
