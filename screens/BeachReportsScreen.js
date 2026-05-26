import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { rs, rf, rh, rw, SPACING, RADIUS } from '../constants/responsive';
import ENV from '../constants/env';

// Base URL for API - fallback to localhost if not set
const API_URL = ENV.API_BASE_URL;


export default function BeachReportsScreen({ route, navigation }) {
    const { beach } = route.params || {};
    const { colors, isDark } = useTheme();
    const [cleanupHistory, setCleanupHistory] = useState([]);
    const [userReports, setUserReports] = useState([]);
    const [loading, setLoading] = useState(true);

    const textColor = isDark ? colors.text : "#0B3B60"; // Deep blue from mockup
    const subTextColor = isDark ? colors.textMuted : "#64748B";

    useEffect(() => {
        fetchData();
    }, [beach]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const beachName = beach?.name || 'Playa Miramar';
            
            // Fetch Users for Cleanup History (Top contributors)
            // Note: Since we don't have beach-specific logs yet, we show global top contributors
            const usersResp = await fetch(`${API_URL}/api/users?limit=10`);
            const usersData = await usersResp.json();
            
            if (usersData.success) {
                const history = usersData.users.map(u => ({
                    id: u._id,
                    title: u.username || 'Explorador TPL',
                    date: u.updated_at ? new Date(u.updated_at).toLocaleDateString() : 'Reciente',
                    participants: 1,
                    residues: u.total_scans || 0,
                    bottles: u.bottle_scans || 0,
                    cans: u.can_scans || 0,
                    plastics: u.plastic_scans || 0
                }));
                setCleanupHistory(history);
            }

            // Fetch Reports for this beach
            const reportsResp = await fetch(`${API_URL}/api/reports/beach/${encodeURIComponent(beachName)}`);
            const reportsData = await reportsResp.json();
            
            if (reportsData.success) {
                const reports = reportsData.reports.map(r => ({
                    id: r._id,
                    title: r.report_type?.toUpperCase() || 'REPORTE',
                    details: r.details || r.msg || 'Sin detalles',
                    userName: r.user_name || 'Anónimo',
                    image: r.image_uri ? { uri: r.image_uri } : null,
                    status: r.status === 'pending' ? 'PENDIENTE' : 'VALIDADO',
                    timeAgo: r.saved_at ? new Date(r.saved_at).toLocaleDateString() : 'Hace poco'
                }));
                setUserReports(reports);
            }
        } catch (error) {
            console.error('Error fetching beach data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        navigation.goBack();
    };

    const renderTimelineNode = (item, isLast) => (
        <View key={item.id} style={styles.timelineRow}>
            {/* Timeline graphics */}
            <View style={styles.timelineGraphics}>
                <View style={styles.timelineDot} />
                {!isLast && <View style={styles.timelineLine} />}
            </View>

            {/* Timeline content */}
            <View style={[styles.timelineCard, { backgroundColor: isDark ? colors.card : '#fff' }]}>
                <View style={styles.timelineHeaderRow}>
                    <Text style={[styles.timelineTitle, { color: textColor }]}>{item.title}</Text>
                    <View style={styles.timelineDateBadge}>
                        <Text style={styles.timelineDateText}>{item.date}</Text>
                    </View>
                </View>
                
                <View style={styles.timelineStatsRow}>
                    <View style={styles.timelineStat}>
                        <Ionicons name="wine-outline" size={rs(16)} color={subTextColor} />
                        <Text style={[styles.timelineStatText, { color: subTextColor }]}>{item.bottles} botellas</Text>
                    </View>
                    <View style={styles.timelineStat}>
                        <Ionicons name="apps-outline" size={rs(16)} color={subTextColor} />
                        <Text style={[styles.timelineStatText, { color: subTextColor }]}>{item.cans} latas</Text>
                    </View>
                    <View style={styles.timelineStat}>
                        <Ionicons name="leaf-outline" size={rs(16)} color={subTextColor} />
                        <Text style={[styles.timelineStatText, { color: subTextColor }]}>{item.plastics} plásticos</Text>
                    </View>
                </View>
            </View>
        </View>
    );

    const renderReportCard = (report) => (
        <View key={report.id} style={[styles.reportCard, { backgroundColor: isDark ? colors.card : '#fff' }]}>
            {report.image ? (
                <Image source={report.image} style={styles.reportImage} />
            ) : (
                <View style={[styles.reportImagePlaceholder, { backgroundColor: isDark ? colors.background : '#F1F5F9' }]}>
                    <Ionicons name="image-outline" size={rs(30)} color={subTextColor} />
                </View>
            )}
            
            <View style={styles.reportContent}>
                <View style={styles.reportHeader}>
                    <View style={[styles.statusBadge, report.status === 'VALIDADO' && { backgroundColor: '#D1FAE5' }]}>
                        <Text style={[styles.statusText, report.status === 'VALIDADO' && { color: '#059669' }]}>{report.status}</Text>
                    </View>
                    <Text style={[styles.timeAgo, { color: subTextColor }]}>{report.timeAgo}</Text>
                </View>

                <Text style={[styles.reportTitle, { color: textColor }]} numberOfLines={1}>
                    {report.title} - {report.userName}
                </Text>
                
                <Text style={[styles.reportDetails, { color: subTextColor }]} numberOfLines={2}>
                    {report.details}
                </Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.background : '#F8FAFC' }]} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={rs(24)} color={textColor} />
                </TouchableOpacity>
                <View style={styles.headerTitles}>
                    <Text style={[styles.headerSubtitle, { color: '#F59E0B' }]}>DETALLES DE UBICACIÓN</Text>
                    <Text style={[styles.headerTitle, { color: textColor }]}>{beach?.name || 'Playa Miramar'}</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                {/* Hero Banner */}
                <View style={styles.bannerContainer}>
                    <Image source={beach?.image || { uri: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800' }} style={styles.bannerImage} />
                    <View style={styles.weatherPill}>
                        <Ionicons name="water-outline" size={rs(14)} color="#fff" />
                        <Text style={styles.weatherText}>78°F</Text>
                    </View>
                </View>

                {/* Historial de Limpieza Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View>
                            <Text style={[styles.sectionTitle, { color: textColor }]}>Historial de Limpieza</Text>
                            <Text style={[styles.sectionSubtitle, { color: subTextColor }]}>Cronología de impacto ambiental</Text>
                        </View>
                        <Ionicons name="time-outline" size={rs(20)} color={textColor} />
                    </View>

                    {loading ? (
                        <View style={styles.loadingSection}>
                            <ActivityIndicator size="large" color={colors.primary} />
                        </View>
                    ) : cleanupHistory.length === 0 ? (
                        <View style={[styles.emptyState, { backgroundColor: isDark ? colors.card : '#fff' }]}>
                            <Ionicons name="calendar-outline" size={rs(36)} color={subTextColor} />
                            <Text style={[styles.emptyStateTitle, { color: textColor }]}>Sin historial registrado</Text>
                            <Text style={[styles.emptyStateDesc, { color: subTextColor }]}>Aún no hay limpiezas registradas en esta playa.</Text>
                        </View>
                    ) : (
                        <View style={styles.timelineContainer}>
                            {cleanupHistory.map((item, index) => renderTimelineNode(item, index === cleanupHistory.length - 1))}
                        </View>
                    )}
                </View>

                {/* Revision de Reportes Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionTitleRow}>
                            <View style={styles.sectionTitleAccent} />
                            <Text style={[styles.sectionTitle, { color: textColor }]}>Revisión de Reportes de Usuario</Text>
                        </View>
                    </View>

                    {loading ? (
                        <View style={styles.loadingSection}>
                            <ActivityIndicator size="large" color={colors.primary} />
                        </View>
                    ) : userReports.length === 0 ? (
                        <View style={[styles.emptyState, { backgroundColor: isDark ? colors.card : '#fff' }]}>
                            <Ionicons name="document-outline" size={rs(36)} color={subTextColor} />
                            <Text style={[styles.emptyStateTitle, { color: textColor }]}>Sin reportes registrados</Text>
                            <Text style={[styles.emptyStateDesc, { color: subTextColor }]}>No se encuentran reportes para esta playa aún.</Text>
                        </View>
                    ) : (
                        <View style={styles.reportsContainer}>
                            {userReports.map(renderReportCard)}
                        </View>
                    )}
                </View>

                <View style={{ height: rs(80) }} />
            </ScrollView>

            {/* Floating Action Button */}
            <TouchableOpacity style={styles.fab} activeOpacity={0.8}>
                <LinearGradient
                    colors={['#0B3B60', '#062038']}
                    style={styles.fabGradient}
                >
                    <Ionicons name="add" size={rs(30)} color="#fff" />
                </LinearGradient>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
    },
    backButton: {
        marginRight: SPACING.md,
        padding: SPACING.xs,
    },
    headerTitles: {
        flex: 1,
    },
    headerSubtitle: {
        fontSize: rf(10),
        fontWeight: '800',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: rs(2),
    },
    headerTitle: {
        fontSize: rf(24),
        fontWeight: '800',
    },
    scrollContent: {
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.xxl,
    },
    bannerContainer: {
        width: '100%',
        height: rs(140),
        borderRadius: RADIUS.xl,
        overflow: 'hidden',
        marginTop: SPACING.md,
        marginBottom: SPACING.xl,
    },
    bannerImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    weatherPill: {
        position: 'absolute',
        top: SPACING.md,
        right: SPACING.md,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(56, 189, 248, 0.8)',
        paddingHorizontal: rs(10),
        paddingVertical: rs(4),
        borderRadius: RADIUS.full,
        gap: rs(4),
    },
    weatherText: {
        color: '#fff',
        fontSize: rf(12),
        fontWeight: '700',
    },
    section: {
        marginBottom: SPACING.xxl,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: SPACING.lg,
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    sectionTitleAccent: {
        width: rs(4),
        height: rs(20),
        backgroundColor: '#B45309', // Dark orange accent from mockup
        borderRadius: RADIUS.full,
    },
    sectionTitle: {
        fontSize: rf(18),
        fontWeight: '800',
    },
    sectionSubtitle: {
        fontSize: rf(13),
        marginTop: rs(2),
    },
    timelineContainer: {
        paddingLeft: rs(10),
    },
    timelineRow: {
        flexDirection: 'row',
        marginBottom: SPACING.md,
    },
    timelineGraphics: {
        width: rs(30),
        alignItems: 'center',
    },
    timelineDot: {
        width: rs(12),
        height: rs(12),
        borderRadius: rs(6),
        backgroundColor: '#0EA5E9', // Cyan/blue dot
        borderWidth: 3,
        borderColor: '#E0F2FE', // Light blue outer ring
        zIndex: 1,
        marginTop: rs(8),
    },
    timelineLine: {
        width: 1,
        flex: 1,
        backgroundColor: '#CBD5E1',
        marginTop: rs(-6),
        marginBottom: rs(-20),
    },
    timelineCard: {
        flex: 1,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    timelineHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    timelineTitle: {
        fontSize: rf(15),
        fontWeight: '700',
        flex: 1,
    },
    timelineDateBadge: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: rs(8),
        paddingVertical: rs(4),
        borderRadius: RADIUS.sm,
    },
    timelineDateText: {
        fontSize: rf(11),
        color: '#64748B',
        fontWeight: '600',
    },
    timelineStatsRow: {
        flexDirection: 'row',
        gap: SPACING.xl,
    },
    timelineStat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: rs(6),
    },
    timelineStatText: {
        fontSize: rf(13),
        fontWeight: '500',
    },
    reportsContainer: {
        gap: SPACING.md,
    },
    reportCard: {
        flexDirection: 'row',
        padding: SPACING.sm,
        borderRadius: RADIUS.xl,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        alignItems: 'center',
    },
    reportImage: {
        width: rs(80),
        height: rs(80),
        borderRadius: RADIUS.lg,
        marginRight: SPACING.md,
    },
    reportImagePlaceholder: {
        width: rs(80),
        height: rs(80),
        borderRadius: RADIUS.lg,
        marginRight: SPACING.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingSection: {
        paddingVertical: SPACING.xl,
        alignItems: 'center',
    },
    reportContent: {
        flex: 1,
        justifyContent: 'center',
    },
    reportHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: rs(4),
    },
    statusBadge: {
        backgroundColor: '#FEF3C7',
        paddingHorizontal: rs(8),
        paddingVertical: rs(4),
        borderRadius: RADIUS.sm,
    },
    statusText: {
        color: '#D97706',
        fontSize: rf(10),
        fontWeight: '800',
    },
    timeAgo: {
        fontSize: rf(11),
    },
    reportTitle: {
        fontSize: rf(15),
        fontWeight: '700',
        marginBottom: rs(4),
    },
    reportDetails: {
        fontSize: rf(12),
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.xxl,
        paddingHorizontal: SPACING.xl,
        borderRadius: RADIUS.xl,
        gap: rs(8),
    },
    emptyStateTitle: {
        fontSize: rf(15),
        fontWeight: '700',
        textAlign: 'center',
    },
    emptyStateDesc: {
        fontSize: rf(13),
        textAlign: 'center',
        opacity: 0.8,
    },
    fab: {
        position: 'absolute',
        bottom: SPACING.xl,
        right: SPACING.lg,
        width: rs(60),
        height: rs(60),
        borderRadius: rs(30),
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
    },
    fabGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: rs(30),
    }
});
