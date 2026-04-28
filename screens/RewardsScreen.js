import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Dimensions, Platform, useWindowDimensions, Alert, Image, Linking, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, {
    FadeInDown, FadeInUp,
    useSharedValue, useAnimatedStyle,
    withRepeat, withTiming, withSequence, withDelay,
    Easing,
} from 'react-native-reanimated';
import { useGame } from '../context/GameContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import translations, { REWARDS_CLAIM_LABELS } from '../constants/translations';
import { useWallet } from '../context/WalletContext';
import { handleClaim, disconnectWalletConnect } from '../utils/nftGenerator';
import { BRAND, GRADIENTS } from '../constants/theme';
import { rs, rf, rh, SPACING, RADIUS, SCREEN } from '../constants/responsive';
import NFTMiniCard from '../components/NFTMiniCard';
import LivingWater from '../components/LivingWater';
import Scoreboard from '../components/Scoreboard';
import FloatingBubbles from '../components/premium/FloatingBubbles';
import GlassCard from '../components/premium/GlassCard';
import AnimatedButton from '../components/premium/AnimatedButton';
import EarthCard from '../components/premium/EarthCard';

const CelebrationModal = ({ visible, onClose, nft }) => {
    const { colors, shadows, isDark } = useTheme();
    const { t, language } = useLanguage();
    if (!nft) return null;
    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.celebrationOverlay}>
                <Animated.View
                    entering={FadeInUp.springify()}
                    style={[styles.celebrationContent, { backgroundColor: colors.surface }, shadows.xl]}
                >
                    <LinearGradient
                        colors={[BRAND.sandGold, '#fbbf24']}
                        style={styles.celebrationIconBg}
                    >
                        <Ionicons name="sparkles" size={rs(36)} color="#fff" />
                    </LinearGradient>
                    <Text style={[styles.celebrationTitle, { color: colors.text }]}>
                        {t('rewards_nft_unlocked')}
                    </Text>
                    <Text style={[styles.celebrationSubtitle, { color: colors.textSecondary }]}>
                        {t('rewards_nft_redeemed')}
                    </Text>
                    <View style={styles.celebrationNFT}>
                        <NFTMiniCard nft={nft} size="large" />
                    </View>
                    <AnimatedButton
                        title={t('rewards_continue')}
                        onPress={onClose}
                        variant="primary"
                        fullWidth
                    />
                </Animated.View>
            </View>
        </Modal>
    );
};

// ─── Modal de confirmación de transacción ──────────────────────────────────
const EXPLORER_URL = 'https://explorer-zk.tanenbaum.io';

const TxConfirmModal = ({ visible, txHash, onClose }) => {
    const { colors, shadows, isDark } = useTheme();
    const { t } = useLanguage();
    if (!txHash) return null;

    const handleOpenExplorer = () => {
        Linking.openURL(`${EXPLORER_URL}/tx/${txHash}`);
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.celebrationOverlay}>
                <Animated.View
                    entering={FadeInUp.delay(50).springify()}
                    style={[
                        styles.txModalContent,
                        { backgroundColor: isDark ? '#0d1f2d' : '#ffffff' },
                        shadows.xl,
                    ]}
                >
                    {/* Icono éxito */}
                    <LinearGradient
                        colors={['#10b981', '#059669']}
                        style={styles.celebrationIconBg}
                    >
                        <Ionicons name="checkmark-circle" size={rs(36)} color="#fff" />
                    </LinearGradient>

                    <Text style={[styles.celebrationTitle, { color: colors.text, marginTop: SPACING.md }]}>
                        {t('tx_success_title') || 'Transacción completada'}
                    </Text>
                    <Text style={[styles.celebrationSubtitle, { color: colors.textSecondary, fontStyle: 'italic', marginTop: SPACING.xs }]}>
                        {t('tx_success_desc') || 'La transacción puede tardar hasta 30 segundos en visualizarse en la red'}
                    </Text>

                    {/* Hash box */}
                    <View style={[styles.txHashBox, { backgroundColor: isDark ? '#0a1929' : '#f1f5f9', borderColor: isDark ? '#1e3a5f' : '#e2e8f0' }]}>
                        <Text style={[styles.txHashLabel, { color: colors.textSecondary }]}>
                            {t('tx_hash_label') || 'Hash de transacción:'}
                        </Text>
                        <Text style={[styles.txHashText, { color: '#10b981' }]} numberOfLines={3} selectable>
                            {txHash}
                        </Text>
                    </View>

                    {/* Botón explorer */}
                    <TouchableOpacity
                        style={styles.explorerButton}
                        onPress={handleOpenExplorer}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={['#0ea5e9', '#0284c7']}
                            style={styles.explorerButtonInner}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Ionicons name="open-outline" size={rs(18)} color="#fff" />
                            <Text style={styles.explorerButtonText}>
                                {t('tx_view_explorer') || 'Ver en Explorer'}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Botón cerrar */}
                    <TouchableOpacity style={styles.txCloseButton} onPress={onClose}>
                        <Text style={[styles.txCloseText, { color: colors.textSecondary }]}>
                            {t('tx_close') || 'Cerrar'}
                        </Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </Modal>
    );
};

