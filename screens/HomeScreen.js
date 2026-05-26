import React, { useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Image,
    Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useWindowDimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withDelay,
    withTiming,
    FadeInDown,
    FadeInUp,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useGame } from '../context/GameContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { rs, rf, rh, SPACING, RADIUS, SCREEN } from '../constants/responsive';
import { SPRING, SCALE } from '../constants/animations';
import { BRAND, GRADIENTS } from '../constants/theme';
import Water from '../components/Water';
import FloatingBubbles from '../components/premium/FloatingBubbles';
import GlassCard from '../components/premium/GlassCard';
import TPLTitle from '../components/premium/TPLTitle';
import TPLRedeemModal from '../components/TPLRedeemModal';
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const ActionItem = ({ icon, label, delay = 0, onPress, customWidth }) => {
    const { colors, shadows, isDark } = useTheme();
    const scale = useSharedValue(1);
    const handlePressIn = () => {
        scale.value = withSpring(SCALE.pressed, SPRING.snappy);
    };
    const handlePressOut = () => {
        scale.value = withSpring(1, SPRING.snappy);
    };
    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
    };
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));
    return (
        <AnimatedPressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handlePress}
            entering={FadeInDown.delay(delay).springify()}
            style={[styles.actionItem, animatedStyle, customWidth && { width: customWidth }]}
        >
            <GlassCard variant="elevated" style={styles.actionCard}>
                <View style={styles.actionContent}>
                    <LinearGradient
                        colors={isDark ? GRADIENTS.oceanSurface : [BRAND.oceanLight, BRAND.oceanMid]}
                        style={[styles.iconBox, shadows.sm]}
                    >
                        <Ionicons name={icon} size={rs(24)} color="#fff" />
                    </LinearGradient>
                    <Text style={[styles.actionLabel, { color: colors.text }]}>{label}</Text>
                </View>
            </GlassCard>
        </AnimatedPressable>
    );
};
const BalanceCard = ({ onRedeem, balance, nfts }) => {
    const { colors, shadows, isDark } = useTheme();
    const { t } = useLanguage();
    const balanceScale = useSharedValue(1);
    useEffect(() => {
        balanceScale.value = withDelay(500, withSpring(1.02, SPRING.bouncy));
        setTimeout(() => {
            balanceScale.value = withSpring(1, SPRING.gentle);
        }, 1000);
    }, []);
    const balanceStyle = useAnimatedStyle(() => ({
        transform: [{ scale: balanceScale.value }],
    }));
    return (
        <Animated.View
            entering={FadeInUp.delay(200).springify()}
            style={[styles.balanceContainer, balanceStyle]}
        >
            <LinearGradient
                colors={isDark
                    ? [BRAND.oceanMid, BRAND.oceanDark, BRAND.oceanDeep]
                    : [BRAND.oceanLight, BRAND.oceanMid, BRAND.oceanDark]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.balanceCard, shadows.xl]}
            >
                <View style={styles.cardShine} />
                <View style={styles.balanceContent}>
                    <View style={styles.balanceHeader}>
                        <Text style={styles.balanceLabel}>{t('home_total_balance')}</Text>
                        <TouchableOpacity
                            style={[styles.redeemButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)' }]}
                            activeOpacity={0.7}
                            onPress={onRedeem}
                        >
                            <Ionicons name="gift-outline" size={rs(14)} color="#fff" style={{ marginRight: rs(6) }} />
                            <Text style={styles.redeemButtonText}>{t('home_redeem_tpl')}</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.balanceValue}>{balance !== null ? balance : '0'} TPL</Text>
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{nfts.length}</Text>
                            <Text style={styles.statLabel}>{t('home_nfts')}</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{balance !== null ? balance : '0'}</Text>
                            <Text style={styles.statLabel}>{t('home_points')}</Text>
                        </View>
                    </View>
                </View>
                <View style={styles.cardDecor}>
                    <View style={[styles.decorCircle, styles.decorCircle1]} />
                    <View style={[styles.decorCircle, styles.decorCircle2]} />
                </View>
            </LinearGradient>
        </Animated.View>
    );
};
import { useWallet } from '../context/WalletContext';
import { useAuth } from '../context/AuthContext';
import { fetchTPLBalance } from '../utils/blockchain/tplToken';
const NoticeBanner = () => {
    const { colors } = useTheme();
    const { address } = useWallet();
    
    const bannerText = address 
        ? "Recuerda: Debes importar el contrato de Tokens TPL para el canje durante las sesiones de escaneo. Si ya lo tienes registrado, ¡felicitaciones! puedes continuar con el juego."
        : "Recuerda: Para poder coleccionar Tokens TPL, debes tener una wallet asociada al juego. De lo contrario, no podrás registrar ingresos usables para el canje de títulos, entre otros. Además, recuerda que se debe importar el contrato de Tokens TPL.";

    return (
        <Animated.View
            entering={FadeInDown.delay(300).springify()}
            style={styles.noticeContainer}
        >
            <GlassCard variant="elevated" style={styles.noticeCard}>
                <View style={styles.noticeHeader}>
                    <View style={styles.noticeIconBox}>
                        <Ionicons name="notifications" size={rs(18)} color={BRAND.sandGold} />
                    </View>
                    <Text style={[styles.noticeTitle, { color: colors.text }]}>Aviso Importante</Text>
                </View>
                <Text style={[styles.noticeDescription, { color: colors.textSecondary }]}>
                    {bannerText}
                </Text>
            </GlassCard>
        </Animated.View>
    );
};

