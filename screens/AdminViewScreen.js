import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Platform,
    useWindowDimensions,
    ActivityIndicator,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useWallet } from '../context/WalletContext';
import { rs, rf, rh, SPACING, RADIUS } from '../constants/responsive';
import { BRAND, GRADIENTS } from '../constants/theme';
import GlassCard from '../components/premium/GlassCard';

// Stat Card Component
const StatCard = ({ icon, trendText, trendColor, label, value, delay = 0 }) => {
    const { colors, isDark } = useTheme();
    const isLight = !isDark;

    return (
        <Animated.View 
            entering={FadeInDown.delay(delay).springify()}
            style={styles.statCardContainer}
        >
            <GlassCard variant="elevated" style={[styles.statCard, { backgroundColor: isLight ? '#ffffff' : colors.card }]}>
                <View style={styles.statHeader}>
                    <View style={[styles.iconBox, { backgroundColor: isLight ? 'rgba(13, 148, 136, 0.1)' : 'rgba(255,255,255,0.05)' }]}>
                        <Ionicons name={icon} size={rs(20)} color={isLight ? '#0d9488' : '#2dd4bf'} />
                    </View>
                    <View style={[styles.trendBadge, { backgroundColor: trendColor + '15' }]}>
                        <Text style={[styles.trendText, { color: trendColor }]}>{trendText}</Text>
                    </View>
                </View>
                <View style={styles.statContent}>
                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
                    <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
                </View>
            </GlassCard>
        </Animated.View>
    );
};

