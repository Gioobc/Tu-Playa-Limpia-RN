import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateNFTAttributes } from '../utils/nftGenerator';
import { fetchUserNFTs } from '../utils/blockchain/missionNFT';
import { fetchTPLBalance, fetchUserTitle } from '../utils/blockchain/tplToken';
import { useAuth } from './AuthContext';
import ENV from '../constants/env';
const GameContext = createContext();
export const useGame = () => useContext(GameContext);
const GAME_KEYS = {
    POINTS: '@tpl_game_points',
    ITEMS: '@tpl_game_items',
    NFTS: '@tpl_game_nfts',
    USER: '@tpl_game_user_meta',
    CLEANUP_HISTORY: '@tpl_game_cleanup_history',
};
export const GameProvider = ({ children }) => {
    const { mongoUserId, setUsername: setAuthUsername } = useAuth();
    const [points, setPoints] = useState(0);
    const [scannedItems, setScannedItems] = useState({ bottles: 0, cans: 0, plastic: 0, total: 0 });
    const [nfts, setNfts] = useState([]);
    const [level, setLevel] = useState(1);
    const [activeBeach, setActiveBeach] = useState(null);
    const [cleanupHistory, setCleanupHistory] = useState([]);
    const [user, setUser] = useState({
        name: '...',
        email: '',
        avatar: null,
        initials: '..',
        hasChangedUsername: false,
        tplTitle: 'Cleanup Rookie',
    });
    const unlockingSet = useRef(new Set());
    const loadGameState = async () => {
        try {
            const [storedPoints, storedItems, storedNfts, storedUser, storedCleanupHistory, storedRegDate, storedUsername] = await Promise.all([
                AsyncStorage.getItem(GAME_KEYS.POINTS),
                AsyncStorage.getItem(GAME_KEYS.ITEMS),
                AsyncStorage.getItem(GAME_KEYS.NFTS),
                AsyncStorage.getItem(GAME_KEYS.USER),
                AsyncStorage.getItem(GAME_KEYS.CLEANUP_HISTORY),
                AsyncStorage.getItem('@tpl_registration_date'),
                AsyncStorage.getItem('@tpl_username'),
            ]);
            if (storedPoints) setPoints(parseInt(storedPoints));
            if (storedItems) setScannedItems(JSON.parse(storedItems));
            if (storedCleanupHistory) setCleanupHistory(JSON.parse(storedCleanupHistory));

            const joinDate = storedRegDate || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

            // Sync Username logic
            let finalName = '...';
            if (storedUsername) {
                finalName = storedUsername;
            } else if (storedUser) {
                const parsed = JSON.parse(storedUser);
                if (parsed.name && (parsed.name !== '...' && parsed.name !== 'TPL Explorer' && parsed.name !== 'Ocean Guardian')) {
                    finalName = parsed.name;
                }
            }

            const initials = finalName && (finalName !== '...' && finalName !== 'TPL Explorer' && finalName !== 'Ocean Guardian')
                ? finalName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                : '..';

            if (storedUser) {
                setUser(prev => ({
                    ...prev,
                    ...JSON.parse(storedUser),
                    name: finalName,
                    initials: initials,
                    joinDate
                }));
            } else {
                setUser(prev => ({
                    ...prev,
                    name: finalName,
                    initials: initials,
                    joinDate
                }));
            }

            const userData = storedUser ? JSON.parse(storedUser) : null;
            const walletAddress = userData?.walletAddress;

            // Patch existing NFTs to reflect the real username
            let initialNfts = storedNfts ? JSON.parse(storedNfts) : [];
            let nftsPatched = false;
            const updatedNfts = initialNfts.map(nft => {
                if (nft.owner === 'Ocean Guardian' || nft.owner === 'TPL Explorer' || !nft.owner || nft.owner === '...') {
                    nftsPatched = true;
                    return { ...nft, owner: finalName, ownerInitials: initials };
                }
                return nft;
            });

            if (storedNfts) {
                setNfts(updatedNfts);
                if (nftsPatched) {
                    AsyncStorage.setItem(GAME_KEYS.NFTS, JSON.stringify(updatedNfts)).catch(() => { });
                    console.log(`✅ ${updatedNfts.length} NFTs parchados con el nombre: ${finalName}`);
                }
            }

            let finalNfts = null;
            if (walletAddress) {
                try {
                    console.log('📡 Buscando NFTs On-Chain en contrato TPL...');
                    const onChainNfts = await fetchUserNFTs(walletAddress);
                    if (onChainNfts && onChainNfts.length > 0) {
                        console.log(`✅ ${onChainNfts.length} NFTs recuperados desde la Blockchain`);
                        finalNfts = onChainNfts;
                    }
                } catch (blockchainErr) {
                    console.warn('⚠️ Error consultando NFTs en Blockchain:', blockchainErr.message);
                }

                // --- Sync TPL Points & Title from Blockchain ---
                try {
                    console.log('📡 Sincronizando puntos TPL desde la Blockchain...');
                    const [onChainBalance, onChainTitle] = await Promise.all([
                        fetchTPLBalance(walletAddress),
                        fetchUserTitle(walletAddress)
                    ]);

                    const numericBalance = onChainBalance ? Math.floor(parseFloat(onChainBalance)) : 0;

                    if (numericBalance > 0) {
                        setPoints(prev => Math.max(prev, numericBalance));
                        console.log(`✅ ${numericBalance} TPL sincronizados desde la Blockchain`);
                    } else {
                        console.log(`ℹ️ Balance on-chain es 0 o insuficiente ("${onChainBalance}"), manteniendo puntos locales.`);
                    }

                    if (onChainTitle && onChainTitle !== "Cleanup Rookie") {
                        setUser(prev => ({ ...prev, tplTitle: onChainTitle }));
                        console.log(`✅ Título "${onChainTitle}" sincronizado desde la Blockchain`);
                    }
                } catch (syncErr) {
                    console.warn('⚠️ Error sincronizando puntos TPL:', syncErr.message);
                }
                // --- End Sync ---
            }

            if (finalNfts) {
                setNfts(finalNfts);
            } else if (storedNfts) {
                setNfts(JSON.parse(storedNfts));
            } else {
                // 3. Fallback 2: AsyncStorage vacío → intentar recuperar desde MongoDB
                console.log('📦 AsyncStorage y Blockchain vacíos, buscando NFTs en MongoDB...');
                try {
                    if (walletAddress) {
                        const appUrl = ENV.APP_URL;
                        const resp = await fetch(`${appUrl}/api/nfts?wallet=${walletAddress}`);
                        if (resp.ok) {
                            const { nfts: backupNfts } = await resp.json();
                            if (backupNfts && backupNfts.length > 0) {
                                // Reconstruir objetos NFT mínimos desde el registro de MongoDB
                                const recovered = backupNfts.map(n => ({
                                    id: n.nftLocalId || n._id,
                                    hash: n.txHash,
                                    txHash: n.txHash,
                                    claimed: true,
                                    date: new Date(n.mintedAt).toLocaleDateString(),
                                    lockedUntil: new Date(new Date(n.mintedAt).getTime() + 86400000 * 30).toLocaleDateString(),
                                    owner: finalName,
                                    ownerInitials: initials || 'OG',
                                    isNew: false,
                                    title: n.metadata?.name || `${finalName} NFT`,
                                    description: n.metadata?.description || '',
                                    attributes: n.metadata?.attributes || [],
                                    rarity: 'Common',
                                    acquisition: 'nft_acq_default',
                                }));
                                setNfts(recovered);
                                console.log(`✅ ${recovered.length} NFTs recuperados desde MongoDB`);
                            }
                        }
                    } else {
                        console.log('ℹ️ Sin wallet conectada, no se puede recuperar nfts remotos.');
                    }
                } catch (mongoErr) {
                    console.warn('⚠️ Error recuperando desde MongoDB:', mongoErr.message);
                }
            }
        } catch (e) {
            console.warn('Failed to load game state:', e);
        }
    };
    useEffect(() => {
        loadGameState();

        // Listener reactivo a las importaciones/registros de cuenta desde Auth o Wallet
        const accountListener = DeviceEventEmitter.addListener('TPL_ACCOUNT_IMPORTED', () => {
            console.log('🔄 Sincronizando GameContext tras nueva sesión o cambio de wallet...');
            loadGameState();
        });

        return () => {
            accountListener.remove();
        };
    }, []);
    useEffect(() => {
        AsyncStorage.setItem(GAME_KEYS.NFTS, JSON.stringify(nfts)).catch(() => { });
    }, [nfts]);
    useEffect(() => {
        AsyncStorage.setItem(GAME_KEYS.USER, JSON.stringify(user)).catch(() => { });
    }, [user]);
    useEffect(() => {
        AsyncStorage.setItem(GAME_KEYS.POINTS, points.toString()).catch(() => { });
    }, [points]);
    useEffect(() => {
        AsyncStorage.setItem(GAME_KEYS.ITEMS, JSON.stringify(scannedItems)).catch(() => { });
    }, [scannedItems]);
    useEffect(() => {
        AsyncStorage.setItem(GAME_KEYS.CLEANUP_HISTORY, JSON.stringify(cleanupHistory)).catch(() => { });
    }, [cleanupHistory]);

    // Automatic Sync to Blockchain when milestones are reached
    useEffect(() => {
        const autoSync = async () => {
            // Solo sincronizar si hay wallet y múltiplos de 5 puntos para coincidir con el primer título
            if (user.walletAddress && points > 0 && points % 5 === 0) {
                console.log(`🎯 Milestone alcanzado: ${points} TPL. Sincronizando automáticamente...`);
                await syncTPLToBlockchain();
            }
        };
        autoSync();
    }, [points, user.walletAddress]);
    const generateNFTHash = () => {
        return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-6);
    };
    const unlockNFT = (nftData) => {
        const nftHash = generateNFTHash();
        const generatedData = (!nftData.attributes && !nftData.image) ? generateNFTAttributes() : {};
        const newNFT = {
            id: Date.now().toString(),
            hash: nftHash,
            date: new Date().toLocaleDateString(),
            lockedUntil: new Date(Date.now() + 86400000 * 30).toLocaleDateString(),
            owner: user.name,
            ownerInitials: user.initials,
            ownerAvatar: user.avatar,
            isNew: true,
            claimed: false,
            acquisition: nftData.acquisition || 'nft_acq_default',
            ...generatedData,
            ...nftData,
        };
        setNfts(prev => {
            const updated = [newNFT, ...prev];
            updateUserProfile({ NFTs: updated });
            return updated;
        });
        return newNFT;
    };
    const unlockRegionNFT = (regionName, regionImage) => {
        // 1. Check if the user already owns this specific region NFT
        const alreadyOwns = nfts.some(n => n.title === regionName && n.acquisition === 'nft_acq_region');

        // 2. Race-condition check (debounce rapid clicks)
        if (alreadyOwns || unlockingSet.current.has(regionName)) {
            console.warn(`[GameContext] Duplicación evitada: NFT de la zona ${regionName} ya está en proceso o en posesión.`);
            return null;
        }

        // 3. Lock the process for this specific region
        unlockingSet.current.add(regionName);

        // 4. Release the lock after a small delay (180ms) to allow UI recovery
        setTimeout(() => unlockingSet.current.delete(regionName), 180);

        return unlockNFT({ title: regionName, image: regionImage, rarity: 'Common', acquisition: 'nft_acq_region' });
    };
    const markNFTSeen = (id) => {
        setNfts(prev => prev.map(n => n.id === id ? { ...n, isNew: false } : n));
    };
    const markNFTClaimed = (id) => {
        setNfts(prev => {
            const updated = prev.map(n => n.id === id ? { ...n, claimed: true } : n);
            updateUserProfile({ NFTs: updated });
            return updated;
        });
    };
    const scanItem = (type, customPoints = null) => {
        const SCORING = { bottle: 5, can: 3, trash: 1 };
        const value = customPoints !== null ? customPoints : (SCORING[type] || 0);

        setPoints(prev => prev + value);
        
        // Update scanned items state
        setScannedItems(prev => {
            const updated = { 
                ...prev, 
                [type]: (prev[type] || 0) + 1, 
                total: (prev.total || 0) + 1 
            };
            return updated;
        });

        // Track in cleanup history if there's an active beach
        if (activeBeach) {
            setCleanupHistory(prev => {
                const now = new Date().toISOString();
                const sessionDate = now.split('T')[0];

                // Find existing session for today and this beach
                const existingSessionIndex = prev.findIndex(s => s.beachId === activeBeach.id && s.timestamp.startsWith(sessionDate));

                if (existingSessionIndex >= 0) {
                    const updated = [...prev];
                    const session = { ...updated[existingSessionIndex] };
                    session.scans = { ...session.scans, [type]: (session.scans[type] || 0) + 1, total: (session.scans.total || 0) + 1 };
                    session.pointsEarned += value;
                    updated[existingSessionIndex] = session;
                    return updated;
                } else {
                    return [{
                        beachId: activeBeach.id,
                        beachName: activeBeach.name,
                        timestamp: now,
                        scans: { [type]: 1, total: 1 },
                        pointsEarned: value
                    }, ...prev];
                }
            });
        }

        return { value };
    };
    const startCleanup = (beach) => {
        setActiveBeach(beach);
    };
    const endCleanup = () => {
        setActiveBeach(null);
    };

    const syncTPLToBlockchain = async (amount = null) => {
        const mintAmount = amount !== null ? amount : points;
        if (!user.walletAddress || mintAmount <= 0) return { success: false, error: 'No wallet or points to sync' };

        try {
            console.log(`📡 Iniciando sincronización de ${mintAmount} TPL a la Blockchain...`);
            // Prioridad: Variable de entorno > Localhost (si estamos en dev) > Fallback Vercel
            const appUrl = ENV.APP_URL;

            const response = await fetch(`${appUrl}/api/mint-tpl`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    address: user.walletAddress,
                    amount: mintAmount
                }),
            });

            const data = await response.json();

            if (data.success) {
                console.log('✅ Puntos sincronizados con éxito:', data.hash);
                // Opcional: Podríamos marcar los puntos como "ya sincronizados" para no duplicar,
                // pero como el contrato requiere onlyOwner y nosotros validamos, por ahora 
                // simplemente actualizamos el estado para reflejar el éxito.
                // En una versión más robusta, resetearíamos los puntos locales si la blockchain es la única fuente.
                return { success: true, hash: data.hash };
            } else {
                throw new Error(data.error || 'Error desconocido en el servidor');
            }
        } catch (error) {
            console.error('❌ Error sincronizando TPL:', error);
            return { success: false, error: error.message };
        }
    };

    const updateUserProfile = async (updates) => {
        // Update local state
        setUser(prev => {
            const updated = { ...prev, ...updates };
            // Persist user data to AsyncStorage
            AsyncStorage.setItem(GAME_KEYS.USER, JSON.stringify(updated)).catch(err => 
                console.warn('Error persisting user data:', err)
            );
            return updated;
        });

        // Keep AuthContext username in sync if name changes
        if (updates.name && setAuthUsername) {
            setAuthUsername(updates.name);
            AsyncStorage.setItem('@tpl_username', updates.name).catch(err =>
                console.warn('Error persisting auth username:', err)
            );
        }
        
        // ✅ Sync with backend if mongoUserId is available
        if (mongoUserId) {
            try {
                const apiUrl = ENV.API_BASE_URL;
                
                const backendUpdates = { ...updates };
                if (updates.avatar) {
                    backendUpdates.avatar_url = updates.avatar;
                    delete backendUpdates.avatar;
                }
                if (updates.name) {
                    backendUpdates.username = updates.name;
                    delete backendUpdates.name;
                }
                
                const response = await fetch(`${apiUrl}/api/users/${mongoUserId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(backendUpdates),
                });
                
                if (!response.ok) {
                    console.warn('⚠️ Error syncing profile to backend:', response.status);
                } else {
                    console.log('✅ Profile synced to backend');
                }
            } catch (error) {
                console.warn('⚠️ Error updating user profile in backend:', error.message);
            }
        }
    };
    return (
        <GameContext.Provider value={{
            scannedItems,
            nfts,
            points,
            level,
            user,
            activeBeach,
            cleanupHistory,
            startCleanup,
            endCleanup,
            updateUserProfile,
            scanItem,
            unlockNFT,
            unlockRegionNFT,
            reloadGameState: loadGameState,
            claimNFT: (id, txHash) => {
                setNfts(prev => {
                    const updated = prev.map(n => n.id === id ? { ...n, claimed: true, txHash } : n);
                    updateUserProfile({ NFTs: updated });
                    return updated;
                });
            },
            markNFTSeen: (id) => {
                setNfts(prev => prev.map(n => n.id === id ? { ...n, isNew: false } : n));
            },
            syncTPLToBlockchain
        }}>
            {children}
        </GameContext.Provider>
    );
};
export default GameContext;
