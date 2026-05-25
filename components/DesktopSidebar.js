
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Pressable, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useNavigationState, TabActions } from '@react-navigation/native';
import Animated, { FadeInLeft, useAnimatedStyle, withTiming, useSharedValue, Easing } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { useGame } from '../context/GameContext';
import { useLanguage } from '../context/LanguageContext';
import { BRAND, GRADIENTS } from '../constants/theme';
import { rs, rf, rh, SPACING, RADIUS, SIDEBAR_WIDTH } from '../constants/responsive';

if (Platform.OS === 'web') {
    const style = document.createElement('style');
    style.innerHTML = `
        html { scroll-behavior: smooth; }
        .sidebar-smooth { transition: width 0.4s cubic-bezier(0.25, 0.1, 0.25, 1); }
    `;
    document.head.appendChild(style);
}
const SidebarItem = ({ icon, label, routeName, isActive, onPress, index }) => {
    const { colors, isDark } = useTheme();
    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));
    return (
        <Animated.View entering={FadeInLeft.delay(index * 50).springify()}>
            <Pressable
                onPress={onPress}
                style={({ pressed }) => [
                    styles.sidebarItem,
                    isActive && styles.sidebarItemActive,
                    isActive && { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' },
                    pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }
                ]}
            >
                <View
                    style={[
                        styles.iconContainer,
                        isActive && { backgroundColor: colors.accent }
                    ]}
                >
                    <Ionicons
                        name={isActive ? icon : `${icon}-outline`}
                        size={rs(20)}
                        color={isActive ? '#fff' : colors.textSecondary}
                    />
                </View>
                <Text
                    style={[
                        styles.itemLabel,
                        { color: isActive ? colors.text : colors.textSecondary },
                        isActive && { fontWeight: '700' }
                    ]}
                >
                    {label}
                </Text>
                {isActive && (
                    <View style={[styles.activeIndicator, { backgroundColor: colors.accent }]} />
                )}
            </Pressable>
        </Animated.View>
    );
};
export default function DesktopSidebar() {
    const { colors, isDark } = useTheme();
    const { user, level } = useGame();
    const { t, language } = useLanguage();
    const navigation = useNavigation();

    const navItems = [
        { label: t('sidebar_home'), icon: 'home', route: 'Inicio' },
        { label: t('sidebar_map'), icon: 'map', route: 'Mapa' },
        { label: t('sidebar_scan'), icon: 'scan', route: 'Escanear' },
        { label: t('sidebar_rewards'), icon: 'trophy', route: 'Premios' },
        { label: t('sidebar_promos'), icon: 'gift', route: 'Promos', locked: level < 2 },
        { label: language === 'es' ? 'Reportes' : 'Reports', icon: 'flag', route: 'Reports' },
        { label: language === 'es' ? 'Estado de Reportes' : 'Report Status', icon: 'checkbox', route: 'ReportStatus' },
    ];

    const activeRoute = useNavigationState(state => {
        if (!state) return 'Inicio';
        const route = state.routes[state.index];
        if (route.name === 'App') {
            return route.state?.routes[route.state.index]?.name || 'Inicio';
        }
        return route.name;
    });

    const [isExpanded, setIsExpanded] = React.useState(false);

    const handleNavigate = (routeName) => {
        navigation.navigate('MainTabs', {
            screen: routeName,
            params: { timestamp: Date.now() }
        });
    };

    return (
        <>
            {/* Spacer to hold layout space */}
            <View style={{ width: rs(100), height: '100%', borderRightWidth: 1, borderColor: isDark ? colors.border : 'rgba(0,0,0,0.05)' }} />
            
            {/* Overlay animated sidebar */}
            <Animated.View 
                style={[
                    styles.container, 
                    { 
                        width: isExpanded ? rs(SIDEBAR_WIDTH) : rs(100),
                        position: 'absolute', 
                        left: 0, 
                        top: 0, 
                        bottom: 0, 
                        backgroundColor: isDark ? colors.backgroundSecondary : '#fff',
                        borderRightColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                        ...(Platform.OS === 'web' ? { transitionProperty: 'width', transitionDuration: '0.4s', transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)' } : {})
                    }
                ]}
            >
                { }
                <View style={[styles.logoContainer, { gap: SPACING.sm }]}>
                    <Pressable
                        style={({ pressed }) => [ pressed && { opacity: 0.7 } ]}
                        onPress={() => handleNavigate('Inicio')}
                    >
                        <LinearGradient
                            colors={GRADIENTS.primary}
                            style={styles.logoIcon}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Ionicons name="water" size={rs(24)} color="#fff" />
                        </LinearGradient>
                    </Pressable>
                    <Pressable
                        onPress={() => setIsExpanded(!isExpanded)}
                        style={({ pressed }) => [
                            pressed && { opacity: 0.7 }
                        ]}
                    >
                        <Ionicons name="menu" size={rs(28)} color={colors.text} />
                    </Pressable>
                    <Pressable onPress={() => handleNavigate('Inicio')} style={{ flex: 1 }}>
                        <Text style={[styles.appName, { color: colors.text }]} numberOfLines={1}>Tu Playa</Text>
                    </Pressable>
                </View>
                { }
                <Pressable
                    style={({ pressed }) => [
                        styles.profileCard,
                        { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' },
                        pressed && { opacity: 0.7 }
                    ]}
                    onPress={() => navigation.navigate('Profile')}
                >
                    {user.avatar ? (
                        <Image source={{ uri: user.avatar }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatarPlaceholder, { backgroundColor: colors.accent }]}>
                            <Text style={styles.avatarInitials}>{user.initials}</Text>
                        </View>
                    )}
                    <View style={styles.userInfo}>
                        <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
                            Destiny
                        </Text>
                        <Text style={[styles.userLevel, { color: colors.textSecondary }]} numberOfLines={1}>
                            {t('profile_level')} {level}
                        </Text>
                        <Text style={[styles.userLevel, { color: colors.textSecondary }]} numberOfLines={1}>
                            ({(user.tplTitle || 'Cleanup Rookie').replace(/[{}]/g, '')})
                        </Text>
                    </View>
                </Pressable>
                { }
                <ScrollView style={styles.navContainer} showsVerticalScrollIndicator={false}>
                    <Text style={[styles.sectionTitle, { color: colors.textMuted }]} numberOfLines={1}>{t('sidebar_menu')}</Text>
                    {navItems.map((item, index) => (
                        <SidebarItem
                            key={item.route}
                            index={index}
                            icon={item.icon}
                            label={item.label}
                            routeName={item.route}
                            isActive={activeRoute === item.route}
                            onPress={() => !item.locked && handleNavigate(item.route)}
                        />
                    ))}
                </ScrollView>
                { }
                <View style={styles.footer}>
                    <Pressable
                        style={({ pressed }) => [
                            styles.sidebarItem,
                            pressed && { opacity: 0.7 }
                        ]}
                        onPress={() => navigation.navigate('Profile')}
                    >
                        <View style={styles.iconContainer}>
                            <Ionicons name="settings-outline" size={rs(20)} color={colors.textSecondary} />
                        </View>
                        <Text style={[styles.itemLabel, { color: colors.textSecondary }]} numberOfLines={1}>{t('sidebar_settings')}</Text>
                    </Pressable>
                    <Text style={[styles.versionText, { color: colors.textMuted }]} numberOfLines={1}>{t('sidebar_version')}</Text>
                </View>
            </Animated.View>
        </>
    );
}
const styles = StyleSheet.create({
    container: {
        height: '100%',
        borderRightWidth: 1,
        paddingVertical: SPACING.xl,
        paddingHorizontal: SPACING.md,
        zIndex: 9999,
        elevation: 10,
        overflow: 'hidden',
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.xxl,
    },
    logoIcon: {
        width: rs(40),
        height: rs(40),
        borderRadius: rs(12),
        justifyContent: 'center',
        alignItems: 'center',
    },
    appName: {
        fontSize: rf(20),
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        borderRadius: RADIUS.lg,
        marginBottom: SPACING.xl,
        gap: SPACING.sm,
    },
    avatar: {
        width: rs(40),
        height: rs(40),
        borderRadius: rs(20),
    },
    avatarPlaceholder: {
        width: rs(40),
        height: rs(40),
        borderRadius: rs(20),
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitials: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: rf(14),
    },
    userInfo: {
        flex: 1,
        minWidth: 0,
    },
    userName: {
        fontSize: rf(14),
        fontWeight: '700',
    },
    userLevel: {
        fontSize: rf(11),
    },
    sectionTitle: {
        fontSize: rf(11),
        fontWeight: '700',
        marginBottom: SPACING.md,
        textAlign: 'center',
        letterSpacing: 1,
    },
    navContainer: {
        flex: 1,
    },
    sidebarItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        minHeight: rs(48),
        marginBottom: SPACING.xs,
        borderRadius: RADIUS.md,
        gap: SPACING.md,
        cursor: 'pointer',
        overflow: 'hidden',
    },
    sidebarItemActive: {
    },
    iconContainer: {
        width: rs(36),
        height: rs(36),
        borderRadius: rs(10),
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemLabel: {
        fontSize: rf(14),
        fontWeight: '500',
    },
    activeIndicator: {
        position: 'absolute',
        right: -SPACING.lg,
        width: 4,
        height: '60%',
        borderRadius: 2,
    },
    footer: {
        marginTop: SPACING.lg,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
        paddingTop: SPACING.md,
    },
    versionText: {
        fontSize: rf(10),
        marginTop: SPACING.sm,
        paddingLeft: SPACING.sm,
    },
});
