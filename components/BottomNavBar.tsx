import React, { useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    FadeInRight
} from 'react-native-reanimated';

// Screen width for calculations
const { width } = Dimensions.get('window');

// Tab Configuration
const TABS = [
    {
        name: 'dashboard',
        label: 'Home',
        icon: 'view-dashboard',
        iconOutline: 'view-dashboard-outline',
        color: '#6366F1' // Indigo
    },
    {
        name: 'friends',
        label: 'Friends',
        icon: 'account-group',
        iconOutline: 'account-group-outline',
        color: '#F9A828' // Yellow/Orange
    },
    {
        name: 'profile',
        label: 'Profile',
        icon: 'account',
        iconOutline: 'account-outline',
        color: '#2DD4BF' // Teal 400 to match Profile Screen
    },
];

type ScreenName = typeof TABS[number]['name'];

interface BottomNavBarProps {
    currentScreen: ScreenName | string;
    onNavigate: (screen: ScreenName) => void;
    activeColor?: string; // Optional color prop for active tab
}

export default function BottomNavBar({ currentScreen, onNavigate, activeColor }: BottomNavBarProps) {
    const activeIndex = useSharedValue(0);

    useEffect(() => {
        const index = TABS.findIndex(tab => tab.name === currentScreen);
        if (index !== -1) {
            activeIndex.value = withSpring(index, { damping: 15, stiffness: 100 });
        }
    }, [currentScreen]);

    return (
        <View style={styles.container}>
            <View style={styles.dock}>

                {TABS.map((tab, index) => {
                    const isActive = currentScreen === tab.name;
                    // Use activeColor if provided, otherwise use tab's default color
                    const backgroundColor = isActive ? (activeColor || tab.color) : 'transparent';
                    return (
                        <TouchableOpacity
                            key={tab.name}
                            style={[
                                styles.tabItem,
                                isActive && { backgroundColor }
                            ]}
                            onPress={() => onNavigate(tab.name)}
                            activeOpacity={0.8}
                        >
                            <Animated.View style={styles.iconContainer}>
                                <MaterialCommunityIcons
                                    name={isActive ? tab.icon as any : tab.iconOutline as any}
                                    size={24}
                                    color={isActive ? "#FFFFFF" : "#94A3B8"}
                                />
                            </Animated.View>

                            {isActive && (
                                <Animated.Text entering={FadeInRight} style={styles.label}>
                                    {tab.label}
                                </Animated.Text>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 30,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 100,
    },
    dock: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        paddingVertical: 8,
        paddingHorizontal: 8,
        borderRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        width: '90%',
        maxWidth: 400,
        justifyContent: 'space-between',
    },
    tabItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 24,
    },
    iconContainer: {
        width: 24, // Fixed width to ensure alignment regardless of glyph
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14,
        marginLeft: 8,
    }
});
