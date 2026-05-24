import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, TextInput, useWindowDimensions, Linking, Modal, FlatList, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withSequence,
    withTiming,
    withDelay,
    FadeInDown,
    FadeInUp,
    FadeIn,
    SlideInRight,
    SlideInLeft,
    Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import { useLanguage } from '../context/LanguageContext';
import { rs, rf, rh, SPACING, RADIUS } from '../constants/responsive';
import { SPRING, DURATION } from '../constants/animations';
import { BRAND } from '../constants/theme';
import FishBowlLoader from './FishBowlLoader';
import DrawingPad from './DrawingPad';
import LivingWater from './LivingWater';
import FloatingBubbles from './premium/FloatingBubbles';
import GlassCard from './premium/GlassCard';
import FlagIcon from './FlagIcon';
export default function AuthScreen({ onAuthenticated }) {
    const { colors, isDark } = useTheme();
    const { register: onRegister, login: onLogin, isFirstTime, importAccount: onImport, username: savedUsername } = useAuth();
    const { user, updateUserProfile, reloadGameState } = useGame();
    const { t, language, setLanguage, LANGUAGES, LANGUAGE_LABELS } = useLanguage();
    const { height: winH } = useWindowDimensions();
    const [mode, setMode] = useState(isFirstTime ? 'choice' : 'login');
    const [showLangDropdown, setShowLangDropdown] = useState(false);
    const [drawingStrokes, setDrawingStrokes] = useState(null);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [statusText, setStatusText] = useState('');
    const [errorText, setErrorText] = useState('');
    const [regUsername, setRegUsername] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [regPasswordConfirm, setRegPasswordConfirm] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [importFileName, setImportFileName] = useState('');
    const [importFileContent, setImportFileContent] = useState('');
    const [importFilePassword, setImportFilePassword] = useState('');
    const [importNewPassword, setImportNewPassword] = useState('');
    const [importNewPasswordConfirm, setImportNewPasswordConfirm] = useState('');
    const [firstDrawing, setFirstDrawing] = useState(null);
    const shake = useSharedValue(0);
    const contentOpacity = useSharedValue(0);
    const contentY = useSharedValue(rs(30));
    // Entrance animation
    useEffect(() => {
        contentOpacity.value = withTiming(1, { duration: 600 });
        contentY.value = withSpring(0, SPRING.smooth);
    }, []);
    // Update status text when mode changes
    useEffect(() => {
        setErrorText('');
        switch (mode) {
            case 'choice':
                setStatusText(t('auth_your_impact'));
                break;
            case 'register_name':
                setStatusText(t('auth_enter_username'));
                break;
            case 'register_password':
                setStatusText(t('auth_create_password'));
                break;
            case 'create_drawing':
                setStatusText(t('auth_create_drawing'));
                break;
            case 'confirm_drawing':
                setStatusText(t('auth_confirm_drawing'));
                break;
            case 'login':
                setStatusText(t('auth_enter_drawing'));
                break;
            case 'import_file':
                setStatusText(t('auth_import_desc'));
                break;
            case 'import_drawing':
                setStatusText(t('auth_create_drawing'));
                break;
            case 'import_confirm_drawing':
                setStatusText(t('auth_confirm_drawing'));
                break;
        }
    }, [mode, t]);
    useEffect(() => {
        if (mode === 'login') {
            const checkBiometrics = async () => {
                try {
                    const hasHardware = await LocalAuthentication.hasHardwareAsync();
                    if (!hasHardware) return;
                    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
                    if (isEnrolled) authenticateBiometric();
                } catch (error) {
                    console.warn("Biometric check failed:", error);
                }
            };
            checkBiometrics();
        }
    }, [mode]);
    const authenticateBiometric = async () => {
        try {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: t('auth_biometric_prompt'),
                fallbackLabel: t('auth_biometric_fallback'),
            });
            if (result.success) {
                if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                onAuthenticated();
            }
        } catch (err) {
            console.warn("Biometric auth failed:", err);
        }
    };
    const triggerShake = () => {
        shake.value = withSequence(
            withSpring(rs(12), { velocity: 100, stiffness: 500 }),
            withSpring(-rs(12), { velocity: 100, stiffness: 500 }),
            withSpring(rs(8), { velocity: 80, stiffness: 500 }),
            withSpring(-rs(8), { velocity: 80, stiffness: 500 }),
            withSpring(0, { velocity: 50, stiffness: 500 })
        );
    };
    const hapticLight = () => {
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };
    const hapticSuccess = () => {
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };
    const hapticError = () => {
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    };
    const handleDrawingSubmit = async (strokes) => {
        setDrawingStrokes(strokes);
        if (mode === 'create_drawing') {
            setFirstDrawing(strokes);
            setMode('confirm_drawing');
        } else if (mode === 'confirm_drawing') {
            const { hashDrawing, compareFingerprints } = require('../utils/crypto');
            const fp1 = await hashDrawing(firstDrawing);
            const fp2 = await hashDrawing(strokes);
            if (compareFingerprints(fp1, fp2)) {
                hapticSuccess();
                setStatusText(t('auth_creating_account'));
                const result = await onRegister(regUsername, regEmail, regPassword, strokes);
                if (result.success) {
                    updateUserProfile({
                        name: regUsername,
                        email: regEmail,
                        initials: regUsername.substring(0, 2).toUpperCase(),
                        hasChangedUsername: false,
                    });
                    onAuthenticated();
                } else {
                    hapticError();
                    setErrorText(result.error || 'Registration failed');
                    setTimeout(() => {
                        setDrawingStrokes(null);
                        setFirstDrawing(null);
                        setMode('create_drawing');
                    }, 1200);
                }
            } else {
                hapticError();
                triggerShake();
                setErrorText(t('auth_pin_mismatch'));
                setTimeout(() => {
                    setDrawingStrokes(null);
                    setFirstDrawing(null);
                    setMode('create_drawing');
                }, 1200);
            }
        } else if (mode === 'import_drawing') {
            setFirstDrawing(strokes);
            setMode('import_confirm_drawing');
        } else if (mode === 'import_confirm_drawing') {
            const { hashDrawing, compareFingerprints } = require('../utils/crypto');
            const fp1 = await hashDrawing(firstDrawing);
            const fp2 = await hashDrawing(strokes);
            if (compareFingerprints(fp1, fp2)) {
                hapticSuccess();
                setStatusText(t('auth_creating_account'));
                const result = await onImport(importFileContent, importFilePassword, importNewPassword, strokes);
                if (result.success) {
                    await reloadGameState();
                    onAuthenticated();
                } else {
                    hapticError();
                    setErrorText(t('account_import_error'));
                    setTimeout(() => {
                        setDrawingStrokes(null);
                        setFirstDrawing(null);
                        setMode('import_file');
                    }, 1200);
                }
            } else {
                hapticError();
                triggerShake();
                setErrorText(t('auth_pin_mismatch'));
                setTimeout(() => {
                    setDrawingStrokes(null);
                    setFirstDrawing(null);
                    setMode('import_drawing');
                }, 1200);
            }
        } else if (mode === 'login') {
            const result = await onLogin(strokes);
            if (result.success) {
                hapticSuccess();
                await reloadGameState();
                onAuthenticated();
            } else {
                hapticError();
                triggerShake();
                setErrorText(t('auth_drawing_mismatch'));
            }
        }
    };
    const handleRegisterNameNext = () => {
        const trimmed = regUsername.trim();
        // Bloquear símbolos potencialmente maliciosos para prevenir XSS
        const isSafe = /^[\p{L}\p{N} \-_.]+$/u.test(trimmed);

        if (trimmed.length < 3) {
            setErrorText(t('profile_name_invalid'));
            triggerShake();
            return;
        }
        if (!isSafe) {
            setErrorText(t('profile_name_unsafe') || 'Nombre contiene caracteres no permitidos.');
            triggerShake();
            return;
        }
        hapticLight();
        setErrorText('');
        setMode('register_password');
    };
    const handleRegisterPasswordNext = () => {
        const trimmedEmail = regEmail.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!trimmedEmail) {
            setErrorText(t('auth_email_required') || 'El correo electrónico es requerido');
            triggerShake();
            return;
        }
        if (!emailRegex.test(trimmedEmail)) {
            setErrorText(t('auth_email_invalid') || 'Ingresa un correo electrónico válido');
            triggerShake();
            return;
        }
        if (regPassword.length < 6) {
            setErrorText(t('auth_password_short'));
            triggerShake();
            return;
        }
        if (regPassword !== regPasswordConfirm) {
            setErrorText(t('auth_password_mismatch'));
            triggerShake();
            return;
        }
        hapticLight();
        setErrorText('');
        setMode('create_drawing');
    };
    const handlePickFile = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/json',
                copyToCacheDirectory: true,
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
                const file = result.assets[0];
                setImportFileName(file.name);
                if (Platform.OS === 'web') {
                    fetch(file.uri)
                        .then(res => res.text())
                        .then(text => setImportFileContent(text))
                        .catch(err => setErrorText('Error reading file: ' + err.message));
                } else {
                    const content = await FileSystem.readAsStringAsync(file.uri);
                    setImportFileContent(content);
                }
            }
        } catch (e) {
            setErrorText('Error: ' + e.message);
        }
    };
    const handleImportNext = () => {
        if (!importFileContent) {
            setErrorText(t('auth_select_file'));
            return;
        }
        if (importFilePassword.length < 1) {
            setErrorText(t('auth_enter_file_password'));
            return;
        }
        if (importNewPassword.length < 6) {
            setErrorText(t('auth_password_short'));
            triggerShake();
            return;
        }
        if (importNewPassword !== importNewPasswordConfirm) {
            setErrorText(t('auth_password_mismatch'));
            triggerShake();
            return;
        }
        hapticLight();
        setErrorText('');
        setMode('import_drawing');
    };
    const contentStyle = useAnimatedStyle(() => ({
        opacity: contentOpacity.value,
        transform: [{ translateY: contentY.value }],
    }));
    const getTitle = () => {
        switch (mode) {
            case 'choice': return t('auth_welcome');
            case 'register_name': return t('auth_create_account');
            case 'register_password': return t('auth_create_account');
            case 'create_drawing':
            case 'confirm_drawing': return t('auth_first_time_title');
            case 'login': return `${t('auth_welcome_back')}, ${savedUsername || ''}`;
            case 'import_file': return t('auth_import_account');
            case 'import_drawing':
            case 'import_confirm_drawing': return t('auth_first_time_title');
            default: return t('auth_welcome');
        }
    };
    const getSubtitle = () => {
        switch (mode) {
            case 'choice': return t('auth_your_impact');
            case 'register_name': return t('auth_enter_username');
            case 'register_password': return t('auth_create_password');
            case 'create_drawing': return t('auth_first_time_subtitle');
            case 'confirm_drawing': return t('auth_confirm_drawing');
            case 'login': return t('auth_login_title');
            case 'import_file': return t('auth_import_desc');
            case 'import_drawing': return t('auth_first_time_subtitle');
            case 'import_confirm_drawing': return t('auth_confirm_drawing');
            default: return '';
        }
    };
    // ═══════════════════════════════════════════
    // DRAWING MODES — show drawing canvas
    // ═══════════════════════════════════════════
    const isDrawingMode = ['create_drawing', 'confirm_drawing', 'login', 'import_drawing', 'import_confirm_drawing'].includes(mode);
    const renderHeader = () => (
        <View style={styles.header}>
            <Text style={[styles.title, { color: isDark ? colors.accent : colors.primary }]}>
                {getTitle()}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {getSubtitle()}
            </Text>
        </View>
    );
    const renderFormContent = () => {
        const content = (() => {
            if (mode === 'choice') {
                return (
                    <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.choiceContainer}>
                        <View style={styles.introTextContainer}>
                            <Text style={[styles.introText, { color: colors.textSecondary }]}>
                                {t('auth_intro_text')}
                            </Text>
                        </View>
                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() => { hapticLight(); setMode('register_name'); }}
                        >
                            <GlassCard variant="elevated" style={styles.choiceCard}>
                                <LinearGradient
                                    colors={isDark
                                        ? ['rgba(10,31,46,0.8)', 'rgba(5,20,30,0.9)']
                                        : ['rgba(255,255,255,0.9)', 'rgba(230,245,255,0.9)']
                                    }
                                    style={StyleSheet.absoluteFill}
                                />
                                <View style={styles.choiceContent}>
                                    <LinearGradient
                                        colors={[BRAND.oceanMid, BRAND.oceanDark]}
                                        style={styles.choiceIconBg}
                                    >
                                        <Ionicons name="person-add-outline" size={rs(32)} color="#fff" />
                                    </LinearGradient>
                                    <Text style={[styles.choiceTitle, { color: isDark ? '#fff' : BRAND.oceanDeep }]}>
                                        {t('auth_create_account')}
                                    </Text>
                                    <Text style={[styles.choiceDesc, { color: isDark ? '#9ca3af' : colors.textSecondary }]}>
                                        {t('auth_create_account_desc')}
                                    </Text>
                                </View>
                            </GlassCard>
                        </TouchableOpacity>
                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() => { hapticLight(); setMode('import_file'); }}
                        >
                            <GlassCard variant="elevated" style={styles.choiceCard}>
                                <LinearGradient
                                    colors={isDark
                                        ? ['rgba(10,31,46,0.6)', 'rgba(5,20,30,0.8)']
                                        : ['rgba(255,255,255,0.6)', 'rgba(230,245,255,0.8)']
                                    }
                                    style={StyleSheet.absoluteFill}
                                />
                                <View style={styles.choiceContent}>
                                    <View style={[styles.choiceIconBgAlt, {
                                        backgroundColor: isDark ? 'rgba(100,210,255,0.1)' : 'rgba(0,51,78,0.08)',
                                    }]}>
                                        <Ionicons name="cloud-download-outline" size={rs(32)}
                                            color={isDark ? BRAND.oceanLight : BRAND.oceanDark} />
                                    </View>
                                    <Text style={[styles.choiceTitle, { color: isDark ? '#fff' : BRAND.oceanDeep }]}>
                                        {t('auth_import_account')}
                                    </Text>
                                    <Text style={[styles.choiceDesc, { color: isDark ? '#9ca3af' : colors.textSecondary }]}>
                                        {t('auth_import_account_desc')}
                                    </Text>
                                </View>
                            </GlassCard>
                        </TouchableOpacity>
                    </Animated.View>
                );
            }
            if (mode === 'register_name') {
                return (
                    <Animated.View entering={SlideInRight.springify()} style={styles.formContainer}>
                        <GlassCard variant="default" style={styles.formCard}>
                            <View style={styles.formIconRow}>
                                <Ionicons name="person-outline" size={rs(24)} color={colors.accent} />
                            </View>
                            <TextInput
                                style={[
                                    styles.input,
                                    { color: colors.text, borderColor: colors.border, backgroundColor: colors.glass },
                                    errorText ? styles.inputError : null
                                ]}
                                placeholder={t('auth_username_placeholder')}
                                placeholderTextColor={colors.textMuted}
                                value={regUsername}
                                onChangeText={(val) => {
                                    setRegUsername(val);
                                    if (errorText) setErrorText('');
                                }}
                                autoCapitalize="words"
                                autoFocus
                                maxLength={30}
                            />
                            {errorText ? (
                                <Animated.View entering={FadeInDown.duration(400)} style={[styles.errorBanner, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)' }]}>
                                    <Ionicons name="alert-circle" size={rs(18)} color="#ef4444" style={{ marginRight: rs(8) }} />
                                    <Text style={styles.errorBannerText}>{errorText}</Text>
                                </Animated.View>
                            ) : null}
                            <TouchableOpacity
                                style={[styles.nextButton, { backgroundColor: isDark ? BRAND.oceanLight : BRAND.oceanDark }]}
                                onPress={handleRegisterNameNext}
                                activeOpacity={0.85}
                            >
                                <Text style={styles.nextButtonText}>{t('auth_next')}</Text>
                                <Ionicons name="arrow-forward" size={rs(18)} color="#fff" />
                            </TouchableOpacity>
                        </GlassCard>
                        <TouchableOpacity style={styles.backButton} onPress={() => { setMode('choice'); setErrorText(''); }}>
                            <Ionicons name="arrow-back" size={rs(18)} color={colors.textSecondary} />
                            <Text style={[styles.backButtonText, { color: colors.textSecondary }]}>{t('auth_back')}</Text>
                        </TouchableOpacity>
                    </Animated.View>
                );
            }
            if (mode === 'register_password') {
                return (
                    <Animated.View entering={SlideInRight.springify()} style={styles.formContainer}>
                        <GlassCard variant="default" style={styles.formCard}>
                            <View style={styles.formIconRow}>
                                <Ionicons name="lock-closed-outline" size={rs(24)} color={colors.accent} />
                            </View>
                            <TextInput
                                style={[
                                    styles.input,
                                    { color: colors.text, borderColor: colors.border, backgroundColor: colors.glass },
                                    errorText === t('auth_email_invalid') || errorText === t('auth_email_required') ? styles.inputError : null
                                ]}
                                placeholder={t('auth_email_placeholder')}
                                placeholderTextColor={colors.textMuted}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={regEmail}
                                onChangeText={(val) => {
                                    setRegEmail(val);
                                    if (errorText) setErrorText('');
                                }}
                                autoFocus
                            />
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={[
                                        styles.input,
                                        styles.passwordInput,
                                        { color: colors.text, borderColor: colors.border, backgroundColor: colors.glass },
                                        (errorText && (errorText.includes('password') || errorText === t('auth_password_short') || errorText === t('auth_password_mismatch'))) || (regPassword.length > 0 && regPassword.length < 6) ? styles.inputError : null
                                    ]}
                                    placeholder={t('auth_password_placeholder')}
                                    placeholderTextColor={colors.textMuted}
                                    secureTextEntry={!showPassword}
                                    value={regPassword}
                                    onChangeText={(val) => {
                                        setRegPassword(val);
                                        if (errorText) setErrorText('');
                                    }}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                    <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color={colors.accent} />
                                </TouchableOpacity>
                            </View>
                            <TextInput
                                style={[
                                    styles.input,
                                    { color: colors.text, borderColor: colors.border, backgroundColor: colors.glass },
                                    errorText === t('auth_password_mismatch') ? styles.inputError : null
                                ]}
                                placeholder={t('auth_password_confirm_placeholder')}
                                placeholderTextColor={colors.textMuted}
                                secureTextEntry={!showPassword}
                                value={regPasswordConfirm}
                                onChangeText={(val) => {
                                    setRegPasswordConfirm(val);
                                    if (errorText) setErrorText('');
                                }}
                            />
                            <Text style={[styles.hintText, { color: isDark ? colors.accent : BRAND.oceanDark }]}>
                                {t('auth_password_hint')}
                            </Text>
                            {errorText ? (
                                <Animated.View entering={FadeInDown.duration(400)} style={[styles.errorBanner, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)' }]}>
                                    <Ionicons name="alert-circle" size={rs(18)} color="#ef4444" style={{ marginRight: rs(8) }} />
                                    <Text style={styles.errorBannerText}>{errorText}</Text>
                                </Animated.View>
                            ) : null}
                            <TouchableOpacity
                                style={[styles.nextButton, { backgroundColor: isDark ? BRAND.oceanLight : BRAND.oceanDark }]}
                                onPress={handleRegisterPasswordNext}
                                activeOpacity={0.85}
                            >
                                <Text style={styles.nextButtonText}>{t('auth_next')}</Text>
                                <Ionicons name="arrow-forward" size={rs(18)} color="#fff" />
                            </TouchableOpacity>
                        </GlassCard>
                        <TouchableOpacity style={styles.backButton} onPress={() => { setMode('register_name'); setErrorText(''); }}>
                            <Ionicons name="arrow-back" size={rs(18)} color={colors.textSecondary} />
                            <Text style={[styles.backButtonText, { color: colors.textSecondary }]}>{t('auth_back')}</Text>
                        </TouchableOpacity>
                    </Animated.View>
                );
            }
            if (mode === 'import_file') {
                return (
                    <Animated.View entering={SlideInRight.springify()} style={styles.formContainer}>
                        <GlassCard variant="default" style={styles.formCard}>
                            <View style={styles.formIconRow}>
                                <Ionicons name="cloud-download-outline" size={rs(24)} color={colors.accent} />
                            </View>
                            { }
                            <TouchableOpacity
                                style={[styles.filePicker, { borderColor: colors.border, backgroundColor: colors.glass }]}
                                onPress={handlePickFile}
                                activeOpacity={0.85}
                            >
                                <Ionicons name="document-outline" size={rs(20)} color={colors.accent} />
                                <Text style={[styles.filePickerText, { color: importFileName ? colors.text : colors.textMuted }]} numberOfLines={1}>
                                    {importFileName || t('account_import_button')}
                                </Text>
                            </TouchableOpacity>
                            { }
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={[
                                        styles.input,
                                        styles.passwordInput,
                                        { color: colors.text, borderColor: colors.border, backgroundColor: colors.glass },
                                        errorText === t('auth_enter_file_password') || errorText === t('account_import_error') ? styles.inputError : null
                                    ]}
                                    placeholder={t('auth_file_password_placeholder')}
                                    placeholderTextColor={colors.textMuted}
                                    secureTextEntry={!showPassword}
                                    value={importFilePassword}
                                    onChangeText={(val) => {
                                        setImportFilePassword(val);
                                        if (errorText) setErrorText('');
                                    }}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                    <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color={colors.accent} />
                                </TouchableOpacity>
                            </View>
                            { }
                            <View style={styles.sectionDivider}>
                                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                                <Text style={[styles.dividerText, { color: colors.textMuted }]}>{t('auth_new_credentials')}</Text>
                                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                            </View>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={[
                                        styles.input,
                                        styles.passwordInput,
                                        { color: colors.text, borderColor: colors.border, backgroundColor: colors.glass },
                                        (errorText && (errorText.includes('password') || errorText === t('auth_password_short') || errorText === t('auth_password_mismatch'))) || (importNewPassword.length > 0 && importNewPassword.length < 6) ? styles.inputError : null
                                    ]}
                                    placeholder={t('auth_new_password_placeholder')}
                                    placeholderTextColor={colors.textMuted}
                                    secureTextEntry={!showPassword}
                                    value={importNewPassword}
                                    onChangeText={(val) => {
                                        setImportNewPassword(val);
                                        if (errorText) setErrorText('');
                                    }}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                    <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color={colors.accent} />
                                </TouchableOpacity>
                            </View>
                            <TextInput
                                style={[
                                    styles.input,
                                    { color: colors.text, borderColor: colors.border, backgroundColor: colors.glass },
                                    errorText === t('auth_password_mismatch') ? styles.inputError : null
                                ]}
                                placeholder={t('auth_password_confirm_placeholder')}
                                placeholderTextColor={colors.textMuted}
                                secureTextEntry={!showPassword}
                                value={importNewPasswordConfirm}
                                onChangeText={(val) => {
                                    setImportNewPasswordConfirm(val);
                                    if (errorText) setErrorText('');
                                }}
                            />
                            <Text style={[styles.hintText, { color: isDark ? colors.accent : BRAND.oceanDark }]}>
                                {t('auth_password_hint')}
                            </Text>
                            {errorText ? (
                                <Animated.View entering={FadeInDown.duration(400)} style={[styles.errorBanner, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)' }]}>
                                    <Ionicons name="alert-circle" size={rs(18)} color="#ef4444" style={{ marginRight: rs(8) }} />
                                    <Text style={styles.errorBannerText}>{errorText}</Text>
                                </Animated.View>
                            ) : null}
                            <TouchableOpacity
                                style={[styles.nextButton, { backgroundColor: isDark ? BRAND.oceanLight : BRAND.oceanDark }]}
                                onPress={handleImportNext}
                                activeOpacity={0.85}
                            >
                                <Text style={styles.nextButtonText}>{t('auth_next')}</Text>
                                <Ionicons name="arrow-forward" size={rs(18)} color="#fff" />
                            </TouchableOpacity>
                        </GlassCard>
                        <TouchableOpacity style={styles.backButton} onPress={() => { setMode('choice'); setErrorText(''); }}>
                            <Ionicons name="arrow-back" size={rs(18)} color={colors.textSecondary} />
                            <Text style={[styles.backButtonText, { color: colors.textSecondary }]}>{t('auth_back')}</Text>
                        </TouchableOpacity>
                    </Animated.View>
                );
            }
            return null;
        })();
        return (
            <Animated.View entering={FadeIn.duration(500)} style={{ flex: 1, width: '100%', alignItems: 'center' }}>
                {renderHeader()}
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', width: '100%', paddingBottom: winH > 800 ? 100 : 40 }}>
                    {content}
                </View>
            </Animated.View>
        );
    };
    const renderLangSelector = () => (
        <View style={styles.langSelectorContainer}>
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => { hapticLight(); setShowLangDropdown(true); }}
                style={[styles.langButton, { backgroundColor: isDark ? 'rgba(0,18,32,0.6)' : 'rgba(255,255,255,0.6)', borderColor: colors.border }]}
            >
                <Text style={{ color: colors.textSecondary, fontSize: rf(12), marginRight: rs(4) }}>{t('profile_language') || 'Selecciona idioma:'}</Text>
                <FlagIcon code={LANGUAGE_LABELS[language]?.code} size={0.7} style={{ marginRight: rs(4) }} />
                <Text style={{ color: colors.text, fontWeight: '700', fontSize: rf(12) }}>
                    {language.toUpperCase()}
                </Text>
                <Ionicons name="chevron-down" size={14} color={colors.textSecondary} style={{ marginLeft: rs(4) }} />
            </TouchableOpacity>

            <Modal visible={showLangDropdown} transparent animationType="fade">
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowLangDropdown(false)}>
                    <View style={[styles.langDropdownMenu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Text style={[styles.langMenuTitle, { color: colors.textSecondary }]}>{t('profile_language') || 'Selecciona idioma:'}</Text>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {LANGUAGES && Object.values(LANGUAGES).map((lang) => (
                                <TouchableOpacity
                                    key={lang}
                                    style={[
                                        styles.langMenuItem,
                                        language === lang && { backgroundColor: isDark ? BRAND.oceanMid : BRAND.oceanLight + '30' }
                                    ]}
                                    onPress={() => {
                                        hapticLight();
                                        setLanguage(lang);
                                        setShowLangDropdown(false);
                                    }}
                                >
                                    <FlagIcon code={LANGUAGE_LABELS[lang]?.code} size={0.8} style={{ marginRight: rs(10) }} />
                                    <Text style={[
                                        styles.langMenuItemText,
                                        { color: language === lang ? colors.accent : colors.text },
                                        language === lang && { fontWeight: '700' }
                                    ]}>
                                        {LANGUAGE_LABELS[lang]?.name || lang.toUpperCase()}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );

    return (
        <View style={[styles.mainContainer, { backgroundColor: colors.background }]}>
            <LinearGradient
                colors={isDark
                    ? [BRAND.oceanDeep, BRAND.oceanDark, BRAND.oceanMid]
                    : [BRAND.biolumSoft, colors.background, colors.backgroundSecondary]
                }
                style={StyleSheet.absoluteFill}
            />
            <FloatingBubbles count={8} minSize={6} maxSize={16} pointerEvents="none" />
            <View style={styles.bgContainer} pointerEvents="none">
                <LivingWater />
            </View>
            <SafeAreaView style={styles.safeContainer}>
                {renderLangSelector()}
                {isDrawingMode ? (
                    <Animated.View style={[styles.contentWrapper, contentStyle]}>
                        {renderHeader()}
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                            {(mode === 'create_drawing' || mode === 'confirm_drawing') && (
                                <View style={{ alignItems: 'center', paddingVertical: winH < 700 ? rs(4) : rs(10) }}>
                                    <FishBowlLoader size={winH < 700 ? 120 : 180} />
                                </View>
                            )}
                            { }
                            <View style={styles.drawingArea}>
                                <DrawingPad
                                    key={mode}
                                    onSubmit={handleDrawingSubmit}
                                    confirmLabel={t('auth_draw_confirm_btn')}
                                    clearLabel={t('auth_draw_clear')}
                                    hintText={t('auth_draw_hint')}
                                    strokeCountLabel={t('auth_draw_strokes')}
                                />
                                <Text style={[styles.pinHint, { color: colors.textMuted, marginTop: rs(8) }]}>{statusText}</Text>
                                {errorText ? (
                                    <Animated.View entering={FadeInDown.duration(400)} style={[styles.errorBanner, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)' }]}>
                                        <Ionicons name="alert-circle" size={rs(18)} color="#ef4444" style={{ marginRight: rs(8) }} />
                                        <Text style={styles.errorBannerText}>{errorText}</Text>
                                    </Animated.View>
                                ) : null}
                            </View>
                            { }
                            {(mode === 'create_drawing' || mode === 'import_drawing') && (
                                <TouchableOpacity
                                    style={styles.backButton}
                                    onPress={() => {
                                        setDrawingStrokes(null);
                                        setFirstDrawing(null);
                                        setErrorText('');
                                        if (mode === 'create_drawing') setMode('register_password');
                                        else setMode('import_file');
                                    }}
                                >
                                    <Ionicons name="arrow-back" size={rs(18)} color={colors.textSecondary} />
                                    <Text style={[styles.backButtonText, { color: colors.textSecondary }]}>{t('auth_back')}</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </Animated.View>
                ) : (
                    renderFormContent()
                )}
            </SafeAreaView>
        </View>
    );
}
const styles = StyleSheet.create({
    mainContainer: { flex: 1 },
    bgContainer: { ...StyleSheet.absoluteFillObject, opacity: 0.3 },
    safeContainer: { flex: 1 },
    contentWrapper: { flex: 1 },
    header: {
        alignItems: 'center',
        paddingVertical: rh(30),
        justifyContent: 'center',
    },
    title: {
        fontSize: rf(26),
        fontWeight: '800',
        letterSpacing: rs(0.5),
        marginBottom: rs(8),
        textAlign: 'center',
    },
    subtitle: {
        fontSize: rf(12),
        textTransform: 'uppercase',
        letterSpacing: rs(2),
        fontWeight: '600',
        textAlign: 'center',
    },
    centerStage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    drawingArea: { flex: 3, justifyContent: 'center', alignItems: 'center', paddingBottom: rh(10) },
    pinHint: { fontSize: rf(12), marginTop: rs(8), letterSpacing: rs(0.5), textAlign: 'center' },
    pinError: { fontSize: rf(11), marginTop: rs(6), color: '#ef4444', textAlign: 'center', fontWeight: '600' },
    introTextContainer: {
        width: '100%',
        maxWidth: rs(600),
        alignSelf: 'center',
        paddingHorizontal: SPACING.md,
        paddingBottom: SPACING.xl,
        alignItems: 'center',
        justifyContent: 'center',
    },
    introText: {
        fontSize: rf(14),
        textAlign: 'center',
        lineHeight: rf(22),
        fontWeight: '500',
    },
    choiceContainer: { width: '100%', maxWidth: 500, alignSelf: 'center', gap: SPACING.lg, paddingHorizontal: SPACING.md },
    choiceCard: {
        borderRadius: rs(24),
        overflow: 'hidden',
        minHeight: rh(160),
        justifyContent: 'center',
    },
    choiceContent: {
        padding: SPACING.xl,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    choiceIconBg: {
        width: rs(60), height: rs(60), borderRadius: rs(30),
        justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.md,
        shadowColor: BRAND.oceanLight,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 8,
    },
    choiceIconBgAlt: {
        width: rs(60), height: rs(60), borderRadius: rs(30),
        justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.md,
    },
    choiceTitle: {
        fontSize: rf(18),
        fontWeight: '700',
        marginBottom: SPACING.xs,
        textAlign: 'center',
        letterSpacing: rs(0.5),
    },
    choiceDesc: {
        fontSize: rf(13),
        textAlign: 'center',
        opacity: 0.8,
        lineHeight: rf(18),
        paddingHorizontal: SPACING.sm,
    },
    formContainer: { width: '100%', maxWidth: 500, alignSelf: 'center', paddingHorizontal: SPACING.md },
    formCard: { padding: SPACING.xl, borderRadius: rs(24) },
    formIconRow: { alignItems: 'center', marginBottom: SPACING.lg },
    input: {
        height: rs(54),
        borderWidth: 1,
        borderRadius: rs(16),
        paddingHorizontal: SPACING.lg,
        fontSize: rf(16),
        marginBottom: SPACING.md,
    },
    passwordContainer: { position: 'relative', marginBottom: SPACING.md },
    passwordInput: { marginBottom: 0, paddingRight: rs(50) },
    eyeIcon: { position: 'absolute', right: rs(16), top: rs(16), padding: 4 },
    nextButton: {
        flexDirection: 'row',
        height: rs(54),
        borderRadius: rs(16),
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: SPACING.md,
        shadowColor: BRAND.oceanDark,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    nextButtonText: {
        color: '#fff',
        fontSize: rf(16),
        fontWeight: '700',
        marginRight: SPACING.sm,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: SPACING.lg,
        padding: SPACING.sm,
    },
    backButtonText: { marginLeft: SPACING.xs, fontSize: rf(14), fontWeight: '600' },
    errorText: { color: '#ef4444', textAlign: 'center', marginBottom: SPACING.md, fontSize: rf(13) },
    inputError: { borderColor: '#ef4444', borderWeight: 1.5, shadowColor: '#ef4444', shadowOpacity: 0.1, shadowRadius: 4 },
    errorBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
        marginBottom: SPACING.md,
        width: '100%',
    },
    errorBannerText: {
        color: '#ef4444',
        fontSize: rf(13),
        fontWeight: '600',
        flex: 1,
    },
    hintText: {
        fontSize: rf(13.5),
        textAlign: 'center',
        marginBottom: SPACING.md,
        fontWeight: '700',
        opacity: 0.9
    },
    filePicker: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        borderWidth: 1,
        borderRadius: rs(16),
        borderStyle: 'dashed',
        marginBottom: SPACING.lg,
    },
    filePickerText: { flex: 1, marginLeft: SPACING.sm, fontSize: rf(14) },
    sectionDivider: {
        flexDirection: 'row', alignItems: 'center', marginVertical: SPACING.md,
    },
    dividerLine: { flex: 1, height: 1, opacity: 0.3 },
    dividerText: { marginHorizontal: SPACING.md, fontSize: rf(12), textTransform: 'uppercase' },
    emailButton: { marginTop: rs(16), padding: rs(12), alignItems: 'center' },
    emailButtonText: { fontSize: rf(14), fontWeight: '600', textDecorationLine: 'underline' },
    langSelectorContainer: {
        position: 'absolute',
        top: Platform.OS === 'web' ? rs(16) : rs(10), // Safe area handles mobile offset
        right: SPACING.md,
        zIndex: 50,
        elevation: 10,
    },
    langButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: rs(10),
        paddingVertical: rs(6),
        borderRadius: rs(20),
        borderWidth: 1,
        backdropFilter: 'blur(10px)',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.lg,
    },
    langDropdownMenu: {
        width: '100%',
        maxWidth: rs(320),
        maxHeight: rh(400),
        borderRadius: rs(16),
        padding: SPACING.md,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 10,
    },
    langMenuTitle: {
        fontSize: rf(14),
        fontWeight: '600',
        marginBottom: SPACING.md,
        textAlign: 'center',
    },
    langMenuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.sm,
        borderRadius: rs(10),
        marginBottom: rs(4),
    },
    langMenuItemText: {
        fontSize: rf(14),
    },
});
