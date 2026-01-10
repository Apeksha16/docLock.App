import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, TextInput, Pressable, Alert } from 'react-native';
import { Ionicons, Feather, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SecureQRScreenProps {
    onNavigate: (screen: 'dashboard' | 'friends' | 'profile') => void;
}

export default function SecureQRScreen({ onNavigate }: SecureQRScreenProps) {
    const [qrCodes, setQrCodes] = useState<any[]>([]); // Start empty
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
    const [label, setLabel] = useState('');

    const toggleDoc = (doc: string) => {
        if (selectedDocs.includes(doc)) {
            setSelectedDocs(selectedDocs.filter(d => d !== doc));
        } else {
            setSelectedDocs([...selectedDocs, doc]);
        }
    };

    const handleGenerateQR = () => {
        if (label && selectedDocs.length > 0) {
            setQrCodes([...qrCodes, { id: Date.now(), label, date: '08/01/2026', files: selectedDocs.length }]);
            setShowAddModal(false);
            setLabel('');
            setSelectedDocs([]);
        }
    };

    const handleDeleteQR = () => {
        setQrCodes([]); // Clear all for demo, or delete specific if needed
        setShowDeleteModal(false);
    };

    const handleDownload = () => {
        Alert.alert("Success", "Documents downloaded successfully.");
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <SafeAreaView style={{ flex: 1 }}>

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => onNavigate('dashboard')} style={styles.backButton}>
                        <Feather name="arrow-left" size={24} color="#1E293B" />
                    </TouchableOpacity>

                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle}>Secure QR</Text>
                        <Text style={styles.headerSubtitle}>{qrCodes.length} active codes</Text>
                    </View>

                    <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
                        <Feather name="plus" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    {qrCodes.length === 0 ? (
                        /* Empty State */
                        <View style={styles.emptyStateContainer}>
                            <View style={styles.bigAddButton}>
                                <Feather name="plus" size={40} color="#F97316" />
                            </View>
                            <Text style={styles.emptyTitle}>No QR Codes</Text>
                            <Text style={styles.emptySubtitle}>Create a secure access point for your documents.</Text>
                        </View>
                    ) : (
                        /* List State */
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {qrCodes.map((qr, index) => (
                                <View key={qr.id} style={styles.cardContainer}>
                                    <LinearGradient
                                        colors={['#FB923C', '#EA580C']} // Orange 400 to Orange 600
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={styles.cardGradient}
                                    >
                                        {/* Geometric Overlay */}
                                        <View style={styles.geometricOverlay1} />
                                        <View style={styles.geometricOverlay2} />

                                        <View style={styles.cardContent}>
                                            {/* Left Side */}
                                            <View style={styles.cardLeft}>
                                                <View style={styles.filesBadge}>
                                                    <Feather name="file-text" size={14} color="#FFFFFF" />
                                                    <Text style={styles.filesBadgeText}>{qr.files} Files</Text>
                                                </View>

                                                <View style={styles.actionButtonsRow}>
                                                    <TouchableOpacity style={styles.actionButton} onPress={handleDownload}>
                                                        <Feather name="download" size={18} color="#FFFFFF" />
                                                    </TouchableOpacity>
                                                    <TouchableOpacity style={styles.actionButton} onPress={() => setShowDeleteModal(true)}>
                                                        <Feather name="trash-2" size={18} color="#FFFFFF" />
                                                    </TouchableOpacity>
                                                </View>

                                                <View style={styles.cardInfo}>
                                                    <Text style={styles.cardIdText}>{qr.label}</Text>
                                                    <View style={styles.dateRow}>
                                                        <Feather name="calendar" size={14} color="#FED7AA" />
                                                        <Text style={styles.dateText}>{qr.date}</Text>
                                                    </View>
                                                </View>
                                            </View>

                                            {/* Right Side - QR Code */}
                                            <View style={styles.qrContainer}>
                                                <View style={styles.qrBox}>
                                                    <MaterialCommunityIcons name="qrcode" size={90} color="#000000" />
                                                </View>
                                            </View>
                                        </View>
                                    </LinearGradient>
                                </View>
                            ))}
                        </ScrollView>
                    )}
                </View>

            </SafeAreaView>

            {/* Top Right Background Decoration */}
            <View style={styles.topRightDecoration} />

            {/* Bottom Navigation Bar - Standard Dashboard Style */}
            <View style={styles.bottomNavContainer}>
                <View style={styles.bottomNav}>
                    {/* Home is Active because we are in a Home flow */}
                    <TouchableOpacity style={styles.navItemActive} onPress={() => onNavigate('dashboard')}>
                        <Ionicons name="home" size={20} color="#FFFFFF" />
                        <Text style={styles.navTextActive}>Home</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('friends')}>
                        <FontAwesome5 name="user-friends" size={20} color="#94A3B8" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('profile')}>
                        <FontAwesome5 name="user" size={20} color="#94A3B8" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Add QR Modal Overlay */}
            {showAddModal && (
                <View style={styles.modalOverlay}>
                    <Pressable style={styles.modalBackdrop} onPress={() => setShowAddModal(false)} />
                    {/* Move container down to bottom sheet style */}
                    <View style={styles.addModalContainer}>
                        <View style={styles.modalHandle} />
                        <View style={styles.iconCircle}>
                            <MaterialCommunityIcons name="qrcode" size={32} color="#F97316" />
                        </View>
                        <Text style={styles.modalTitle}>New Secure QR</Text>

                        <Text style={styles.inputLabel}>LABEL</Text>
                        <View style={styles.textInputWrapper}>
                            <TextInput
                                placeholder="e.g. Travel, Health"
                                placeholderTextColor="#94A3B8"
                                style={styles.textInput}
                                value={label}
                                onChangeText={setLabel}
                            />
                        </View>

                        <Text style={styles.inputLabel}>SELECT DOCUMENTS</Text>
                        {/* Doc List Mock */}
                        <View style={styles.docList}>
                            {['IMG_4301.jpeg', 'Aadhar.pdf', 'PAN CARD.pdf'].map((doc) => {
                                const isSelected = selectedDocs.includes(doc);
                                return (
                                    <TouchableOpacity
                                        key={doc}
                                        style={[
                                            styles.docItemCard,
                                            { backgroundColor: isSelected ? '#FFF7ED' : '#FFFFFF' }
                                        ]}
                                        onPress={() => toggleDoc(doc)}
                                    >
                                        <View style={[styles.docIcon, doc.endsWith('pdf') ? { backgroundColor: '#F97316' } : { backgroundColor: '#EC4899' }]}>
                                            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>{doc.endsWith('pdf') ? 'P' : 'I'}</Text>
                                        </View>
                                        <Text style={styles.docName}>{doc}</Text>
                                        <View style={[styles.checkbox, isSelected ? styles.checkboxSelected : styles.checkboxUnselected]}>
                                            {isSelected && <Feather name="check" size={14} color="white" />}
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.generateButton,
                                { backgroundColor: (label && selectedDocs.length > 0) ? '#F97316' : '#FBAC78' }
                            ]}
                            onPress={handleGenerateQR}
                            disabled={!(label && selectedDocs.length > 0)}
                        >
                            <Text style={styles.generateButtonText}>Generate Secure QR</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <View style={styles.deleteModalOverlay}>
                    <Pressable style={styles.modalBackdrop} onPress={() => setShowDeleteModal(false)} />
                    <View style={styles.deleteModalContent}>
                        <View style={styles.deleteIconCircle}>
                            <Feather name="trash-2" size={24} color="#FFFFFF" />
                        </View>
                        <Text style={styles.deleteTitle}>Delete QR?</Text>
                        <Text style={styles.deleteSubtitle}>Are you sure you want to delete this Secure QR from your vault?</Text>

                        <TouchableOpacity style={styles.deleteConfirmButton} onPress={handleDeleteQR}>
                            <Text style={styles.deleteConfirmText}>Yes, Delete</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setShowDeleteModal(false)} style={{ padding: 10 }}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF7ED', // Very light orange tint background
    },
    topRightDecoration: {
        position: 'absolute',
        top: -80,
        right: -80,
        width: 250,
        height: 250,
        borderRadius: 125,
        backgroundColor: '#FFEDD5', // Orange 100
        opacity: 0.6,
        zIndex: -1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: 10,
        marginBottom: 20,
    },
    backButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        shadowColor: '#E2E8F0',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
        elevation: 2,
    },
    headerTitleContainer: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0F172A',
    },
    headerSubtitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
        marginTop: 2,
    },
    addButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F97316', // Orange 500
        borderRadius: 12,
        shadowColor: '#F97316',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
    },

    // Empty State
    emptyStateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: -60,
    },
    bigAddButton: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: '#FFEDD5',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FDBA74',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        maxWidth: 200,
        lineHeight: 20,
    },

    // Card Styles
    cardContainer: {
        borderRadius: 24,
        shadowColor: '#F97316',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 8,
        marginBottom: 20,
    },
    cardGradient: {
        borderRadius: 24,
        padding: 24,
        height: 200,
        position: 'relative',
        overflow: 'hidden',
    },
    geometricOverlay1: {
        position: 'absolute',
        top: -50,
        left: -50,
        width: 200,
        height: 200,
        backgroundColor: '#FFFFFF',
        opacity: 0.1,
        transform: [{ rotate: '45deg' }],
    },
    geometricOverlay2: {
        position: 'absolute',
        bottom: -50,
        right: 50,
        width: 200,
        height: 200,
        backgroundColor: '#FFFFFF',
        opacity: 0.1,
        borderRadius: 100,
    },
    cardContent: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    cardLeft: {
        justifyContent: 'space-between',
        flex: 1,
    },
    filesBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        gap: 6,
    },
    filesBadgeText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 12,
    },
    actionButtonsRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 10,
    },
    actionButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    cardInfo: {
        marginTop: 8,
    },
    cardIdText: {
        color: '#FFFFFF',
        fontSize: 32,
        fontWeight: '800',
        marginBottom: 4,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dateText: {
        color: '#FED7AA', // Orange 200
        fontSize: 12,
        fontWeight: '600',
    },
    qrContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    qrBox: {
        width: 120,
        height: 120,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },

    // Bottom Nav
    bottomNavContainer: {
        position: 'absolute',
        bottom: 30,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    bottomNav: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
        gap: 30,
        alignItems: 'center',
    },
    navItem: {
        padding: 10,
    },
    navItemActive: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#6366F1', // Indigo to match dashboard
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        gap: 8,
    },
    navTextActive: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14,
    },

    // Add Modal Styles
    modalOverlay: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        justifyContent: 'flex-end',
        zIndex: 50,
    },
    modalBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    addModalContainer: {
        backgroundColor: 'white',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        paddingBottom: 40,
        alignItems: 'center',
        width: '100%',
    },
    modalHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#E2E8F0',
        borderRadius: 2,
        marginBottom: 20,
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#FFEDD5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 24,
    },
    inputLabel: {
        alignSelf: 'flex-start',
        fontSize: 12,
        fontWeight: '700',
        color: '#64748B',
        marginBottom: 8,
        marginLeft: 4,
    },
    textInputWrapper: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F97316',
        marginBottom: 20,
    },
    textInput: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#0F172A',
        fontWeight: '600',
    },
    docList: {
        width: '100%',
        marginBottom: 24,
    },
    docItemCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 16,
        marginBottom: 12,
        // Background color handled dynamically
    },
    docIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    docName: {
        flex: 1,
        fontSize: 15,
        fontWeight: '700',
        color: '#1E293B',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12, // Circle
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxUnselected: {
        borderColor: '#CBD5E1',
        backgroundColor: 'transparent',
    },
    checkboxSelected: {
        borderColor: '#F97316',
        backgroundColor: '#F97316',
        borderWidth: 0,
    },
    generateButton: {
        width: '100%',
        borderRadius: 16,
        paddingVertical: 18,
        alignItems: 'center',
        backgroundColor: '#FBAC78', // Lighter pastel orange/peach from image
    },
    generateButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },

    // Delete Modal
    deleteModalOverlay: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        justifyContent: 'flex-end',
        zIndex: 60,
    },
    deleteModalContent: {
        width: '100%',
        backgroundColor: 'white',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 32,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    deleteIconCircle: {
        width: 56,
        height: 56,
        borderRadius: 20,
        backgroundColor: '#FFEBEE', // Light Red
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    deleteTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 8,
    },
    deleteSubtitle: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    deleteConfirmButton: {
        width: '100%',
        backgroundColor: '#FF0000',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 16,
    },
    deleteConfirmText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 16,
    },
    cancelText: {
        color: '#64748B',
        fontWeight: '600',
        fontSize: 16,
    },
});
