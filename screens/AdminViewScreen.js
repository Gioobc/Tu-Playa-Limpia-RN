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
import ENV from '../constants/env';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const API_URL = ENV.API_BASE_URL;

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
    const [stats, setStats] = useState({
        total_scans: 0,
        bottle_scans: 0,
        can_scans: 0,
        plastic_scans: 0,
        total_users: 0,
        total_reports: 0,
        total_beaches: 0,
    });
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/admin/stats`);
            const data = await response.json();
            if (data.success) {
                setStats(data.stats);
            }
        } catch (error) {
            console.error('Error fetching admin stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = async () => {
        try {
            const maxBar = Math.max(stats.plastic_scans, stats.bottle_scans, stats.can_scans, (stats.total_scans - stats.plastic_scans - stats.bottle_scans - stats.can_scans), 1);
            const plasticBarH = Math.round((stats.plastic_scans / maxBar) * 160);
            const bottleBarH = Math.round((stats.bottle_scans / maxBar) * 160);
            const canBarH = Math.round((stats.can_scans / maxBar) * 160);
            const othersBarH = Math.round(((stats.total_scans - stats.plastic_scans - stats.bottle_scans - stats.can_scans) / maxBar) * 160);

            // conic-gradient stops
            const p1 = plasticPercent;
            const p2 = p1 + bottlePercent;
            const p3 = p2 + canPercent;

            const html = `
                <html>
                <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
                    <style>
                        body {
                            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                            padding: 30px;
                            color: #334155;
                            background-color: #ffffff;
                        }
                        .header {
                            text-align: center;
                            margin-bottom: 30px;
                            border-bottom: 2px solid #0d9488;
                            padding-bottom: 20px;
                        }
                        .header h1 { color: #0d9488; margin: 0; font-size: 28px; }
                        .header p { margin: 5px 0 0 0; color: #64748b; }
                        .section-title {
                            font-size: 18px;
                            color: #0f172a;
                            margin-top: 30px;
                            margin-bottom: 15px;
                            border-bottom: 1px solid #e2e8f0;
                            padding-bottom: 5px;
                            font-weight: 700;
                        }
                        .grid { display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 30px; }
                        .card {
                            flex: 1;
                            min-width: 160px;
                            border: 1px solid #e2e8f0;
                            border-radius: 12px;
                            padding: 20px;
                            background-color: #f8fafc;
                        }
                        .card-label { font-size: 11px; color: #64748b; text-transform: uppercase; margin-bottom: 8px; font-weight: bold; letter-spacing: 0.5px; }
                        .card-value { font-size: 22px; color: #0f172a; font-weight: bold; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                        th, td { padding: 11px 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
                        th { background-color: #0d9488; color: #ffffff; font-weight: bold; }
                        tr:nth-child(even) { background-color: #f8fafc; }

                        /* ── Charts layout ── */
                        .charts-row { display: flex; gap: 40px; align-items: flex-start; margin-top: 10px; }

                        /* Bar chart */
                        .bar-chart-wrap { flex: 1; }
                        .bar-chart {
                            display: flex;
                            align-items: flex-end;
                            gap: 18px;
                            height: 180px;
                            border-left: 2px solid #cbd5e1;
                            border-bottom: 2px solid #cbd5e1;
                            padding: 0 16px 0 8px;
                        }
                        .bar-col { display: flex; flex-direction: column; align-items: center; gap: 6px; }
                        .bar {
                            width: 38px;
                            border-radius: 6px 6px 0 0;
                        }
                        .bar-lbl { font-size: 11px; color: #64748b; font-weight: 600; margin-top: 6px; }
                        .bar-val { font-size: 10px; color: #0f172a; font-weight: 700; }

                        /* Donut chart */
                        .donut-wrap { width: 220px; display: flex; flex-direction: column; align-items: center; }
                        .donut {
                            width: 160px;
                            height: 160px;
                            border-radius: 50%;
                            background: conic-gradient(
                                #0d9488 0% ${p1}%,
                                #0ea5e9 ${p1}% ${p2}%,
                                #d4a574 ${p2}% ${p3}%,
                                #64748b ${p3}% 100%
                            );
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            position: relative;
                        }
                        .donut-hole {
                            width: 100px;
                            height: 100px;
                            border-radius: 50%;
                            background: #ffffff;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                        }
                        .donut-total { font-size: 18px; font-weight: 800; color: #0f172a; }
                        .donut-lbl { font-size: 10px; font-weight: 700; color: #64748b; letter-spacing: 1px; }
                        .legend { margin-top: 14px; width: 100%; }
                        .legend-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; font-size: 12px; color: #334155; }
                        .legend-dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>TU PLAYA LIMPIA</h1>
                        <p>Reporte de Impacto Ambiental &mdash; Vista de Administración</p>
                        <p>Generado el: ${new Date().toLocaleString()}</p>
                    </div>

                    <div class="section-title">Resumen de Métricas Globales</div>
                    <div class="grid">
                        <div class="card">
                            <div class="card-label">Residuos Recolectados</div>
                            <div class="card-value">${stats.total_scans.toLocaleString()} uds</div>
                        </div>
                        <div class="card">
                            <div class="card-label">Playas Intervenidas</div>
                            <div class="card-value">${stats.total_beaches}</div>
                        </div>
                        <div class="card">
                            <div class="card-label">Guardianes Activos</div>
                            <div class="card-value">${stats.total_users}</div>
                        </div>
                    </div>

                    <div class="section-title">Composición de Residuos</div>
                    <table>
                        <thead>
                            <tr>
                                <th>Material</th>
                                <th>Escaneos</th>
                                <th>% del Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td>Plásticos</td><td>${stats.plastic_scans.toLocaleString()}</td><td>${plasticPercent}%</td></tr>
                            <tr><td>Botellas</td><td>${stats.bottle_scans.toLocaleString()}</td><td>${bottlePercent}%</td></tr>
                            <tr><td>Latas</td><td>${stats.can_scans.toLocaleString()}</td><td>${canPercent}%</td></tr>
                            <tr><td>Otros</td><td>${(stats.total_scans - stats.plastic_scans - stats.bottle_scans - stats.can_scans).toLocaleString()}</td><td>${othersPercent}%</td></tr>
                        </tbody>
                    </table>

                    <div class="section-title">Visualización de Residuos</div>
                    <div class="charts-row">

                        <!-- Gráfico de Barras -->
                        <div class="bar-chart-wrap">
                            <div style="font-size:13px;font-weight:700;color:#0f172a;margin-bottom:12px;">Gráfico de Barras por Material</div>
                            <div class="bar-chart">
                                <div class="bar-col">
                                    <span class="bar-val">${plasticPercent}%</span>
                                    <div class="bar" style="height:${plasticBarH}px;background:#0d9488;"></div>
                                    <span class="bar-lbl">Plásticos</span>
                                </div>
                                <div class="bar-col">
                                    <span class="bar-val">${bottlePercent}%</span>
                                    <div class="bar" style="height:${bottleBarH}px;background:#0ea5e9;"></div>
                                    <span class="bar-lbl">Botellas</span>
                                </div>
                                <div class="bar-col">
                                    <span class="bar-val">${canPercent}%</span>
                                    <div class="bar" style="height:${canBarH}px;background:#d4a574;"></div>
                                    <span class="bar-lbl">Latas</span>
                                </div>
                                <div class="bar-col">
                                    <span class="bar-val">${othersPercent}%</span>
                                    <div class="bar" style="height:${othersBarH}px;background:#64748b;"></div>
                                    <span class="bar-lbl">Otros</span>
                                </div>
                            </div>
                        </div>

                        <!-- Gráfico Circular -->
                        <div class="donut-wrap">
                            <div style="font-size:13px;font-weight:700;color:#0f172a;margin-bottom:12px;">Distribución Circular</div>
                            <div class="donut">
                                <div class="donut-hole">
                                    <span class="donut-total">${stats.total_scans.toLocaleString()}</span>
                                    <span class="donut-lbl">TOTAL</span>
                                </div>
                            </div>
                            <div class="legend">
                                <div class="legend-row"><div class="legend-dot" style="background:#0d9488;"></div>Plásticos &mdash; ${plasticPercent}%</div>
                                <div class="legend-row"><div class="legend-dot" style="background:#0ea5e9;"></div>Botellas &mdash; ${bottlePercent}%</div>
                                <div class="legend-row"><div class="legend-dot" style="background:#d4a574;"></div>Latas &mdash; ${canPercent}%</div>
                                <div class="legend-row"><div class="legend-dot" style="background:#64748b;"></div>Otros &mdash; ${othersPercent}%</div>
                            </div>
                        </div>

                    </div>
                </body>
                </html>
            `;

            if (Platform.OS === 'web') {
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                    printWindow.document.write(html);
                    printWindow.document.close();
                    printWindow.print();
                } else {
                    alert(language === 'es' ? 'Por favor permite las ventanas emergentes para descargar el PDF' : 'Please allow popups to download the PDF');
                }
            } else {
                const { uri } = await Print.printToFileAsync({ html });
                await Sharing.shareAsync(uri, { UTM: 'application/pdf', mimeType: 'application/pdf', dialogTitle: 'Descargar Reporte TPL' });
            }
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert(language === 'es' ? 'Error al generar el PDF' : 'Error generating PDF');
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

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

    const totalScansForPercent = stats.total_scans || 1; // avoid division by zero
    const plasticPercent = Math.round((stats.plastic_scans / totalScansForPercent) * 100);
    const bottlePercent = Math.round((stats.bottle_scans / totalScansForPercent) * 100);
    const canPercent = Math.round((stats.can_scans / totalScansForPercent) * 100);
    const othersPercent = Math.max(0, 100 - (plasticPercent + bottlePercent + canPercent));

    const materials = [
        { name: language === 'es' ? 'Plásticos' : 'Plastics', percent: stats.total_scans ? plasticPercent : 0, color: '#0d9488' },
        { name: language === 'es' ? 'Botellas' : 'Bottles', percent: stats.total_scans ? bottlePercent : 0, color: '#0ea5e9' },
        { name: language === 'es' ? 'Latas' : 'Cans', percent: stats.total_scans ? canPercent : 0, color: '#d4a574' },
        { name: language === 'es' ? 'Otros' : 'Others', percent: stats.total_scans ? othersPercent : 0, color: '#64748b' },
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
                            <TouchableOpacity 
                                style={[styles.btnSecondary, { borderColor: isLight ? '#cbd5e1' : colors.border }]}
                                onPress={handleDownloadPDF}
                            >
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
                            value={loading ? '...' : `${stats.total_scans.toLocaleString()} uds`}
                            delay={100}
                        />
                        <StatCard
                            icon="umbrella-outline"
                            trendText={language === 'es' ? 'Registradas' : 'Registered'}
                            trendColor="#0ea5e9"
                            label={language === 'es' ? 'Playas Intervenidas' : 'Beaches Cleaned'}
                            value={loading ? '...' : stats.total_beaches.toString()}
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
                            trendText={language === 'es' ? 'Registrados' : 'Registered'}
                            trendColor="#22c55e"
                            label={language === 'es' ? 'Guardianes Activos' : 'Active Guardians'}
                            value={loading ? '...' : stats.total_users.toString()}
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
                                            <Text style={[styles.donutValue, { color: colors.text }]}>
                                                {loading ? '...' : stats.total_scans.toLocaleString()}
                                            </Text>
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
