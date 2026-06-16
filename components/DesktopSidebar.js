
import React, { useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Image, Pressable, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useGame } from '../context/GameContext';
import { useLanguage } from '../context/LanguageContext';
import { GRADIENTS } from '../constants/theme';
import { rs, rf, rh, SPACING, RADIUS, SIDEBAR_WIDTH } from '../constants/responsive';

export const SIDEBAR_COLLAPSED = rs(100);
export const SIDEBAR_EXPANDED  = rs(SIDEBAR_WIDTH);

// ─── Item de navegación ───────────────────────────────────────────────────────
const SidebarItem = ({ icon, label, isActive, onPress, textOpacity, index }) => {
    const { colors, isDark } = useTheme();

    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                styles.sidebarItem,
                isActive && { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' },
                pressed && { opacity: 0.75, transform: [{ scale: 0.97 }] },
            ]}
        >
            <View style={[styles.iconContainer, isActive && { backgroundColor: colors.accent }]}>
                <Ionicons
                    name={isActive ? icon : `${icon}-outline`}
                    size={rs(20)}
                    color={isActive ? '#fff' : colors.textSecondary}
                />
            </View>

            <Animated.Text
                numberOfLines={1}
                style={[
                    styles.itemLabel,
                    {
                        color:      isActive ? colors.text : colors.textSecondary,
                        fontWeight: isActive ? '700' : '500',
                        opacity:    textOpacity,
                    },
                ]}
            >
                {label}
            </Animated.Text>

            {isActive && (
                <View style={[styles.activeIndicator, { backgroundColor: colors.accent }]} />
            )}
        </Pressable>
    );
};

