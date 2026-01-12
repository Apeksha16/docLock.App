import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, TextInput, FlatList, Modal, Image, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { Feather, FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { firestoreService } from './services/firestoreService';
import { storageService } from './services/storageService';

const { width, height } = Dimensions.get('window');

interface MyDocumentsScreenProps {
    onNavigate: (screen: 'dashboard' | 'friends' | 'profile' | 'my-cards' | 'add-card' | 'my-documents') => void;
    userId?: string;
}

interface DocumentItem {
    id: string;
    type: 'folder' | 'file';
    name: string;
    meta: string; // "0 items" or "713.2 KB • Jan 10, 2026"
    parentId: string | null;
}

export default function MyDocumentsScreen({ onNavigate, userId }: MyDocumentsScreenProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [documents, setDocuments] = useState<DocumentItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [folderStack, setFolderStack] = useState<{ id: string, name: string }[]>([]); // Navigation stack

    // UI State
    const [isCreateFolderVisible, setCreateFolderVisible] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [activeOptionItemId, setActiveOptionItemId] = useState<string | null>(null);
    const [renamingId, setRenamingId] = useState<string | null>(null);
    const [isCreatingFolder, setIsCreatingFolder] = useState(false); // Loading state
    const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);

    // Upload State
    const [isUploadVisible, setUploadVisible] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadDocName, setUploadDocName] = useState('');
    const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);

    // File Viewer State
    const [viewingFile, setViewingFile] = useState<DocumentItem | null>(null);

    // Delete Confirmation State
    const [deletingItem, setDeletingItem] = useState<DocumentItem | null>(null);

    const currentFolderId = folderStack.length > 0 ? folderStack[folderStack.length - 1].id : null;

    // Load documents when folder changes (Realtime)
    useEffect(() => {
        if (!userId) return;

        setIsLoading(true);
        const unsubscribe = firestoreService.subscribeToDocuments(userId, currentFolderId, (docs) => {
            setDocuments(docs as DocumentItem[]);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [userId, currentFolderId]);

    const initiateDelete = (item: DocumentItem) => {
        setDeletingItem(item);
        setActiveOptionItemId(null);
    };

    const confirmDelete = async () => {
        if (deletingItem && userId) {
            try {
                await firestoreService.deleteDocument(userId, deletingItem.id);
                // No need to update local state, listener will handle it
                setDeletingItem(null);
                if (viewingFile?.id === deletingItem.id) {
                    setViewingFile(null);
                }
            } catch (error) {
                console.error(error);
                Alert.alert('Error', 'Failed to delete item.');
            }
        }
    };

    // Create / Rename Folder
    const handleCreateFolder = () => {
        if (newFolderName.trim() && userId) {
            const nameToUse = newFolderName.trim();
            const isRename = !!renamingId;
            const targetId = renamingId;

            // 1. Close UI Immediately
            setNewFolderName('');
            setRenamingId(null);
            setCreateFolderVisible(false);
            setIsCreatingFolder(false); // Ensure loading is off

            // 2. Perform Background Operation
            const bgOperation = async () => {
                try {
                    if (isRename && targetId) {
                        await firestoreService.renameDocument(userId, targetId, nameToUse);
                    } else {
                        // Check Nesting Level (Max 5)
                        if (folderStack.length >= 5) {
                            Alert.alert('Limit Reached', 'You cannot create folders deeper than 5 levels.');
                            return;
                        }
                        // Check Item Count (Max 10)
                        if (documents.length >= 10) {
                            Alert.alert('Limit Reached', 'You can only have up to 10 items in this folder.');
                            return;
                        }
                        await firestoreService.createFolder(userId, nameToUse, currentFolderId);
                    }
                } catch (error) {
                    console.error(error);
                    Alert.alert('Error', isRename ? 'Failed to rename folder.' : 'Failed to create folder.');
                }
            };

            // Run in background
            bgOperation();
        }
    };

    const initiateRename = (item: DocumentItem) => {
        setNewFolderName(item.name);
        setRenamingId(item.id);
        setActiveOptionItemId(null);
        setCreateFolderVisible(true);
    };

    // Helper to close and clear Create Folder Modal
    const closeCreateFolderModal = () => {
        if (isCreatingFolder) return;
        setCreateFolderVisible(false);
        setNewFolderName('');
        setRenamingId(null);
    };

    // Helper to close and clear Upload Modal
    const closeUploadModal = () => {
        if (isUploading) return;
        setUploadVisible(false);
        setUploadDocName('');
        setSelectedFile(null);
    };



    const handleUpload = () => {
        setUploadVisible(true);
    };

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*', // Allow all types
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                // Validate size (5MB limit)
                if (asset.size && asset.size > 5 * 1024 * 1024) {
                    Alert.alert('File too large', 'Please select a file smaller than 5MB.');
                    return;
                }
                setSelectedFile(asset);
                setUploadDocName(asset.name);
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to pick document.');
        }
    };

    const confirmUpload = async () => {
        if (!userId || !selectedFile) return;

        // Check Item Count (Max 10)
        if (documents.length >= 10) {
            Alert.alert('Limit Reached', 'You can only have up to 10 items in this folder.');
            return;
        }

        const nameToUse = uploadDocName.trim() || selectedFile.name;
        setIsUploading(true);

        try {
            // 1. Upload to Storage
            const { downloadURL, size } = await storageService.uploadFile(userId, selectedFile.uri, selectedFile.name);

            // 2. Save Metadata to Firestore
            const sizeMB = (size / (1024 * 1024)).toFixed(2) + ' MB';
            const date = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

            // Pass metadata to services
            // Note: firestoreService.saveDocumentMetadata needs to be updated to accept object or correct args
            // Earlier it was: saveDocumentMetadata(userId, name, size, downloadUrl, parentId)
            // Let's assume we update usage match definition: 
            // saveDocumentMetadata(userId, { name, type, size, meta, downloadURL, parentId })

            // Checking definition from previous turn: 
            // saveDocumentMetadata(userId: string, data: DocumentMetadata)

            await firestoreService.saveDocumentMetadata(userId, {
                name: nameToUse,
                type: 'file',
                size: size,
                meta: `${sizeMB} • ${date}`,
                downloadURL: downloadURL,
                parentId: currentFolderId
            });

            setUploadVisible(false);
            setUploadDocName('');
            setSelectedFile(null);

        } catch (error) {
            console.error(error);
            Alert.alert('Upload Failed', 'There was an error uploading your file.');
        } finally {
            setIsUploading(false);
        }
    };

    const navigateToFolder = (folder: DocumentItem) => {
        if (folder.type === 'folder') {
            setFolderStack([...folderStack, { id: folder.id, name: folder.name }]);
        }
    };

    const navigateUp = () => {
        if (folderStack.length > 0) {
            const newStack = [...folderStack];
            newStack.pop();
            setFolderStack(newStack);
        } else {
            onNavigate('dashboard');
        }
    };

    // Breadcrumb Navigation
    const navigateToBreadcrumb = (index: number) => {
        // index -1 is Home (root)
        if (index === -1) {
            setFolderStack([]);
        } else {
            // Cut stack to index
            setFolderStack(folderStack.slice(0, index + 1));
        }
    };

    // Close options when clicking elsewhere
    const closeOptions = () => setActiveOptionItemId(null);

    const renderDocumentItem = ({ item }: { item: DocumentItem }) => (
        <View style={{ zIndex: activeOptionItemId === item.id ? 10 : 1 }}>
            {/* Wrapper View for zIndex handling since FlatList items can overlap z-index wise */}
            <TouchableOpacity
                style={styles.docItem}
                onPress={() => {
                    if (activeOptionItemId) {
                        closeOptions();
                    } else if (item.type === 'folder') {
                        navigateToFolder(item);
                    } else {
                        setViewingFile(item);
                    }
                }}
                activeOpacity={item.type === 'folder' ? 0.7 : 1}
            >
                <View style={styles.docItemLeft}>
                    <View style={[styles.docIconContainer, item.type === 'folder' ? styles.folderIconBg : styles.fileIconBg]}>
                        {item.type === 'folder' ? (
                            <Feather name="folder" size={24} color="#F59E0B" />
                        ) : (
                            <Feather name="image" size={24} color="#EA580C" />
                        )}
                    </View>
                    <View>
                        <Text style={styles.docName}>{item.name}</Text>
                        <Text style={styles.docMeta}>{item.meta}</Text>
                    </View>
                </View>
                <TouchableOpacity
                    style={styles.moreButton}
                    onPress={() => setActiveOptionItemId(activeOptionItemId === item.id ? null : item.id)}
                >
                    <Feather name="more-vertical" size={20} color="#94A3B8" />
                </TouchableOpacity>

                {/* Options Menu */}
                {activeOptionItemId === item.id && (
                    <View style={styles.optionsMenu}>
                        {item.type === 'folder' ? (
                            <>
                                <TouchableOpacity style={styles.optionItem} onPress={() => initiateRename(item)}>
                                    <Feather name="edit-2" size={16} color="#64748B" />
                                    <Text style={styles.optionText}>Rename</Text>
                                </TouchableOpacity>
                                <View style={styles.optionDivider} />
                                <TouchableOpacity style={styles.optionItem} onPress={() => initiateDelete(item)}>
                                    <Feather name="trash-2" size={16} color="#EF4444" />
                                    <Text style={[styles.optionText, { color: '#EF4444' }]}>Delete</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <TouchableOpacity style={styles.optionItem}>
                                    <Feather name="download" size={16} color="#F97316" />
                                    <Text style={[styles.optionText, { color: '#F97316' }]}>Download</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.optionItem}>
                                    <Feather name="share-2" size={16} color="#F59E0B" />
                                    <Text style={[styles.optionText, { color: '#F59E0B' }]}>Share</Text>
                                </TouchableOpacity>
                                <View style={styles.optionDivider} />
                                <TouchableOpacity style={styles.optionItem} onPress={() => initiateDelete(item)}>
                                    <Feather name="trash-2" size={16} color="#EF4444" />
                                    <Text style={[styles.optionText, { color: '#EF4444' }]}>Delete</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            <SafeAreaView style={{ flex: 1 }}>

                <View style={styles.header}>
                    <TouchableOpacity onPress={navigateUp} style={styles.backButton}>
                        <Feather name="arrow-left" size={24} color="#1E293B" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>My Documents</Text>
                    <View style={{ width: 44 }} />
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Feather name="search" size={20} color="#94A3B8" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search documents..."
                        placeholderTextColor="#94A3B8"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {/* Breadcrumb / Section Title */}
                {/* SHOW BREADCRUMB ONLY IF NOT EMPTY ROOT or IF NAVIGATED */}
                {(documents.length > 0 || currentFolderId !== null) && (
                    <View style={styles.sectionHeader}>
                        <View style={styles.breadcrumb}>
                            <TouchableOpacity onPress={() => navigateToBreadcrumb(-1)}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <Ionicons name="home-outline" size={14} color="#64748B" />
                                    <Text style={styles.breadcrumbText}>HOME</Text>
                                </View>
                            </TouchableOpacity>

                            {folderStack.map((folder, index) => (
                                <React.Fragment key={folder.id}>
                                    <Feather name="chevron-right" size={12} color="#CBD5E1" />
                                    <TouchableOpacity onPress={() => navigateToBreadcrumb(index)}>
                                        <Text style={index === folderStack.length - 1 ? styles.breadcrumbActive : styles.breadcrumbText}>
                                            {folder.name}
                                        </Text>
                                    </TouchableOpacity>
                                </React.Fragment>
                            ))}
                        </View>
                    </View>
                )}


                {/* Content */}
                {isLoading ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator size="large" color="#F97316" />
                    </View>
                ) : documents.length === 0 ? (
                    <View style={styles.emptyStateContainer}>
                        {/* Placeholder Icon */}
                        <View style={styles.emptyIconContainer}>
                            <LinearGradient
                                colors={['#FB923C', '#EA580C']}
                                style={styles.emptyIconGradient}
                            >
                                <Ionicons name="document-text-outline" size={48} color="white" />
                            </LinearGradient>
                            <View style={styles.emptyIconReflection} />
                        </View>

                        <Text style={styles.emptyTitle}>No Documents Found</Text>
                        <Text style={styles.emptySubtitle}>
                            Start by uploading your first document or creating a folder to organize your files
                        </Text>

                        <View style={styles.actionButtonsColumn}>
                            <TouchableOpacity
                                style={styles.actionButtonSecondary}
                                onPress={() => setCreateFolderVisible(true)}
                            >
                                <Feather name="folder" size={20} color="white" style={{ marginRight: 8 }} />
                                <Text style={styles.actionButtonText}>Create Folder</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.actionButtonPrimary}
                                onPress={handleUpload}
                            >
                                <Feather name="upload" size={20} color="white" style={{ marginRight: 8 }} />
                                <Text style={styles.actionButtonText}>Upload Document</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <FlatList
                        data={documents}
                        renderItem={renderDocumentItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                    />
                )}


            </SafeAreaView>

            {/* Global Overlay for FAB - Close on outside click */}
            {
                isFabMenuOpen && (
                    <TouchableOpacity
                        style={styles.overlay}
                        activeOpacity={1}
                        onPress={() => setIsFabMenuOpen(false)}
                    />
                )
            }

            {/* Bottom Navigation Bar */}
            {/* Moved outside SafeAreaView to handle zIndex correctly against Overlay */}
            <View style={styles.bottomNavContainer}>
                {documents.length > 0 && (
                    <View style={styles.bottomNavWrapper}>
                        {isFabMenuOpen && (
                            <>
                                <View style={styles.fabMenuContainer}>
                                    <TouchableOpacity
                                        style={styles.fabMenuItemSecondary}
                                        onPress={() => {
                                            setIsFabMenuOpen(false);
                                            setCreateFolderVisible(true);
                                        }}
                                    >
                                        <Feather name="folder" size={20} color="white" />
                                        <Text style={styles.fabMenuItemText}>Create Folder</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.fabMenuItemPrimary}
                                        onPress={() => {
                                            setIsFabMenuOpen(false);
                                            handleUpload();
                                        }}
                                    >
                                        <Feather name="upload" size={20} color="white" />
                                        <Text style={styles.fabMenuItemText}>Upload Document</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}

                        <TouchableOpacity
                            style={[styles.fabButton, isFabMenuOpen && styles.fabButtonOpen]}
                            onPress={() => setIsFabMenuOpen(!isFabMenuOpen)}
                            activeOpacity={0.8}
                        >
                            <Ionicons
                                name="add"
                                size={32}
                                color="white"
                                style={{ transform: [{ rotate: isFabMenuOpen ? '45deg' : '0deg' }] }}
                            />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Navigation Pill */}
                <View style={styles.pillNav}>
                    <TouchableOpacity style={styles.navItemActive}>
                        <Ionicons name="home-outline" size={20} color="#FFFFFF" />
                        <Text style={styles.navTextActive}>Home</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('friends')}>
                        <Ionicons name="people-outline" size={22} color="#94A3B8" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('profile')}>
                        <Ionicons name="person-outline" size={22} color="#94A3B8" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Create Folder Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={isCreateFolderVisible}
                onRequestClose={closeCreateFolderModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.bottomSheet}>
                        <View style={styles.dragHandle} />

                        <View style={styles.folderIconContainer}>
                            <Feather name="folder" size={24} color="#F59E0B" />
                        </View>

                        <Text style={styles.modalTitle}>{renamingId ? 'Rename Folder' : 'New Folder'}</Text>

                        <TextInput
                            style={[
                                styles.modalInput,
                                newFolderName.length > 0 && styles.modalInputActive
                            ]}
                            placeholder="Folder name"
                            placeholderTextColor="#94A3B8"
                            value={newFolderName}
                            onChangeText={setNewFolderName}
                            autoFocus
                            editable={!isCreatingFolder} // Disable input while loading
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.modalCancelButton}
                                onPress={closeCreateFolderModal}
                                disabled={isCreatingFolder}
                            >
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.modalCreateButton,
                                    { backgroundColor: newFolderName.trim() ? '#F97316' : '#FED7AA' } // Matched colors
                                ]}
                                onPress={handleCreateFolder}
                                disabled={!newFolderName.trim() || isCreatingFolder}
                            >
                                {isCreatingFolder ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <Text style={styles.modalCreateText}>{renamingId ? 'Save Changes' : 'Create Folder'}</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Upload Document Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={isUploadVisible}
                onRequestClose={() => setUploadVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.bottomSheet}>
                        <View style={styles.dragHandle} />

                        <View style={[styles.folderIconContainer, { backgroundColor: '#FFEDD5' }]}>
                            <Feather name="upload" size={24} color="#F97316" />
                        </View>

                        <Text style={styles.modalTitle}>Upload File</Text>

                        <TouchableOpacity style={styles.uploadDropZone} onPress={pickDocument}>
                            {selectedFile ? (
                                <View style={{ alignItems: 'center' }}>
                                    <Feather name="file-text" size={32} color="#F97316" />
                                    <Text style={styles.uploadMainText}>{selectedFile.name}</Text>
                                    <Text style={styles.uploadSubText}>
                                        {selectedFile.size ? (selectedFile.size / (1024 * 1024)).toFixed(2) + ' MB' : 'Unknown Size'}
                                    </Text>
                                </View>
                            ) : (
                                <View style={{ alignItems: 'center' }}>
                                    <Feather name="upload-cloud" size={32} color="#3B82F6" style={{ marginBottom: 12 }} />
                                    <Text style={styles.uploadMainText}>Tap to select file</Text>
                                    <Text style={styles.uploadSubText}>PDF (Max 5MB), Images (Max 2MB)</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        <TextInput
                            style={styles.modalInput}
                            placeholder="Document name (optional)"
                            placeholderTextColor="#94A3B8"
                            value={uploadDocName}
                            onChangeText={setUploadDocName}
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.modalCancelButton}
                                onPress={closeUploadModal}
                                disabled={isUploading}
                            >
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.modalCreateButton,
                                    { backgroundColor: selectedFile ? '#F97316' : '#FED7AA' }
                                ]}
                                onPress={confirmUpload}
                                disabled={!selectedFile || isUploading}
                            >
                                {isUploading ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <Text style={styles.modalCreateText}>Upload File</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* File Viewer Modal */}
            <Modal
                animationType="slide"
                transparent={false}
                visible={!!viewingFile}
                onRequestClose={() => setViewingFile(null)}
            >
                <View style={styles.viewerContainer}>
                    <SafeAreaView style={{ flex: 1 }}>
                        {/* Viewer Header */}
                        <View style={styles.viewerHeader}>
                            <TouchableOpacity
                                onPress={() => setViewingFile(null)}
                                style={styles.viewerBackBtn}
                                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                            >
                                <Feather name="chevron-left" size={32} color="white" />
                            </TouchableOpacity>
                            <View style={{ alignItems: 'center' }}>
                                <Text style={styles.viewerTitle}>{viewingFile?.name}</Text>
                                <Text style={styles.viewerDate}>{viewingFile?.meta.split('•')[1]?.trim() || 'Jan 10, 2026'}</Text>
                            </View>
                            <View style={{ width: 32 }} />
                        </View>

                        {/* Viewer Content */}
                        <View style={styles.viewerContent}>
                            {/* Placeholder for the actual file content */}
                            <View style={styles.filePreviewPlaceholder}>
                                <Feather name="image" size={120} color="#EA580C" />
                            </View>
                        </View>

                        {/* Viewer Footer actions */}
                        <View style={styles.viewerFooter}>
                            <TouchableOpacity style={styles.viewerActionBtn}>
                                <View style={styles.viewerActionIcon}>
                                    <Feather name="share-2" size={20} color="white" />
                                </View>
                                <Text style={styles.viewerActionText}>SHARE</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.viewerActionBtn}>
                                <View style={styles.viewerActionIcon}>
                                    <Feather name="download" size={20} color="white" />
                                </View>
                                <Text style={styles.viewerActionText}>SAVE</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.viewerActionBtn}
                                onPress={() => {
                                    if (viewingFile) initiateDelete(viewingFile);
                                }}
                            >
                                <View style={[styles.viewerActionIcon, { backgroundColor: '#EF4444' }]}>
                                    <Feather name="trash-2" size={20} color="white" />
                                </View>
                                <Text style={styles.viewerActionText}>DELETE</Text>
                            </TouchableOpacity>
                        </View>
                    </SafeAreaView>
                </View>
            </Modal >

            {/* Delete Confirmation Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={!!deletingItem}
                onRequestClose={() => setDeletingItem(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.bottomSheet}>
                        <View style={styles.dragHandle} />

                        <View style={[styles.folderIconContainer, { backgroundColor: '#FEE2E2' }]}>
                            <Feather name="trash-2" size={24} color="#EF4444" />
                        </View>

                        <Text style={styles.modalTitle}>Delete {deletingItem?.type === 'folder' ? 'Folder' : 'File'}?</Text>
                        <Text style={styles.deleteConfirmText}>
                            Are you sure you want to delete "{deletingItem?.name}"? This action cannot be undone.
                        </Text>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.modalCancelButton}
                                onPress={() => setDeletingItem(null)}
                            >
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalCreateButton, { backgroundColor: '#EF4444' }]}
                                onPress={confirmDelete}
                            >
                                <Text style={styles.modalCreateText}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF7ED', // Orange 50
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
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
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
    },
    searchContainer: {
        marginHorizontal: 24,
        marginTop: 8,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 50,
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#1E293B',
        fontWeight: '500',
    },
    sectionHeader: {
        paddingHorizontal: 24,
        marginTop: 20,
    },
    breadcrumb: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    breadcrumbText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#64748B',
        letterSpacing: 0.5,
    },
    breadcrumbActive: {
        fontSize: 12,
        fontWeight: '700',
        backgroundColor: '#FFEDD5', // Orange 100
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        color: '#C2410C', // Orange 700
    },

    // Empty State
    emptyStateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        marginTop: -60, // visual correction
    },
    emptyIconContainer: {
        marginBottom: 32,
        alignItems: 'center',
    },
    emptyIconGradient: {
        width: 100,
        height: 100,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#EA580C',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    emptyIconReflection: {
        position: 'absolute',
        top: -10,
        right: -10,
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#FFEDD5', // Orange 100
        opacity: 0.5,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 12,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
    },
    actionButtonsColumn: {
        flexDirection: 'column',
        gap: 16,
        width: '100%',
        maxWidth: 280,
        zIndex: 100, // Ensure clickable
    },
    actionButtonSecondary: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#475569',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        shadowColor: '#475569',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 3,
    },
    actionButtonPrimary: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F97316', // Orange 500
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        shadowColor: '#F97316',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 3,
    },
    actionButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 15,
    },

    // List View
    listContent: {
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 100,
    },
    docItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    docItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    docIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    folderIconBg: {
        backgroundColor: '#FFEDD5', // Orange 100
    },
    fileIconBg: {
        backgroundColor: '#FEF3C7', // Amber 100
    },
    docName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 4,
    },
    docMeta: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '500',
    },
    moreButton: {
        padding: 8,
    },
    optionsMenu: {
        position: 'absolute',
        top: 40,
        right: 16,
        backgroundColor: 'white',
        borderRadius: 12,
        shadowColor: '#94A3B8',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 5,
        zIndex: 100,
        minWidth: 140,
        paddingVertical: 4,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 10,
    },
    optionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
    },
    optionDivider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginHorizontal: 8,
    },

    // Bottom Nav
    bottomNavContainer: {
        position: 'absolute',
        bottom: 30,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    bottomNavWrapper: {
        // Logic for FAB if needed
        marginBottom: 10, // Adjust position relative to nav
        alignItems: 'center',
        zIndex: 200,
    },
    fabButton: {
        width: 56,
        height: 56,
        borderRadius: 20, // Squircle shape
        backgroundColor: '#F97316', // Orange 500
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#F97316',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
        zIndex: 200,
    },
    fabButtonOpen: {
        backgroundColor: '#F97316',
        // No rotation needed for icon swap
    },
    fabIconOpen: {
        // No rotation needed
    },
    fabMenuContainer: {
        position: 'absolute',
        bottom: 70, // Above the FAB
        gap: 12,
        zIndex: 199,
        width: 200, // Ensure enough width for buttons
    },
    fabMenuItemPrimary: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F97316',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 24,
        gap: 8,
        shadowColor: '#F97316',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
        width: '100%',
        justifyContent: 'center',
    },
    fabMenuItemSecondary: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#475569', // Dark grey/slate
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 24,
        gap: 8,
        shadowColor: '#475569',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
        width: '100%',
        justifyContent: 'center',
    },
    fabMenuItemText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 14,
    },
    bottomNav: {
        // ... unused standard nav ...
    },
    pillNav: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        paddingVertical: 6,
        paddingHorizontal: 6,
        borderRadius: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 10,
        gap: 8,
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '90%', // Almost full width but floating
        maxWidth: 340,
    },
    navItem: {
        flex: 1,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 24,
    },
    navItemActive: {
        flex: 1.2, // Slightly wider
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#6366F1', // Indigo color from screenshot (Reverted)
        paddingVertical: 12,
        borderRadius: 24,
        gap: 8,
    },
    navTextActive: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 15,
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    bottomSheet: {
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
        alignItems: 'center',
    },
    dragHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#E2E8F0',
        borderRadius: 2,
        marginBottom: 24,
    },
    folderIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 24,
    },
    modalInput: {
        width: '100%',
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#1E293B',
        marginBottom: 24,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 16,
        width: '100%',
    },
    modalCancelButton: {
        flex: 1,
        paddingVertical: 16,
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        alignItems: 'center',
    },
    modalCancelText: {
        color: '#64748B',
        fontWeight: '700',
        fontSize: 16,
    },
    modalCreateButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    modalCreateText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 16,
    },
    modalInputActive: {
        borderColor: '#F97316',
        backgroundColor: '#FFFFFF',
    },

    // Viewer
    viewerContainer: {
        flex: 1,
        backgroundColor: '#000000',
    },
    viewerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
        marginBottom: 20,
    },
    viewerBackBtn: {
        padding: 12,
    },
    viewerTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    viewerDate: {
        color: '#94A3B8',
        fontSize: 12,
        marginTop: 2,
    },
    viewerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filePreviewPlaceholder: {
        width: width * 0.8,
        height: height * 0.5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    viewerFooter: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        paddingBottom: 40,
        paddingTop: 20,
    },
    viewerActionBtn: {
        alignItems: 'center',
        gap: 8,
    },
    viewerActionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#1E293B',
        justifyContent: 'center',
        alignItems: 'center',
    },
    viewerActionText: {
        color: 'white',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
    },

    // Upload Modal specific
    uploadDropZone: {
        width: '100%',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        borderStyle: 'dashed',
        borderRadius: 16,
        padding: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        backgroundColor: '#F8FAFC',
    },
    uploadMainText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 4,
        marginTop: 8,
    },
    uploadSubText: {
        fontSize: 13,
        color: '#94A3B8',
        fontWeight: '500',
        textAlign: 'center',
    },

    // Delete Modal Text
    deleteConfirmText: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'transparent',
        zIndex: 50,
    },
});
