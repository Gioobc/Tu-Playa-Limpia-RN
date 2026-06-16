import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, ActivityIndicator, useWindowDimensions, Alert, TouchableOpacity, Platform } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCameraPermissions } from 'expo-camera';
import WasteScanner from '../components/WasteScanner';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSpring,
    withSequence,
    Easing,
    FadeIn,
    FadeInDown,
    FadeInUp,
    FadeInLeft,
    FadeOutDown,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGame } from '../context/GameContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useWallet } from '../context/WalletContext';
import { useAuth } from '../context/AuthContext';
import { BRAND } from '../constants/theme';
import { rs, rf, rh, rw, SPACING, RADIUS, SCREEN } from '../constants/responsive';
import { SPRING } from '../constants/animations';
import FloatingBubbles from '../components/premium/FloatingBubbles';
import CelebrationModal from '../components/CelebrationModal';
import ENV from '../constants/env';
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const { width, height } = Dimensions.get('window');
const getScannerSize = () => {
    const baseSize = Math.min(SCREEN.width, SCREEN.height) * 0.7;
    return Math.min(baseSize, 350);
};
const CornerBracket = ({ position, color, size = 28 }) => {
    const thickness = 4;
    const length = size;
    const getPositionStyle = () => {
        switch (position) {
            case 'topLeft':
                return { top: 0, left: 0 };
            case 'topRight':
                return { top: 0, right: 0 };
            case 'bottomLeft':
                return { bottom: 0, left: 0 };
            case 'bottomRight':
                return { bottom: 0, right: 0 };
            default:
                return {};
        }
    };
    const getLineStyles = () => {
        const isTop = position.includes('top');
        const isLeft = position.includes('Left');
        return {
            horizontal: {
                position: 'absolute',
                width: length,
                height: thickness,
                backgroundColor: color,
                borderRadius: thickness / 2,
                [isTop ? 'top' : 'bottom']: 0,
                [isLeft ? 'left' : 'right']: 0,
            },
            vertical: {
                position: 'absolute',
                width: thickness,
                height: length,
                backgroundColor: color,
                borderRadius: thickness / 2,
                [isTop ? 'top' : 'bottom']: 0,
                [isLeft ? 'left' : 'right']: 0,
            },
        };
    };
    const lines = getLineStyles();
    return (
        <View style={[styles.cornerBracket, getPositionStyle()]}>
            <View style={lines.horizontal} />
            <View style={lines.vertical} />
        </View>
    );
};
const ScanButton = ({ icon, color, label, onPress, delay }) => {
    const { colors, isDark } = useTheme();
    const scale = useSharedValue(1);
    const handlePressIn = () => {
        scale.value = withSpring(0.92, SPRING.snappy);
    };
    const handlePressOut = () => {
        scale.value = withSpring(1, SPRING.smooth);
    };
    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress?.();
    };
    const buttonStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));
    const ButtonBackground = isDark ? LinearGradient : View;
    const buttonProps = isDark ? {
        colors: [BRAND.oceanDeep, '#002844'],
        style: [styles.scanButtonInner, { borderColor: color }]
    } : {
        style: [
            styles.scanButtonInner,
            {
                borderColor: color,
                backgroundColor: 'rgba(255,255,255,0.95)',
            }
        ]
    };
    return (
        <AnimatedPressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handlePress}
            style={[styles.scanButton, buttonStyle]}
        >
            <Animated.View entering={FadeInUp.delay(delay).springify()}>
                <ButtonBackground {...buttonProps}>
                    <Ionicons name={icon} size={rs(24)} color={color} />
                </ButtonBackground>
                <Text style={[styles.scanButtonLabel, { color: isDark ? '#fff' : '#1a3a4a' }]}>
                    {label}
                </Text>
            </Animated.View>
        </AnimatedPressable>
    );
};
const SuccessPopup = ({ visible, points, type }) => {
    const { colors, shadows, isDark } = useTheme();
    const { t } = useLanguage();
    if (!visible) return null;
    const translatedType = type ? t(`scan_type_${type.toLowerCase()}`, type) : type;
    return (
        <Animated.View
            entering={FadeIn.springify()}
            style={[styles.successPopup, { backgroundColor: colors.surface }, shadows.xl]}
        >
            <LinearGradient
                colors={isDark ? [BRAND.oceanLight, BRAND.oceanMid] : [BRAND.success, '#2e7d32']}
                style={styles.successIcon}
            >
                <Ionicons name="checkmark" size={rs(26)} color="#fff" />
            </LinearGradient>
            <View style={styles.successContent}>
                <Text style={[styles.successPoints, { color: colors.text }]}>+{points} TPL</Text>
                <Text style={[styles.successType, { color: colors.textSecondary }]}>
                    {t('scan_detected', { type: translatedType?.toUpperCase() })}
                </Text>
            </View>
        </Animated.View>
    );
};
const PermissionScreen = ({ onRequestPermission, isDark }) => {
    const { t } = useLanguage();
    const waterGradient = isDark
        ? [BRAND.oceanDeep, '#002844', BRAND.oceanMid]
        : ['#1a6b8f', '#2d8ab0', '#4aa3c7'];
    return (
        <View style={styles.container}>
            <LinearGradient colors={waterGradient} style={StyleSheet.absoluteFill} />
            <FloatingBubbles count={12} minSize={4} maxSize={16} zIndex={1} />
            <View style={styles.permissionContainer}>
                <Animated.View
                    entering={FadeIn.springify()}
                    style={[
                        styles.permissionCard,
                        { backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.95)' }
                    ]}
                >
                    <View style={[
                        styles.permissionIconContainer,
                        { backgroundColor: isDark ? BRAND.oceanMid : '#e0f2fe' }
                    ]}>
                        <Ionicons
                            name="camera"
                            size={rs(48)}
                            color={isDark ? BRAND.biolum : '#0d4a6f'}
                        />
                    </View>
                    <Text style={[
                        styles.permissionTitle,
                        { color: isDark ? '#fff' : '#1a3a4a' }
                    ]}>
                        {t('scan_camera_permission')}
                    </Text>
                    <Text style={[
                        styles.permissionDescription,
                        { color: isDark ? 'rgba(255,255,255,0.7)' : '#666' }
                    ]}>
                        {t('scan_camera_permission_desc')}
                    </Text>
                    <Pressable
                        onPress={onRequestPermission}
                        style={({ pressed }) => [
                            styles.permissionButton,
                            {
                                backgroundColor: isDark ? BRAND.biolum : '#0d4a6f',
                                opacity: pressed ? 0.8 : 1
                            }
                        ]}
                    >
                        <Ionicons name="checkmark-circle" size={rs(20)} color="#fff" />
                        <Text style={styles.permissionButtonText}>{t('scan_permission_allow')}</Text>
                    </Pressable>
                </Animated.View>
            </View>
        </View>
    );
};
const CLASS_MAPPING = {
    'battery': { type: 'dangerous', labelKey: 'scan_label_battery', points: 15, color: '#f43f5e' },
    'cardboard': { type: 'paper', labelKey: 'scan_label_cardboard', points: 5, color: '#f97316' },
    'glass': { type: 'glass', labelKey: 'scan_label_glass', points: 8, color: '#06b6d4' },
    'metal': { type: 'metal', labelKey: 'scan_label_metal', points: 8, color: '#64748b' },
    'paper': { type: 'paper', labelKey: 'scan_label_paper', points: 5, color: '#a855f7' },
    'plastic': { type: 'plastic', labelKey: 'scan_label_plastic', points: 6, color: '#3b82f6' },
    'plastic_bottle': { type: 'bottle', labelKey: 'scan_label_plastic_bottle', points: 6, color: '#22c55e' },
    // fallbacks
    'bottle': { type: 'bottle', labelKey: 'scan_label_bottle', points: 6, color: '#22c55e' },
    'can': { type: 'can', labelKey: 'scan_label_can', points: 8, color: '#eab308' },
    'trash': { type: 'trash', labelKey: 'scan_label_trash', points: 1, color: '#ef4444' },
};
const DetectionBox = () => null;
const DetectionPanel = ({ counts, totalPoints, isDark }) => {
    const { t } = useLanguage();
    if (!counts || Object.keys(counts).length === 0) return null;
    return (
        <Animated.View
            entering={FadeInUp.springify()}
            style={[
                styles.detectionPanel,
                { backgroundColor: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.95)' }
            ]}
        >
            <View style={styles.detectionPanelHeader}>
                <Ionicons name="checkmark-circle" size={rs(20)} color={isDark ? '#60a5fa' : '#3b82f6'} />
                <Text style={[styles.detectionPanelTitle, { color: isDark ? '#fff' : '#1a3a4a' }]}>
                    {t('scan_waste_found')}
                </Text>
            </View>
            <View style={styles.detectionCounts}>
                {Object.entries(counts).map(([className, count]) => {
                    const mapping = CLASS_MAPPING[className.toLowerCase()] || { label: className, color: '#22c55e' };
                    const label = mapping.labelKey ? t(mapping.labelKey) : (mapping.label || className);
                    return (
                        <View key={className} style={styles.detectionCountItem}>
                            <View style={[styles.detectionDot, { backgroundColor: mapping.color }]} />
                            <Text style={[styles.detectionCountText, { color: isDark ? '#e0e0e0' : '#1a3a4a' }]}>
                                {count}x {label}
                            </Text>
                        </View>
                    );
                })}
            </View>
            <View style={[styles.pointsBadge, { backgroundColor: isDark ? BRAND.biolum : '#3b82f6' }]}>
                <Text style={[styles.pointsBadgeText, { color: isDark ? '#001220' : '#fff' }]}>
                    +{totalPoints} TPL
                </Text>
            </View>
        </Animated.View>
    );
};
const LastScanInfoPanel = ({ scanInfo, isDark, onDismiss }) => {
    const { t } = useLanguage();
    const { width } = useWindowDimensions();
    const isDesktop = width > 768;
    useEffect(() => {
        if (!isDesktop && scanInfo) {
            const timer = setTimeout(() => {
                onDismiss();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [scanInfo, isDesktop, onDismiss]);
    if (!scanInfo) return null;
    return (
        <Animated.View
            entering={isDesktop ? FadeInLeft.springify() : FadeInUp.springify()}
            style={[
                styles.lastScanPanel,
                {
                    backgroundColor: isDark ? 'rgba(0,18,32,0.95)' : 'rgba(255,255,255,0.98)',
                    ...(isDesktop ? {
                        top: 100,
                        left: 20,
                        right: undefined,
                        width: 300,
                        bottom: 100,
                        maxHeight: 500,
                    } : {
                        top: rs(87),
                        left: rs(16),
                        right: rs(16),
                        backgroundColor: isDark ? 'rgba(0,18,32,0.95)' : 'rgba(255,255,255,0.98)',
                    })
                }
            ]}
        >
            <View style={styles.lastScanHeader}>
                <View style={styles.lastScanHeaderLeft}>
                    <Ionicons name="checkmark-circle" size={rs(18)} color={isDark ? '#60a5fa' : '#2563eb'} />
                    <Text style={[styles.lastScanTitle, { color: isDark ? '#fff' : '#1a3a4a' }]}>
                        {t('scan_last_scan')}
                    </Text>
                </View>
                { }
            </View>
            <View style={styles.lastScanItems}>
                {scanInfo.items.map((item, index) => (
                    <View key={index} style={styles.lastScanItem}>
                        <View style={styles.lastScanItemLeft}>
                            <Text style={[styles.lastScanItemLabel, { color: isDark ? '#e0e0e0' : '#374151' }]}>
                                {item.count}x {item.labelKey ? t(item.labelKey) : item.label}
                            </Text>
                            { }
                            <Text style={[styles.lastScanItemSize, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                                {item.width > 0 && item.height > 0
                                    ? `${t('scan_width')}: ${item.width}px | ${t('scan_height')}: ${item.height}px`
                                    : `${t('scan_size')}: ${item.sizePercent}%`}
                            </Text>
                        </View>
                        <Text style={[styles.lastScanItemPoints, { color: isDark ? '#60a5fa' : '#2563eb' }]}>
                            +{item.points}
                        </Text>
                    </View>
                ))}
            </View>
            <View style={[styles.lastScanTotal, { borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
                <Text style={[styles.lastScanTotalLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                    {t('scan_total_objects', { count: scanInfo.totalItems })}
                </Text>
                <Text style={[styles.lastScanTotalPoints, { color: isDark ? '#60a5fa' : '#2563eb' }]}>
                    +{scanInfo.totalPoints} TPL
                </Text>
            </View>
            <Pressable onPress={onDismiss} style={styles.lastScanDismiss}>
                <Ionicons name="close-circle" size={rs(20)} color={isDark ? '#6b7280' : '#9ca3af'} />
            </Pressable>
        </Animated.View>
    );
};
export default function ScanScreen() {
    const { scanItem, activeBeach, endCleanup, syncTPLToBlockchain, scannedItems, points, updateUserProfile, user } = useGame();
    const { mongoUserId } = useAuth(); // Import useAuth to check mongoUserId
    const { address: walletAddress } = useWallet();
    const { colors, isDark } = useTheme();
    const { t } = useLanguage();
    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const [lastScanned, setLastScanned] = useState(null);
    const [permission, requestPermission] = useCameraPermissions();
    const [isCameraActive, setIsCameraActive] = useState(false);
    const cameraRef = useRef(null);
    const scanIntervalRef = useRef(null);
    const isScanningRef = useRef(false);
    const isReadyToCollectRef = useRef(false);
    const [isScanning, setIsScanningState] = useState(false);
    const [isAutoScanning, setIsAutoScanning] = useState(true);
    const [isReadyToCollect, setIsReadyToCollectState] = useState(false);
    const setIsScanning = (val) => {
        isScanningRef.current = val;
        setIsScanningState(val);
    };
    const setIsReadyToCollect = (val) => {
        isReadyToCollectRef.current = val;
        setIsReadyToCollectState(val);
    };
    const [detectionResults, setDetectionResults] = useState(null);
    const [scanError, setScanError] = useState(null);
    const [predictions, setPredictions] = useState([]);
    const [imageSize, setImageSize] = useState({ width: 640, height: 480 });
    const [lastScanInfo, setLastScanInfo] = useState(null);
    const [showCelebration, setShowCelebration] = useState(false);
    const [celebrationMessage, setCelebrationMessage] = useState('');
    const [showAdminNotice, setShowAdminNotice] = useState(false);
    const [pendingReclaim, setPendingReclaim] = useState(null);
    const scannerSize = getScannerSize();
    const waterGradient = isDark
        ? [BRAND.oceanDeep, '#002844', BRAND.oceanMid]
        : ['#1a6b8f', '#2d8ab0', '#4aa3c7'];
    // Scanner line animation
    const scanLineY = useSharedValue(0);
    const pulseOpacity = useSharedValue(0.6);
    useEffect(() => {
        scanLineY.value = withRepeat(
            withTiming(scannerSize - 10, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        );
        pulseOpacity.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 1000 }),
                withTiming(0.6, { duration: 1000 })
            ),
            -1,
            false
        );
    }, [scannerSize]);

    const scanLineStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: scanLineY.value }],
    }));
    const pulseStyle = useAnimatedStyle(() => ({
        opacity: pulseOpacity.value,
    }));

    const handlePrediction = (pred) => {
        if (!pred) {
            setPredictions([]);
            setDetectionResults(null);
            setIsReadyToCollect(false);
            return;
        }

        const formattedPred = {
            class: pred.class,
            confidence: pred.confidence,
            x: 0,
            y: 0,
            width: 0,
            height: 0,
        };

        setPredictions([formattedPred]);

        const className = pred.class.toLowerCase();
        const mapping = CLASS_MAPPING[className] ||
            { type: 'trash', label: className, points: 5, color: '#3b82f6' };

        const itemPoints = mapping.points;

        const detectedItems = [{
            className,
            count: 1,
            labelKey: mapping.labelKey,
            label: mapping.label || className,
            points: itemPoints,
            sizePercent: 10,
            width: 0,
            height: 0,
        }];

        setDetectionResults({
            items: detectedItems,
            totalPoints: itemPoints,
            count: 1,
            counts: { [className]: 1 },
        });

        setIsReadyToCollect(true);
    };
    const handleCollect = () => {
        console.log("[ScanScreen] handleCollect triggered");
        if (!isReadyToCollect || !detectionResults || detectionResults.totalPoints <= 0) {
            console.log("[ScanScreen] Not ready or no points", { isReadyToCollect, hasResults: !!detectionResults });
            return;
        }
        
        const currentAddress = walletAddress || user.walletAddress;
        console.log("[ScanScreen] Checking address:", currentAddress);
        
        const isAdmin = currentAddress?.toLowerCase() === '0x12539926a3e4331b411b9d1bfc66fdded008b72e';
        const mainType = detectionResults.items[0]?.label || 'Residuo';

        if (isAdmin) {
            console.log("[ScanScreen] Admin detected, showing custom notice");
            setPendingReclaim({ type: mainType, points: detectionResults.totalPoints });
            setShowAdminNotice(true);
        } else {
            processReclaim(mainType, detectionResults.totalPoints);
        }
    };

    const handleAdminNoticeConfirm = () => {
        setShowAdminNotice(false);
        if (pendingReclaim) {
            processReclaim(pendingReclaim.type, pendingReclaim.points);
            setPendingReclaim(null);
        }
    };

    const processReclaim = (mainType, rewardPoints) => {
        console.log(`[ScanScreen] Reclaiming ${rewardPoints} points for ${mainType}`);
        
        // Registrar escaneo en el backend FastAPI
        if (mongoUserId) {
            fetch(`${ENV.API_BASE_URL}/api/scan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    waste_class: mainType.toLowerCase().replace(' ', '_'),
                    confidence: predictions[0]?.confidence || 0.95,
                    scanned_at: new Date().toISOString(),
                    user_id: mongoUserId,
                    beach_id: activeBeach?.id,
                }),
            }).catch(err => console.warn('[ScanScreen] /api/scan sync error:', err.message));
        }

        const { unlockedNFT } = scanItem(mainType.toLowerCase().includes('plastic') ? 'plastic' : 'trash', rewardPoints);
        
        // Sync to blockchain only if NOT admin
        const currentAddress = walletAddress || user.walletAddress;
        const isAdmin = currentAddress?.toLowerCase() === '0x12539926a3e4331b411b9d1bfc66fdded008b72e';
        if (!isAdmin) {
            syncTPLToBlockchain(rewardPoints);
        }

        // Persist to MongoDB — include beach info so we can count intervened beaches correctly
        const updateData = {
            total_scans: (scannedItems.total || 0) + 1,
            bottle_scans: scannedItems.bottles + (mainType.toLowerCase().includes('bottle') ? 1 : 0),
            can_scans: scannedItems.cans + (mainType.toLowerCase().includes('can') ? 1 : 0),
            plastic_scans: (scannedItems.plastic || 0) + (mainType.toLowerCase().includes('plastic') ? 1 : 0),
            points: (points || 0) + rewardPoints,
            // Beach association: stores the beach where this scan happened.
            // scanned_beach_id is a single value (last beach scanned);
            // scanned_beaches is an array we append to via the backend endpoint.
            last_scanned_beach_id:   activeBeach?.id   || null,
            last_scanned_beach_name: activeBeach?.name || null,
        };
        
        console.log(`[ScanScreen] Syncing to MongoDB (ID: ${mongoUserId}):`, updateData);
        if (!mongoUserId) {
            console.warn("[ScanScreen] No mongoUserId found, sync might fail");
        }
        updateUserProfile(updateData);

        // Registrar la playa como intervenida (usa $addToSet para evitar duplicados).
        // Esto es lo que hace que el dashboard cuente solo playas CON escaneos.
        if (mongoUserId && activeBeach?.id) {
            fetch(`${ENV.API_BASE_URL}/api/users/${mongoUserId}/scan-beach`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    beach_id:   activeBeach.id,
                    beach_name: activeBeach.name || activeBeach.id,
                }),
            }).catch(err => console.warn('[ScanScreen] scan-beach sync error:', err.message));
        }

        
        // Skip celebration for admin, show only for normal users
        if (!isAdmin) {
            if (unlockedNFT) {
                setCelebrationMessage(`${t('celebration_thanks')}\n\n${t('celebration_nft_unlocked')}\n${unlockedNFT.title}\n\n${t('celebration_see_rewards')}`);
                setShowCelebration(true);
            } else {
                setCelebrationMessage(`${t('celebration_thanks')}\n\n+${rewardPoints} TPL ${t('celebration_earned')}`);
                setShowCelebration(true);
            }
        }

        setLastScanInfo({
            timestamp: new Date().toLocaleTimeString(),
            items: detectionResults.items.map(item => ({
                label: item.label,
                count: item.count,
                points: item.points,
                sizePercent: item.sizePercent || 0,
                width: item.width || 0,
                height: item.height || 0,
            })),
            totalPoints: detectionResults.totalPoints,
            totalItems: detectionResults.count,
        });

        setLastScanned({
            type: mainType,
            points: detectionResults.totalPoints,
            details: detectionResults.items,
        });

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setIsReadyToCollect(false);
        
        setTimeout(() => {
            setLastScanned(null);
            setDetectionResults(null);
            setPredictions([]);
        }, 5000);
    };
    const toggleAutoScan = () => {
        setIsAutoScanning(!isAutoScanning);
        if (!isAutoScanning) {
            setPredictions([]);
            setDetectionResults(null);
        }
    };
    const scannerColor = isDark ? BRAND.biolum : '#0d4a6f';
    if (!isFocused) {
        return <View style={styles.container} />;
    }
    if (!permission) {
        return (
            <View style={[styles.container, styles.loadingContainer]}>
                <LinearGradient
                    colors={isDark ? [BRAND.oceanDeep, '#002844'] : ['#1a6b8f', '#2d8ab0']}
                    style={StyleSheet.absoluteFill}
                />
                <Ionicons name="camera" size={rs(40)} color={isDark ? BRAND.biolum : '#fff'} />
                <Text style={[styles.loadingText, { color: '#fff' }]}>Cargando...</Text>
            </View>
        );
    }
    if (!activeBeach) {
        return (
            <View style={styles.container}>
                <LinearGradient colors={waterGradient} style={StyleSheet.absoluteFill} />
                <FloatingBubbles count={12} minSize={4} maxSize={16} zIndex={1} />
                <View style={styles.permissionContainer}>
                    <Animated.View
                        entering={FadeIn.springify()}
                        style={[
                            styles.permissionCard,
                            { backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.95)' }
                        ]}
                    >
                        <View style={[
                            styles.permissionIconContainer,
                            { backgroundColor: isDark ? BRAND.oceanMid : '#e0f2fe' }
                        ]}>
                            <Ionicons
                                name="location"
                                size={rs(48)}
                                color={isDark ? BRAND.biolum : '#0d4a6f'}
                            />
                        </View>
                        <Text style={[
                            styles.permissionTitle,
                            { color: isDark ? '#fff' : '#1a3a4a' }
                        ]}>
                            {t('scan_beach_required')}
                        </Text>
                        <Pressable
                            onPress={() => navigation.navigate('MainTabs', { screen: 'Mapa' })}
                            style={({ pressed }) => [
                                styles.permissionButton,
                                {
                                    backgroundColor: isDark ? BRAND.biolum : '#0d4a6f',
                                    opacity: pressed ? 0.8 : 1
                                }
                            ]}
                        >
                            <Ionicons name="map" size={rs(20)} color="#fff" />
                            <Text style={styles.permissionButtonText}>{t('sidebar_map')}</Text>
                        </Pressable>
                    </Animated.View>
                </View>
            </View>
        );
    }

    if (!permission.granted || !isCameraActive) {
        return (
            <PermissionScreen
                onRequestPermission={async () => {
                    if (!permission.granted) {
                        const result = await requestPermission();
                        if (result?.granted) {
                            setIsCameraActive(true);
                            setIsAutoScanning(true);
                        }
                    } else {
                        setIsCameraActive(true);
                        setIsAutoScanning(true);
                    }
                }}
                isDark={isDark}
            />
        );
    }
    return (
        <View style={styles.container}>
            { }
            <LinearGradient colors={waterGradient} style={StyleSheet.absoluteFill} />
            { }
            <FloatingBubbles count={12} minSize={4} maxSize={16} zIndex={1} />
            { }
            <Pressable
                onPress={() => {
                    setIsAutoScanning(false);
                    setPredictions([]);
                    setDetectionResults(null);
                    setIsCameraActive(false);
                    endCleanup();
                    if (navigation.canGoBack()) {
                        navigation.goBack();
                    } else {
                        navigation.navigate('Home');
                    }
                }}
                style={({ pressed }) => [
                    styles.revokeButton,
                    { opacity: pressed ? 0.6 : 1 }
                ]}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <Ionicons name="close" size={rs(16)} color={isDark ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.95)'} />
            </Pressable>
            <CelebrationModal
                visible={showCelebration}
                onClose={() => setShowCelebration(false)}
                message={celebrationMessage}
            />
            { }
            <Animated.View
                entering={FadeIn.delay(400)}
                style={styles.scanningBox}
            >
                {isReadyToCollect ? (
                    <Ionicons
                        name="checkmark-circle"
                        size={rs(20)}
                        color='#60a5fa'
                    />
                ) : (
                    <ActivityIndicator
                        size="small"
                        color={isDark ? 'rgba(255,255,255,0.8)' : '#fff'}
                    />
                )}
                <Text style={[
                    styles.scanText,
                    {
                        color: isReadyToCollect ? '#60a5fa' : (isDark ? 'rgba(255,255,255,0.8)' : '#fff'),
                        textShadowColor: 'rgba(0,0,0,0.8)',
                        textShadowOffset: { width: 0, height: 1 },
                        textShadowRadius: 3
                    }
                ]}>
                    {isReadyToCollect
                        ? t('scan_waste_found')
                        : t('scan_searching')}
                </Text>
            </Animated.View>

            {/* Banner de Playa Activa */}
            {activeBeach && (
                <Animated.View
                    entering={FadeInDown.delay(600)}
                    style={[styles.activeBeachBanner, { backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.7)' }]}
                >
                    <Ionicons name="location" size={rs(16)} color={BRAND.oceanLight} />
                    <Text style={[styles.activeBeachText, { color: isDark ? '#fff' : BRAND.oceanDeep }]}>
                        {t('scan_cleaning_at', { beach: activeBeach.name })}
                    </Text>
                </Animated.View>
            )}
            { }
            <View style={styles.scannerOverlay}>
                { }
                <Animated.View style={[
                    styles.scannerFrame,
                    {
                        width: scannerSize,
                        height: scannerSize,
                        borderColor: isDark ? 'rgba(168,197,212,0.3)' : 'rgba(13,74,111,0.2)',
                        overflow: 'hidden',
                        marginTop: rs(20),
                    },
                    pulseStyle
                ]}>
                    { }
                    <View style={{ flex: 1, width: '100%', height: '100%' }}>
                        <WasteScanner
                            isActive={isCameraActive && isAutoScanning && isFocused && !isReadyToCollect}
                            onPrediction={handlePrediction}
                            style={styles.cameraInFrame}
                        />
                    </View>
                    { }
                    <View style={styles.cornerOverlay}>
                        <CornerBracket position="topLeft" color={scannerColor} size={rs(32)} />
                        <CornerBracket position="topRight" color={scannerColor} size={rs(32)} />
                        <CornerBracket position="bottomLeft" color={scannerColor} size={rs(32)} />
                        <CornerBracket position="bottomRight" color={scannerColor} size={rs(32)} />
                    </View>
                    { }
                    {predictions.map((pred, index) => (
                        <DetectionBox
                            key={pred.detection_id || index}
                            prediction={pred}
                            frameSize={scannerSize}
                            imageSize={imageSize}
                        />
                    ))}
                    { }
                    <Animated.View style={[styles.scanLine, scanLineStyle]}>
                        <LinearGradient
                            colors={[
                                'transparent',
                                isDark ? 'rgba(168,197,212,0.8)' : 'rgba(13,74,111,0.7)',
                                'transparent'
                            ]}
                            start={{ x: 0, y: 0.5 }}
                            end={{ x: 1, y: 0.5 }}
                            style={styles.scanLineGradient}
                        />
                    </Animated.View>
                </Animated.View>
            </View>
            { }
            {scanError && (
                <Animated.View
                    entering={FadeIn.springify()}
                    style={[styles.errorBox, { backgroundColor: 'rgba(239,68,68,0.9)' }]}
                >
                    <Ionicons name="alert-circle" size={rs(18)} color="#fff" />
                    <Text style={styles.errorText}>{scanError}</Text>
                </Animated.View>
            )}
            { }
            <SuccessPopup
                visible={lastScanned !== null}
                points={lastScanned?.points}
                type={lastScanned?.type}
            />
            { }
            {detectionResults && !lastScanInfo && (
                <DetectionPanel
                    counts={detectionResults.counts}
                    totalPoints={detectionResults.totalPoints}
                    isDark={isDark}
                />
            )}
            { }
            <LastScanInfoPanel
                scanInfo={lastScanInfo}
                isDark={isDark}
                onDismiss={() => setLastScanInfo(null)}
            />
            { }
            <SafeAreaView edges={['bottom']} style={styles.controlsArea}>
                <LinearGradient
                    colors={isDark
                        ? ['transparent', 'rgba(0,18,32,0.95)']
                        : ['transparent', 'rgba(13,74,111,0.95)']
                    }
                    style={[styles.controlsGradient, { paddingBottom: rs(110) }]}
                >
                    { }
                    <Animated.View entering={FadeIn.delay(100)} style={styles.statusRow}>
                        <View style={[
                            styles.statusDot,
                            { backgroundColor: isReadyToCollect ? '#3b82f6' : (isAutoScanning ? '#60a5fa' : '#6b7280') }
                        ]} />
                        <Text style={styles.statusText}>
                            {isReadyToCollect
                                ? t('scan_waste_found')
                                : (isScanning ? t('scan_analyzing') : (isAutoScanning ? t('scan_searching') : t('scan_paused')))}
                        </Text>
                    </Animated.View>
                    { }
                    <Animated.View entering={FadeInUp.delay(100).springify()}>
                        {!activeBeach ? (
                            <View style={[styles.aiScanButton, { backgroundColor: 'rgba(239,68,68,0.2)', borderColor: '#ef4444', borderWidth: 1 }]}>
                                <Ionicons name="location-outline" size={rs(24)} color="#ef4444" />
                                <Text style={[styles.aiScanButtonText, { color: '#ef4444', fontSize: rf(12), letterSpacing: 0.5, textAlign: 'center' }]}>
                                    {t('scan_beach_required')}
                                </Text>
                            </View>
                        ) : (
                            <Pressable
                                onPress={handleCollect}
                                disabled={!isReadyToCollect}
                                style={({ pressed }) => [
                                    styles.aiScanButton,
                                    {
                                        backgroundColor: isReadyToCollect
                                            ? (isDark ? '#3b82f6' : '#2563eb')
                                            : 'rgba(100,100,100,0.3)',
                                        opacity: pressed ? 0.8 : 1,
                                        transform: [{ scale: pressed ? 0.95 : 1 }],
                                    }
                                ]}
                            >
                                <Ionicons
                                    name="scan"
                                    size={rs(32)}
                                    color="#fff"
                                />
                                <Text style={[styles.aiScanButtonText, { color: '#fff' }]}>
                                    {isReadyToCollect
                                        ? `${t('scan_button')} +${detectionResults?.totalPoints || 0} TPL`
                                        : (isScanning ? t('scan_analyzing') : t('scan_searching'))}
                                </Text>
                            </Pressable>
                        )}
                    </Animated.View>
                    { }
                    <View style={styles.controlButtonRow}>
                        <Pressable
                            onPress={toggleAutoScan}
                            style={({ pressed }) => [
                                styles.toggleButton,
                                { opacity: pressed ? 0.7 : 1 }
                            ]}
                        >
                            <Ionicons
                                name={isAutoScanning ? "pause" : "play"}
                                size={rs(18)}
                                color="#fff"
                            />
                            <Text style={styles.toggleButtonText}>
                                {isAutoScanning ? t('scan_auto_pause') : t('scan_auto_resume')}
                            </Text>
                        </Pressable>
                    </View>
                </LinearGradient>
            </SafeAreaView>

            {/* Admin Notice Overlay */}
            {showAdminNotice && (
                <View style={[StyleSheet.absoluteFill, styles.noticeOverlay]}>
                    <Animated.View 
                        entering={FadeInDown}
                        style={[styles.noticeCard, { backgroundColor: isDark ? '#1a202c' : '#fff' }]}
                    >
                        <View style={styles.noticeIconContainer}>
                            <Ionicons name="alert-circle" size={rs(50)} color="#eab308" />
                        </View>
                        <Text style={[styles.noticeTitle, { color: colors.text }]}>¡Hey! 😅</Text>
                        <Text style={[styles.noticeDesc, { color: colors.textSecondary }]}>
                            ¡Son tus propios tokens! Estás intentando reclamar tokens que tú mismo emites.
                        </Text>
                        <TouchableOpacity 
                            style={styles.noticeButton}
                            onPress={handleAdminNoticeConfirm}
                        >
                            <Text style={styles.noticeButtonText}>Continuar y Guardar</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            )}

            {/* Celebration Overlay */}
            {showCelebration && (
                <View style={[StyleSheet.absoluteFill, styles.noticeOverlay]}>
                    <Animated.View 
                        entering={FadeInDown}
                        style={[styles.noticeCard, { backgroundColor: isDark ? '#1a202c' : '#fff' }]}
                    >
                        <View style={styles.noticeIconContainer}>
                            <Ionicons name="star" size={rs(50)} color="#eab308" />
                        </View>
                        <Text style={[styles.noticeTitle, { color: colors.text }]}>¡Felicidades!</Text>
                        <Text style={[styles.noticeDesc, { color: colors.textSecondary }]}>
                            {celebrationMessage}
                        </Text>
                        <TouchableOpacity 
                            style={styles.noticeButton}
                            onPress={() => setShowCelebration(false)}
                        >
                            <Text style={styles.noticeButtonText}>Aceptar</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            )}
        </View>
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scannerOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'flex-start',
        paddingTop: rh(230),
        alignItems: 'center',
        zIndex: 2,
    },
    scannerFrame: {
        borderWidth: 1.5,
        borderRadius: RADIUS.md,
        position: 'relative',
    },
    cornerBracket: {
        position: 'absolute',
        width: rs(32),
        height: rs(32),
    },
    scanLine: {
        position: 'absolute',
        left: rs(8),
        right: rs(8),
        height: rs(3),
    },
    scanLineGradient: {
        flex: 1,
        borderRadius: rs(2),
    },
    scanText: {
        fontSize: rf(16),
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    controlsArea: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    controlsGradient: {
        paddingTop: SPACING.xxl,
        paddingBottom: rh(90),
        paddingHorizontal: SPACING.lg,
    },
    scanButton: {
        alignItems: 'center',
    },
    scanButtonInner: {
        width: rs(64),
        height: rs(64),
        borderRadius: rs(32),
        borderWidth: 2.5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanButtonLabel: {
        marginTop: SPACING.xs,
        fontSize: rf(11),
        fontWeight: '600',
    },
    successPopup: {
        position: 'absolute',
        top: rh(100),
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        paddingRight: SPACING.xl,
        borderRadius: RADIUS.xl,
        zIndex: 100,
    },
    successIcon: {
        width: rs(46),
        height: rs(46),
        borderRadius: rs(23),
        justifyContent: 'center',
        alignItems: 'center',
    },
    successContent: {
        marginLeft: SPACING.md,
    },
    successPoints: {
        fontSize: rf(18),
        fontWeight: '800',
    },
    successType: {
        fontSize: rf(10),
        marginTop: rs(2),
        letterSpacing: 1,
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: SPACING.md,
        fontSize: rf(14),
        fontWeight: '500',
    },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING.xl,
        zIndex: 10,
    },
    permissionCard: {
        width: '100%',
        maxWidth: rs(320),
        padding: SPACING.xl,
        borderRadius: RADIUS.xl,
        alignItems: 'center',
    },
    permissionIconContainer: {
        width: rs(80),
        height: rs(80),
        borderRadius: rs(40),
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    permissionTitle: {
        fontSize: rf(20),
        fontWeight: '700',
        marginBottom: SPACING.sm,
        textAlign: 'center',
    },
    permissionDescription: {
        fontSize: rf(14),
        textAlign: 'center',
        marginBottom: SPACING.xl,
        lineHeight: rf(20),
    },
    permissionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: rs(8),
        paddingVertical: rs(14),
        paddingHorizontal: rs(24),
        borderRadius: RADIUS.lg,
    },
    permissionButtonText: {
        color: '#fff',
        fontSize: rf(15),
        fontWeight: '600',
    },
    cameraInFrame: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: RADIUS.md,
        flex: 1,
        width: '100%',
        height: '100%',
    },
    cornerOverlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 2,
    },
    aiScanButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: rs(12),
        alignSelf: 'center',
        paddingVertical: rs(16),
        paddingHorizontal: rs(40),
        borderRadius: rs(30),
        marginBottom: SPACING.lg,
        minWidth: rs(180),
        minHeight: rs(60),
    },
    aiScanButtonText: {
        fontSize: rf(16),
        fontWeight: '700',
        letterSpacing: 2,
    },
    errorBox: {
        position: 'absolute',
        top: rh(15),
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        gap: rs(8),
        paddingVertical: rs(12),
        paddingHorizontal: rs(20),
        borderRadius: RADIUS.lg,
        zIndex: 100,
    },
    errorText: {
        color: '#fff',
        fontSize: rf(13),
        fontWeight: '600',
    },
    scanningBox: {
        position: 'absolute',
        top: rh(15),
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        gap: rs(10),
        paddingVertical: rs(12),
        paddingHorizontal: rs(20),
        borderRadius: RADIUS.lg,
        zIndex: 100,
    },
    detectionBox: {
        position: 'absolute',
        borderWidth: 2,
        borderRadius: 4,
        zIndex: 10,
    },
    detectionLabel: {
        position: 'absolute',
        top: -22,
        left: -2,
        paddingHorizontal: rs(6),
        paddingVertical: rs(2),
        borderRadius: 4,
    },
    detectionLabelText: {
        color: '#fff',
        fontSize: rf(10),
        fontWeight: '700',
    },
    detectionPanel: {
        position: 'absolute',
        top: rh(120),
        alignSelf: 'center',
        paddingVertical: rs(12),
        paddingHorizontal: rs(16),
        borderRadius: RADIUS.lg,
        zIndex: 90,
        minWidth: rs(180),
    },
    detectionPanelHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: rs(6),
        marginBottom: rs(8),
    },
    detectionPanelTitle: {
        fontSize: rf(15),
        fontWeight: '700',
    },
    detectionCounts: {
        gap: rs(4),
        marginBottom: rs(10),
    },
    detectionCountItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: rs(6),
    },
    detectionDot: {
        width: rs(8),
        height: rs(8),
        borderRadius: rs(4),
    },
    detectionCountText: {
        fontSize: rf(13),
    },
    pointsBadge: {
        alignSelf: 'center',
        paddingVertical: rs(6),
        paddingHorizontal: rs(16),
        borderRadius: rs(20),
    },
    pointsBadgeText: {
        fontSize: rf(14),
        fontWeight: '700',
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: rs(6),
        marginBottom: rs(12),
    },
    statusDot: {
        width: rs(8),
        height: rs(8),
        borderRadius: rs(4),
    },
    statusText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: rf(12),
    },
    controlButtonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: rs(20),
        marginTop: rs(12),
    },
    toggleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: rs(6),
        paddingVertical: rs(8),
        paddingHorizontal: rs(16),
        borderRadius: rs(20),
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    toggleButtonText: {
        color: '#fff',
        fontSize: rf(12),
        fontWeight: '600',
    },
    lastScanPanel: {
        position: 'absolute',
        top: rs(100),
        left: rs(16),
        right: rs(16),
        borderRadius: RADIUS.md,
        padding: rs(12),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    lastScanHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: rs(10),
    },
    lastScanHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: rs(6),
    },
    lastScanTitle: {
        fontSize: rf(14),
        fontWeight: '700',
    },
    lastScanItems: {
        gap: rs(6),
    },
    lastScanItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: rs(4),
    },
    lastScanItemLeft: {
        flex: 1,
    },
    lastScanItemLabel: {
        fontSize: rf(13),
        fontWeight: '500',
    },
    lastScanItemSize: {
        fontSize: rf(10),
        marginTop: rs(2),
    },
    lastScanItemPoints: {
        fontSize: rf(14),
        fontWeight: '700',
    },
    lastScanTotal: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: rs(10),
        paddingTop: rs(10),
        borderTopWidth: 1,
    },
    lastScanTotalLabel: {
        fontSize: rf(12),
    },
    lastScanTotalPoints: {
        fontSize: rf(16),
        fontWeight: '800',
    },
    lastScanDismiss: {
        position: 'absolute',
        top: rs(8),
        right: rs(8),
        padding: rs(4),
    },
    revokeButton: {
        position: 'absolute',
        top: rs(48),
        right: rs(16),
        zIndex: 100,
        width: rs(32),
        height: rs(32),
        borderRadius: rs(16),
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.4)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeBeachBanner: {
        position: 'absolute',
        top: rs(130),
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: rs(6),
        paddingHorizontal: rs(12),
        borderRadius: RADIUS.full,
        gap: rs(6),
        zIndex: 10,
    },
    activeBeachText: {
        fontSize: rf(14),
        fontWeight: '600',
    },
    noticeOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
        zIndex: 9999,
    },
    noticeCard: {
        width: '90%',
        padding: SPACING.xl,
        borderRadius: RADIUS.xl,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    noticeIconContainer: {
        marginBottom: SPACING.md,
    },
    noticeTitle: {
        fontSize: rf(24),
        fontWeight: '900',
        marginBottom: SPACING.sm,
    },
    noticeDesc: {
        fontSize: rf(16),
        textAlign: 'center',
        lineHeight: rf(22),
        marginBottom: SPACING.xl,
    },
    noticeButton: {
        backgroundColor: '#3b82f6',
        paddingVertical: rs(12),
        paddingHorizontal: rs(30),
        borderRadius: RADIUS.lg,
        width: '100%',
        alignItems: 'center',
    },
    noticeButtonText: {
        color: '#fff',
        fontSize: rf(16),
        fontWeight: '800',
    },
});