export default function AdminViewScreen() {
    const { colors, isDark } = useTheme();
    const { language } = useLanguage();
    const { width } = useWindowDimensions();
    const { address: walletAddress, connectMetaMask, connectPali } = useWallet();
    const isLight = !isDark;
    const isDesktop = width >= 1024;

    const [selectedRange, setSelectedRange] = useState('6months');

    // Layout configuration
    const statCardWidth = isDesktop 
        ? (width - 250 - (SPACING.lg * 2) - (SPACING.md * 3)) / 4 
        : '100%';

    const chartData = [
        { month: 'ENE', value: 30 },
        { month: 'FEB', value: 45 },
        { month: 'MAR', value: 35 },
        { month: 'ABR', value: 65 },
        { month: 'MAY', value: 80 },
        { month: 'JUN', value: 95 },
    ];

    const materials = [
        { name: language === 'es' ? 'Plástico' : 'Plastic', percent: 45, color: '#0d9488' },
        { name: language === 'es' ? 'Vidrio' : 'Glass', percent: 25, color: '#0ea5e9' },
        { name: language === 'es' ? 'Metal' : 'Metal', percent: 20, color: '#d4a574' },
        { name: language === 'es' ? 'Otros' : 'Others', percent: 10, color: '#64748b' },
    ];

    return (
        <View style={[styles.container, { backgroundColor: isLight ? '#f8fafc' : colors.background }]}>
            {isDark && (
                <LinearGradient
                    colors={[BRAND.oceanDeep, BRAND.oceanDark]}
                    style={StyleSheet.absoluteFill}
                />
            )}
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <ScrollView 
                    contentContainerStyle={[styles.scrollContent, { paddingHorizontal: isDesktop ? SPACING.xl : SPACING.lg }]} 
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header Row */}
                    <Animated.View entering={FadeInUp.springify()} style={styles.headerRow}>
                        <View>
                            <Text style={[styles.subTitle, { color: '#0d9488' }]}>
                                ENVIRONMENTAL IMPACT DASHBOARD
                            </Text>
                            <Text style={[styles.title, { color: colors.text }]}>
                                {language === 'es' ? 'Reporte de Impacto Ambiental' : 'Environmental Impact Report'}
                            </Text>
                        </View>
                        
                        <View style={styles.actionButtons}>
                            <TouchableOpacity style={[styles.btnSecondary, { borderColor: isLight ? '#cbd5e1' : colors.border }]}>
                                <Ionicons name="download-outline" size={rs(16)} color={colors.text} style={styles.btnIcon} />
                                <Text style={[styles.btnTextSecondary, { color: colors.text }]}>
                                    {language === 'es' ? 'Descargar PDF' : 'Download PDF'}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.btnPrimary}>
                                <Text style={styles.btnTextPrimary}>
                                    {language === 'es' ? 'Nueva Acción' : 'New Action'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>

                    {/* Wallet connection prompt if no wallet is connected */}
                    {!walletAddress && (
                        <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.walletAlertWrapper}>
                            <GlassCard variant="elevated" style={styles.walletAlertCard}>
                                <View style={styles.walletAlertHeader}>
                                    <View style={styles.walletAlertIconContainer}>
                                        <Ionicons name="wallet-outline" size={rs(24)} color="#e11d48" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.walletAlertTitle, { color: colors.text }]}>
                                            {language === 'es' ? "Conexión de Billetera Requerida" : "Wallet Connection Required"}
                                        </Text>
                                        <Text style={[styles.walletAlertDesc, { color: colors.textSecondary }]}>
                                            {language === 'es' 
                                                ? "Como administrador, necesitas conectar tu wallet para autorizar el minado de certificados ecológicos y la distribución de recompensas en zkTanenbaum." 
                                                : "As an administrator, you need to connect your wallet to authorize environmental certificate minting and rewards distribution on zkTanenbaum."}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.walletAlertButtons}>
                                    <TouchableOpacity 
                                        style={[styles.walletAlertBtn, { backgroundColor: isLight ? '#cbd5e1' : 'rgba(255,255,255,0.05)', borderColor: colors.border }]}
                                        onPress={connectPali}
                                    >
                                        <Image source={require('../assets/logo-pali.png')} style={styles.walletAlertBtnLogo} resizeMode="contain" />
                                        <Text style={[styles.walletAlertBtnText, { color: colors.text }]}>Conectar Pali</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={[styles.walletAlertBtn, { backgroundColor: isLight ? '#cbd5e1' : 'rgba(255,255,255,0.05)', borderColor: colors.border }]}
                                        onPress={connectMetaMask}
                                    >
                                        <Image source={require('../assets/logo-metamask.png')} style={styles.walletAlertBtnLogo} resizeMode="contain" />
                                        <Text style={[styles.walletAlertBtnText, { color: colors.text }]}>Conectar MetaMask</Text>
                                    </TouchableOpacity>
                                </View>
                            </GlassCard>
                        </Animated.View>
                    )}

                    {/* Stats Grid */}
                    <View style={[styles.statsGrid, { flexDirection: isDesktop ? 'row' : 'column' }]}>
                        <StatCard
                            icon="trash-outline"
                            trendText="+12% este mes"
                            trendColor="#0d9488"
                            label={language === 'es' ? 'Residuos Recolectados' : 'Waste Collected'}
                            value="12,450 kg"
                            delay={100}
                        />
                        <StatCard
                            icon="umbrella-outline"
                            trendText="8 nuevas"
                            trendColor="#0ea5e9"
                            label={language === 'es' ? 'Playas Intervenidas' : 'Beaches Cleaned'}
                            value="48"
                            delay={200}
                        />
                        <StatCard
                            icon="cube-outline"
                            trendText="+340 hoy"
                            trendColor="#d4a574"
                            label={language === 'es' ? 'NFTs Otorgados' : 'NFTs Distributed'}
                            value="1,822"
                            delay={300}
                        />
                        <StatCard
                            icon="people-outline"
                            trendText="Activos ahora"
                            trendColor="#22c55e"
                            label={language === 'es' ? 'Guardianes Activos' : 'Active Guardians'}
                            value="3,150"
                            delay={400}
                        />
                    </View>

                    {/* Charts Row */}
                    <View style={[styles.chartsRow, { flexDirection: isDesktop ? 'row' : 'column' }]}>
                        {/* Bar Chart Card */}
                        <Animated.View 
                            entering={FadeInDown.delay(300).springify()}
                            style={[styles.chartCardWrapper, { flex: isDesktop ? 0.65 : 1, marginRight: isDesktop ? SPACING.xl : 0, marginBottom: isDesktop ? 0 : SPACING.xl }]}
                        >
                            <GlassCard variant="elevated" style={[styles.chartCard, { backgroundColor: isLight ? '#ffffff' : colors.card }]}>
                                <View style={styles.chartHeader}>
                                    <View>
                                        <Text style={[styles.chartTitle, { color: colors.text }]}>
                                            {language === 'es' ? 'Actividad de Limpieza' : 'Cleanup Activity'}
                                        </Text>
                                        <Text style={[styles.chartSubtitle, { color: colors.textMuted }]}>
                                            {language === 'es' ? 'Tendencia mensual de recolección en 2024' : 'Monthly collection trend in 2024'}
                                        </Text>
                                    </View>
                                    <TouchableOpacity style={[styles.rangeSelector, { backgroundColor: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.05)' }]}>
                                        <Text style={[styles.rangeText, { color: colors.text }]}>
                                            {language === 'es' ? 'Últimos 6 meses' : 'Last 6 months'}
                                        </Text>
                                        <Ionicons name="chevron-down" size={rs(12)} color={colors.text} style={{ marginLeft: rs(4) }} />
                                    </TouchableOpacity>
                                </View>

                                {/* Visual Bar Chart */}
                                <View style={styles.barChartContainer}>
                                    {chartData.map((d, index) => (
                                        <View key={d.month} style={styles.barColumn}>
                                            <View style={styles.barBackground}>
                                                <View 
                                                    style={[
                                                        styles.barFill, 
                                                        { 
                                                            height: `${d.value}%`,
                                                            backgroundColor: index === 5 ? '#0d9488' : '#cbd5e1' 
                                                        }
                                                    ]} 
                                                />
                                            </View>
                                            <Text style={[styles.barLabel, { color: colors.textMuted }]}>{d.month}</Text>
                                        </View>
                                    ))}
                                </View>
                            </GlassCard>
                        </Animated.View>

                        {/* Donut Chart Card */}
                        <Animated.View 
                            entering={FadeInDown.delay(400).springify()}
                            style={[styles.chartCardWrapper, { flex: isDesktop ? 0.35 : 1 }]}
                        >
                            <GlassCard variant="elevated" style={[styles.chartCard, { backgroundColor: isLight ? '#ffffff' : colors.card }]}>
                                <Text style={[styles.chartTitle, { color: colors.text }]}>
                                    {language === 'es' ? 'Composición de Residuos' : 'Waste Composition'}
                                </Text>
                                <Text style={[styles.chartSubtitle, { color: colors.textMuted }]}>
                                    {language === 'es' ? 'Distribución por material' : 'Distribution by material'}
                                </Text>

                                {/* Visual Donut Chart */}
                                <View style={styles.donutContainer}>
                                    <View style={[styles.donutOuter, { borderColor: isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)' }]}>
                                        {/* Nested Circle for Center Text */}
                                        <View style={[styles.donutInner, { backgroundColor: isLight ? '#ffffff' : colors.card }]}>
                                            <Text style={[styles.donutValue, { color: colors.text }]}>12.4t</Text>
                                            <Text style={[styles.donutLabel, { color: colors.textMuted }]}>TOTAL</Text>
                                        </View>
                                        
                                        {/* Colored segments representation (SVG simulation with absolute items) */}
                                        <View style={[styles.donutSegment, { borderColor: '#0d9488', borderTopWidth: 10, borderRightWidth: 10 }]} />
                                        <View style={[styles.donutSegment, { borderColor: '#0ea5e9', borderBottomWidth: 10, borderLeftWidth: 10, transform: [{ rotate: '45deg' }] }]} />
                                    </View>
                                </View>

                                {/* Legend */}
                                <View style={styles.legendGrid}>
                                    {materials.map((m) => (
                                        <View key={m.name} style={styles.legendItem}>
                                            <View style={[styles.legendColor, { backgroundColor: m.color }]} />
                                            <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                                                {m.name} ({m.percent}%)
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            </GlassCard>
                        </Animated.View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    scrollContent: { paddingVertical: SPACING.xl, paddingBottom: rh(100) },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginBottom: SPACING.xl,
        gap: SPACING.md,
    },
    subTitle: {
        fontSize: rf(11),
        fontWeight: '800',
        letterSpacing: 1.5,
        marginBottom: rs(4),
    },
    title: {
        fontSize: rf(26),
        fontWeight: '800',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: SPACING.md,
        alignItems: 'center',
    },
    btnSecondary: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: rs(10),
        paddingHorizontal: rs(16),
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        backgroundColor: 'transparent',
    },
    btnIcon: {
        marginRight: rs(6),
    },
    btnTextSecondary: {
        fontSize: rf(14),
        fontWeight: '600',
    },
    btnPrimary: {
        backgroundColor: '#0d9488',
        paddingVertical: rs(10),
        paddingHorizontal: rs(20),
        borderRadius: RADIUS.lg,
        shadowColor: '#0d9488',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 3,
    },
    btnTextPrimary: {
        color: '#ffffff',
        fontSize: rf(14),
        fontWeight: '700',
    },
    statsGrid: {
        gap: SPACING.md,
        marginBottom: SPACING.xl,
    },
    statCardContainer: {
        flex: 1,
    },
    statCard: {
        padding: SPACING.lg,
        borderRadius: RADIUS.xl,
        justifyContent: 'space-between',
        minHeight: rs(110),
    },
    statHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    iconBox: {
        width: rs(36),
        height: rs(36),
        borderRadius: RADIUS.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    trendBadge: {
        paddingHorizontal: rs(8),
        paddingVertical: rs(4),
        borderRadius: RADIUS.full,
    },
    trendText: {
        fontSize: rf(11),
        fontWeight: '700',
    },
    statContent: {},
    statLabel: {
        fontSize: rf(12),
        fontWeight: '600',
        marginBottom: rs(4),
    },
    statValue: {
        fontSize: rf(22),
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    chartsRow: {
        gap: SPACING.md,
    },
    chartCardWrapper: {
        height: rs(340),
    },
    chartCard: {
        padding: SPACING.xl,
        borderRadius: RADIUS.xl,
        height: '100%',
        justifyContent: 'flex-start',
    },
    chartHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    chartTitle: {
        fontSize: rf(17),
        fontWeight: '800',
    },
    chartSubtitle: {
        fontSize: rf(12),
        marginTop: rs(2),
    },
    rangeSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: rs(6),
        paddingHorizontal: rs(10),
        borderRadius: RADIUS.md,
    },
    rangeText: {
        fontSize: rf(12),
        fontWeight: '600',
    },
    barChartContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        flex: 1,
        paddingTop: SPACING.md,
        paddingBottom: SPACING.xs,
    },
    barColumn: {
        alignItems: 'center',
        flex: 1,
    },
    barBackground: {
        width: rs(16),
        height: rs(170),
        backgroundColor: 'rgba(0,0,0,0.03)',
        borderRadius: RADIUS.full,
        justifyContent: 'flex-end',
        overflow: 'hidden',
    },
    barFill: {
        width: '100%',
        borderRadius: RADIUS.full,
    },
    barLabel: {
        fontSize: rf(11),
        fontWeight: '600',
        marginTop: rs(8),
    },
    donutContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        marginVertical: SPACING.md,
    },
    donutOuter: {
        width: rs(130),
        height: rs(130),
        borderRadius: rs(65),
        borderWidth: 10,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    donutInner: {
        width: rs(100),
        height: rs(100),
        borderRadius: rs(50),
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
    },
    donutValue: {
        fontSize: rf(20),
        fontWeight: '800',
    },
    donutLabel: {
        fontSize: rf(10),
        fontWeight: '700',
        letterSpacing: 1,
        marginTop: rs(2),
    },
    donutSegment: {
        position: 'absolute',
        width: rs(130),
        height: rs(130),
        borderRadius: rs(65),
        borderWidth: 0,
        zIndex: 1,
    },
    legendGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: SPACING.sm,
        marginTop: SPACING.md,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '45%',
    },
    legendColor: {
        width: rs(10),
        height: rs(10),
        borderRadius: rs(5),
        marginRight: rs(8),
    },
    legendText: {
        fontSize: rf(12),
        fontWeight: '600',
    },
    walletAlertWrapper: {
        marginBottom: SPACING.xl,
        width: '100%',
    },
    walletAlertCard: {
        padding: SPACING.lg,
        borderRadius: RADIUS.xl,
        borderWidth: 1,
        borderColor: 'rgba(225, 29, 72, 0.2)',
        backgroundColor: 'rgba(225, 29, 72, 0.03)',
    },
    walletAlertHeader: {
        flexDirection: 'row',
        gap: SPACING.md,
        alignItems: 'flex-start',
        marginBottom: SPACING.md,
    },
    walletAlertIconContainer: {
        width: rs(44),
        height: rs(44),
        borderRadius: RADIUS.md,
        backgroundColor: 'rgba(225, 29, 72, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    walletAlertTitle: {
        fontSize: rf(16),
        fontWeight: '800',
        marginBottom: rs(4),
    },
    walletAlertDesc: {
        fontSize: rf(13),
        lineHeight: rf(19),
    },
    walletAlertButtons: {
        flexDirection: 'row',
        gap: SPACING.md,
        marginTop: SPACING.xs,
        paddingLeft: rs(56), // align with content next to icon
    },
    walletAlertBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: rs(10),
        paddingHorizontal: rs(16),
        borderRadius: RADIUS.lg,
        borderWidth: 1,
    },
    walletAlertBtnLogo: {
        width: rs(18),
        height: rs(18),
        marginRight: rs(6),
    },
    walletAlertBtnText: {
        fontSize: rf(13),
        fontWeight: '700',
    },
});
