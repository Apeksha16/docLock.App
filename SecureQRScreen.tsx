import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, TextInput, Pressable, Alert, ActivityIndicator } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons, Feather, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { firestoreService } from './services/firestoreService';

interface SecureQRCardItemProps {
    qr: any;
    onDelete: (id: string) => void;
    onEdit: (qr: any) => void;
    styles: any;
}

const SecureQRCardItem = ({ qr, onDelete, onEdit, styles }: SecureQRCardItemProps) => {
    const viewRef = useRef(null);
    const swipeableRef = useRef<Swipeable>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = async () => {
        try {
            setIsDownloading(true);
            // Close swipe if open
            swipeableRef.current?.close();
            // Wait for render update to hide buttons
            await new Promise(resolve => setTimeout(resolve, 100));

            const uri = await captureRef(viewRef, {
                format: 'png',
                quality: 1,
            });

            await Sharing.shareAsync(uri);
        } catch (error) {
            console.error("Download failed", error);
            Alert.alert("Error", "Failed to download card.");
        } finally {
            setIsDownloading(false);
        }
    };

    const renderRightActions = (progress: any, dragX: any) => {
        return (
            <TouchableOpacity
                style={styles.deleteAction}
                onPress={() => {
                    swipeableRef.current?.close();
                    onDelete(qr.id);
                }}
            >
                <Feather name="trash-2" size={24} color="white" />
                <Text style={styles.actionText}>Delete</Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.swipeWrapper}>
            <Swipeable
                ref={swipeableRef}
                renderRightActions={renderRightActions}
                overshootRight={false}
            >
                <TouchableOpacity activeOpacity={0.9} onPress={() => onEdit(qr)} style={styles.cardContainer}>
                    <View ref={viewRef} collapsable={false}>
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
                                        <Text style={styles.filesBadgeText}>{qr.filesCount} Files</Text>
                                    </View>

                                    {/* Action Buttons - Hidden during download - Only Download now */}
                                    <View style={[styles.actionButtonsRow, { opacity: isDownloading ? 0 : 1 }]}>
                                        <TouchableOpacity style={styles.actionButton} onPress={handleDownload}>
                                            <Feather name="download" size={18} color="#FFFFFF" />
                                        </TouchableOpacity>
                                        {/* Delete moved to Swipe */}
                                    </View>

                                    <View style={styles.cardInfo}>
                                        <Text style={styles.cardIdText} numberOfLines={1}>{qr.label}</Text>
                                        <View style={styles.dateRow}>
                                            <Feather name="calendar" size={14} color="#FED7AA" />
                                            <Text style={styles.dateText}>{qr.date}</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Right Side - QR Code */}
                                <View style={styles.qrContainer}>
                                    <View style={styles.qrBox}>
                                        <QRCode
                                            value={`https://doclock.app/verify/${qr.id}`}
                                            size={90}
                                            color="black"
                                            backgroundColor="white"
                                            enableLinearGradient={true}
                                            linearGradient={['#F97316', '#DB2777']} // Orange to Pink/Red
                                        />
                                    </View>
                                </View>
                            </View>
                        </LinearGradient>
                    </View>
                </TouchableOpacity>
            </Swipeable>
        </View>
    );
};

interface SecureQRScreenProps {
    onNavigate: (screen: 'dashboard' | 'friends' | 'profile') => void;
    userId?: string;
}

