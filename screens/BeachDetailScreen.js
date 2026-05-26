import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Platform, Linking, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useGame } from '../context/GameContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { rs, rf, SPACING, RADIUS } from '../constants/responsive';
import { BRAND } from '../constants/theme';
import FlagIcon from '../components/FlagIcon';
import ReportModal from '../components/ReportModal';

const BLUE_GREY = "#607d8b";
const BLUE_GREY_BG = "rgba(96, 125, 139, 0.15)";

export default function BeachDetailScreen({ route, navigation }) {
    const { beach } = route.params || {};
    const { colors, isDark } = useTheme();
    const { t } = useLanguage();
    const { startCleanup } = useGame();
    const { width } = useWindowDimensions();
    const [showReportModal, setShowReportModal] = useState(false);

    // Si por alguna razon no llega beach data
    if (!beach) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: colors.text }}>{t('beach_detail_error') || 'Error loading beach data'}</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
                    <Text style={{ color: colors.primary }}>{t('beach_detail_go_back') || 'Go Back'}</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const textColor = isDark ? colors.text : "#000000";
    const subTextColor = isDark ? colors.textMuted : "#666666";
    const statusBg = beach.clean ? BLUE_GREY_BG : "rgba(245, 158, 11, 0.15)";
    const statusColor = beach.clean ? BLUE_GREY : "#f59e0b";

    const handleOpenMap = () => {
        const url = beach.mapUrl || `https://www.google.com/maps/search/?api=1&query=${beach.lat},${beach.lng}`;
        if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Linking.openURL(url);
    };

    const handleStartCleanup = () => {
        if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        startCleanup(beach);
        // Al estar en un Stack superior, debemos navegar al TabNavigator primero
        navigation.navigate('MainTabs', { screen: 'Escanear' });
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView bounces={false} contentContainerStyle={{ flexGrow: 1 }}>
                {/* Hero Header Image */}
                <View style={styles.imageContainer}>
                    <Image source={beach.image} style={styles.beachImage} resizeMode="cover" />
                    <LinearGradient
                        colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,0.8)']}
                        style={StyleSheet.absoluteFillObject}
                    />

                    {/* Navbar interactiva flotante superpuesta en la imagen */}
                    <SafeAreaView edges={['top']} style={styles.floatingNav}>
                        <TouchableOpacity
                            style={[styles.backButton, { backgroundColor: 'rgba(0,0,0,0.4)' }]}
                            onPress={() => {
                                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                navigation.goBack();
                            }}>
                            <Ionicons name="chevron-back" size={rs(24)} color="#fff" />
                        </TouchableOpacity>
                    </SafeAreaView>

                    {/* Titulo sobre la imagen flotando al fondo */}
                    <View style={styles.titleContainer}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: rs(8), marginBottom: rs(6) }}>
                            <FlagIcon code={beach.country} size={1} />
                            <Text style={styles.locationZoneText}>{beach.district}, {t(beach.zone)}</Text>
                        </View>
                        <Text style={styles.beachName}>{beach.name}</Text>
                    </View>
                </View>

                {/* Main Content Body */}
                <View style={[styles.contentContainer, { backgroundColor: colors.card, borderTopLeftRadius: RADIUS.xl * 1.5, borderTopRightRadius: RADIUS.xl * 1.5, marginTop: -rs(30) }]}>

                    {/* Estadisticas rapidas superiores */}
                    <View style={styles.statsRow}>
                        <View style={[styles.statBadge, { backgroundColor: statusBg }]}>
                            <Ionicons name={beach.clean ? "checkmark-circle" : "alert-circle"} size={rs(20)} color={statusColor} />
                            <Text style={[styles.statText, { color: statusColor }]}>
                                {beach.clean ? t("map_clean") : t("map_dirty")}
                            </Text>
                        </View>
                        <View style={[styles.statBadge, { backgroundColor: BLUE_GREY_BG }]}>
                            <Ionicons name="people" size={rs(20)} color={BLUE_GREY} />
                            <Text style={[styles.statText, { color: BLUE_GREY }]}>
                                {beach.people} {t("map_cleaning_count")}
                            </Text>
                        </View>
                    </View>

                    {/* Bloque descriptivo / Contexto de la playa */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: textColor }]}>{t('beach_detail_about') || 'About this beach'}</Text>
                        <Text style={[styles.description, { color: subTextColor }]}>
                            {beach.name}{t('beach_detail_located_in', { location: `${beach.district}, ${t(beach.zone)}` })}{beach.clean ? t('beach_detail_desc_clean') : t('beach_detail_desc_dirty')}
                        </Text>
                    </View>

                    {/* Bloque de Acciones: Google Maps */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: textColor }]}>{t('beach_detail_location') || 'Location Details'}</Text>
                        <TouchableOpacity
                            style={[styles.mapActionBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc', borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0' }]}
                            onPress={handleOpenMap}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.mapActionIcon, { backgroundColor: BLUE_GREY }]}>
                                <Ionicons name="map" size={rs(20)} color="#fff" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.mapActionTitle, { color: textColor }]}>{t('beach_detail_open_map') || 'Open in Google Maps'}</Text>
                                <Text style={[styles.mapActionSub, { color: subTextColor }]}>{beach.lat.toFixed(4)}, {beach.lng.toFixed(4)}</Text>
                            </View>
                            <Ionicons name="open-outline" size={rs(20)} color={subTextColor} />
                        </TouchableOpacity>
                    </View>

                    {/* Botón de Acción Principal: Iniciar Limpieza */}
                    <TouchableOpacity
                        style={[styles.primaryButton, { backgroundColor: colors.primary, marginTop: SPACING.lg }]}
                        onPress={handleStartCleanup}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={[colors.primary, BRAND.oceanDeep]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={StyleSheet.absoluteFillObject}
                        />
                        <Ionicons name="camera" size={rs(22)} color="#fff" />
                        <Text style={styles.primaryButtonText}>{t('beach_start_cleanup')}</Text>
                    </TouchableOpacity>

                    {/* Fila de Reportes (Fila 2) */}
                    <View style={{ flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.md }}>
                        {/* Botón Secundario: Enviar Reporte */}
                        <TouchableOpacity
                            style={[styles.primaryButton, { flex: 1, backgroundColor: '#10b981', marginTop: 0 }]}
                            onPress={() => setShowReportModal(true)}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#10b981', '#059669']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={StyleSheet.absoluteFillObject}
                            />
                            <Ionicons name="document-text-outline" size={rs(18)} color="#fff" />
                            <Text style={[styles.primaryButtonText, { fontSize: rf(13) }]} numberOfLines={1}>Enviar Reporte</Text>
                        </TouchableOpacity>

                        {/* Botón Terciario: Revisar Reportes */}
                        <TouchableOpacity
                            style={[styles.primaryButton, { flex: 1, backgroundColor: '#f59e0b', marginTop: 0 }]}
                            onPress={() => navigation.navigate('BeachReports', { beach })}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#f59e0b', '#d97706']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={StyleSheet.absoluteFillObject}
                            />
                            <Ionicons name="list" size={rs(18)} color="#fff" />
                            <Text style={[styles.primaryButtonText, { fontSize: rf(13) }]} numberOfLines={1}>Revisar Reportes</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            <ReportModal 
                visible={showReportModal} 
                beach={beach} 
                onClose={() => setShowReportModal(false)} 
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    imageContainer: {
        width: '100%',
        height: rs(350),
        position: 'relative'
    },
    beachImage: {
        width: '100%',
        height: '100%'
    },
    floatingNav: {
        position: 'absolute',
        top: 0, left: 0, right: 0,
        paddingHorizontal: SPACING.md,
        paddingTop: SPACING.sm,
        flexDirection: 'row',
    },
    backButton: {
        width: rs(40), height: rs(40),
        borderRadius: RADIUS.full,
        justifyContent: 'center', alignItems: 'center',
        backdropFilter: 'blur(5px)',
    },
    titleContainer: {
        position: 'absolute',
        bottom: rs(50), left: SPACING.lg, right: SPACING.lg
    },
    locationZoneText: {
        color: '#fff', fontSize: rf(14), fontWeight: '600',
        textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4
    },
    beachName: {
        color: '#fff', fontSize: rf(32), fontWeight: '800',
        textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6,
        letterSpacing: 0.5
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.xl,
        paddingBottom: SPACING.xxl * 2,
    },
    statsRow: {
        flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.xl
    },
    statBadge: {
        flexDirection: 'row', alignItems: 'center', paddingVertical: rs(8), paddingHorizontal: rs(12),
        borderRadius: RADIUS.lg, gap: rs(6), flex: 1, justifyContent: 'center'
    },
    statText: { fontSize: rf(14), fontWeight: '700' },
    section: {
        marginBottom: SPACING.xl
    },
    sectionTitle: {
        fontSize: rf(18), fontWeight: '700', marginBottom: SPACING.md
    },
    description: {
        fontSize: rf(15), lineHeight: rf(22), opacity: 0.9
    },
    mapActionBox: {
        flexDirection: 'row', alignItems: 'center', padding: SPACING.md,
        borderRadius: RADIUS.lg, borderWidth: 1, gap: SPACING.md
    },
    mapActionIcon: {
        width: rs(46), height: rs(46), borderRadius: RADIUS.md,
        justifyContent: 'center', alignItems: 'center'
    },
    mapActionTitle: {
        fontSize: rf(15), fontWeight: '600', marginBottom: rs(2)
    },
    mapActionSub: {
        fontSize: rf(12),
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: rs(16),
        borderRadius: RADIUS.xl,
        gap: rs(10),
        marginTop: SPACING.lg,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: rf(18),
        fontWeight: '700',
        letterSpacing: 0.5,
    }
});
