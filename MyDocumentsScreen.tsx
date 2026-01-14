import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, TextInput, FlatList, Modal, Image, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { Feather, FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { firestoreService } from './services/firestoreService';
import { storageService } from './services/storageService';
import BottomNavBar from './components/BottomNavBar';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Linking, Platform } from 'react-native';

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
    downloadURL?: string;
}

export default function MyDocumentsScreen({ onNavigate, userId }: MyDocumentsScreenProps) {
    const [documents, setDocuments] = useState<DocumentItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [folderStack, setFolderStack] = useState<{ id: string, name: string }[]>([]); // Navigation stack

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const filteredDocuments = documents.filter(doc =>
        doc.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // UI State
    const [isCreateFolderVisible, setCreateFolderVisible] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [renamingId, setRenamingId] = useState<string | null>(null);
    const [isCreatingFolder, setIsCreatingFolder] = useState(false); // Loading state
    const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);

    // Upload State
    const [isUploadVisible, setUploadVisible] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadDocName, setUploadDocName] = useState('');
    const [uploadType, setUploadType] = useState<'pdf' | 'image'>('pdf'); // default
    const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);

    // File Viewer State
    const [viewingFile, setViewingFile] = useState<DocumentItem | null>(null);
    const [isViewerLoading, setIsViewerLoading] = useState(true);

    // Reset loader when opening a file
    useEffect(() => {
        if (viewingFile) {
            setIsViewerLoading(true);
        }
    }, [viewingFile]);

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



    const handleUpload = (type: 'pdf' | 'image') => {
        setUploadType(type);
        setUploadVisible(true);
    };

    const pickDocument = async () => {
        try {
            let asset: any = null;

            if (uploadType === 'image') {
                const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: false,
                    quality: 1,
                });

                if (!result.canceled && result.assets && result.assets.length > 0) {
                    const pickerAsset = result.assets[0];
                    asset = {
                        uri: pickerAsset.uri,
                        name: pickerAsset.fileName || pickerAsset.uri.split('/').pop() || 'image.jpg',
                        mimeType: pickerAsset.mimeType || 'image/jpeg',
                        size: pickerAsset.fileSize || 0
                    };
                }
            } else {
                const result = await DocumentPicker.getDocumentAsync({
                    type: ['application/pdf'],
                    copyToCacheDirectory: true,
                });

                if (!result.canceled && result.assets && result.assets.length > 0) {
                    asset = result.assets[0];
                }
            }

            if (asset) {
                if (uploadType === 'image') {
                    // Validate File Type (No GIFs)
                    const isGif = asset.mimeType === 'image/gif' || asset.name.toLowerCase().endsWith('.gif');
                    if (isGif) {
                        Alert.alert('Invalid File Type', 'GIFs are not allowed. Please upload a static image.');
                        return;
                    }
                }

                // Validate size (5MB limit)
                if (asset.size && asset.size > 5 * 1024 * 1024) {
                    Alert.alert('File too large', 'Please select a file smaller than 5MB.');
                    return;
                }
                setSelectedFile(asset as DocumentPicker.DocumentPickerAsset);
                setUploadDocName(asset.name);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to pick file.');
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
            Alert.alert('Upload Failed', 'There was an error uploading your file.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleOpenPdf = async (pdfUrl: string, fileName: string) => {
        try {
            setIsViewerLoading(true);
            
            // Download PDF to local file system
            const fileUri = FileSystem.documentDirectory + fileName;
            const downloadResult = await FileSystem.downloadAsync(pdfUrl, fileUri);
            
            // Check if sharing is available
            const isAvailable = await Sharing.isAvailableAsync();
            
            if (isAvailable) {
                // Open with system PDF viewer
                await Sharing.shareAsync(downloadResult.uri, {
                    mimeType: 'application/pdf',
                    dialogTitle: 'Open PDF',
                });
            } else {
                // Fallback: Try to open with Linking
                const canOpen = await Linking.canOpenURL(downloadResult.uri);
                if (canOpen) {
                    await Linking.openURL(downloadResult.uri);
                } else {
                    Alert.alert('Error', 'Unable to open PDF. Please install a PDF viewer app.');
                }
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to open PDF. Please try again.');
        } finally {
            setIsViewerLoading(false);
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



    const renderDocumentItem = ({ item }: { item: DocumentItem }) => (
        <DocumentItemRow
            item={item}
            onRename={() => initiateRename(item)}
            onDelete={() => initiateDelete(item)}
            onPress={() => {
                if (item.type === 'folder') {
                    navigateToFolder(item);
                } else {
                    setViewingFile(item);
                }
            }}
        />
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
                        placeholder="Search docs..."
                        placeholderTextColor="#94A3B8"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {/* Breadcrumb / Section Title */}
                {/* SHOW BREADCRUMB ONLY IF NOT EMPTY ROOT or IF NAVIGATED */}
                {
                    (documents.length > 0 || currentFolderId !== null) && (
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
                    )
                }


                {/* Content */}
                {
                    isLoading ? (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <ActivityIndicator size="large" color="#1581BF" />
                        </View>
                    ) : filteredDocuments.length === 0 && searchQuery.length > 0 ? (
                        <View style={styles.emptyStateContainer}>
                            <Text style={styles.emptyTitle}>No Results Found</Text>
                            <Text style={styles.emptySubtitle}>
                                Try searching for something else
                            </Text>
                        </View>
                    ) : documents.length === 0 ? (
                        <View style={styles.emptyStateContainer}>
                            {/* Placeholder Icon */}
                            <View style={styles.emptyIconContainer}>
                                <LinearGradient
                                    colors={['#3B82F6', '#1565A0']}
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
                                    onPress={() => handleUpload('image')}
                                >
                                    <Feather name="image" size={20} color="white" style={{ marginRight: 8 }} />
                                    <Text style={styles.actionButtonText}>Upload Img</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.actionButtonPrimary}
                                    onPress={() => handleUpload('pdf')}
                                >
                                    <Feather name="file-text" size={20} color="white" style={{ marginRight: 8 }} />
                                    <Text style={styles.actionButtonText}>Upload Doc</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <FlatList
                            data={filteredDocuments}
                            renderItem={renderDocumentItem}
                            keyExtractor={item => item.id}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                        />
                    )
                }


            </SafeAreaView >

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

            {/* FAB Menu and Shared Bottom Nav */}
            <View style={styles.bottomNavContainer}>
                {documents.length > 0 && (
                    <View style={styles.fabMenuWrapper}>
                        {isFabMenuOpen && (
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
                                        handleUpload('image');
                                    }}
                                >
                                    <Feather name="image" size={20} color="white" />
                                    <Text style={styles.fabMenuItemText}>Upload Img</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.fabMenuItemPrimary}
                                    onPress={() => {
                                        setIsFabMenuOpen(false);
                                        handleUpload('pdf');
                                    }}
                                >
                                    <Feather name="file-text" size={20} color="white" />
                                    <Text style={styles.fabMenuItemText}>Upload Doc</Text>
                                </TouchableOpacity>
                            </View>
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
            </View>
            {/* Shared Bottom Navigation Bar */}
            <BottomNavBar currentScreen="dashboard" onNavigate={(screen: any) => onNavigate(screen)} activeColor="#1581BF" />

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
                            <Feather name="folder" size={24} color="#1581BF" />
                        </View>

                        <Text style={styles.modalTitle}>{renamingId ? 'Rename Folder' : 'New Folder'}</Text>

                        <TextInput
                            style={[
                                styles.modalInput,
                                newFolderName.length > 0 && { borderColor: '#1581BF', backgroundColor: '#FFFFFF' }
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
                                    { backgroundColor: newFolderName.trim() ? '#1581BF' : '#93C5FD' }
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

                        <View style={[styles.folderIconContainer, { backgroundColor: '#DBEAFE' }]}>
                            <Feather name="upload" size={24} color="#1581BF" />
                        </View>

                        <Text style={styles.modalTitle}>{uploadType === 'pdf' ? 'Upload Document' : 'Upload Image'}</Text>

                        <TouchableOpacity style={styles.uploadDropZone} onPress={pickDocument}>
                            {selectedFile ? (
                                <View style={{ alignItems: 'center' }}>
                                    <Feather name="file-text" size={32} color="#1581BF" />
                                    <Text style={styles.uploadMainText}>{selectedFile.name}</Text>
                                    <Text style={styles.uploadSubText}>
                                        {selectedFile.size ? (selectedFile.size / (1024 * 1024)).toFixed(2) + ' MB' : 'Unknown Size'}
                                    </Text>
                                </View>
                            ) : (
                                <View style={{ alignItems: 'center' }}>
                                    <Feather name="upload-cloud" size={32} color="#3B82F6" style={{ marginBottom: 12 }} />
                                    <Text style={styles.uploadMainText}>Tap to select {uploadType === 'pdf' ? 'PDF' : 'Image'}</Text>
                                    <Text style={styles.uploadSubText}>{uploadType === 'pdf' ? 'PDF (Max 5MB)' : 'Images (Max 5MB)'}</Text>
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
                                    { backgroundColor: selectedFile ? '#1581BF' : '#BFDBFE' }
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
                            {viewingFile?.downloadURL ? (
                                (() => {
                                    const isPdf = viewingFile.name.toLowerCase().endsWith('.pdf');
                                    const isImage = ['jpg', 'jpeg', 'png', 'heic', 'gif'].some(ext => viewingFile.name.toLowerCase().endsWith(ext));

                                    return (
                                        <View style={{ flex: 1 }}>
                                            {/* Global Viewer Loader Overlay */}
                                            {isViewerLoading && (
                                                <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', zIndex: 10 }]}>
                                                    <ActivityIndicator size="large" color="#1581BF" />
                                                </View>
                                            )}

                                            {isImage ? (
                                                <Image
                                                    source={{ uri: viewingFile.downloadURL }}
                                                    style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
                                                    onLoadEnd={() => setIsViewerLoading(false)}
                                                />
                                            ) : isPdf ? (
                                                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
                                                    <Feather name="file-text" size={120} color="#3B82F6" />
                                                    <Text style={{ marginTop: 24, fontSize: 20, fontWeight: '600', color: '#1E293B', textAlign: 'center' }}>
                                                        {viewingFile.name}
                                                    </Text>
                                                    <Text style={{ marginTop: 8, fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 32 }}>
                                                        Tap the button below to open this PDF with your device's default PDF viewer
                                                    </Text>
                                                    <TouchableOpacity
                                                        style={{
                                                            backgroundColor: '#3B82F6',
                                                            paddingHorizontal: 32,
                                                            paddingVertical: 16,
                                                            borderRadius: 12,
                                                            flexDirection: 'row',
                                                            alignItems: 'center',
                                                            gap: 8
                                                        }}
                                                        onPress={() => viewingFile.downloadURL && handleOpenPdf(viewingFile.downloadURL, viewingFile.name)}
                                                        disabled={isViewerLoading}
                                                    >
                                                        {isViewerLoading ? (
                                                            <ActivityIndicator size="small" color="#FFFFFF" />
                                                        ) : (
                                                            <>
                                                                <Feather name="external-link" size={20} color="#FFFFFF" />
                                                                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
                                                                    Open PDF
                                                                </Text>
                                                            </>
                                                        )}
                                                    </TouchableOpacity>
                                                </View>
                                            ) : (
                                                <View style={[styles.filePreviewPlaceholder, { zIndex: 5 }]}>
                                                    <Feather name="file-text" size={120} color="#CBD5E1" />
                                                    <Text style={{ marginTop: 24, fontSize: 18, color: '#64748B' }}>Preview not available</Text>
                                                </View>
                                            )}
                                        </View>
                                    );
                                })()
                            ) : (
                                <View style={styles.filePreviewPlaceholder}>
                                    <ActivityIndicator size="large" color="#1581BF" />
                                    <Text style={{ marginTop: 24, fontSize: 16, color: '#64748B' }}>Loading file data...</Text>
                                </View>
                            )}
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

// Separate component for list item to handle swipe ref
interface DocumentItemRowProps {
    item: DocumentItem;
    onRename: () => void;
    onDelete: () => void;
    onPress: () => void;
}

const DocumentItemRow = ({ item, onRename, onDelete, onPress }: DocumentItemRowProps) => {
    const swipeableRef = React.useRef<Swipeable>(null);

    const closeSwipeable = () => {
        swipeableRef.current?.close();
    };

    const renderRightActions = (progress: any, dragX: any) => {
        return (
            <TouchableOpacity
                style={styles.rightAction}
                onPress={() => {
                    closeSwipeable();
                    onRename();
                }}
            >
                <Feather name="edit-2" size={24} color="white" />
                <Text style={styles.actionText}>Rename</Text>
            </TouchableOpacity>
        );
    };

    const renderLeftActions = (progress: any, dragX: any) => {
        return (
            <TouchableOpacity
                style={styles.leftAction}
                onPress={() => {
                    closeSwipeable();
                    onDelete();
                }}
            >
                <Feather name="trash-2" size={24} color="white" />
                <Text style={styles.actionText}>Delete</Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={{ zIndex: 1, marginBottom: 12 }}>
            <Swipeable
                ref={swipeableRef}
                renderRightActions={renderRightActions}
                renderLeftActions={renderLeftActions}
            >
                <View style={{ backgroundColor: '#EFF6FF' }}>
                    <TouchableOpacity
                        style={styles.docItem}
                        onPress={onPress}
                        activeOpacity={item.type === 'folder' ? 0.7 : 1}
                    >
                        <View style={styles.docItemLeft}>
                            <View style={[
                                styles.docIconContainer,
                                (item.type === 'folder' || item.name.toLowerCase().endsWith('.pdf')) ? styles.folderIconBg : styles.fileIconBg
                            ]}>
                                {item.type === 'folder' ? (
                                    <Feather name="folder" size={24} color="#3B82F6" />
                                ) : (
                                    item.name.toLowerCase().endsWith('.pdf') ? (
                                        <Feather name="file-text" size={24} color="#3B82F6" />
                                    ) : (['jpg', 'jpeg', 'png', 'heic', 'gif'].some(ext => item.name.toLowerCase().endsWith(ext))) ? (
                                        <Feather name="image" size={24} color="#1565A0" />
                                    ) : (
                                        <Feather name="file-text" size={24} color="#64748B" />
                                    )
                                )}
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.docName} numberOfLines={1} ellipsizeMode="middle">{item.name}</Text>
                                <Text style={styles.docMeta}>{item.meta}</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>
            </Swipeable>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#EFF6FF', // Orange 50
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
        backgroundColor: '#DBEAFE', // Orange 100
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        color: '#C2410C', // Orange 700
    },
    // Search Styles
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        marginHorizontal: 24,
        paddingHorizontal: 16,
        paddingVertical: 12, // Increased height
        borderRadius: 16, // More rounded
        marginBottom: 8,
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#1E293B',
        fontWeight: '500',
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
        shadowColor: '#1565A0',
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
        backgroundColor: '#DBEAFE', // Orange 100
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
        backgroundColor: '#1581BF', // Orange 500
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        shadowColor: '#1581BF',
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
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
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
        backgroundColor: '#DBEAFE', // Blue 100
    },
    fileIconBg: {
        backgroundColor: '#BFDBFE', // Blue 200
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
        bottom: 100,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    fabMenuWrapper: {
        // Logic for FAB if needed
        marginBottom: 10, // Adjust position relative to nav
        alignItems: 'center',
        alignSelf: 'center', // Center the wrapper
        zIndex: 200,
    },
    fabButton: {
        width: 56,
        height: 56,
        borderRadius: 20, // Squircle shape
        backgroundColor: '#1581BF', // Orange 500
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#1581BF',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
        zIndex: 200,
    },
    fabButtonOpen: {
        backgroundColor: '#1581BF',
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
        backgroundColor: '#1581BF',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 24,
        gap: 8,
        shadowColor: '#1581BF',
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
        borderColor: '#1581BF',
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
        textAlign: 'center',
        fontSize: 14,
        color: '#64748B',
        lineHeight: 20,
        marginBottom: 24,
    },
    actionText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 14,
        marginTop: 4,
    },
    leftAction: {
        backgroundColor: '#EF4444',
        justifyContent: 'center',
        alignItems: 'center',
        width: 100,
        height: '100%',
        marginRight: 8, // Added space
        borderRadius: 16,
    },
    rightAction: {
        backgroundColor: '#F59E0B',
        justifyContent: 'center',
        alignItems: 'center',
        width: 100,
        height: '100%',
        marginLeft: 8, // Added space
        borderRadius: 16,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'transparent',
        zIndex: 50,
    },
    initialIcon: {
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        borderRadius: 4,
    },
    initialText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1565A0', // Blue 800
    },
});
