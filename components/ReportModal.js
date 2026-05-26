import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, Image, ScrollView, Platform, useWindowDimensions, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { rs, rf, rh, SPACING, RADIUS } from '../constants/responsive';
import { BRAND, GRADIENTS } from '../constants/theme';
import ENV from '../constants/env';

// Backend API URL - CAMBIAR SEGÚN TU ENTORNO
const API_URL = ENV.API_BASE_URL;

const REPORT_TYPES = [
    { id: 'general', title: 'Reporte General', subtitle: 'Situación común', icon: 'grid-outline' },
    { id: 'state', title: 'Estado de Playa', subtitle: 'Mareas y condiciones', icon: 'water-outline' },
    { id: 'trash', title: 'Basura Anormal', subtitle: 'Residuos grandes', icon: 'trash-outline' },
    { id: 'animal', title: 'Animal Muerto', subtitle: 'Especies marinas', icon: 'fish-outline' },
];

export default function ReportModal({ visible, beach, onClose }) {
    const { colors, isDark } = useTheme();
    const { t } = useLanguage();
    const { width } = useWindowDimensions();
    const isDesktop = width >= 1024;
    
    const [selectedType, setSelectedType] = useState('general');
    const [details, setDetails] = useState('');
    const [uploadedImage, setUploadedImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            setUploadedImage(result.assets[0].uri);
        }
    };

    const convertImageToBase64 = async (imageUri) => {
        try {
            const base64 = await FileSystem.readAsStringAsync(imageUri, {
                encoding: FileSystem.Encoding.Base64,  // Corregido: EncodingType -> Encoding
            });
            return base64;
        } catch (error) {
            console.error('Error converting image:', error);
            return null;
        }
    };

    const getCurrentLocation = async () => {
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMessage('Permiso de ubicación denegado');
                return null;
            }
            const location = await Location.getCurrentPositionAsync({});
            return {
                lat: location.coords.latitude,
                lng: location.coords.longitude,
            };
        } catch (error) {
            console.error('Error getting location:', error);
            return {
                lat: beach?.lat || 0,
                lng: beach?.lng || 0,
            };
        }
    };

    const submitReport = async () => {
        // Validar que haya detalles
        if (!details.trim()) {
            setErrorMessage('Por favor describe lo que observaste');
            return;
        }

        setLoading(true);
        setErrorMessage(null);
        setSuccessMessage(null);

        try {
            // Obtener ubicación actual
            let location = await getCurrentLocation();
            
            // Si no se pudo obtener ubicación, usar la del beach como fallback
            if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
                location = {
                    lat: parseFloat(beach?.lat) || 0,
                    lng: parseFloat(beach?.lng) || 0,
                };
            }

            // Convertir imagen a base64 si existe
            let imageBase64 = null;
            if (uploadedImage) {
                imageBase64 = await convertImageToBase64(uploadedImage);
            }

            // Construir objeto del reporte
            const reportData = {
                report_type: selectedType,
                msg: details.trim(),  // Cambiado de 'details' a 'msg'
                beach_name: beach.name,
                beach_id: beach.id ? String(beach.id) : null,  // Convertir a string
                location: {
                    lat: location.lat,
                    lng: location.lng,
                    beach_name: beach.name,
                    sector: beach.zone || 'General',
                },
                image_uri: imageBase64, // Base64 de la imagen
                user_id: null, // Cambiar por user_id real si tienes autenticación
                user_name: 'Anonymous',
            };

            console.log('Sending report data:', reportData);

            // Enviar al backend
            const response = await fetch(`${API_URL}/api/reports`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(reportData),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Response error:', response.status, errorText);
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();

            if (result.success) {
                setSuccessMessage(`✅ Reporte enviado exitosamente!\nID: ${result.report_id}`);
                
                // Limpiar formulario después de 2 segundos
                setTimeout(() => {
                    setDetails('');
                    setUploadedImage(null);
                    setSelectedType('general');
                    setSuccessMessage(null);
                    onClose();
                }, 2000);

                // Mostrar alerta de éxito
                if (Platform.OS === 'web') {
                    alert(`✅ ¡Reporte enviado exitosamente!\n\nID del reporte: ${result.report_id}`);
                } else {
                    Alert.alert('Éxito', `¡Reporte enviado exitosamente!\n\nID: ${result.report_id}`);
                }
            } else {
                throw new Error(result.message || 'Error desconocido');
            }
        } catch (error) {
            console.error('Error submitting report:', error);
            const errorMsg = error.message || 'Error al enviar el reporte. Intenta de nuevo.';
            setErrorMessage(errorMsg);

            if (Platform.OS === 'web') {
                alert(`❌ Error: ${errorMsg}`);
            } else {
                Alert.alert('Error', errorMsg);
            }
        } finally {
            setLoading(false);
        }
    };

    if (!beach) return null;

    return (
        <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={[styles.modalContainer, { backgroundColor: isDark ? colors.backgroundSecondary : '#f8fafc', width: isDesktop ? rs(850) : '95%' }]}>
                    
                    {/* Close Button */}
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Ionicons name="close" size={rs(24)} color={colors.textMuted} />
                    </TouchableOpacity>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                        
                        {/* Header Section */}
                        <View style={styles.headerSection}>
                            <View style={styles.headerTextContainer}>
                                <Text style={[styles.superTitle, { color: BRAND.primary }]}>NUEVA CONTRIBUCIÓN</Text>
                                <Text style={[styles.mainTitle, { color: colors.text }]}>
                                    Reportar en <Text style={{ color: BRAND.primary }}>{beach.name}</Text>
                                </Text>
                                <Text style={[styles.description, { color: colors.textSecondary }]}>
                                    Ayúdanos a mantener nuestras costas limpias. Tu reporte genera un impacto directo en la preservación del ecosistema marino.
                                </Text>
                            </View>
                            {isDesktop && (
                                <Image 
                                    source={beach.image} 
                                    style={styles.headerImage} 
                                />
                            )}
                        </View>

                        <View style={[styles.contentColumns, { flexDirection: isDesktop ? 'row' : 'column' }]}>
                            
                            {/* Left Column */}
                            <View style={styles.leftColumn}>
                                {/* Report Type */}
                                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>TIPO DE REPORTE</Text>
                                <View style={styles.typeGrid}>
                                    {REPORT_TYPES.map(type => {
                                        const isSelected = selectedType === type.id;
                                        return (
                                            <TouchableOpacity 
                                                key={type.id}
                                                style={[
                                                    styles.typeCard, 
                                                    { backgroundColor: isDark ? (isSelected ? 'rgba(6, 182, 212, 0.1)' : 'rgba(255,255,255,0.03)') : (isSelected ? 'rgba(6, 182, 212, 0.05)' : '#fff') },
                                                    isSelected && { borderColor: BRAND.primary, borderWidth: 2 }
                                                ]}
                                                onPress={() => setSelectedType(type.id)}
                                            >
                                                <Ionicons name={type.icon} size={rs(20)} color={isSelected ? BRAND.primary : colors.textSecondary} style={{ marginBottom: SPACING.sm }} />
                                                <Text style={[styles.typeTitle, { color: colors.text }]}>{type.title}</Text>
                                                <Text style={[styles.typeSubtitle, { color: colors.textMuted }]}>{type.subtitle}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>

                                {/* Details */}
                                <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: SPACING.xl }]}>DETALLES DEL HALLAZGO</Text>
                                <View style={[styles.textAreaContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f1f5f9' }]}>
                                    <TextInput
                                        style={[styles.textArea, { color: colors.text }]}
                                        placeholder={`Describe lo que has observado en ${beach.name}...`}
                                        placeholderTextColor={colors.textMuted}
                                        multiline
                                        numberOfLines={4}
                                        value={details}
                                        onChangeText={setDetails}
                                        maxLength={500}
                                    />
                                    <Text style={[styles.charCount, { color: colors.textMuted }]}>{details.length} / 500</Text>
                                </View>

                                {/* Multimedia */}
                                <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: SPACING.xl }]}>CARGAR MULTIMEDIA</Text>
                                <View style={styles.multimediaContainer}>
                                    <TouchableOpacity 
                                        style={[styles.uploadBtn, { borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }]}
                                        onPress={pickImage}
                                    >
                                        <Ionicons name="camera" size={rs(24)} color={BRAND.primary} />
                                        <Text style={[styles.uploadText, { color: colors.textSecondary }]}>SUBIR</Text>
                                    </TouchableOpacity>
                                    <Image 
                                        source={uploadedImage ? { uri: uploadedImage } : beach.image} 
                                        style={styles.mediaThumbnail} 
                                    />
                                </View>
                            </View>

                            {/* Right Column */}
                            <View style={styles.rightColumn}>
                                {/* Map */}
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm }}>
                                    <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginBottom: 0 }]}>UBICACIÓN PRECISA</Text>
                                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                        <Ionicons name="locate" size={rs(14)} color={BRAND.primary} />
                                        <Text style={{ fontSize: rf(12), color: BRAND.primary, fontWeight: '600' }}>Centrar</Text>
                                    </TouchableOpacity>
                                </View>
                                
                                <View style={styles.mapContainer}>
                                    <Image 
                                        source={beach.image} 
                                        style={styles.mapSnapshot} 
                                        blurRadius={2}
                                    />
                                    {/* Overlay Pin */}
                                    <View style={styles.mapPin}>
                                        <Ionicons name="location" size={rs(24)} color={BRAND.primary} />
                                    </View>
                                    
                                    <View style={[styles.locationLabel, { backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)' }]}>
                                        <Ionicons name="location-outline" size={rs(16)} color={colors.text} />
                                        <View>
                                            <Text style={[styles.locationLabelText, { color: colors.text }]}>Sector Norte, {beach.name}</Text>
                                            <Text style={[styles.locationCoords, { color: colors.textSecondary }]}>{beach.lat}, {beach.lng}</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Reward */}
                                <View style={[styles.rewardCard, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.1)' : '#fef3c7' }]}>
                                    <Ionicons name="checkmark-circle" size={rs(20)} color="#d97706" style={{ marginTop: 2 }} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.rewardTitle, { color: '#92400e' }]}>Recompensa Estimada</Text>
                                        <Text style={[styles.rewardDesc, { color: '#b45309' }]}>
                                            Al completar este reporte de basura anormal, recibirás <Text style={{ fontWeight: 'bold' }}>50 TPL tokens</Text> tras la validación de la comunidad.
                                        </Text>
                                    </View>
                                </View>

                                {/* Submit Button */}
                                <View style={{ marginTop: 'auto', paddingTop: SPACING.xl }}>
                                    {/* Error Message */}
                                    {errorMessage && (
                                        <View style={[styles.messageBox, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444', borderWidth: 1 }]}>
                                            <Ionicons name="alert-circle" size={rs(18)} color="#ef4444" />
                                            <Text style={[styles.messageText, { color: '#dc2626' }]}>{errorMessage}</Text>
                                        </View>
                                    )}

                                    {/* Success Message */}
                                    {successMessage && (
                                        <View style={[styles.messageBox, { backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: '#22c55e', borderWidth: 1 }]}>
                                            <Ionicons name="checkmark-circle" size={rs(18)} color="#22c55e" />
                                            <Text style={[styles.messageText, { color: '#16a34a' }]}>{successMessage}</Text>
                                        </View>
                                    )}

                                    <TouchableOpacity 
                                        onPress={submitReport} 
                                        disabled={loading}
                                        style={{ opacity: loading ? 0.6 : 1 }}
                                    >
                                        <LinearGradient
                                            colors={loading ? ['#9ca3af', '#9ca3af'] : GRADIENTS.primary}
                                            style={styles.submitButton}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                        >
                                            {loading ? (
                                                <>
                                                    <ActivityIndicator size="small" color="#fff" />
                                                    <Text style={styles.submitText}>Enviando...</Text>
                                                </>
                                            ) : (
                                                <>
                                                    <Text style={styles.submitText}>Enviar Reporte</Text>
                                                    <Ionicons name="send" size={rs(18)} color="#fff" />
                                                </>
                                            )}
                                        </LinearGradient>
                                    </TouchableOpacity>
                                    <Text style={[styles.termsText, { color: colors.textMuted }]}>
                                        AL ENVIAR, ACEPTAS NUESTROS TÉRMINOS DE PRESERVACIÓN COSTERA
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.lg,
    },
    modalContainer: {
        borderRadius: RADIUS.xl,
        maxHeight: '95%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 30,
        elevation: 10,
        overflow: 'hidden',
    },
    closeButton: {
        position: 'absolute',
        top: SPACING.lg,
        right: SPACING.lg,
        zIndex: 10,
        padding: SPACING.xs,
    },
    scrollContent: {
        padding: SPACING.xl,
    },
    headerSection: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: SPACING.xxl,
    },
    headerTextContainer: {
        flex: 1,
        paddingRight: SPACING.lg,
    },
    superTitle: {
        fontSize: rf(11),
        fontWeight: '800',
        letterSpacing: 1.5,
        marginBottom: SPACING.sm,
    },
    mainTitle: {
        fontSize: rf(28),
        fontWeight: '900',
        marginBottom: SPACING.sm,
        letterSpacing: -0.5,
    },
    description: {
        fontSize: rf(14),
        lineHeight: rf(22),
    },
    headerImage: {
        width: rs(120),
        height: rs(120),
        borderRadius: RADIUS.lg,
        transform: [{ rotate: '5deg' }],
    },
    contentColumns: {
        gap: SPACING.xxl,
    },
    leftColumn: {
        flex: 1.2,
    },
    rightColumn: {
        flex: 1,
        display: 'flex',
    },
    sectionLabel: {
        fontSize: rf(12),
        fontWeight: '700',
        marginBottom: SPACING.md,
        letterSpacing: 0.5,
    },
    typeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.md,
    },
    typeCard: {
        width: '47%',
        padding: SPACING.md,
        borderRadius: RADIUS.lg,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    typeTitle: {
        fontSize: rf(13),
        fontWeight: '700',
        marginBottom: 2,
    },
    typeSubtitle: {
        fontSize: rf(11),
    },
    textAreaContainer: {
        borderRadius: RADIUS.lg,
        padding: SPACING.md,
    },
    textArea: {
        height: rs(100),
        textAlignVertical: 'top',
        fontSize: rf(14),
    },
    charCount: {
        fontSize: rf(11),
        textAlign: 'right',
        marginTop: SPACING.xs,
    },
    multimediaContainer: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
    uploadBtn: {
        width: rs(80),
        height: rs(80),
        borderRadius: RADIUS.lg,
        borderWidth: 2,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
    },
    uploadText: {
        fontSize: rf(10),
        fontWeight: '700',
        marginTop: SPACING.xs,
    },
    mediaThumbnail: {
        width: rs(80),
        height: rs(80),
        borderRadius: RADIUS.lg,
    },
    mapContainer: {
        height: rs(220),
        borderRadius: RADIUS.xl,
        overflow: 'hidden',
        marginBottom: SPACING.xl,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mapSnapshot: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    mapPin: {
        width: rs(40),
        height: rs(40),
        backgroundColor: 'rgba(6, 182, 212, 0.2)',
        borderRadius: rs(20),
        justifyContent: 'center',
        alignItems: 'center',
    },
    locationLabel: {
        position: 'absolute',
        bottom: SPACING.md,
        left: SPACING.md,
        right: SPACING.md,
        padding: SPACING.sm,
        borderRadius: RADIUS.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    locationLabelText: {
        fontSize: rf(12),
        fontWeight: '700',
    },
    locationCoords: {
        fontSize: rf(10),
    },
    rewardCard: {
        flexDirection: 'row',
        padding: SPACING.md,
        borderRadius: RADIUS.lg,
        gap: SPACING.sm,
    },
    rewardTitle: {
        fontSize: rf(13),
        fontWeight: '700',
        marginBottom: 2,
    },
    rewardDesc: {
        fontSize: rf(12),
        lineHeight: rf(16),
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.md,
        borderRadius: RADIUS.round,
        gap: SPACING.sm,
        marginBottom: SPACING.sm,
    },
    submitText: {
        color: '#fff',
        fontSize: rf(16),
        fontWeight: 'bold',
    },
    termsText: {
        fontSize: rf(9),
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    messageBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        borderRadius: RADIUS.md,
        marginBottom: SPACING.md,
        gap: SPACING.sm,
    },
    messageText: {
        flex: 1,
        fontSize: rf(12),
        fontWeight: '500',
    },
});
