import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { hashDrawing, verifyDrawing, hashExportPassword, obfuscateData, deobfuscateData, encryptData, decryptData } from '../utils/crypto';
import ENV from '../constants/env';
const AuthContext = createContext(null);
const KEYS = {
    ACCOUNT: '@tpl_account_data',
    SESSION: '@tpl_session_active',
    DRAWING_HASH: '@tpl_drawing_hash',
    PASSWORD_HASH: '@tpl_password_hash',
    PROFILE: '@tpl_user_profile',
    USERNAME: '@tpl_username',
    REGISTRATION_DATE: '@tpl_registration_date',
};

const OBFUSCATION_KEY = 'tpl_secure_storage_v1';

const getSecureItem = async (key) => {
    try {
        const val = await AsyncStorage.getItem(key);
        if (!val) return null;
        if (val.startsWith('v2:') || val.startsWith('v2-js:')) {
            return await deobfuscateData(val, OBFUSCATION_KEY);
        }
        return val;
    } catch (e) {
        return null;
    }
};

const setSecureItem = async (key, value) => {
    try {
        const obfuscated = await obfuscateData(value, OBFUSCATION_KEY);
        await AsyncStorage.setItem(key, obfuscated);
    } catch (e) {
        console.warn('Set secure item error:', e);
    }
};
export function AuthProvider({ children }) {
    const [isLoading, setIsLoading] = useState(true);
    const [isFirstTime, setIsFirstTime] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [accountId, setAccountId] = useState(null);
    const [mongoUserId, setMongoUserId] = useState(null);
    const [username, setUsername] = useState('');
    // Check existing account & session on mount
    useEffect(() => {
        (async () => {
            try {
                const [drawingHash, sessionActive, accountData, savedUsername] = await Promise.all([
                    getSecureItem(KEYS.DRAWING_HASH),
                    AsyncStorage.getItem(KEYS.SESSION),
                    AsyncStorage.getItem(KEYS.ACCOUNT),
                    AsyncStorage.getItem(KEYS.USERNAME),
                ]);
                if (drawingHash && accountData) {
                    // Account exists
                    setIsFirstTime(false);
                    const parsed = JSON.parse(accountData);
                    setAccountId(parsed.accountId);
                    setMongoUserId(parsed.mongoUserId || null);
                    setUsername(savedUsername || '');
                    // Check for active session ("cookie")
                    // MODIFIED: Even if session exists, we REQUIRE drawing on refresh for security
                    if (sessionActive === 'true') {
                        console.log('Session active, waiting for drawing unlock...');
                    }
                } else {
                    setIsFirstTime(true);
                }
            } catch (e) {
                console.warn('Auth init error:', e);
                setIsFirstTime(true);
            }
            setIsLoading(false);
        })();
    }, []);
    const register = useCallback(async (name, password, drawingData) => {
        try {
            // Capa extra de sanitización (Sanitization layer) para Prevenir Stored XSS
            const sanitizeString = (str) => {
                if (!str) return '';
                return str.replace(/[<>"'&;/]/g, '');
            };
            const cleanName = sanitizeString(name).trim();

            const timestamp = Date.now().toString(16);
            const random = Math.random().toString(16).slice(2, 14);
            const newAccountId = `0x${timestamp}${random}`.slice(0, 42).padEnd(42, '0');
            const drawingHashed = await hashDrawing(drawingData);
            const passwordHashed = await hashExportPassword(password);
            
            // ✅ Register user in backend API (MongoDB)
            const apiUrl = ENV.API_BASE_URL;
            const registerResponse = await fetch(`${apiUrl}/api/users/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: cleanName,
                    password: password,
                    initials: cleanName.substring(0, 2).toUpperCase(),
                    avatar_url: null,
                    tpl_title: null,
                    points: 0,
                    level: 1,
                    total_scans: 0,
                    bottle_scans: 0,
                    can_scans: 0,
                    has_changed_username: false,
                    has_awarded_profile_visit: false,
                }),
            });

            if (!registerResponse.ok) {
                const errorData = await registerResponse.json().catch(() => ({}));
                throw new Error(errorData.detail || `Backend error: ${registerResponse.status}`);
            }

            const backendData = await registerResponse.json();
            console.log('✅ User registered in backend:', backendData.user_id);

            const accountData = {
                accountId: newAccountId,
                createdAt: new Date().toISOString(),
                version: 2,
                mongoUserId: backendData.user_id,
            };
            await Promise.all([
                setSecureItem(KEYS.DRAWING_HASH, drawingHashed),
                setSecureItem(KEYS.PASSWORD_HASH, passwordHashed),
                AsyncStorage.setItem(KEYS.USERNAME, cleanName),
                AsyncStorage.setItem(KEYS.ACCOUNT, JSON.stringify(accountData)),
                AsyncStorage.setItem(KEYS.SESSION, 'true'),
                AsyncStorage.setItem(KEYS.REGISTRATION_DATE, new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })),
            ]);
            setAccountId(newAccountId);
            setMongoUserId(backendData.user_id);
            setUsername(cleanName);
            setIsFirstTime(false);
            setIsAuthenticated(true);

            // Emitir evento global para refrescar el GameContext y el Dashboard
            DeviceEventEmitter.emit('TPL_ACCOUNT_IMPORTED');

            return { success: true, accountId: newAccountId };
        } catch (e) {
            console.error('Registration error:', e);
            return { success: false, error: e.message };
        }
    }, []);
    const login = useCallback(async (drawingData) => {
        try {
            const storedHash = await getSecureItem(KEYS.DRAWING_HASH);
            if (!storedHash) return { success: false, error: 'No account found' };
            const isValid = await verifyDrawing(drawingData, storedHash);
            if (isValid) {
                await AsyncStorage.setItem(KEYS.SESSION, 'true');
                setIsAuthenticated(true);

                // Emitir evento global para leer el storage actual
                DeviceEventEmitter.emit('TPL_ACCOUNT_IMPORTED');

                return { success: true };
            }
            return { success: false, error: 'Invalid drawing' };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }, []);
    const logout = useCallback(async () => {
        await AsyncStorage.setItem(KEYS.SESSION, 'false');
        setIsAuthenticated(false);
    }, []);
    const verifySessionPassword = useCallback(async (password) => {
        try {
            const storedHash = await getSecureItem(KEYS.PASSWORD_HASH);
            if (!storedHash) return false;
            const inputHash = await hashExportPassword(password);
            return inputHash === storedHash;
        } catch (e) {
            return false;
        }
    }, []);
    const exportAccount = useCallback(async (sessionPassword, filePassword, liveAccountData = null, liveProfileData = null) => {
        try {
            const isValid = await verifySessionPassword(sessionPassword);
            if (!isValid) {
                return { success: false, error: 'Contraseña de sesión inválida.' };
            }
            let accountData, profileData, savedUsername, passwordHash;
            if (liveAccountData && liveProfileData) {
                accountData = JSON.stringify(liveAccountData);
                profileData = JSON.stringify(liveProfileData);
                savedUsername = liveProfileData.name;
                passwordHash = await getSecureItem(KEYS.PASSWORD_HASH);
            } else {
                [passwordHash, accountData, profileData, savedUsername] = await Promise.all([
                    getSecureItem(KEYS.PASSWORD_HASH),
                    AsyncStorage.getItem(KEYS.ACCOUNT),
                    AsyncStorage.getItem(KEYS.PROFILE),
                    AsyncStorage.getItem(KEYS.USERNAME),
                ]);
            }
            const internalPayload = {
                app: 'TuPlayaLimpia',
                version: 3,
                exportedAt: new Date().toISOString(),
                username: savedUsername,
                account: accountData,
                profile: profileData,
                checksum: (await hashExportPassword(filePassword)).slice(0, 16)
            };
            const jsonStr = JSON.stringify(internalPayload);
            const filePasswordHash = await hashExportPassword(filePassword);
            const encrypted = await encryptData(jsonStr, filePasswordHash);
            return {
                success: true,
                data: JSON.stringify({
                    data: encrypted,
                }),
            };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }, [verifySessionPassword]);
    const importAccount = useCallback(async (fileContent, filePassword, newPassword, newDrawingData) => {
        try {
            const parsed = JSON.parse(fileContent);
            let encryptedData = parsed.data || parsed.encrypted;
            if (!encryptedData) {
                return { success: false, error: 'Formato de archivo desconocido.' };
            }
            const filePasswordHash = await hashExportPassword(filePassword);
            const decrypted = await decryptData(encryptedData, filePasswordHash);
            if (!decrypted) {
                return { success: false, error: 'Contraseña incorrecta o archivo dañado.' };
            }
            const importedPayload = JSON.parse(decrypted);
            if (importedPayload.app !== 'TuPlayaLimpia') {
                return { success: false, error: 'Este archivo no pertenece a Tu Playa Limpia.' };
            }
            const importedData = importedPayload;
            const newPasswordHash = await hashExportPassword(newPassword);
            const newDrawingHash = await hashDrawing(newDrawingData);
            const GAME_KEYS = {
                POINTS: '@tpl_game_points',
                ITEMS: '@tpl_game_items',
                NFTS: '@tpl_game_nfts',
                USER: '@tpl_game_user_meta',
            };
            const accountDataStr = importedData.account || '{}';
            const profileDataStr = importedData.profile || '{}';
            const accountObj = JSON.parse(accountDataStr);
            const profileObj = JSON.parse(profileDataStr);
            await Promise.all([
                setSecureItem(KEYS.DRAWING_HASH, newDrawingHash),
                setSecureItem(KEYS.PASSWORD_HASH, newPasswordHash),
                AsyncStorage.setItem(KEYS.USERNAME, importedData.username || ''),
                AsyncStorage.setItem(KEYS.ACCOUNT, accountDataStr),
                AsyncStorage.setItem(KEYS.PROFILE, profileDataStr),
                AsyncStorage.setItem(KEYS.SESSION, 'true'),
                AsyncStorage.setItem(KEYS.REGISTRATION_DATE, importedPayload.exportedAt ? new Date(importedPayload.exportedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString()),
                AsyncStorage.setItem(GAME_KEYS.POINTS, (accountObj.points || 0).toString()),
                AsyncStorage.setItem(GAME_KEYS.ITEMS, JSON.stringify(accountObj.scannedItems || { bottles: 0, cans: 0, total: 0 })),
                AsyncStorage.setItem(GAME_KEYS.NFTS, JSON.stringify(accountObj.nfts || [])),
                AsyncStorage.setItem(GAME_KEYS.USER, profileDataStr),
            ]);
            const accountInfo = JSON.parse(importedData.account || '{}');
            setAccountId(accountInfo.accountId || 'imported');
            setUsername(importedData.username || '');
            setIsFirstTime(false);
            setIsAuthenticated(true);

            // Avisar a todo el aplicativo (principalmente GameContext) que recargue del Storage
            DeviceEventEmitter.emit('TPL_ACCOUNT_IMPORTED');

            return { success: true };
        } catch (error) {
            console.error('Import error:', error);
            return { success: false, error: 'Error al importar: ' + error.message };
        }
    }, []);
    /**
     * Save user profile data to AsyncStorage
     */
    const saveProfile = useCallback(async (profileData) => {
        try {
            await AsyncStorage.setItem(KEYS.PROFILE, JSON.stringify(profileData));
        } catch (e) {
            console.warn('Profile save error:', e);
        }
    }, []);
    /**
     * Load user profile data from AsyncStorage
     */
    const loadProfile = useCallback(async () => {
        try {
            const data = await AsyncStorage.getItem(KEYS.PROFILE);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    }, []);
    const value = useMemo(() => ({
        isLoading,
        isFirstTime,
        isAuthenticated,
        accountId,
        mongoUserId,
        username,
        register,
        login,
        logout,
        verifySessionPassword,
        exportAccount,
        importAccount,
        saveProfile,
        loadProfile,
        setUsername,
    }), [isLoading, isFirstTime, isAuthenticated, accountId, mongoUserId, username, register, login, logout, verifySessionPassword, exportAccount, importAccount, saveProfile, loadProfile, setUsername]);
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
export default AuthContext;