// ─── Sidebar principal ────────────────────────────────────────────────────────
export default function DesktopSidebar({ isAdmin = false, onExpandChange }) {
    const { colors, isDark } = useTheme();
    const { user, level }   = useGame();
    const { t, language }   = useLanguage();
    const navigation        = useNavigation();

    const [isExpanded, setIsExpanded] = React.useState(false);
    const sidebarAnim = useRef(new Animated.Value(SIDEBAR_COLLAPSED)).current;

    // Opacity for text / labels — appears only when expanded
    const textOpacity = sidebarAnim.interpolate({
        inputRange:  [SIDEBAR_COLLAPSED, SIDEBAR_EXPANDED - rs(30)],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    // Rotate the hamburger icon when expanded
    const menuRotate = sidebarAnim.interpolate({
        inputRange:  [SIDEBAR_COLLAPSED, SIDEBAR_EXPANDED],
        outputRange: ['0deg', '180deg'],
        extrapolate: 'clamp',
    });

    const toggleSidebar = useCallback(() => {
        const next   = !isExpanded;
        const target = next ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED;
        setIsExpanded(next);
        Animated.spring(sidebarAnim, {
            toValue:           target,
            useNativeDriver:   false,
            tension:           70,
            friction:          12,
            overshootClamping: false,
        }).start();
        onExpandChange && onExpandChange(next, target);
    }, [isExpanded, sidebarAnim, onExpandChange]);

    const navItems = isAdmin
        ? [
            { label: language === 'es' ? 'Menú principal' : 'Main menu', icon: 'shield',        route: 'Reports'      },
            { label: language === 'es' ? 'Reportes'       : 'Reports',   icon: 'document-text', route: 'ReportStatus' },
        ]
        : [
            { label: t('sidebar_home'),    icon: 'home',   route: 'Inicio'   },
            { label: t('sidebar_map'),     icon: 'map',    route: 'Mapa'     },
            { label: t('sidebar_scan'),    icon: 'scan',   route: 'Escanear' },
            { label: t('sidebar_rewards'), icon: 'trophy', route: 'Premios'  },
            { label: t('sidebar_promos'),  icon: 'gift',   route: 'Promos', locked: level < 2 },
        ];

    const activeRoute = useNavigationState(state => {
        if (!state) return 'Inicio';
        const route = state.routes[state.index];
        if (route.name === 'App')
            return route.state?.routes[route.state.index]?.name || 'Inicio';
        return route.name;
    });

    const go = (name) =>
        navigation.navigate('MainTabs', { screen: name, params: { timestamp: Date.now() } });

    const borderCol = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    width:            sidebarAnim,
                    backgroundColor:  isDark ? colors.backgroundSecondary : '#fff',
                    borderRightColor: borderCol,
                },
            ]}
        >
            {/* ── CABECERA ─────────────────────────────────────────────── */}
            <View style={styles.logoContainer}>
                {/* Logo */}
                <Pressable
                    onPress={() => go('Inicio')}
                    style={({ pressed }) => [pressed && { opacity: 0.7 }]}
                >
                    <LinearGradient
                        colors={GRADIENTS.primary}
                        style={styles.logoIcon}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Ionicons name="water" size={rs(22)} color="#fff" />
                    </LinearGradient>
                </Pressable>

                {/* Hamburguesa */}
                <Pressable
                    onPress={toggleSidebar}
                    hitSlop={8}
                    style={({ pressed }) => [pressed && { opacity: 0.6 }]}
                >
                    <Animated.View style={{ transform: [{ rotate: menuRotate }] }}>
                        <Ionicons name="menu" size={rs(26)} color={colors.text} />
                    </Animated.View>
                </Pressable>

                {/* Nombre de la app — fade in al expandir */}
                <Animated.View style={[styles.appNameWrap, { opacity: textOpacity }]}>
                    <Pressable onPress={() => go('Inicio')}>
                        <Text style={[styles.appName, { color: colors.text }]} numberOfLines={1}>
                            Tu Playa
                        </Text>
                    </Pressable>
                </Animated.View>
            </View>

            {/* ── PERFIL ───────────────────────────────────────────────── */}
            <Pressable
                style={({ pressed }) => [
                    styles.profileCard,
                    { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' },
                    pressed && { opacity: 0.7 },
                ]}
                onPress={() => navigation.navigate('Profile')}
            >
                {user.avatar
                    ? <Image source={{ uri: user.avatar }} style={styles.avatar} />
                    : (
                        <View style={[styles.avatarPlaceholder, { backgroundColor: colors.accent }]}>
                            <Text style={styles.avatarInitials}>{user.initials}</Text>
                        </View>
                    )
                }
                <Animated.View style={[styles.userInfo, { opacity: textOpacity }]}>
                    <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
                        {user.displayName || user.username || 'Usuario'}
                    </Text>
                    <Text style={[styles.userLevel, { color: colors.textSecondary }]} numberOfLines={1}>
                        {t('profile_level')} {level}
                    </Text>
                    <Text style={[styles.userLevel, { color: colors.textSecondary }]} numberOfLines={1}>
                        ({(user.tplTitle || 'Cleanup Rookie').replace(/[{}]/g, '')})
                    </Text>
                </Animated.View>
            </Pressable>

            {/* ── NAV ──────────────────────────────────────────────────── */}
            <ScrollView style={styles.navContainer} showsVerticalScrollIndicator={false}>
                <Animated.Text
                    numberOfLines={1}
                    style={[styles.sectionTitle, { color: colors.textMuted, opacity: textOpacity }]}
                >
                    {t('sidebar_menu')}
                </Animated.Text>

                {navItems.map((item, index) => (
                    <SidebarItem
                        key={item.route}
                        index={index}
                        icon={item.icon}
                        label={item.label}
                        isActive={activeRoute === item.route}
                        onPress={() => !item.locked && go(item.route)}
                        textOpacity={textOpacity}
                    />
                ))}
            </ScrollView>

            {/* ── PIE ──────────────────────────────────────────────────── */}
            <View style={[styles.footer, { borderTopColor: borderCol }]}>
                <Pressable
                    style={({ pressed }) => [
                        styles.sidebarItem,
                        pressed && { opacity: 0.7 },
                    ]}
                    onPress={() => navigation.navigate('Profile')}
                >
                    <View style={styles.iconContainer}>
                        <Ionicons
                            name={isAdmin ? 'person-outline' : 'settings-outline'}
                            size={rs(20)}
                            color={colors.textSecondary}
                        />
                    </View>
                    <Animated.Text
                        numberOfLines={1}
                        style={[styles.itemLabel, { color: colors.textSecondary, opacity: textOpacity }]}
                    >
                        {isAdmin ? (language === 'es' ? 'Perfil' : 'Profile') : t('sidebar_settings')}
                    </Animated.Text>
                </Pressable>

                <Animated.Text
                    numberOfLines={1}
                    style={[styles.versionText, { color: colors.textMuted, opacity: textOpacity }]}
                >
                    {t('sidebar_version')}
                </Animated.Text>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignSelf:        'stretch',   // fills full height of the flex-row parent
        flexDirection:    'column',
        borderRightWidth: 1,
        paddingVertical:  SPACING.xl,
        paddingHorizontal: SPACING.md,
        zIndex:           100,
        elevation:        10,
        overflow:         'hidden',
    },

    // Header
    logoContainer: {
        flexDirection:  'row',
        alignItems:     'center',
        gap:            SPACING.sm,
        marginBottom:   SPACING.xxl,
    },
    logoIcon: {
        width:          rs(40),
        height:         rs(40),
        borderRadius:   rs(12),
        justifyContent: 'center',
        alignItems:     'center',
        flexShrink:     0,
    },
    appNameWrap: {
        flex:     1,
        overflow: 'hidden',
    },
    appName: {
        fontSize:      rf(20),
        fontWeight:    '800',
        letterSpacing: 0.5,
    },

    // Profile
    profileCard: {
        flexDirection:  'row',
        alignItems:     'center',
        padding:        SPACING.md,
        borderRadius:   RADIUS.lg,
        marginBottom:   SPACING.xl,
        gap:            SPACING.sm,
        overflow:       'hidden',
    },
    avatar: {
        width:        rs(40),
        height:       rs(40),
        borderRadius: rs(20),
        flexShrink:   0,
    },
    avatarPlaceholder: {
        width:          rs(40),
        height:         rs(40),
        borderRadius:   rs(20),
        justifyContent: 'center',
        alignItems:     'center',
        flexShrink:     0,
    },
    avatarInitials: {
        color:      '#fff',
        fontWeight: 'bold',
        fontSize:   rf(14),
    },
    userInfo: {
        flex:     1,
        minWidth: 0,
        overflow: 'hidden',
    },
    userName: {
        fontSize:   rf(14),
        fontWeight: '700',
    },
    userLevel: {
        fontSize: rf(11),
    },

    // Nav
    sectionTitle: {
        fontSize:      rf(11),
        fontWeight:    '700',
        marginBottom:  SPACING.md,
        textAlign:     'center',
        letterSpacing: 1,
    },
    navContainer: {
        flex: 1,
    },
    sidebarItem: {
        flexDirection:  'row',
        alignItems:     'center',
        padding:        SPACING.md,
        minHeight:      rs(48),
        marginBottom:   SPACING.xs,
        borderRadius:   RADIUS.md,
        gap:            SPACING.md,
        overflow:       'hidden',
        cursor:         'pointer',
    },
    iconContainer: {
        width:          rs(36),
        height:         rs(36),
        borderRadius:   rs(10),
        justifyContent: 'center',
        alignItems:     'center',
        flexShrink:     0,
    },
    itemLabel: {
        fontSize: rf(14),
        flex:     1,
    },
    activeIndicator: {
        position:     'absolute',
        right:        0,
        width:        3,
        height:       '60%',
        borderRadius: 2,
    },

    // Footer
    footer: {
        marginTop:     SPACING.lg,
        borderTopWidth: 1,
        paddingTop:    SPACING.md,
    },
    versionText: {
        fontSize:    rf(10),
        marginTop:   SPACING.sm,
        paddingLeft: SPACING.sm,
    },
});