export default function HomeScreen() {
    const navigation = useNavigation();
    const { user, points, nfts, level, updateUserProfile, syncTPLToBlockchain } = useGame();
    const { username } = useAuth();
    const { address, provider: walletProvider } = useWallet();
    const { colors, shadows, isDark } = useTheme();
    const { t, language } = useLanguage();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 1024;
    const [showRedeemModal, setShowRedeemModal] = React.useState(false);
    const [tplBalance, setTplBalance] = React.useState(null);
    useEffect(() => {
        const getBalance = async () => {
            if (address && walletProvider) {
                const bal = await fetchTPLBalance(address, walletProvider);
                setTplBalance(parseFloat(bal));
            } else {
                setTplBalance(0);
            }
        };
        getBalance();
    }, [address, walletProvider]);
    const handleTitleUpdate = (newTitle) => {
        updateUserProfile({ tplTitle: newTitle });
        setShowRedeemModal(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };
    const today = new Date();
    const localeMap = { es: 'es-ES', en: 'en-US', zh: 'zh-CN', hi: 'hi-IN', ar: 'ar-SA', fr: 'fr-FR', pt: 'pt-BR' };
    const dateString = today.toLocaleDateString(localeMap[language] || 'es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    const actionItemWidth = isDesktop
        ? (width - 250 - (SPACING.lg * 2) - (SPACING.md * 3)) / 4
        : (width - (SPACING.lg * 2) - SPACING.md) / 2;
    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {isDark && (
                <LinearGradient
                    colors={[BRAND.oceanDeep, BRAND.oceanDark]}
                    style={StyleSheet.absoluteFill}
                />
            )}
            <FloatingBubbles count={isDesktop ? 20 : 8} minSize={4} maxSize={isDesktop ? 20 : 14} zIndex={0} />
            <SafeAreaView style={styles.safeArea}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    { }
                    <Animated.View
                        entering={FadeInDown.delay(100).springify()}
                        style={styles.header}
                    >
                        <View>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={[styles.greeting, { color: colors.text, fontSize: isDesktop ? rf(32) : rf(26) }]}>
                                    {t('home_greeting')}, {username || user.name.split(' ')[0]}
                                </Text>
                                <TPLTitle title={user.tplTitle} />
                            </View>
                            <Text style={[styles.date, { color: colors.textMuted }]}>
                                {dateString}
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={[
                                styles.avatar,
                                {
                                    backgroundColor: isDark ? colors.surface : BRAND.sandGold,
                                    ...shadows.md
                                }
                            ]}
                            onPress={() => navigation.navigate('Profile')}
                            activeOpacity={0.8}
                        >
                            {user.avatar ? (
                                <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
                            ) : (
                                <Text style={[styles.avatarInitials, { color: colors.primary }]}>
                                    {user.initials}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </Animated.View>
                    { }
                    <View style={isDesktop ? styles.desktopRow : styles.mobileCol}>
                        { }
                        <View style={isDesktop ? { flex: 0.4, marginRight: SPACING.xl } : { width: '100%' }}>
                            <BalanceCard
                                onRedeem={() => setShowRedeemModal(true)}
                                balance={tplBalance}
                                nfts={nfts}
                            />
                            {!isDesktop && <NoticeBanner />}
                        </View>
                        { }
                        <View style={isDesktop ? { flex: 0.6 } : { width: '100%' }}>
                            {isDesktop && <NoticeBanner />}
                            <Animated.View entering={FadeInUp.delay(400).springify()}>
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                    {t('home_quick_actions')}
                                </Text>
                            </Animated.View>
                            <View style={styles.grid}>
                                <ActionItem
                                    icon="scan-outline"
                                    label={t('home_scan')}
                                    delay={500}
                                    onPress={() => navigation.navigate('Escanear')}
                                    customWidth={actionItemWidth}
                                />
                                <ActionItem
                                    icon="map-outline"
                                    label={t('home_map')}
                                    delay={600}
                                    onPress={() => navigation.navigate('Mapa')}
                                    customWidth={actionItemWidth}
                                />
                                <ActionItem
                                    icon="person-outline"
                                    label={t('home_profile')}
                                    delay={700}
                                    onPress={() => navigation.navigate('Profile')}
                                    customWidth={actionItemWidth}
                                />
                                <ActionItem
                                    icon="gift-outline"
                                    label={t('home_rewards')}
                                    delay={800}
                                    onPress={() => navigation.navigate('Premios')}
                                    customWidth={actionItemWidth}
                                />
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
            <View style={styles.waterWrapper}>
                <Water />
            </View>
            <TPLRedeemModal
                visible={showRedeemModal}
                onClose={() => setShowRedeemModal(false)}
                points={tplBalance !== null ? tplBalance : 0}
                currentTitle={user.tplTitle}
                onUpdateTitle={handleTitleUpdate}
            />
        </View>
    );
}
const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    scrollContent: { padding: SPACING.lg, paddingBottom: rh(120) },
    header: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: SPACING.xl,
    },
    greeting: { fontSize: rf(26), fontWeight: '700', letterSpacing: 0.5 },
    date: { fontSize: rf(13), marginTop: rs(4) },
    avatar: {
        width: rs(50), height: rs(50), borderRadius: rs(25),
        justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
    },
    avatarImage: { width: rs(50), height: rs(50), borderRadius: rs(25) },
    avatarInitials: { fontSize: rf(18), fontWeight: '700' },
    desktopRow: { flexDirection: 'row', alignItems: 'flex-start' },
    mobileCol: { flexDirection: 'column' },
    balanceContainer: { marginBottom: SPACING.xl },
    balanceCard: { borderRadius: RADIUS.xl, padding: SPACING.lg, overflow: 'hidden', minHeight: 200 },
    cardShine: {
        position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl,
    },
    balanceContent: { zIndex: 1, height: '100%', justifyContent: 'space-between' },
    balanceLabel: {
        color: 'rgba(255, 255, 255, 0.7)', fontSize: rf(11), fontWeight: '600',
        textTransform: 'uppercase', letterSpacing: rs(2),
    },
    balanceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
    },
    redeemButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: rs(6),
        paddingHorizontal: rs(12),
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    redeemButtonText: {
        color: '#ffffff',
        fontSize: rf(12),
        fontWeight: '700',
    },
    balanceValue: { color: '#fff', fontSize: rf(36), fontWeight: '800', marginVertical: rs(8), letterSpacing: 1 },
    balanceRow: { flexDirection: 'row' },
    badge: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(76, 175, 80, 0.15)',
        paddingVertical: rs(6), paddingHorizontal: rs(12),
        borderRadius: RADIUS.md, gap: rs(6),
    },
    badgeText: { color: BRAND.successLight, fontSize: rf(12), fontWeight: '600' },
    statsRow: {
        flexDirection: 'row', marginTop: SPACING.lg, paddingTop: SPACING.md,
        borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    statItem: { flex: 1, alignItems: 'center' },
    statValue: { color: '#fff', fontSize: rf(22), fontWeight: '700' },
    statLabel: {
        color: BRAND.oceanLight, fontSize: rf(11), marginTop: rs(4),
        textTransform: 'uppercase', letterSpacing: 1,
    },
    statDivider: { width: 1, backgroundColor: 'rgba(255, 255, 255, 0.15)' },
    cardDecor: { position: 'absolute', top: 0, right: 0, bottom: 0, width: rs(150), overflow: 'hidden' },
    decorCircle: { position: 'absolute', borderRadius: rs(100), backgroundColor: 'rgba(255, 255, 255, 0.03)' },
    decorCircle1: { width: rs(200), height: rs(200), top: -rs(50), right: -rs(80) },
    decorCircle2: { width: rs(120), height: rs(120), bottom: -rs(30), right: -rs(20) },
    sectionTitle: { fontSize: rf(18), fontWeight: '700', marginBottom: SPACING.md },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', gap: SPACING.md },
    actionItem: {},
    actionCard: { padding: 0, height: '100%' },
    actionContent: { alignItems: 'center', padding: SPACING.lg, justifyContent: 'center', height: '100%' },
    iconBox: {
        width: rs(52), height: rs(52), borderRadius: rs(16),
        justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.sm,
    },
    actionLabel: { fontWeight: '600', fontSize: rf(14) },
    waterWrapper: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: rh(100), zIndex: -1, opacity: 0.4,
    },
    noticeContainer: {
        marginBottom: SPACING.lg,
    },
    noticeCard: {
        padding: SPACING.md,
        borderLeftWidth: 4,
        borderLeftColor: BRAND.sandGold,
    },
    noticeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: rs(6),
    },
    noticeIconBox: {
        marginRight: rs(8),
    },
    noticeTitle: {
        fontSize: rf(16),
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    noticeDescription: {
        fontSize: rf(13),
        lineHeight: rf(19),
        fontWeight: '500',
    },
});