export default function SecureQRScreen({ onNavigate, userId }: SecureQRScreenProps) {
    const [qrCodes, setQrCodes] = useState<any[]>([]);
    const [loadingQrs, setLoadingQrs] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const [allDocuments, setAllDocuments] = useState<any[]>([]);
    const [loadingDocs, setLoadingDocs] = useState(false);

    const [showAddModal, setShowAddModal] = useState(false);
    const [editingQR, setEditingQR] = useState<any | null>(null);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [qrToDelete, setQrToDelete] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [saving, setSaving] = useState(false);

    const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
    const [label, setLabel] = useState('');

    useEffect(() => {
        if (!userId) return;

        const unsubscribe = firestoreService.subscribeToSecureQRs(userId, (data) => {
            setQrCodes(data);
            setLoadingQrs(false);
        });

        return () => unsubscribe();
    }, [userId]);

    const fetchQRs = () => {
        // Placeholder as fetch is now real-time, but keeping function if used elsewhere or for explicit refresh if needed (though listeners handle it)
        // Actually, let's keep it as no-op or just remove usages.
        // But wait, it's used in handleSaveQR and handleDeleteQR. 
        // Since we have a listener, we don't need to manually fetch anymore!
        // I will simply remove the manual calls to fetchQRs in those functions later.
        // For now, let's comment it out or make it empty to avoid breaking refs.
    };

    const handleOpenAddModal = async () => {
        if (qrCodes.length >= 5) {
            Alert.alert("Limit Reached", "You can only create up to 5 Secure QRs.");
            return;
        }
        setEditingQR(null);
        setLabel('');
        setSelectedDocs([]);
        setShowAddModal(true);
        loadDocumentsIfNeeded();
    };

    const handleEditQR = (qr: any) => {
        setEditingQR(qr);
        setLabel(qr.label);
        setSelectedDocs(qr.documentIds || []);
        setShowAddModal(true);
        loadDocumentsIfNeeded();
    };

    const loadDocumentsIfNeeded = async () => {
        if (allDocuments.length === 0 && userId) {
            setLoadingDocs(true);
            try {
                const docs = await firestoreService.getAllFiles(userId);
                setAllDocuments(docs);
            } catch (error) {
                console.error("Failed to fetch documents", error);
                Alert.alert("Error", "Could not fetch documents selection.");
            } finally {
                setLoadingDocs(false);
            }
        }
    };

    const toggleDoc = (docId: string) => {
        if (selectedDocs.includes(docId)) {
            setSelectedDocs(selectedDocs.filter(d => d !== docId));
        } else {
            setSelectedDocs([...selectedDocs, docId]);
        }
    };

    const handleSaveQR = async () => {
        if (!userId) return;

        if (!label.trim()) {
            Alert.alert("Missing Information", "Please enter a label for this Secure QR.");
            return;
        }

        if (selectedDocs.length === 0) {
            Alert.alert("No Documents", "Please select at least one document to secure.");
            return;
        }

        try {
            setSaving(true);
            if (editingQR) {
                // Update
                await firestoreService.updateSecureQR(userId, editingQR.id, {
                    documentIds: selectedDocs,
                    filesCount: selectedDocs.length
                }, label); // Pass label for notification
            } else {
                // Create
                await firestoreService.addSecureQR(userId, {
                    label,
                    documentIds: selectedDocs,
                    filesCount: selectedDocs.length
                });
            }

            // Reset and Refresh
            setShowAddModal(false);
            setEditingQR(null);
            setLabel('');
            setSelectedDocs([]);
            // fetchQRs(); // Handled by subscription
        } catch (error) {
            console.error("Failed to save QR", error);
            Alert.alert("Error", "Failed to save Secure QR.");
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = (qrId: string) => {
        setQrToDelete(qrId);
        setShowDeleteModal(true);
    };

    const handleDeleteQR = async () => {
        if (!userId || !qrToDelete) return;
        try {
            setDeleting(true);
            const qrToDeleteLabel = qrCodes.find(q => q.id === qrToDelete)?.label || 'Unknown QR';
            await firestoreService.deleteSecureQR(userId, qrToDelete, qrToDeleteLabel);
            setShowDeleteModal(false);
            setQrToDelete(null);
            // fetchQRs(); // Handled by subscription
        } catch (error) {
            console.error("Failed to delete QR", error);
            Alert.alert("Error", "Failed to remove QR.");
        } finally {
            setDeleting(false);
        }
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

                </View>

                <View style={styles.content}>
                    {loadingQrs ? (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <ActivityIndicator size="large" color="#F97316" />
                        </View>
                    ) : qrCodes.length === 0 ? (
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
                            {/* Search Bar */}
                            <View style={styles.searchContainer}>
                                <Feather name="search" size={20} color="#94A3B8" />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Search QRs..."
                                    placeholderTextColor="#94A3B8"
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                />
                            </View>

                            {qrCodes
                                .filter(qr => qr.label?.toLowerCase().includes(searchQuery.toLowerCase()))
                                .map((qr) => (
                                    <SecureQRCardItem
                                        key={qr.id}
                                        qr={qr}
                                        onDelete={confirmDelete}
                                        onEdit={handleEditQR}
                                        styles={styles}
                                    />
                                ))}
                            {/* Spacer */}
                            <View style={{ height: 100 }} />
                        </ScrollView>
                    )}
                </View>

            </SafeAreaView>

            {/* Top Right Background Decoration */}
            <View style={styles.topRightDecoration} />

            {/* Bottom Navigation Bar */}
            <View style={styles.bottomNavContainer}>
                {/* FAB Button */}
                <View style={styles.fabWrapper}>
                    <TouchableOpacity
                        style={styles.fabButton}
                        onPress={handleOpenAddModal}
                    >
                        <Feather name="plus" size={32} color="white" />
                    </TouchableOpacity>
                </View>

                <View style={styles.bottomNav}>
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

            {/* Add/Edit QR Modal Overlay */}
            {showAddModal && (
                <View style={styles.modalOverlay}>
                    <Pressable style={styles.modalBackdrop} onPress={() => setShowAddModal(false)} />
                    <View style={styles.addModalContainer}>
                        <View style={styles.modalHandle} />
                        <View style={styles.iconCircle}>
                            <MaterialCommunityIcons name="qrcode" size={32} color="#F97316" />
                        </View>
                        <Text style={styles.modalTitle}>
                            {editingQR ? 'Edit Secure QR' : 'New Secure QR'}
                        </Text>

                        <Text style={styles.inputLabel}>LABEL</Text>
                        <View style={[styles.textInputWrapper, editingQR && { backgroundColor: '#F1F5F9', borderColor: '#E2E8F0' }]}>
                            <TextInput
                                placeholder="e.g. Travel, Health"
                                placeholderTextColor="#94A3B8"
                                style={[styles.textInput, editingQR && { color: '#64748B' }]}
                                value={label}
                                onChangeText={setLabel}
                                editable={!editingQR}
                            />
                        </View>

                        <Text style={styles.inputLabel}>SELECT DOCUMENTS {editingQR && '(Update List)'}</Text>

                        {/* Doc List */}
                        <View style={{ width: '100%', height: 200, marginBottom: 24 }}>
                            {loadingDocs ? (
                                <ActivityIndicator color="#F97316" />
                            ) : allDocuments.length === 0 ? (
                                <Text style={{ textAlign: 'center', color: '#64748B', marginTop: 20 }}>No files found to link.</Text>
                            ) : (
                                <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
                                    {allDocuments.map((doc) => {
                                        const isSelected = selectedDocs.includes(doc.id);
                                        const isPdf = (doc.name || '').toLowerCase().endsWith('.pdf');
                                        return (
                                            <TouchableOpacity
                                                key={doc.id}
                                                style={[
                                                    styles.docItemCard,
                                                    { backgroundColor: isSelected ? '#FFF7ED' : '#F8FAFC', borderWidth: isSelected ? 1 : 0, borderColor: '#F97316' }
                                                ]}
                                                onPress={() => toggleDoc(doc.id)}
                                            >
                                                <View style={[styles.docIcon, isPdf ? { backgroundColor: '#F97316' } : { backgroundColor: '#EC4899' }]}>
                                                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>{isPdf ? 'P' : 'I'}</Text>
                                                </View>
                                                <Text style={styles.docName} numberOfLines={1}>{doc.name}</Text>
                                                <View style={[styles.checkbox, isSelected ? styles.checkboxSelected : styles.checkboxUnselected]}>
                                                    {isSelected && <Feather name="check" size={14} color="white" />}
                                                </View>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>
                            )}
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.generateButton,
                                { backgroundColor: '#F97316', opacity: saving ? 0.7 : 1 }
                            ]}
                            onPress={handleSaveQR}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.generateButtonText}>
                                    {editingQR ? 'Update Secure QR' : 'Generate Secure QR'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <View style={styles.deleteModalOverlay}>
                    <Pressable style={styles.modalBackdrop} onPress={() => !deleting && setShowDeleteModal(false)} />
                    <View style={styles.deleteModalContent}>
                        <View style={styles.deleteIconCircle}>
                            <Feather name="trash-2" size={24} color="#FFFFFF" />
                        </View>
                        <Text style={styles.deleteTitle}>Delete QR?</Text>
                        <Text style={styles.deleteSubtitle}>Are you sure you want to delete this Secure QR from your vault?</Text>

                        <TouchableOpacity
                            style={[styles.deleteConfirmButton, deleting && { opacity: 0.7 }]}
                            onPress={handleDeleteQR}
                            disabled={deleting}
                        >
                            {deleting ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.deleteConfirmText}>Yes, Delete</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setShowDeleteModal(false)}
                            style={{ padding: 10 }}
                            disabled={deleting}
                        >
                            <Text style={[styles.cancelText, deleting && { opacity: 0.5 }]}>Cancel</Text>
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
    headerSubtitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
        marginTop: 2,
    },
    // addButton removed
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
    swipeWrapper: {
        marginBottom: 20,
        borderRadius: 24,
        overflow: 'hidden', // Required for corner radius with swipe
    },
    cardContainer: {
        borderRadius: 24,
        shadowColor: '#F97316',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 8,
        // marginBottom removed, handled by wrapper
        backgroundColor: '#FFF', // Ensure bg is white behind gradient if needed
    },
    deleteAction: {
        backgroundColor: '#EF4444',
        justifyContent: 'center',
        alignItems: 'center',
        width: 100,
        height: '100%',
        borderRadius: 24, // Match card radius
        marginLeft: 10,
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    actionText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '700',
        marginTop: 6,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 20,
        shadowColor: '#E2E8F0',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
        elevation: 2,
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        color: '#0F172A',
        fontWeight: '500',
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
    },
    // Bottom Nav (Pill) & FAB
    bottomNavContainer: {
        position: 'absolute',
        bottom: 30,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    fabWrapper: {
        marginBottom: 16,
        zIndex: 10,
    },
    fabButton: {
        width: 64,
        height: 64,
        borderRadius: 24, // Squircle shape
        backgroundColor: '#F97316', // Orange 500
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#F97316',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 10,
    },
    bottomNav: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
        gap: 20,
    },
    navItem: {
        padding: 10,
    },
    navItemActive: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F97316', // Orange 500 to match theme
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
});

