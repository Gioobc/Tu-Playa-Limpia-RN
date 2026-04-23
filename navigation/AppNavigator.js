import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useGame } from '../context/GameContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useWallet } from '../context/WalletContext';
import { BRAND } from '../constants/theme';
import { rs, rh, SPACING, RADIUS, HEIGHT } from '../constants/responsive';
import HomeScreen from '../screens/HomeScreen';
import RewardsScreen from '../screens/RewardsScreen';
import AuthScreen from '../components/AuthScreen';
import ScanScreen from '../screens/ScanScreen';
import PromotionsScreen from '../screens/PromotionsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import BeachMapScreen from '../screens/BeachMapScreen';
import BeachDetailScreen from '../screens/BeachDetailScreen';
import BeachReportsScreen from '../screens/BeachReportsScreen';
import AnimatedTabIcon from './AnimatedTabIcon';
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
function LockedPromotionsScreen() {
    const { colors, isDark } = useTheme();
    const { t } = useLanguage();
    return (
        <View style={[styles.lockedContainer, { backgroundColor: colors.background }]}>
            {isDark && (
                <LinearGradient
                    colors={[BRAND.oceanDeep, BRAND.oceanDark]}
                    style={StyleSheet.absoluteFill}
                />
            )}
            <View style={styles.lockedOverlay} />
            <View style={styles.lockContent}>
                <Ionicons name="lock-closed" size={rs(60)} color={colors.textMuted} />
                <Text style={[styles.lockTitle, { color: colors.text }]}>
                    {t('promos_locked_title')}
                </Text>
                <Text style={[styles.lockDesc, { color: colors.textSecondary }]}>
                    {t('promos_locked_desc')}
                </Text>
                <Text style={[styles.lockHint, { color: colors.accent }]}>
                    {t('promos_locked_hint')}
                </Text>
            </View>
            <View style={styles.previewContainer}>
                {[1, 2, 3].map((i) => (
                    <View
                        key={i}
                        style={[
                            styles.previewCard,
                            { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }
                        ]}
                    >
                        <View style={[styles.previewBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]} />
                        <View style={[styles.previewLine, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]} />
                        <View style={[styles.previewLineShort, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }]} />
                    </View>
                ))}
            </View>
        </View>
    );
}
function LockedTabIcon({ name, size, focused, isLocked }) {
    const { colors, isDark } = useTheme();
    return (
        <View style={styles.tabIconContainer}>
            <Ionicons
                name={focused ? name : `${name}-outline`}
                size={rs(size)}
                color={isLocked
                    ? (isDark ? 'rgba(255,255,255,0.25)' : 'rgba(13, 92, 117, 0.35)')
                    : (focused ? colors.tabActive : colors.tabInactive)
                }
            />
            {isLocked && (
                <View style={styles.lockBadge}>
                    <Ionicons name="lock-closed" size={rs(10)} color={colors.textMuted} />
                </View>
            )}
        </View>
    );
}
import { useWindowDimensions } from 'react-native';
import DesktopSidebar from '../components/DesktopSidebar';
import { isDesktop } from '../constants/responsive';
function TabNavigator() {
    const { level } = useGame();
    const { colors, shadows, isDark } = useTheme();
    const { width } = useWindowDimensions();
    const isPromotionsLocked = level < 2;
    const showSidebar = width >= 1024;
    return (
        <View style={{ flex: 1, flexDirection: 'row' }}>
            { }
            {showSidebar && <DesktopSidebar />}
            { }
            <View style={{ flex: 1 }}>
                <Tab.Navigator
                    screenOptions={{
                        headerShown: false,
                        tabBarShowLabel: false,
                        lazy: false,
                        tabBarBackground: () => (
                            !isDark && (
                                <LinearGradient
                                    colors={[BRAND.oceanLight, BRAND.oceanMid, BRAND.oceanDark]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={{
                                        ...StyleSheet.absoluteFillObject,
                                        borderRadius: rs(35),
                                    }}
                                />
                            )
                        ),
                        tabBarStyle: showSidebar ? { display: 'none' } : [
                            styles.tabBar,
                            {
                                backgroundColor: isDark ? colors.tabBar : 'transparent',
                                borderColor: isDark ? colors.tabBarBorder : 'rgba(255,255,255,0.15)',
                                ...shadows.xl,
                            }
                        ],
                    }}
                >
                    <Tab.Screen
                        name="Inicio"
                        component={HomeScreen}
                        options={{
                            tabBarIcon: ({ focused }) => (
                                <AnimatedTabIcon name="home" size={24} focused={focused} />
                            )
                        }}
                    />
                    <Tab.Screen
                        name="Mapa"
                        component={BeachMapScreen}
                        options={{
                            tabBarIcon: ({ focused }) => (
                                <AnimatedTabIcon name="map" size={24} focused={focused} />
                            )
                        }}
                    />
                    <Tab.Screen
                        name="Escanear"
                        component={ScanScreen}
                        options={{
                            tabBarIcon: ({ focused }) => (
                                <AnimatedTabIcon name="scan" size={24} focused={focused} />
                            )
                        }}
                    />
                    <Tab.Screen
                        name="Premios"
                        component={RewardsScreen}
                        options={{
                            tabBarIcon: ({ focused }) => (
                                <AnimatedTabIcon name="trophy" size={24} focused={focused} />
                            )
                        }}
                    />
                    <Tab.Screen
                        name="Promos"
                        component={isPromotionsLocked ? LockedPromotionsScreen : PromotionsScreen}
                        options={{
                            tabBarIcon: ({ focused }) => (
                                <LockedTabIcon
                                    name="gift"
                                    size={24}
                                    focused={focused}
                                    isLocked={isPromotionsLocked}
                                />
                            )
                        }}
                    />
                </Tab.Navigator>
            </View>
        </View>
    );
}
import WalletConnectScreen from '../components/WalletConnectScreen';

export default function AppNavigator({ isAuthenticated, isFirstTime, onRegister, onLogin, onImport, username }) {
    const { address, hasSkippedConnection, setHasSkippedConnection } = useWallet();

    if (!isAuthenticated) {
        return (
            <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade_from_bottom' }}>
                <Stack.Screen name="Auth">
                    {props => (
                        <AuthScreen
                            {...props}
                            onAuthenticated={() => { }}
                            isFirstTime={isFirstTime}
                            onRegister={onRegister}
                            onLogin={onLogin}
                            onImport={onImport}
                            username={username}
                        />
                    )}
                </Stack.Screen>
            </Stack.Navigator>
        );
    }

    // Si ya está autenticado pero aún no tiene Wallet ni ha decidido omitirlo, forzamos WalletConnectScreen
    if (!address && !hasSkippedConnection) {
        return (
            <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
                <Stack.Screen name="WalletConnect">
                    {props => (
                        <WalletConnectScreen
                            {...props}
                            onComplete={() => setHasSkippedConnection(true)}
                        />
                    )}
                </Stack.Screen>
            </Stack.Navigator>
        );
    }

    // Ruta Principal con Tabs
    return (
        <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
            <Stack.Screen name="MainTabs" component={TabNavigator} />
            <Stack.Screen
                name="Profile"
                component={ProfileScreen}
                options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
                name="BeachDetail"
                component={BeachDetailScreen}
                options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
                name="BeachReports"
                component={BeachReportsScreen}
                options={{ animation: 'slide_from_bottom' }}
            />
        </Stack.Navigator>
    );
}
const styles = StyleSheet.create({
    tabBar: {
        position: 'absolute',
        bottom: rh(25),
        left: rs(20),
        right: rs(20),
        height: HEIGHT.tabBar,
        borderRadius: rs(35),
        borderWidth: 1,
        borderTopWidth: 1,
        paddingBottom: 0,
        paddingTop: 0,
        elevation: 0,
    },
    tabIconContainer: { alignItems: 'center', justifyContent: 'center' },
    lockBadge: { position: 'absolute', top: rs(-4), right: rs(-8) },
    lockedContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    lockedOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
    lockContent: { alignItems: 'center', zIndex: 10, padding: SPACING.xl },
    lockTitle: { fontSize: rs(22), fontWeight: '700', marginTop: SPACING.lg, marginBottom: SPACING.sm },
    lockDesc: { fontSize: rs(14), textAlign: 'center' },
    lockHint: { fontSize: rs(12), textAlign: 'center', marginTop: SPACING.md, fontWeight: '600' },
    previewContainer: {
        position: 'absolute', bottom: rh(120), left: SPACING.lg, right: SPACING.lg, opacity: 0.4,
    },
    previewCard: { borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm, height: rh(70) },
    previewBadge: {
        position: 'absolute', top: SPACING.sm, right: SPACING.sm,
        width: rs(40), height: rs(18), borderRadius: RADIUS.sm,
    },
    previewLine: { width: '60%', height: rs(12), borderRadius: RADIUS.xs, marginBottom: SPACING.xs },
    previewLineShort: { width: '40%', height: rs(10), borderRadius: RADIUS.xs },
});
