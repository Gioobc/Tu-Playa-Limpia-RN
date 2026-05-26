import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    TextInput, Image, Alert, Modal, Platform, Switch
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import Animated, {
    FadeInDown,
    FadeInUp,
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { useGame } from '../context/GameContext';
import { useTheme } from '../context/ThemeContext';
import { useWallet } from '../context/WalletContext';
import ENV from '../constants/env';
import { BRAND } from '../constants/theme';
import { useLanguage } from '../context/LanguageContext';
import { rs, rf, rh, SPACING, RADIUS } from '../constants/responsive';
import FlagIcon from '../components/FlagIcon';
import CelebrationModal from '../components/CelebrationModal';
import LivingWater from '../components/LivingWater';
import FloatingBubbles from '../components/premium/FloatingBubbles';
import GlassCard from '../components/premium/GlassCard';
import ScalePressable from '../components/ScalePressable';
import { mintNFT } from "../utils/blockchain/missionNFT";
import { generateNFTAttributes } from "../utils/nftGenerator";
import TPLTitle from '../components/premium/TPLTitle';
import { useWindowDimensions } from 'react-native';
export default function ProfileScreen({ navigation }) {
    const { width } = useWindowDimensions();
    const isDesktop = width >= 1024;
    const { user, updateUserProfile, nfts, points, level, scannedItems, unlockNFT } = useGame();
    const { colors, shadows, isDark, themeMode, setDarkMode, setLightMode, setSystemMode, THEME_MODES } = useTheme();
    const { t, language, setLanguage, LANGUAGES, LANGUAGE_LABELS, isAutoMode } = useLanguage();
    const { verifySessionPassword, exportAccount, mongoUserId, clearLocalAccount } = useAuth();
    const { address, connectMetaMask, connectPali, disconnectWallet } = useWallet();
    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState(user.name);
    const [showImagePicker, setShowImagePicker] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [showCelebration, setShowCelebration] = useState(false);
    const [celebrationMessage, setCelebrationMessage] = useState('');
    // Export State
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportStep, setExportStep] = useState('verify_session');
    const [sessionPassword, setSessionPassword] = useState('');
    const [filePassword, setFilePassword] = useState('');
    const [filePasswordConfirm, setFilePasswordConfirm] = useState('');
    const [exportError, setExportError] = useState('');
    const [isExporting, setIsExporting] = useState(false);
    // Visibility State
    const [showPassword, setShowPassword] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showDeleteSuccessModal, setShowDeleteSuccessModal] = useState(false);
    const [deleteSuccessMessage, setDeleteSuccessMessage] = useState('');
    // ── Milestone Checks ──
    useEffect(() => {
        const checkMilestones = async () => {
            // Visit Profile NFT
            if (user && !user.hasAwardedProfileVisit) {
                try {
                    updateUserProfile({ hasAwardedProfileVisit: true });
                    const newNft = unlockNFT({
                        title: 'Profile Explorer',
                        image: 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=crop&q=80&w=800',
                        rarity: 'Common',
                        acquisition: 'nft_acq_profile_visit',
                        description: 'Awarded for visiting your profile for the first time.',
                    });
                    if (newNft) {
                        setCelebrationMessage(`${t('celebration_thanks')}\n\n${t('celebration_nft_unlocked')}\n${newNft.title}\n\n${t('celebration_see_rewards')}`);
                        setShowCelebration(true);
                        setTimeout(() => showSuccess(`${t('nft_unlocked_toast')}: Profile Explorer!`), 1500);
                    }
                } catch (error) {
                    console.warn("Error unlocking profile NFT:", error);
                }
            }
        };
        const timer = setTimeout(checkMilestones, 1000);
        return () => clearTimeout(timer);
    }, [user]);
    const toastOpacity = useSharedValue(0);
    const toastY = useSharedValue(rs(-50));
    const showSuccess = (message) => {
        setSuccessMessage(message);
        setShowSuccessToast(true);
        toastOpacity.value = withSpring(1);
        toastY.value = withSpring(0);
        setTimeout(() => {
            toastOpacity.value = withTiming(0, { duration: 300 });
            toastY.value = withTiming(rs(-50), { duration: 300 });
            setTimeout(() => setShowSuccessToast(false), 300);
        }, 2500);
    };
    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(t('profile_permission_required'), t('profile_gallery_permission'));
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
            base64: true,
        });
        if (!result.canceled) {
            const base64Img = `data:image/jpeg;base64,${result.assets[0].base64}`;
            console.log('📸 Avatar image selected, size:', base64Img.length);
            await updateUserProfile({ avatar: base64Img });
            console.log('✅ Avatar updated in local state:', base64Img.substring(0, 50) + '...');
            showSuccess(t('profile_photo_updated'));
        }
        setShowImagePicker(false);
    };
    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(t('profile_permission_required'), t('profile_camera_permission'));
            return;
        }
        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
            base64: true,
        });
        if (!result.canceled) {
            const base64Img = `data:image/jpeg;base64,${result.assets[0].base64}`;
            console.log('📷 Avatar photo taken, size:', base64Img.length);
            await updateUserProfile({ avatar: base64Img });
            console.log('✅ Avatar updated in local state:', base64Img.substring(0, 50) + '...');
            showSuccess(t('profile_photo_updated'));
        }
        setShowImagePicker(false);
    };
    const handleSaveName = async () => {
        if (user.hasChangedUsername) {
            Alert.alert(t('profile_name_change_denied'), t('profile_name_change_denied'));
            setIsEditingName(false);
            return;
        }
        const trimmedName = newName.trim();
        if (trimmedName.length < 3) {
            Alert.alert(t('profile_name_invalid'), t('profile_name_invalid'));
            return;
        }
        if (trimmedName === user.name) {
            setIsEditingName(false);
            return;
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await updateUserProfile({ name: trimmedName });
        setNewName(trimmedName);
        setIsEditingName(false);
        showSuccess(t('profile_name_saved'));

    };
    const handleThemeChange = (mode) => {
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (mode === 'dark') setDarkMode();
        else if (mode === 'light') setLightMode();
        else setSystemMode();
        showSuccess(`${t('profile_toast_theme')}: ${mode === 'system' ? t('profile_theme_auto') : mode === 'dark' ? t('profile_theme_dark') : t('profile_theme_light')}`);
    };
    const handleLanguageChange = (lang) => {
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setLanguage(lang);
        const label = LANGUAGE_LABELS[Object.keys(LANGUAGES).find(key => LANGUAGES[key] === lang)];
        showSuccess(`${t('profile_toast_lang')}: ${label || lang}`);
    };
    const handleExportProfile = async () => {
        setExportError('');

        try {
            const result = await exportAccount(sessionPassword, filePassword, filePasswordConfirm);
            if (result.success) {
                closeExportModal();
                if (Platform.OS === 'web' && typeof window !== 'undefined' && window.alert) {
                    window.alert(language === 'es' ? 'Cuenta exportada correctamente' : 'Account exported successfully');
                } else {
                    Alert.alert(
                        language === 'es' ? 'Cuenta exportada' : 'Account exported',
                        language === 'es' ? 'Tu cuenta fue exportada correctamente.' : 'Your account was exported successfully.'
                    );
                }
            } else {
                setExportError(result.error);
            }
        } finally {
            setIsExporting(false);
        }
    };

    const closeExportModal = () => {
        setShowExportModal(false);
        setExportStep('verify_session');
        setSessionPassword('');
        setFilePassword('');
        setFilePasswordConfirm('');
        setExportError('');
    };

    const confirmDeleteAccount = async () => {
        setShowDeleteModal(false);
        try {
            if (!mongoUserId) {
                throw new Error(language === 'es' ? 'No se encontró tu usuario en el servidor' : 'User record not found on server');
            }

            const response = await fetch(`${ENV.API_BASE_URL}/api/users/${mongoUserId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || errorData.message || `HTTP ${response.status}`);
            }

            await disconnectWallet();
            await clearLocalAccount();

            const successMessage = language === 'es'
                ? 'Tu cuenta fue borrada correctamente. Puedes crear o importar otra cuenta.'
                : 'Your account was deleted successfully. You can now create or import another account.';
            setDeleteSuccessMessage(successMessage);
            setShowDeleteSuccessModal(true);
        } catch (error) {
            const errorTitle = language === 'es' ? 'Error' : 'Error';
            const errorMessage = error.message || (language === 'es' ? 'No se pudo eliminar la cuenta' : 'Could not delete the account');
            if (Platform.OS === 'web' && typeof window !== 'undefined' && window.alert) {
                window.alert(`${errorTitle}\n\n${errorMessage}`);
            } else {
                Alert.alert(errorTitle, errorMessage);
            }
        }
    };

    const handleDeleteAccount = () => {
        setShowDeleteModal(true);
    };
    const toastStyle = useAnimatedStyle(() => ({
        opacity: toastOpacity.value,
        transform: [{ translateY: toastY.value }],
    }));
    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Background */}
            {isDark && (
                <LinearGradient
                    colors={[BRAND.oceanDeep, BRAND.oceanDark, BRAND.oceanMid]}
                    style={StyleSheet.absoluteFill}
                />
            )}
            {isDark && <FloatingBubbles count={6} minSize={4} maxSize={12} />}
            <View style={styles.bgContainer}>
                <LivingWater />
            </View>
            <ScrollView
                contentContainerStyle={[styles.scrollContent, isDesktop && { width: '100%', maxWidth: 800, alignSelf: 'center' }]}
                showsVerticalScrollIndicator={false}
            >
                { }
                <Animated.View
                    entering={FadeInDown.delay(100).springify()}
                    style={styles.header}
                >
                    <ScalePressable
                        onPress={() => navigation.goBack()}
                        style={[styles.backButton, { backgroundColor: colors.glass }]}
                    >
                        <Ionicons name="arrow-back" size={rs(24)} color={colors.text} />
                    </ScalePressable>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>{t('profile_title')}</Text>
                    <View style={{ width: rs(44) }} />
                </Animated.View>
                { }
                <Animated.View entering={FadeInUp.delay(200).springify()}>
                    <ScalePressable
                        style={styles.avatarContainer}
                        onPress={() => setShowImagePicker(true)}
                    >
                        <LinearGradient
                            colors={[BRAND.sandGold, BRAND.goldShimmer, BRAND.sandGold]}
                            style={styles.avatarBorder}
                        >
                            {user.avatar ? (
                                <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
                            ) : (
                                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surface }]}>
                                    <Text style={[styles.avatarInitials, { color: colors.tabInactive }]}>
                                        {user.initials}
                                    </Text>
                                </View>
                            )}
                        </LinearGradient>
                        <View style={[styles.editBadge, { backgroundColor: colors.tabInactive }]}>
                            <Ionicons name="camera" size={rs(16)} color="#fff" />
                        </View>
                    </ScalePressable>
                </Animated.View>
                { }
                <Animated.View
                    entering={FadeInUp.delay(300).springify()}
                    style={styles.nameContainer}
                >
                    {isEditingName ? (
                        <View style={styles.editNameContainer}>
                            <TextInput
                                style={[styles.nameInput, { color: colors.text, borderColor: colors.border }]}
                                value={newName}
                                onChangeText={setNewName}
                                placeholder={t('profile_new_name')}
                                placeholderTextColor={colors.textMuted}
                                maxLength={20}
                                autoFocus
                            />
                            <ScalePressable onPress={handleSaveName} style={[styles.saveButton, { backgroundColor: isDark ? BRAND.oceanLight : BRAND.success }]}>
                                <Ionicons name="checkmark" size={rs(20)} color="#fff" />
                            </ScalePressable>
                            <ScalePressable
                                onPress={() => { setNewName(user.name); setIsEditingName(false); }}
                                style={[styles.cancelButton, { backgroundColor: colors.glass }]}
                            >
                                <Ionicons name="close" size={rs(20)} color={colors.text} />
                            </ScalePressable>
                        </View>
                    ) : (
                        <ScalePressable
                            onPress={() => !user.hasChangedUsername && setIsEditingName(true)}
                            style={styles.nameDisplay}
                        >
                            <Text style={[styles.userName, { color: colors.text }]}>{user.name}</Text>
                            <TPLTitle title={user.tplTitle} />
                            {!user.hasChangedUsername && (
                                <Ionicons name="pencil" size={rs(16)} color={colors.textSecondary} style={{ marginLeft: rs(10) }} />
                            )}
                        </ScalePressable>
                    )}
                    {user.hasChangedUsername && (
                        <Text style={[styles.nameLockedHint, { color: colors.textMuted }]}>
                            {t('profile_name_locked')}
                        </Text>
                    )}
                </Animated.View>
                { }
                <Animated.View entering={FadeInUp.delay(350).springify()}>
                    <LinearGradient
                        colors={BRAND.goldShimmer ? [BRAND.sandGold, BRAND.goldShimmer] : ['#e8d5b5', '#FFD700']}
                        style={[styles.levelBadge, shadows.goldGlow]}
                    >
                        <Text style={styles.levelText}>{t('profile_level')} {level}</Text>
                    </LinearGradient>
                </Animated.View>
                { }
                <Animated.View entering={FadeInUp.delay(400).springify()}>
                    <GlassCard variant="elevated" style={styles.statsCard}>
                        <View style={styles.statsGrid}>
                            <View style={styles.statItem}>
                                <Text style={[styles.statValue, { color: colors.text }]}>{nfts.length}</Text>
                                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('home_nfts')}</Text>
                            </View>
                            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                            <View style={styles.statItem}>
                                <Text style={[styles.statValue, { color: colors.text }]}>{points}</Text>
                                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('home_points')}</Text>
                            </View>
                            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                            <View style={styles.statItem}>
                                <Text style={[styles.statValue, { color: colors.text }]}>{scannedItems.total}</Text>
                                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('profile_scans')}</Text>
                            </View>
                        </View>
                    </GlassCard>
                </Animated.View>
                { }
                <Animated.View entering={FadeInUp.delay(450).springify()}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('profile_appearance')}</Text>
                    <GlassCard variant="default" style={styles.settingsCard}>
                        { }
                        <View style={styles.themeRow}>
                            <View style={styles.themeInfo}>
                                <Ionicons name={isDark ? 'moon' : 'sunny'} size={rs(22)} color={colors.accent} />
                                <View style={{ marginLeft: SPACING.md }}>
                                    <Text style={[styles.settingLabel, { color: colors.text }]}>{t('profile_app_theme')}</Text>
                                    <Text style={[styles.settingHint, { color: colors.textMuted }]}>
                                        {themeMode === THEME_MODES.SYSTEM
                                            ? t('profile_follows_device')
                                            : themeMode === THEME_MODES.DARK
                                                ? t('profile_dark_mode')
                                                : t('profile_light_mode')}
                                    </Text>
                                </View>
                            </View>
                        </View>
                        <View style={styles.themeButtons}>
                            {[
                                { mode: THEME_MODES.SYSTEM, icon: 'phone-portrait-outline', label: t('profile_auto') },
                                { mode: THEME_MODES.LIGHT, icon: 'sunny-outline', label: t('profile_theme_light') },
                                { mode: THEME_MODES.DARK, icon: 'moon-outline', label: t('profile_theme_dark') },
                            ].map(({ mode, icon, label }) => (
                                <ScalePressable
                                    key={mode}
                                    style={[
                                        styles.themeButton,
                                        {
                                            backgroundColor: themeMode === mode
                                                ? (isDark ? BRAND.oceanMid : BRAND.oceanDark)
                                                : colors.glass,
                                            borderColor: themeMode === mode ? colors.accent : colors.border,
                                        }
                                    ]}
                                    onPress={() => handleThemeChange(mode)}
                                >
                                    <Ionicons
                                        name={icon}
                                        size={rs(18)}
                                        color={themeMode === mode ? '#fff' : colors.textSecondary}
                                    />
                                    <Text style={[
                                        styles.themeButtonText,
                                        { color: themeMode === mode ? '#fff' : colors.textSecondary }
                                    ]}>
                                        {label}
                                    </Text>
                                </ScalePressable>
                            ))}
                        </View>
                        { }
                        <View style={[styles.sectionDivider, { backgroundColor: colors.border }]} />
                        <View style={styles.themeRow}>
                            <View style={styles.themeInfo}>
                                <Ionicons name="language" size={rs(22)} color={colors.accent} />
                                <View style={{ marginLeft: SPACING.md }}>
                                    <Text style={[styles.settingLabel, { color: colors.text }]}>{t('profile_language')}</Text>
                                    <Text style={[styles.settingHint, { color: colors.textMuted }]}>
                                        {isAutoMode ? `${t('profile_auto')} (${t('profile_theme_system')})` : (LANGUAGE_LABELS[Object.keys(LANGUAGES).find(key => LANGUAGES[key] === language)]?.label || 'Manual')}
                                    </Text>
                                </View>
                            </View>
                        </View>
                        <View style={styles.langGrid}>
                            <ScalePressable
                                style={[
                                    styles.langButton,
                                    {
                                        backgroundColor: isAutoMode
                                            ? (isDark ? BRAND.oceanMid : BRAND.oceanDark)
                                            : colors.glass,
                                        borderColor: isAutoMode ? colors.accent : colors.border,
                                    }
                                ]}
                                onPress={() => handleLanguageChange('auto')}
                            >
                                <Text style={[
                                    styles.langButtonText,
                                    { color: isAutoMode ? '#fff' : colors.textSecondary }
                                ]}>
                                    🌐 {t('profile_auto')}
                                </Text>
                            </ScalePressable>
                            {[
                                { lang: LANGUAGES.ES, id: 'es' },
                                { lang: LANGUAGES.EN, id: 'en' },
                                { lang: LANGUAGES.RU, id: 'ru' },
                                { lang: LANGUAGES.ZH, id: 'zh' },
                                { lang: LANGUAGES.HI, id: 'hi' },
                                { lang: LANGUAGES.AR, id: 'ar' },
                                { lang: LANGUAGES.FR, id: 'fr' },
                                { lang: LANGUAGES.PT, id: 'pt' },
                            ].map(({ lang, id }) => (
                                <ScalePressable
                                    key={lang}
                                    style={[
                                        styles.langButton,
                                        {
                                            backgroundColor: !isAutoMode && language === lang
                                                ? (isDark ? BRAND.oceanMid : BRAND.oceanDark)
                                                : colors.glass,
                                            borderColor: !isAutoMode && language === lang ? colors.accent : colors.border,
                                        }
                                    ]}
                                    onPress={() => handleLanguageChange(lang)}
                                >
                                    <Text style={[
                                        styles.langButtonText,
                                        { color: !isAutoMode && language === lang ? '#fff' : colors.textSecondary, flexDirection: 'row', alignItems: 'center' }
                                    ]}>
                                        <FlagIcon code={LANGUAGE_LABELS[id]?.code} size={0.8} style={{ marginRight: 6 }} />
                                        {id.toUpperCase()}
                                    </Text>
                                </ScalePressable>
                            ))}
                        </View>
                    </GlassCard>
                </Animated.View>
                { }
                <Animated.View entering={FadeInUp.delay(500).springify()}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('profile_private_info')}</Text>
                    <GlassCard variant="default" style={styles.infoCard}>
                        <Ionicons name="calendar-outline" size={rs(20)} color={colors.accent} />
                        <View style={styles.infoContent}>
                            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t('profile_join_date')}</Text>
                            <Text style={[styles.infoValue, { color: colors.text }]}>{user.joinDate}</Text>
                        </View>
                    </GlassCard>
                    <GlassCard variant="default" style={[styles.infoCard, { marginTop: SPACING.sm }]}>
                        <Ionicons name="mail-outline" size={rs(20)} color={colors.accent} />
                        <View style={styles.infoContent}>
                            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t('auth_email_placeholder')}</Text>
                            <Text style={[styles.infoValue, { color: colors.text }]}>{user.email || '—'}</Text>
                        </View>
                    </GlassCard>
                    <GlassCard variant="default" style={[styles.infoCard, { marginTop: SPACING.sm }]}>
                        <Ionicons name="shield-checkmark-outline" size={rs(20)} color={colors.accent} />
                        <View style={styles.infoContent}>
                            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t('profile_security')}</Text>
                            <Text style={[styles.infoValue, { color: colors.text }]}>{t('profile_verified')}</Text>
                        </View>
                    </GlassCard>
                    <ScalePressable onPress={() => setShowExportModal(true)}>
                        <GlassCard variant="default" style={[styles.infoCard, { marginTop: SPACING.sm }]}>
                            <Ionicons name="download-outline" size={rs(20)} color={colors.accent} />
                            <View style={styles.infoContent}>
                                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t('account_export')}</Text>
                                <Text style={[styles.infoValue, { color: colors.text }]}>{t('export_title')}</Text>
                            </View>
                            <View style={[styles.exportButton, { backgroundColor: isDark ? BRAND.oceanMid : BRAND.oceanDark, paddingHorizontal: rs(12), height: rs(32) }]}>
                                <Ionicons name="arrow-forward" size={rs(16)} color="#fff" />
                            </View>
                        </GlassCard>
                    </ScalePressable>

                    {!address && (
                        <View style={{ marginTop: SPACING.md }}>
                            <Text style={[styles.infoValue, { color: colors.text, marginBottom: SPACING.sm, fontWeight: '700' }]}>
                                {t('profile_connect_wallet')}
                            </Text>
                            <GlassCard variant="default" style={{ padding: SPACING.md, gap: SPACING.sm }}>
                                <ScalePressable
                                    onPress={async () => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                        await connectPali();
                                    }}
                                    style={[styles.exportButton, { backgroundColor: '#1a365d', width: '100%', paddingVertical: SPACING.sm, gap: SPACING.sm, justifyContent: 'center' }]}
                                >
                                    <Image source={require('../assets/logo-pali.png')} style={{ width: rs(20), height: rs(20) }} resizeMode="contain" />
                                    <Text style={{ color: '#fff', fontWeight: '700' }}>{t('wallet_connect_pali') || 'Conectar Pali'}</Text>
                                </ScalePressable>

                                <ScalePressable
                                    onPress={async () => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                        await connectMetaMask();
                                    }}
                                    style={[styles.exportButton, { backgroundColor: '#1e293b', width: '100%', paddingVertical: SPACING.sm, gap: SPACING.sm, justifyContent: 'center' }]}
                                >
                                    <Image source={require('../assets/logo-metamask.png')} style={{ width: rs(20), height: rs(20) }} resizeMode="contain" />
                                    <Text style={{ color: '#fff', fontWeight: '700' }}>{t('wallet_connect_metamask') || 'Conectar MetaMask'}</Text>
                                </ScalePressable>
                            </GlassCard>
                        </View>
                    )}
                </Animated.View>
                { }
                <Animated.View entering={FadeInUp.delay(550).springify()} style={styles.privacyNotice}>
                    <Ionicons name="lock-closed" size={rs(14)} color={colors.textMuted} />
                    <Text style={[styles.privacyText, { color: colors.textMuted }]}>
                        {t('profile_privacy_notice')}
                    </Text>
                </Animated.View>
                <ScalePressable onPress={handleDeleteAccount} style={styles.deleteAccountButton}>
                    <Ionicons name="trash-outline" size={rs(18)} color="#fff" />
                    <Text style={styles.deleteAccountText}>
                        {language === 'es' ? 'Eliminar Cuenta' : 'Delete Account'}
                    </Text>
                </ScalePressable>
            </ScrollView>
            { }
            <Modal visible={showImagePicker} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>{t('profile_change_photo')}</Text>
                        <ScalePressable style={styles.modalOption} onPress={takePhoto}>
                            <Ionicons name="camera" size={rs(24)} color={colors.accent} />
                            <Text style={[styles.modalOptionText, { color: colors.text }]}>{t('profile_take_photo')}</Text>
                        </ScalePressable>
                        <ScalePressable style={styles.modalOption} onPress={pickImage}>
                            <Ionicons name="images" size={rs(24)} color={colors.accent} />
                            <Text style={[styles.modalOptionText, { color: colors.text }]}>{t('profile_choose_gallery')}</Text>
                        </ScalePressable>
                        <ScalePressable
                            style={[styles.modalCancel, { backgroundColor: colors.glass }]}
                            onPress={() => setShowImagePicker(false)}
                        >
                            <Text style={[styles.modalCancelText, { color: colors.text }]}>{t('profile_cancel')}</Text>
                        </ScalePressable>
                    </View>
                </View>
            </Modal>
            { }
            <Modal visible={showExportModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text, marginBottom: 0 }]}>{t('export_title')}</Text>
                            <ScalePressable onPress={closeExportModal}>
                                <Ionicons name="close" size={rs(24)} color={colors.text} />
                            </ScalePressable>
                        </View>
                        <Text style={[styles.modalDesc, { color: colors.textSecondary }]}>
                            {t('export_desc_intro')}
                            {'\n'}• {t('export_desc_points')} ({points})
                            {'\n'}• {nfts.length} {t('export_desc_nfts')}
                            {'\n'}• {t('export_desc_level')} ({level})
                            {'\n'}• {t('export_desc_recent')}
                            {'\n\n'}{t('export_desc_outro')}
                        </Text>
                        {exportStep === 'verify_session' ? (
                            <View style={styles.exportStep}>
                                <Text style={[styles.inputLabel, { color: colors.text }]}>{t('export_step_verify')}</Text>
                                <View style={styles.passwordContainer}>
                                    <TextInput
                                        style={[styles.exportInput, styles.passwordInput, { color: colors.text, borderColor: colors.border }]}
                                        secureTextEntry={!showPassword}
                                        placeholder={t('export_step_verify_placeholder')}
                                        placeholderTextColor={colors.textMuted}
                                        value={sessionPassword}
                                        onChangeText={setSessionPassword}
                                    />
                                    <ScalePressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                        <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color={colors.accent} />
                                    </ScalePressable>
                                </View>
                                <ScalePressable
                                    style={[styles.actionButton, { backgroundColor: isDark ? BRAND.oceanLight : BRAND.oceanDark }]}
                                    onPress={handleExportProfile}
                                >
                                    {isExporting ? (
                                        <Text style={styles.actionButtonText}>{t('export_step_verify_loading')}</Text>
                                    ) : (
                                        <Text style={styles.actionButtonText}>{t('export_step_verify_btn')}</Text>
                                    )}
                                </ScalePressable>
                            </View>
                        ) : (
                            <View style={styles.exportStep}>
                                <View style={styles.warningBox}>
                                    <Ionicons name="warning-outline" size={rs(20)} color={BRAND.sandGold} />
                                    <Text style={[styles.warningText, { color: BRAND.sandGold }]}>
                                        {t('export_step_create_warning')}
                                    </Text>
                                </View>
                                <Text style={[styles.inputLabel, { color: colors.text }]}>{t('export_step_create_label')}</Text>
                                <View style={styles.passwordContainer}>
                                    <TextInput
                                        style={[styles.exportInput, styles.passwordInput, { color: colors.text, borderColor: colors.border }]}
                                        secureTextEntry={!showPassword}
                                        placeholder={t('export_step_create_placeholder')}
                                        placeholderTextColor={colors.textMuted}
                                        value={filePassword}
                                        onChangeText={setFilePassword}
                                    />
                                    <ScalePressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                        <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color={colors.accent} />
                                    </ScalePressable>
                                </View>
                                <Text style={[styles.inputLabel, { color: colors.text }]}>{t('export_step_confirm_label')}</Text>
                                <View style={styles.passwordContainer}>
                                    <TextInput
                                        style={[styles.exportInput, styles.passwordInput, { color: colors.text, borderColor: colors.border }]}
                                        secureTextEntry={!showPassword}
                                        placeholder={t('export_step_confirm_placeholder')}
                                        placeholderTextColor={colors.textMuted}
                                        value={filePasswordConfirm}
                                        onChangeText={setFilePasswordConfirm}
                                    />
                                    <ScalePressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                        <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color={colors.textSecondary} />
                                    </ScalePressable>
                                </View>
                                <ScalePressable
                                    style={[styles.actionButton, { backgroundColor: isDark ? BRAND.oceanLight : BRAND.oceanDark }]}
                                    onPress={handleExportProfile}
                                >
                                    {isExporting ? (
                                        <Text style={styles.actionButtonText}>{t('export_step_generate_loading')}</Text>
                                    ) : (
                                        <Text style={styles.actionButtonText}>{t('export_step_generate_btn')}</Text>
                                    )}
                                </ScalePressable>
                            </View>
                        )}
                        {exportError ? (
                            <Text style={styles.errorText}>{exportError}</Text>
                        ) : null}
                    </View>
                </View>
            </Modal>
            { }
            <Modal visible={showDeleteModal} transparent animationType="fade" onRequestClose={() => setShowDeleteModal(false)}>
                <View style={styles.deleteOverlay}>
                    <View style={[styles.deleteCard, { backgroundColor: isDark ? '#2a0f12' : '#fff1f2', borderColor: isDark ? '#7f1d1d' : '#fecdd3' }]}>
                        <ScalePressable
                            onPress={() => setShowDeleteModal(false)}
                            style={[styles.deleteCloseButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(127,29,29,0.08)' }]}
                        >
                            <Ionicons name="close" size={rs(18)} color="#dc2626" />
                        </ScalePressable>
                        <View style={styles.deleteIconWrap}>
                            <LinearGradient
                                colors={['#ef4444', '#b91c1c']}
                                style={styles.deleteIconGradient}
                            >
                                <Ionicons name="warning" size={rs(28)} color="#fff" />
                            </LinearGradient>
                        </View>
                        <Text style={[styles.deleteTitle, { color: isDark ? '#fecaca' : '#991b1b' }]}>
                            {language === 'es' ? 'Eliminar Cuenta' : 'Delete Account'}
                        </Text>
                        <Text style={[styles.deleteMessage, { color: isDark ? '#fca5a5' : '#7f1d1d' }]}>
                            {language === 'es'
                                ? 'Esta acción es irreversible. Se borrarán para siempre tus datos, pero tus NFTs y tokens permanecerán en tu wallet de la red.'
                                : 'This action is irreversible. Your MongoDB data will be deleted, but your NFTs and tokens will remain in your wallet on-chain.'}
                        </Text>
                        <View style={styles.deleteActions}>
                            <ScalePressable
                                onPress={() => setShowDeleteModal(false)}
                                style={[styles.deleteActionButton, styles.deleteCancelButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#fee2e2' }]}
                            >
                                <Text style={[styles.deleteActionText, { color: isDark ? '#fca5a5' : '#7f1d1d' }]}>
                                    {language === 'es' ? 'Cancelar' : 'Cancel'}
                                </Text>
                            </ScalePressable>
                            <ScalePressable
                                onPress={confirmDeleteAccount}
                                style={[styles.deleteActionButton, styles.deleteConfirmButton]}
                            >
                                <Text style={styles.deleteActionText}>
                                    {language === 'es' ? 'Eliminar Cuenta' : 'Delete Account'}
                                </Text>
                            </ScalePressable>
                        </View>
                    </View>
                </View>
            </Modal>
            { }
            { }
            <Modal
                visible={showDeleteSuccessModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowDeleteSuccessModal(false)}
            >
                <View style={styles.deleteSuccessOverlay}>
                    <View style={[styles.deleteSuccessCard, { backgroundColor: isDark ? '#0f2618' : '#ecfdf5', borderColor: isDark ? '#166534' : '#bbf7d0' }]}>
                        <ScalePressable
                            onPress={() => setShowDeleteSuccessModal(false)}
                            style={[styles.deleteSuccessCloseButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(22,101,52,0.08)' }]}
                        >
                            <Ionicons name="close" size={rs(18)} color="#16a34a" />
                        </ScalePressable>
                        <View style={styles.deleteSuccessIconWrap}>
                            <LinearGradient colors={['#22c55e', '#15803d']} style={styles.deleteSuccessIconGradient}>
                                <Ionicons name="checkmark" size={rs(28)} color="#fff" />
                            </LinearGradient>
                        </View>
                        <Text style={[styles.deleteSuccessTitle, { color: isDark ? '#bbf7d0' : '#166534' }]}>
                            {language === 'es' ? 'Cuenta eliminada' : 'Account deleted'}
                        </Text>
                        <Text style={[styles.deleteSuccessMessage, { color: isDark ? '#86efac' : '#166534' }]}>
                            {deleteSuccessMessage}
                        </Text>
                        <ScalePressable onPress={() => setShowDeleteSuccessModal(false)} style={styles.deleteSuccessActionButton}>
                            <Text style={styles.deleteSuccessActionText}>
                                {language === 'es' ? 'Aceptar' : 'Accept'}
                            </Text>
                        </ScalePressable>
                    </View>
                </View>
            </Modal>
            { }
            <CelebrationModal
                visible={showCelebration}
                onClose={() => setShowCelebration(false)}
                message={celebrationMessage}
            />
            { }
            {showSuccessToast && (
                <Animated.View style={[styles.toastCard, { backgroundColor: colors.surface }, shadows.lg, toastStyle]}>
                    <LinearGradient colors={isDark ? [BRAND.oceanLight, BRAND.oceanMid] : [BRAND.success, '#388e3c']} style={styles.toastIconGradient}>
                        <Ionicons name="checkmark" size={rs(18)} color="#fff" />
                    </LinearGradient>
                    <View style={styles.toastTextBox}>
                        <Text style={[styles.toastTitle, { color: colors.text }]}>Tu Playa Limpia</Text>
                        <Text style={[styles.toastMessage, { color: colors.textSecondary }]}>{successMessage}</Text>
                    </View>
                </Animated.View>
            )}
        </View>
    );
}
const styles = StyleSheet.create({
    container: { flex: 1 },
    bgContainer: { ...StyleSheet.absoluteFillObject, opacity: 0.2 },
    scrollContent: {
        padding: SPACING.lg,
        paddingTop: Platform.OS === 'ios' ? rh(60) : rh(50),
        paddingBottom: rh(120),
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    backButton: {
        width: rs(44),
        height: rs(44),
        borderRadius: rs(22),
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: { fontSize: rf(20), fontWeight: '700' },
    avatarContainer: { alignSelf: 'center', marginBottom: SPACING.lg },
    avatarBorder: {
        width: rs(124),
        height: rs(124),
        borderRadius: rs(62),
        padding: rs(4),
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarImage: {
        width: rs(116),
        height: rs(116),
        borderRadius: rs(58),
    },
    avatarPlaceholder: {
        width: rs(116),
        height: rs(116),
        borderRadius: rs(58),
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitials: { fontSize: rf(36), fontWeight: '700' },
    editBadge: {
        position: 'absolute',
        bottom: rs(4),
        right: rs(4),
        width: rs(36),
        height: rs(36),
        borderRadius: rs(18),
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    nameContainer: { alignItems: 'center', marginBottom: SPACING.md },
    nameDisplay: { flexDirection: 'row', alignItems: 'center' },
    userName: { fontSize: rf(24), fontWeight: '700' },
    nameLockedHint: { fontSize: rf(11), marginTop: rs(4) },
    editNameContainer: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
    nameInput: {
        fontSize: rf(18),
        fontWeight: '600',
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        borderWidth: 1,
        borderRadius: RADIUS.md,
        minWidth: rs(150),
    },
    saveButton: {
        width: rs(40),
        height: rs(40),
        borderRadius: rs(20),
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButton: {
        width: rs(40),
        height: rs(40),
        borderRadius: rs(20),
        justifyContent: 'center',
        alignItems: 'center',
    },
    levelBadge: {
        alignSelf: 'center',
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.xl,
        borderRadius: RADIUS.xl,
        marginBottom: SPACING.lg,
    },
    levelText: {
        fontSize: rf(12),
        fontWeight: '800',
        color: BRAND.oceanDark,
        letterSpacing: 2,
    },
    statsCard: { marginBottom: SPACING.xl, padding: SPACING.lg },
    statsGrid: { flexDirection: 'row', justifyContent: 'space-around' },
    statItem: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: rf(24), fontWeight: '700' },
    statLabel: { fontSize: rf(12), marginTop: rs(4), textTransform: 'uppercase' },
    statDivider: { width: 1, height: '80%', alignSelf: 'center', backgroundColor: '#000', opacity: 0.1 },
    sectionDivider: { height: 1, marginVertical: SPACING.md, opacity: 0.1 },
    themeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.md },
    themeInfo: { flexDirection: 'row', alignItems: 'center' },
    settingLabel: { fontSize: rf(16), fontWeight: '600' },
    settingHint: { fontSize: rf(12), marginTop: rs(2) },
    themeButtons: { flexDirection: 'row', gap: SPACING.sm },
    themeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.sm,
        borderRadius: RADIUS.sm,
        borderWidth: 1,
        gap: rs(6),
    },
    themeButtonText: { fontSize: rf(12), fontWeight: '600' },
    langGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
        marginTop: SPACING.xs
    },
    langButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: rs(8),
        paddingHorizontal: rs(16),
        borderRadius: RADIUS.full,
        borderWidth: 1,
        minWidth: rs(60),
    },
    langButtonText: { fontSize: rf(14), fontWeight: '600' },
    statDivider: { width: 1, height: '80%', alignSelf: 'center' },
    sectionTitle: {
        fontSize: rf(16),
        fontWeight: '700',
        marginBottom: SPACING.md,
        marginTop: SPACING.sm,
    },
    settingsCard: { marginBottom: SPACING.lg, padding: SPACING.md },
    themeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
    themeInfo: { flexDirection: 'row', alignItems: 'center' },
    settingLabel: { fontSize: rf(14), fontWeight: '600' },
    settingHint: { fontSize: rf(11), marginTop: rs(2) },
    themeButtons: { flexDirection: 'row', gap: SPACING.sm },
    themeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.sm,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        gap: rs(6),
    },
    themeButtonText: { fontSize: rf(12), fontWeight: '600' },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        marginBottom: SPACING.sm,
    },
    infoContent: { flex: 1, marginLeft: SPACING.md },
    infoLabel: { fontSize: rf(11), textTransform: 'uppercase', letterSpacing: 0.5 },
    infoValue: { fontSize: rf(14), fontWeight: '600', marginTop: rs(2) },
    connectButton: {
        paddingVertical: SPACING.xs,
        paddingHorizontal: SPACING.md,
        borderRadius: RADIUS.sm,
    },
    connectText: { color: '#fff', fontSize: rf(10), fontWeight: '700' },
    privacyNotice: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: SPACING.md,
        gap: SPACING.sm,
    },
    privacyText: { flex: 1, fontSize: rf(11), lineHeight: rf(16) },
    deleteAccountButton: {
        marginTop: SPACING.lg,
        paddingVertical: SPACING.md,
        borderRadius: RADIUS.lg,
        backgroundColor: '#b91c1c',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
    },
    deleteAccountText: {
        color: '#fff',
        fontSize: rf(15),
        fontWeight: '800',
    },
    deleteOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.66)',
        padding: SPACING.lg,
    },
    deleteCard: {
        width: '100%',
        maxWidth: rs(420),
        borderRadius: RADIUS.xl,
        borderWidth: 1,
        padding: SPACING.xl,
        paddingTop: SPACING.xxl,
        alignItems: 'center',
        position: 'relative',
        shadowColor: '#b91c1c',
        shadowOpacity: 0.35,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 8 },
        elevation: 12,
    },
    deleteCloseButton: {
        position: 'absolute',
        top: SPACING.md,
        right: SPACING.md,
        width: rs(34),
        height: rs(34),
        borderRadius: rs(17),
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
    },
    deleteIconWrap: {
        marginBottom: SPACING.md,
    },
    deleteIconGradient: {
        width: rs(72),
        height: rs(72),
        borderRadius: rs(36),
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#ef4444',
        shadowOpacity: 0.45,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
        elevation: 10,
    },
    deleteTitle: {
        fontSize: rf(22),
        fontWeight: '900',
        textAlign: 'center',
        marginBottom: SPACING.sm,
    },
    deleteMessage: {
        fontSize: rf(14),
        textAlign: 'center',
        lineHeight: rf(22),
        marginBottom: SPACING.xl,
    },
    deleteActions: {
        flexDirection: 'row',
        gap: SPACING.md,
        width: '100%',
    },
    deleteActionButton: {
        flex: 1,
        minHeight: rs(48),
        borderRadius: RADIUS.lg,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: SPACING.md,
    },
    deleteCancelButton: {
        borderWidth: 1,
        borderColor: 'rgba(127,29,29,0.18)',
    },
    deleteConfirmButton: {
        backgroundColor: '#dc2626',
        shadowColor: '#dc2626',
        shadowOpacity: 0.3,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 5 },
        elevation: 6,
    },
    deleteActionText: {
        color: '#fff',
        fontSize: rf(14),
        fontWeight: '800',
    },
    deleteSuccessOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.55)',
        padding: SPACING.lg,
    },
    deleteSuccessCard: {
        width: '100%',
        maxWidth: rs(420),
        borderRadius: RADIUS.xl,
        borderWidth: 1,
        padding: SPACING.xl,
        paddingTop: SPACING.xxl,
        alignItems: 'center',
        position: 'relative',
        shadowColor: '#16a34a',
        shadowOpacity: 0.28,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 8 },
        elevation: 12,
    },
    deleteSuccessCloseButton: {
        position: 'absolute',
        top: SPACING.md,
        right: SPACING.md,
        width: rs(34),
        height: rs(34),
        borderRadius: rs(17),
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
    },
    deleteSuccessIconWrap: {
        marginBottom: SPACING.md,
    },
    deleteSuccessIconGradient: {
        width: rs(72),
        height: rs(72),
        borderRadius: rs(36),
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#22c55e',
        shadowOpacity: 0.4,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
        elevation: 10,
    },
    deleteSuccessTitle: {
        fontSize: rf(22),
        fontWeight: '900',
        textAlign: 'center',
        marginBottom: SPACING.sm,
    },
    deleteSuccessMessage: {
        fontSize: rf(14),
        textAlign: 'center',
        lineHeight: rf(22),
        marginBottom: SPACING.xl,
    },
    deleteSuccessActionButton: {
        minHeight: rs(48),
        borderRadius: RADIUS.lg,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: SPACING.xl,
        backgroundColor: '#16a34a',
        shadowColor: '#16a34a',
        shadowOpacity: 0.28,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 5 },
        elevation: 6,
        alignSelf: 'stretch',
    },
    deleteSuccessActionText: {
        color: '#fff',
        fontSize: rf(14),
        fontWeight: '800',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: RADIUS.xl,
        borderTopRightRadius: RADIUS.xl,
        padding: SPACING.xl,
        paddingBottom: rh(40),
    },
    modalTitle: { fontSize: rf(18), fontWeight: '700', textAlign: 'center', marginBottom: SPACING.lg },
    modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    modalOptionText: { fontSize: rf(16), marginLeft: SPACING.md },
    modalCancel: {
        marginTop: SPACING.lg,
        paddingVertical: SPACING.md,
        borderRadius: RADIUS.md,
        alignItems: 'center',
    },
    modalCancelText: { fontSize: rf(16), fontWeight: '600' },
    toastCard: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? rh(60) : rh(40),
        left: SPACING.lg,
        right: SPACING.lg,
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        borderRadius: RADIUS.lg,
    },
    toastIconGradient: {
        width: rs(36),
        height: rs(36),
        borderRadius: rs(18),
        justifyContent: 'center',
        alignItems: 'center',
    },
    toastTextBox: { marginLeft: SPACING.md },
    toastTitle: { fontSize: rf(12), fontWeight: '700' },
    toastMessage: { fontSize: rf(11), marginTop: rs(2) },
    langScroll: { gap: SPACING.sm, paddingVertical: SPACING.sm },
    langButton: {
        minWidth: rs(40),
        height: rs(36),
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        borderRadius: RADIUS.md,
        borderWidth: 1,
    },
    langButtonText: { fontSize: rf(12), fontWeight: '600' },
    exportButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.xs,
        paddingHorizontal: SPACING.md,
        borderRadius: RADIUS.sm,
    },
    exportButtonText: { color: '#fff', fontSize: rf(10), fontWeight: '700' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
    modalDesc: { fontSize: rf(13), marginBottom: SPACING.xl, lineHeight: rf(20) },
    exportStep: { gap: SPACING.md },
    passwordContainer: {
        position: 'relative',
        marginBottom: SPACING.sm,
        justifyContent: 'center',
    },
    passwordInput: {
        paddingRight: rs(48),
    },
    eyeIcon: {
        position: 'absolute',
        right: 0,
        height: '100%',
        justifyContent: 'center',
        paddingHorizontal: SPACING.md,
    },
    exportInput: {
        borderWidth: 1,
        borderRadius: RADIUS.md,
        padding: SPACING.md,
        fontSize: rf(15),
    },
    inputLabel: { fontSize: rf(13), fontWeight: '600', marginBottom: rs(-8) },
    actionButton: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.md,
        borderRadius: RADIUS.md,
        marginTop: SPACING.sm,
    },
    actionButtonText: { color: '#fff', fontSize: rf(15), fontWeight: '700' },
    warningBox: {
        flexDirection: 'row',
        gap: SPACING.sm,
        padding: SPACING.md,
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.3)',
        marginBottom: SPACING.md,
    },
    warningText: { flex: 1, fontSize: rf(12), lineHeight: rf(18) },
    errorText: { color: BRAND.info, fontSize: rf(12), marginTop: SPACING.sm, textAlign: 'center', fontWeight: '600' },
});
