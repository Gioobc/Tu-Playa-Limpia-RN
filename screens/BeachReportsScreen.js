import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Platform, ActivityIndicator, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { rs, rf, rh, rw, SPACING, RADIUS } from '../constants/responsive';
import ENV from '../constants/env';
import ScalePressable from '../components/ScalePressable';

// Base URL for API - fallback to localhost if not set
const API_URL = ENV.API_BASE_URL;


export default function BeachReportsScreen({ route, navigation }) {
    const { beach } = route.params || {};
    const { colors, isDark } = useTheme();
    const { language } = useLanguage();
    const { isAdmin } = useAuth();
    const [cleanupHistory, setCleanupHistory] = useState([]);
    const [userReports, setUserReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState(null);
    const [updatingReport, setUpdatingReport] = useState(false);

    const textColor = isDark ? colors.text : "#0B3B60"; // Deep blue from mockup
    const subTextColor = isDark ? colors.textMuted : "#64748B";

    const getStatusLabel = (status) => {
        const normalized = (status || '').toUpperCase();
        if (normalized === 'CONFIRMED') return language === 'es' ? 'CONFIRMADO' : 'CONFIRMED';
        if (normalized === 'DENIED') return language === 'es' ? 'DENEGADO' : 'DENIED';
        return language === 'es' ? 'PENDIENTE' : 'PENDING';
    };

    const getStatusStyle = (status) => {
        const normalized = (status || '').toUpperCase();
        if (normalized === 'CONFIRMED') return { backgroundColor: '#D1FAE5', color: '#059669' };
        if (normalized === 'DENIED') return { backgroundColor: '#FEE2E2', color: '#DC2626' };
        return { backgroundColor: '#FEF3C7', color: '#D97706' };
    };

    const getReportTypeLabel = (type) => {
        const normalized = (type || '').toLowerCase();
        const map = {
            general: language === 'es' ? 'General' : 'General',
            state: language === 'es' ? 'Estado de Playa' : 'Beach State',
            trash: language === 'es' ? 'Basura Anormal' : 'Large Waste',
            animal: language === 'es' ? 'Animal Muerto' : 'Dead Animal',
        };
        return map[normalized] || (type ? type.toUpperCase() : (language === 'es' ? 'REPORTE' : 'REPORT'));
    };

    const isGlobalAdminView = !beach;
    const canReviewReports = isAdmin || isGlobalAdminView;

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

            // Fetch reports: all reports for admin/global view, beach-only for location view
            const reportsUrl = isGlobalAdminView
                ? `${API_URL}/api/reports`
                : `${API_URL}/api/reports/beach/${encodeURIComponent(beachName)}`;
            const reportsResp = await fetch(reportsUrl);
            const reportsData = await reportsResp.json();
            
            if (reportsData.success) {
                const reports = reportsData.reports.map(r => ({
                    id: r._id,
                    title: getReportTypeLabel(r.report_type),
                    details: r.msg || r.details || 'Sin detalles',
                    userName: r.user_name || 'Anónimo',
                    image: r.image_uri ? { uri: r.image_uri } : null,
                    status: (r.status || 'PENDING').toUpperCase(),
                    timeAgo: r.saved_at ? new Date(r.saved_at).toLocaleDateString() : 'Hace poco',
                    beachName: r.beach_name || beachName,
                    reportType: r.report_type || 'general',
                    location: r.location || {},
                    sector: r.location?.sector || r.sector || 'General',
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

    const handleOpenReport = (report) => {
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setSelectedReport(report);
    };

    const handleUpdateReportStatus = async (newStatus) => {
        if (!selectedReport || updatingReport) return;
        setUpdatingReport(true);
        try {
            const response = await fetch(`${API_URL}/api/reports/${selectedReport.id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.detail || data.message || `HTTP ${response.status}`);
            }

            setUserReports(prev => prev.map(report => (
                report.id === selectedReport.id ? { ...report, status: newStatus } : report
            )));
            setSelectedReport(prev => prev ? { ...prev, status: newStatus } : prev);
        } catch (error) {
            console.error('Error updating report status:', error);
            if (Platform.OS === 'web') {
                alert(error.message || 'No se pudo actualizar el reporte');
            } else {
                Alert.alert(language === 'es' ? 'Error' : 'Error', error.message || (language === 'es' ? 'No se pudo actualizar el reporte' : 'Could not update the report'));
            }
        } finally {
            setUpdatingReport(false);
        }
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

    const renderReportCard = (report) => {
        const statusStyle = getStatusStyle(report.status);
        const CardComponent = canReviewReports ? TouchableOpacity : View;
        const cardProps = canReviewReports
            ? {
                activeOpacity: 0.85,
                onPress: () => handleOpenReport(report),
            }
            : {};
        return (
        <CardComponent
            key={report.id}
            {...cardProps}
            style={[styles.reportCard, { backgroundColor: isDark ? colors.card : '#fff' }]}
        >
            {report.image ? (
                <Image source={report.image} style={styles.reportImage} />
            ) : (
                <View style={[styles.reportImagePlaceholder, { backgroundColor: isDark ? colors.background : '#F1F5F9' }]}>
                    <Ionicons name="image-outline" size={rs(30)} color={subTextColor} />
                </View>
            )}
            
            <View style={styles.reportContent}>
                <View style={styles.reportHeader}>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
                        <Text style={[styles.statusText, { color: statusStyle.color }]}>{getStatusLabel(report.status)}</Text>
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
        </CardComponent>
        );
    };

    const selectedStatusStyle = selectedReport ? getStatusStyle(selectedReport.status) : getStatusStyle('PENDING');

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
                            <Text style={[styles.sectionTitle, { color: textColor }]}>
                                {isGlobalAdminView
                                    ? (language === 'es' ? 'Revisión de Todos los Reportes' : 'Review All Reports')
                                    : (language === 'es' ? 'Revisión de Reportes de Usuario' : 'User Report Review')}
                            </Text>
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

                    {canReviewReports ? (
                    <Modal
                        visible={!!selectedReport}
                        transparent
                        animationType="fade"
                        onRequestClose={() => setSelectedReport(null)}
                    >
                        <View style={styles.detailOverlay}>
                            <View style={[styles.detailCard, { backgroundColor: isDark ? colors.card : '#ffffff', borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0' }]}>
                                <ScalePressable onPress={() => setSelectedReport(null)} style={styles.detailCloseButton}>
                                    <Ionicons name="close" size={rs(20)} color={colors.textMuted} />
                                </ScalePressable>

                                <View style={styles.detailHeader}>
                                    <View style={[styles.detailBadge, { backgroundColor: selectedStatusStyle.backgroundColor }]}>
                                        <Text style={[styles.detailBadgeText, { color: selectedStatusStyle.color }]}>
                                            {getStatusLabel(selectedReport?.status)}
                                        </Text>
                                    </View>
                                    <Text style={[styles.detailTitle, { color: textColor }]} numberOfLines={2}>
                                        {selectedReport?.title} - {selectedReport?.userName}
                                    </Text>
                                    <Text style={[styles.detailSubtitle, { color: subTextColor }]}>
                                        {selectedReport?.timeAgo} • {selectedReport?.beachName}
                                    </Text>
                                </View>

                                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.detailScrollContent}>
                                    {selectedReport?.image ? (
                                        <Image source={selectedReport.image} style={styles.detailImage} />
                                    ) : (
                                        <View style={[styles.detailImagePlaceholder, { backgroundColor: isDark ? colors.background : '#F8FAFC' }]}>
                                            <Ionicons name="image-outline" size={rs(42)} color={subTextColor} />
                                        </View>
                                    )}

                                    <View style={styles.detailMetaGrid}>
                                        <View style={[styles.detailMetaCard, { backgroundColor: isDark ? colors.background : '#F8FAFC' }]}>
                                            <Text style={[styles.detailMetaLabel, { color: subTextColor }]}>{language === 'es' ? 'Playa' : 'Beach'}</Text>
                                            <Text style={[styles.detailMetaValue, { color: textColor }]}>{selectedReport?.beachName}</Text>
                                        </View>
                                        <View style={[styles.detailMetaCard, { backgroundColor: isDark ? colors.background : '#F8FAFC' }]}>
                                            <Text style={[styles.detailMetaLabel, { color: subTextColor }]}>{language === 'es' ? 'Tipo' : 'Type'}</Text>
                                            <Text style={[styles.detailMetaValue, { color: textColor }]}>{selectedReport?.title}</Text>
                                        </View>
                                    </View>

                                    <View style={[styles.detailSection, { backgroundColor: isDark ? colors.background : '#F8FAFC' }]}>
                                        <Text style={[styles.detailSectionLabel, { color: subTextColor }]}>{language === 'es' ? 'Descripción' : 'Description'}</Text>
                                        <Text style={[styles.detailDescription, { color: textColor }]}>{selectedReport?.details}</Text>
                                    </View>

                                    <View style={[styles.detailSection, { backgroundColor: isDark ? colors.background : '#F8FAFC' }]}>
                                        <Text style={[styles.detailSectionLabel, { color: subTextColor }]}>{language === 'es' ? 'Ubicación reportada' : 'Reported location'}</Text>
                                        <Text style={[styles.detailDescription, { color: textColor }]}>
                                            {selectedReport?.location?.sector || (language === 'es' ? 'Sector general' : 'General sector')}
                                        </Text>
                                        <Text style={[styles.detailTiny, { color: subTextColor }]}>
                                            {selectedReport?.location?.lat ? `Lat: ${selectedReport.location.lat}` : ''}
                                            {selectedReport?.location?.lng ? `  •  Lng: ${selectedReport.location.lng}` : ''}
                                        </Text>
                                    </View>

                                    <View style={[styles.detailSection, { backgroundColor: isDark ? colors.background : '#F8FAFC' }]}>
                                        <Text style={[styles.detailSectionLabel, { color: subTextColor }]}>{language === 'es' ? 'Detalle del usuario' : 'User details'}</Text>
                                        <Text style={[styles.detailTiny, { color: textColor }]}>{selectedReport?.userName}</Text>
                                    </View>
                                </ScrollView>

                                <View style={styles.detailActions}>
                                    <TouchableOpacity
                                        disabled={updatingReport}
                                        onPress={() => handleUpdateReportStatus('CONFIRMED')}
                                        style={[styles.detailActionButton, styles.confirmButton, updatingReport && { opacity: 0.7 }]}
                                    >
                                        <Ionicons name="checkmark-circle-outline" size={rs(18)} color="#fff" />
                                        <Text style={styles.detailActionText}>{language === 'es' ? 'Confirmar Reporte' : 'Confirm Report'}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        disabled={updatingReport}
                                        onPress={() => handleUpdateReportStatus('DENIED')}
                                        style={[styles.detailActionButton, styles.denyButton, updatingReport && { opacity: 0.7 }]}
                                    >
                                        <Ionicons name="close-circle-outline" size={rs(18)} color="#fff" />
                                        <Text style={styles.detailActionText}>{language === 'es' ? 'Denegar Reporte' : 'Deny Report'}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </Modal>
                    ) : null}

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
    detailOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.55)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.lg,
    },
    detailCard: {
        width: '100%',
        maxWidth: rs(720),
        maxHeight: '92%',
        borderRadius: RADIUS.xl,
        borderWidth: 1,
        padding: SPACING.lg,
        position: 'relative',
    },
    detailCloseButton: {
        position: 'absolute',
        top: SPACING.md,
        right: SPACING.md,
        zIndex: 2,
        padding: SPACING.xs,
    },
    detailHeader: {
        paddingRight: rs(36),
        marginBottom: SPACING.md,
    },
    detailBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: rs(10),
        paddingVertical: rs(4),
        borderRadius: RADIUS.full,
        marginBottom: SPACING.sm,
    },
    detailBadgeText: {
        fontSize: rf(11),
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    detailTitle: {
        fontSize: rf(20),
        fontWeight: '800',
        marginBottom: rs(4),
    },
    detailSubtitle: {
        fontSize: rf(12),
        fontWeight: '600',
    },
    detailScrollContent: {
        paddingBottom: SPACING.md,
    },
    detailImage: {
        width: '100%',
        height: rs(220),
        borderRadius: RADIUS.xl,
        marginBottom: SPACING.md,
    },
    detailImagePlaceholder: {
        width: '100%',
        height: rs(220),
        borderRadius: RADIUS.xl,
        marginBottom: SPACING.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    detailMetaGrid: {
        flexDirection: 'row',
        gap: SPACING.sm,
        marginBottom: SPACING.md,
    },
    detailMetaCard: {
        flex: 1,
        padding: SPACING.md,
        borderRadius: RADIUS.lg,
    },
    detailMetaLabel: {
        fontSize: rf(11),
        fontWeight: '700',
        marginBottom: rs(4),
        textTransform: 'uppercase',
    },
    detailMetaValue: {
        fontSize: rf(14),
        fontWeight: '800',
    },
    detailSection: {
        padding: SPACING.md,
        borderRadius: RADIUS.lg,
        marginBottom: SPACING.sm,
    },
    detailSectionLabel: {
        fontSize: rf(11),
        fontWeight: '700',
        textTransform: 'uppercase',
        marginBottom: rs(6),
    },
    detailDescription: {
        fontSize: rf(14),
        lineHeight: rf(21),
        fontWeight: '500',
    },
    detailTiny: {
        fontSize: rf(11),
        marginTop: rs(6),
    },
    detailActions: {
        flexDirection: 'row',
        gap: SPACING.sm,
        marginTop: SPACING.sm,
    },
    detailActionButton: {
        flex: 1,
        minHeight: rs(48),
        borderRadius: RADIUS.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: rs(6),
    },
    confirmButton: {
        backgroundColor: '#16a34a',
    },
    denyButton: {
        backgroundColor: '#dc2626',
    },
    detailActionText: {
        color: '#fff',
        fontSize: rf(13),
        fontWeight: '800',
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
