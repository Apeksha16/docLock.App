import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity, TextInput, Dimensions, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

interface EditNameModalProps {
    visible: boolean;
    onClose: () => void;
    currentName: string;
    onSave: (newName: string) => Promise<void>;
}

const { width } = Dimensions.get('window');

export default function EditNameModal({ visible, onClose, currentName, onSave }: EditNameModalProps) {
    const [name, setName] = useState(currentName);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible) {
            setName(currentName);
        }
    }, [visible, currentName]);

    const handleSave = async () => {
        if (!name.trim()) return;

        setLoading(true);
        try {
            await onSave(name.trim());
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardAvoidingView}
            >
                <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
                    {/* Blur Background */}
                    <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />

                    <TouchableOpacity activeOpacity={1} style={styles.modalContainer}>
                        {/* Handle Bar */}
                        <View style={styles.handleBar} />

                        {/* Header */}
                        <View style={styles.header}>
                            <View style={styles.iconContainer}>
                                <Feather name="edit-2" size={24} color="#FFFFFF" />
                            </View>
                            <Text style={styles.title}>Edit Name</Text>
                        </View>

                        {/* Input */}
                        <Text style={styles.inputLabel}>Full Name</Text>
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholder="Enter your full name"
                            placeholderTextColor="#94A3B8"
                            autoCapitalize="words"
                            autoCorrect={false}
                        />

                        {/* Buttons */}
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={[styles.saveButton, !name.trim() && styles.disabledButton]}
                                onPress={handleSave}
                                disabled={loading || !name.trim()}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.saveButtonText}>Save Changes</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.cancelButton} onPress={onClose} disabled={loading}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    keyboardAvoidingView: {
        flex: 1,
    },
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
        paddingBottom: 40,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
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
    header: {
        alignItems: 'center',
        marginBottom: 24,
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 20,
        backgroundColor: '#2DD4BF', // Teal 400
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#2DD4BF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#0F172A',
    },
    inputLabel: {
        alignSelf: 'flex-start',
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        width: '100%',
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 16,
        fontSize: 16,
        color: '#1E293B',
        marginBottom: 24,
    },
    buttonContainer: {
        width: '100%',
        gap: 12,
    },
    saveButton: {
        width: '100%',
        backgroundColor: '#2DD4BF',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#2DD4BF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    disabledButton: {
        backgroundColor: '#94A3B8',
        shadowOpacity: 0,
    },
    saveButtonText: {
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
        color: '#64748B',
        fontSize: 16,
        fontWeight: '700',
    },
});