const NFTDetailModal = ({ visible, onClose, nft, onClaim }) => {
    const { colors, shadows, isDark } = useTheme();
    const { t } = useLanguage();
    const { address, connectedWalletType } = useWallet();
    const [claiming, setClaiming] = useState(false);
    if (!nft) return null;

    const handleClaimPress = async (walletType) => {
        if (nft.claimed || claiming) return;
        setClaiming(true);
        try {
            await onClaim(nft, walletType);
        } catch (error) {
            console.error(error);
        } finally {
            setClaiming(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={[styles.detailOverlay, { backgroundColor: isDark ? 'rgba(0,18,32,0.95)' : 'rgba(0,0,0,0.85)' }]}>
                <SafeAreaView style={styles.detailSafeArea}>
                    <TouchableOpacity style={styles.detailClose} onPress={onClose}>
                        <Ionicons name="close-circle" size={rs(36)} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.detailContent}>
                        <NFTMiniCard nft={nft} size="large" static />
                        <View style={styles.detailInfo}>
                            <Text style={[styles.detailTitle, { color: '#ffffff' }]}>{nft.title}</Text>
                            <View style={styles.detailRow}>
                                <Text style={[styles.detailHash, { color: 'rgba(255,255,255,0.6)' }]} numberOfLines={1}>
                                    {nft.claimed && nft.txHash
                                        ? `${nft.txHash.slice(0, 18)}...${nft.txHash.slice(-8)}`
                                        : `${nft.hash?.slice(0, 18)}...${nft.hash?.slice(-8)}`}
                                </Text>
                            </View>
                            <View style={styles.detailStats}>
                                <GlassCard variant="flat" style={styles.detailStat}>
                                    <Text style={[styles.detailStatLabel, { color: 'rgba(255,255,255,0.7)' }]}>{t('rewards_created')}</Text>
                                    <Text style={[styles.detailStatValue, { color: '#ffffff' }]}>{nft.date}</Text>
                                </GlassCard>
                                <GlassCard variant="flat" style={styles.detailStat}>
                                    <Text style={[styles.detailStatLabel, { color: 'rgba(255,255,255,0.7)' }]}>{t('rewards_locked_until')}</Text>
                                    <Text style={[styles.detailStatValue, { color: '#ffffff' }]}>{nft.lockedUntil}</Text>
                                </GlassCard>
                            </View>
                            <View style={styles.detailRow}>
                                <Ionicons name="person-circle" size={rs(18)} color={colors.accent} />
                                <Text style={[styles.detailOwner, { color: '#ffffff' }]}>
                                    {t('rewards_owner')}: {nft.owner}
                                </Text>
                            </View>
                            {nft.acquisition && (
                                <View style={[styles.detailRow, { marginTop: SPACING.sm }]}>
                                    <Ionicons name="sparkles" size={rs(16)} color={BRAND.sandGold} />
                                    <Text style={[styles.detailOwner, { color: 'rgba(255,255,255,0.8)', fontStyle: 'italic' }]}>
                                        {nft.acquisition.includes(':')
                                            ? `${t(nft.acquisition.split(':')[0])} ${nft.acquisition.split(':')[1]}`
                                            : t(nft.acquisition)
                                        }
                                    </Text>
                                </View>
                            )}

                            {/* ✅ Updated Claim Layout */}
                            <View style={{ marginTop: SPACING.xl, width: '100%', gap: SPACING.md }}>
                                {!address && !nft.claimed && (
                                    <Animated.View entering={FadeInDown.delay(100)} style={styles.walletWarningContent}>
                                        <Text style={[styles.walletWarningTextDesc, { color: colors.textSecondary, textAlign: 'center', fontSize: rf(12), marginTop: SPACING.xs }]}>
                                            {t('rewards_connect_wallet_warning') || 'No esta conectado a una billetera - No se puede reclamar en este momento'}
                                        </Text>
                                    </Animated.View>
                                )}

                                <AnimatedButton
                                    title={nft.claimed ? t('rewards_claimed') : (t('rewards_claim_nft') || 'Reclamar NFT')}
                                    onPress={() => handleClaimPress(connectedWalletType || 'metamask')}
                                    variant={!address && !nft.claimed ? "secondary" : "primary"}
                                    disabled={nft.claimed || claiming || !address}
                                    fullWidth
                                    style={{ justifyContent: 'center', alignItems: 'center', opacity: (!address && !nft.claimed) ? 0.5 : 1 }}
                                />
                            </View>
                        </View>
                    </Animated.View>
                </SafeAreaView>
            </View>
        </Modal>
    );
};

export default function RewardsScreen() {
    const { points, nfts, unlockNFT, markNFTSeen, claimNFT, updateUserProfile } = useGame();
    const { colors, shadows, isDark } = useTheme();
    const { t } = useLanguage();
    const { address, signer, setProvider, setSigner, setAddress } = useWallet();
    const [showCelebration, setShowCelebration] = useState(false);
    const [showDetail, setShowDetail] = useState(false);
    const [selectedNFT, setSelectedNFT] = useState(null);
    const [lastUnlockedNFT, setLastUnlockedNFT] = useState(null);
    const [connectTarget, setConnectTarget] = useState(null);
    const [claimingMap, setClaimingMap] = useState({});
    // ✅ Nuevo: estado para el modal de confirmación de TX
    const [txConfirmation, setTxConfirmation] = useState({ visible: false, txHash: null });
    const { width } = useWindowDimensions();
    const isDesktop = width >= 1024;

    const handleNFTPress = (nft) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (nft.isNew) {
            markNFTSeen(nft.id);
        }
        setSelectedNFT(nft);
        setShowDetail(true);
    };

    const numColumns = isDesktop ? 6 : 3;
    const cardGap = SPACING.sm;
    const sidebarOffset = isDesktop ? 250 : 0;
    const availableWidth = width - sidebarOffset - (SPACING.lg * 2) - (cardGap * (numColumns - 1));
    const cardWidth = availableWidth / numColumns;
    const cardHeight = cardWidth * 1.4;

    const renderNFT = useCallback(({ item, index }) => {
        const isNew = lastUnlockedNFT?.id === item.id;
        return (
            <Animated.View
                entering={FadeInUp.delay(index * 60).springify()}
                style={{
                    marginBottom: cardGap,
                    width: cardWidth,
                }}
            >
                <TouchableOpacity onPress={() => handleNFTPress(item)} activeOpacity={0.9}>
                    <EarthCard
                        title={item.title}
                        rarity={item.rarity}
                        description={item.description}
                        date={item.date}
                        attributes={item.attributes}
                        id={item.id}
                        image={item.image}
                        width={cardWidth}
                        height={cardHeight}
                        compact={true}
                        isNew={item.isNew}
                        onPress={handleNFTPress}
                    />
                </TouchableOpacity>
            </Animated.View>
        );
    }, [lastUnlockedNFT, cardWidth, address, claimingMap, t, colors, signer]);

    const ListHeader = () => (
        <>
            <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.header}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>{t('rewards_title')}</Text>
                <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                    {nfts.length} {t('rewards_collection_count')}
                </Text>
            </Animated.View>
            <Animated.View entering={FadeInDown.delay(200).springify()}>
                <Scoreboard />
            </Animated.View>
            {nfts.length > 0 && (
                <Animated.View entering={FadeInUp.delay(400).springify()}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('rewards_your_collection')}</Text>
                </Animated.View>
            )}
        </>
    );

    const EmptyState = () => (
        <Animated.View entering={FadeInUp.delay(400).springify()} style={styles.emptyContainer}>
            <GlassCard variant="flat" style={styles.emptyCard}>
                <Ionicons name="diamond-outline" size={rs(48)} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('rewards_no_nfts')}</Text>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    {t('rewards_no_nfts_desc')}
                </Text>
            </GlassCard>
        </Animated.View>
    );

    // ✅ Al cerrar el modal, desconectar la sesión WalletConnect activa.
    //    Evita que MetaMask reciba solicitudes duplicadas en la próxima
    //    conexión, lo que causaría el error -32002 "Request already pending".
    const handleCloseDetail = () => {
        disconnectWalletConnect();
        setShowDetail(false);
    };

    const handleClaimNFT = async (nft, walletType = 'any') => {
        try {
            if (!nft) return;
            console.log(`🚀 Claim iniciado (${walletType}) para missionId:`, nft.id);
            const timeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout: la transacción tardó demasiado')), 120000)
            );
            const result = await Promise.race([
                handleClaim(nft.id, walletType),
                timeout
            ]);
            console.log("Resultado del claim:", result);
            if (result?.success) {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                claimNFT(nft.id, result.txHash);
                // ✅ Mostrar modal de confirmación con el txHash real
                setShowDetail(false);
                setTxConfirmation({ visible: true, txHash: result.txHash });
            } else {
                throw result?.error || new Error('Error desconocido');
            }
        } catch (err) {
            console.error("Error en handleClaimNFT:", err);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert(
                'Error',
                err?.message || 'No se pudo mintear el NFT'
            );
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {isDark && (
                <LinearGradient
                    colors={[BRAND.oceanDeep, BRAND.oceanDark]}
                    style={StyleSheet.absoluteFill}
                />
            )}
            <FloatingBubbles count={10} minSize={4} maxSize={14} zIndex={0} />
            <View style={styles.bgWater}><LivingWater /></View>
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <FlatList
                    key={numColumns}
                    data={nfts}
                    renderItem={renderNFT}
                    keyExtractor={(item) => item.id}
                    numColumns={numColumns}
                    ListHeaderComponent={ListHeader}
                    ListEmptyComponent={EmptyState}
                    columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            </SafeAreaView>
            <CelebrationModal
                visible={showCelebration}
                onClose={() => setShowCelebration(false)}
                nft={lastUnlockedNFT}
            />
            <NFTDetailModal
                visible={showDetail}
                onClose={handleCloseDetail}
                nft={selectedNFT}
                onClaim={handleClaimNFT}
            />
            {/* ✅ Modal de confirmación de TX con hash y link al explorer */}
            <TxConfirmModal
                visible={txConfirmation.visible}
                txHash={txConfirmation.txHash}
                onClose={() => setTxConfirmation({ visible: false, txHash: null })}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    bgWater: { ...StyleSheet.absoluteFillObject, opacity: 0.2 },
    safeArea: { flex: 1 },
    listContent: { padding: SPACING.lg, paddingBottom: rh(120) },
    row: { justifyContent: 'flex-start', gap: SPACING.sm },
    header: { marginBottom: SPACING.lg },
    headerTitle: { fontSize: rf(26), fontWeight: '700' },
    headerSubtitle: { fontSize: rf(14), marginTop: rs(4) },
    sectionTitle: { fontSize: rf(18), fontWeight: '700', marginBottom: SPACING.md },
    emptyContainer: { marginTop: SPACING.xl },
    emptyCard: { alignItems: 'center', padding: SPACING.xl },
    emptyTitle: { fontSize: rf(18), fontWeight: '700', marginTop: SPACING.md },
    emptyText: { fontSize: rf(13), textAlign: 'center', marginTop: SPACING.sm, lineHeight: rf(20) },
    celebrationOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
    celebrationContent: { width: '100%', maxWidth: rs(340), borderRadius: RADIUS.xl, padding: SPACING.xl, alignItems: 'center' },
    celebrationIconBg: { width: rs(72), height: rs(72), borderRadius: rs(36), justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.lg },
    celebrationTitle: { fontSize: rf(22), fontWeight: '700', textAlign: 'center' },
    celebrationSubtitle: { fontSize: rf(14), textAlign: 'center', marginTop: SPACING.xs },
    celebrationNFT: { marginVertical: SPACING.xl },
    detailOverlay: { flex: 1 },
    detailSafeArea: { flex: 1 },
    detailClose: { alignSelf: 'flex-end', padding: SPACING.md },
    detailContent: { flex: 1, alignItems: 'center', paddingHorizontal: SPACING.xl },
    detailInfo: { marginTop: SPACING.xl, width: '100%' },
    detailTitle: { fontSize: rf(24), fontWeight: '700', textAlign: 'center' },
    detailRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: SPACING.md, gap: SPACING.xs },
    detailHash: { fontSize: rf(11), fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
    detailStats: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.lg },
    detailStat: { flex: 1, padding: SPACING.md, alignItems: 'center' },
    detailStatLabel: { fontSize: rf(10), textTransform: 'uppercase', letterSpacing: 0.5 },
    detailStatValue: { fontSize: rf(14), fontWeight: '600', marginTop: rs(4) },
    detailOwner: { fontSize: rf(14), fontWeight: '600' },
    claimSection: { marginTop: SPACING.lg, alignItems: 'center', width: '100%', gap: SPACING.md },
    walletWarning: { width: '100%', borderRadius: RADIUS.md, padding: SPACING.md, flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
    walletWarningText: { fontSize: rf(13), fontWeight: '600', flex: 1 },
    claimButton: { width: '100%', borderRadius: RADIUS.md, padding: SPACING.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm },
    claimButtonText: { fontSize: rf(14), fontWeight: '700', color: '#fff' },
    connectWalletContainer: { flex: 1, width: '100%' },
    // ── TxConfirmModal ──────────────────────────────────────────────────────
    txModalContent: {
        width: '100%',
        maxWidth: rs(380),
        borderRadius: RADIUS.xl,
        padding: SPACING.xl,
        alignItems: 'center',
    },
    txHashBox: {
        width: '100%',
        borderRadius: RADIUS.md,
        borderWidth: 1,
        padding: SPACING.md,
        marginTop: SPACING.lg,
        marginBottom: SPACING.md,
    },
    txHashLabel: {
        fontSize: rf(11),
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: SPACING.xs,
        fontWeight: '600',
    },
    txHashText: {
        fontSize: rf(12),
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        lineHeight: rf(18),
        fontWeight: '500',
    },
    explorerButton: {
        width: '100%',
        borderRadius: RADIUS.md,
        overflow: 'hidden',
        marginBottom: SPACING.sm,
    },
    explorerButtonInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
        gap: SPACING.sm,
    },
    explorerButtonText: {
        fontSize: rf(14),
        fontWeight: '700',
        color: '#ffffff',
    },
    txCloseButton: {
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.lg,
        marginTop: SPACING.xs,
    },
    txCloseText: {
        fontSize: rf(14),
        fontWeight: '500',
    },
});