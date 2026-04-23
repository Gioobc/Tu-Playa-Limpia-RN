import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Platform,
  Modal,
  Linking,
  Image,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { BRAND } from "../constants/theme";
import { rs, rf, SPACING, RADIUS } from "../constants/responsive";
import { useGame } from '../context/GameContext';
import { useLanguage } from '../context/LanguageContext';
import CelebrationModal from '../components/CelebrationModal';
import { mintNFT } from "../utils/blockchain/missionNFT";
import { generateNFTAttributes } from "../utils/nftGenerator";
import FlagIcon from "../components/FlagIcon";
import { LANGUAGE_LABELS } from "../constants/translations";
const BLUE_GREY = "#607d8b";
const BLUE_GREY_DARK = "#455a64";
const BLUE_GREY_LIGHT = "#cfd8dc";
const BLUE_GREY_BG = "rgba(96, 125, 139, 0.15)";
const LIMA_BEACHES = [
  {
    id: 1,
    name: "Playa Miramar",
    zone: "Lima Norte",
    district: "Ancón",
    lat: -11.7695,
    lng: -77.1758,
    image: require("./Beach/data/PE-LIM-MIRAMAR.webp"),
    clean: true,
    people: 0,
    country: "pe",
  },
  {
    id: 2,
    name: "Playa Las Conchitas",
    zone: "Lima Norte",
    district: "Ancón",
    lat: -11.7588,
    lng: -77.1732,
    image: require("./Beach/data/PE-LIM-LASCONCHITAS.webp"),
    clean: true,
    people: 0,
    country: "pe",
  },
  {
    id: 3,
    name: "Playa Hermosa",
    zone: "Lima Norte",
    district: "Ancón",
    lat: -11.7772,
    lng: -77.1803,
    image: require("./Beach/data/PE-LIM-PLAYAHERMOSA.webp"),
    clean: true,
    people: 0,
    country: "pe",
  },
  {
    id: 4,
    name: "Playa Chica",
    zone: "Lima Norte",
    district: "Santa Rosa",
    lat: -11.8015,
    lng: -77.1688,
    image: require("./Beach/data/PE-LIM-PLAYACHICA.webp"),
    clean: true,
    people: 0,
    country: "pe",
  },
  {
    id: 5,
    name: "Playa Grande",
    zone: "Lima Norte",
    district: "Santa Rosa",
    lat: -11.8082,
    lng: -77.1655,
    image: require("./Beach/data/PE-LIM-PLAYAGRANDE.webp"),
    clean: true,
    people: 0,
    country: "pe",
  },
  {
    id: 6,
    name: "Punta Roquitas",
    zone: "Lima Centro",
    district: "Miraflores",
    lat: -12.1215,
    lng: -77.0418,
    image: require("./Beach/data/PE-LIM-PUNTAROQUITAS.webp"),
    clean: true,
    people: 0,
    country: "pe",
  },
  {
    id: 7,
    name: "La Pampilla",
    zone: "Lima Centro",
    district: "Miraflores",
    lat: -12.1234,
    lng: -77.0402,
    image: require("./Beach/data/PE-LIM-LAPAMPILLA.webp"),
    clean: true,
    people: 0,
    country: "pe",
  },
  {
    id: 8,
    name: "Waikiki",
    zone: "Lima Centro",
    district: "Miraflores",
    lat: -12.1275,
    lng: -77.0377,
    image: require("./Beach/data/PE-LIM-WAIKIKI.webp"),
    clean: true,
    people: 0,
    country: "pe",
  },
  {
    id: 9,
    name: "Makaha",
    zone: "Lima Centro",
    district: "Miraflores",
    lat: -12.1287,
    lng: -77.0369,
    image: require("./Beach/data/PE-LIM-MAKAHA.webp"),
    clean: true,
    people: 0,
    country: "pe",
  },
  {
    id: 10,
    name: "Redondo",
    zone: "Lima Centro",
    district: "Miraflores",
    lat: -12.1315,
    lng: -77.0352,
    image: require("./Beach/data/PE-LIM-REDONDO.webp"),
    clean: true,
    people: 0,
    country: "pe",
  },
  {
    id: 11,
    name: "La Estrella",
    zone: "Lima Centro",
    district: "Miraflores",
    lat: -12.1342,
    lng: -77.0335,
    image: require("./Beach/data/PE-LIM-LAESTRELLA.webp"),
    clean: false,
    people: 0,
    country: "pe",
  },
  {
    id: 12,
    name: "Las Cascadas",
    zone: "Lima Centro",
    district: "Barranco",
    lat: -12.1438,
    lng: -77.0289,
    image: require("./Beach/data/PE-LIM-LASCASCADAS.webp"),
    clean: true,
    people: 0,
    country: "pe",
  },
  {
    id: 13,
    name: "Barranquito",
    zone: "Lima Centro",
    district: "Barranco",
    lat: -12.1472,
    lng: -77.0275,
    image: require("./Beach/data/PE-LIM-BARRANQUITO.webp"),
    clean: true,
    people: 0,
    country: "pe",
  },
  {
    id: 14,
    name: "Los Pavos",
    zone: "Lima Centro",
    district: "Barranco",
    lat: -12.1505,
    lng: -77.0263,
    image: require("./Beach/data/PE-LIM-LOSPAVOS.webp"),
    clean: false,
    people: 0,
    country: "pe",
  },
  {
    id: 15,
    name: "Los Yuyos",
    zone: "Lima Centro",
    district: "Barranco",
    lat: -12.1528,
    lng: -77.0255,
    image: require("./Beach/data/PE-LIM-LOSYUYOS.webp"),
    clean: false,
    people: 0,
    country: "pe",
  },
  {
    id: 16,
    name: "Las Sombrillas",
    zone: "Lima Centro",
    district: "Barranco",
    lat: -12.1569,
    lng: -77.0258,
    image: require("./Beach/data/PE-LIM-LASSOMBRILLAS.webp"),
    clean: true,
    people: 0,
    country: "pe",
  },
  {
    id: 17,
    name: "Agua Dulce",
    zone: "Lima Centro",
    district: "Chorrillos",
    lat: -12.1612,
    lng: -77.0266,
    image: require("./Beach/data/PE-LIM-AGUADULCE.webp"),
    clean: false,
    people: 0,
    country: "pe",
  },
  {
    id: 18,
    name: "Pescadores",
    zone: "Lima Centro",
    district: "Chorrillos",
    lat: -12.1645,
    lng: -77.0278,
    image: require("./Beach/data/PE-LIM-PESCADORES.webp"),
    clean: false,
    people: 0,
    country: "pe",
  },
  {
    id: 19,
    name: "La Herradura",
    zone: "Lima Centro",
    district: "Chorrillos",
    lat: -12.1744,
    lng: -77.0336,
    image: require("./Beach/data/PE-LIM-LAHERRADURA.webp"),
    clean: false,
    people: 0,
    country: "pe",
  },
  {
    id: 20,
    name: "La Chira",
    zone: "Lima Centro",
    district: "Chorrillos",
    lat: -12.1885,
    lng: -77.0405,
    image: require("./Beach/data/PE-LIM-LACHIRA.webp"),
    clean: false,
    people: 0,
    country: "pe",
  },
  {
    id: 21,
    name: "Playa Venecia",
    zone: "Lima Sur",
    district: "Villa El Salvador",
    lat: -12.2355,
    lng: -76.9758,
    image: require("./Beach/data/PE-LIM-PLAYAVENECIA.webp"),
    clean: true,
    people: 0,
    country: "pe",
  },
  {
    id: 22,
    name: "Barlovento",
    zone: "Lima Sur",
    district: "Villa El Salvador",
    lat: -12.2452,
    lng: -76.9655,
    image: require("./Beach/data/PE-LIM-BARLOVENTO.webp"),
    clean: true,
    people: 0,
    country: "pe",
  },
  {
    id: 23,
    name: "San Pedro",
    zone: "Lima Sur",
    district: "Lurín",
    lat: -12.2685,
    lng: -76.9248,
    image: require("./Beach/data/PE-LIM-SANPEDRO.webp"),
    clean: true,
    people: 0,
    country: "pe",
  },
  {
    id: 24,
    name: "Arica",
    zone: "Lima Sur",
    district: "Lurín",
    lat: -12.2785,
    lng: -76.9125,
    image: require("./Beach/data/PE-LIM-ARICA.webp"),
    clean: false,
    people: 0,
    country: "pe",
  },
  {
    id: 25,
    name: "Los Pulpos",
    zone: "Lima Sur",
    district: "Lurín",
    lat: -12.2882,
    lng: -76.9015,
    image: require("./Beach/data/PE-LIM-LOSPULPUS.webp"),
    clean: true,
    people: 0,
    country: "pe",
  },
  {
    id: 26,
    name: "El Silencio",
    zone: "Sur Chico",
    district: "Punta Hermosa",
    lat: -12.3153,
    lng: -76.8364,
    image: require("./Beach/data/PE-LIM-ELSILENCIO.webp"),
    clean: true,
    people: 0,
    country: "pe",
  },
  {
    id: 27,
    name: "Caballeros",
    zone: "Sur Chico",
    district: "Punta Hermosa",
    lat: -12.3297,
    lng: -76.8319,
    image: require("./Beach/data/PE-LIM-PLAYACABALLEROS.webp"),
    clean: true,
    people: 0,
    country: "pe",
  },
  {
    id: 28,
    name: "Señoritas",
    zone: "Sur Chico",
    district: "Punta Hermosa",
    lat: -12.3315,
    lng: -76.8292,
    image: require("./Beach/data/PE-LIM-PLAYASENORITAS.webp"),
    clean: true,
    people: 0,
    country: "pe",
  },
  {
    id: 29,
    name: "Los Pulpos",
    zone: "Sur Chico",
    district: "Punta Hermosa",
    lat: -12.42,
    lng: -76.75,
    image: require("./Beach/data/PE-LIM-LOSPULPUS.webp"),
    clean: true,
    people: 0,
    country: "pe",
  },
  {
    id: 30,
    name: "Punta Negra",
    zone: "Sur Chico",
    district: "Punta Negra",
    lat: -12.365,
    lng: -76.795,
    image: require("./Beach/data/PE-LIM-PUNTAROQUITAS.webp"),
    clean: true,
    people: 0,
    country: "pe",
  },
  {
    id: 31,
    name: "San Bartolo",
    zone: "Sur Chico",
    district: "San Bartolo",
    lat: -12.383,
    lng: -76.782,
    image: require("./Beach/data/PE-LIM-BARRANQUITO.webp"),
    clean: true,
    people: 0,
    country: "pe",
  },
  {
    id: 32,
    name: "Santa María",
    zone: "Sur Chico",
    district: "Santa María",
    lat: -12.405,
    lng: -76.767,
    image: require("./Beach/data/PE-LIM-SANPEDRO.webp"),
    clean: true,
    people: 0,
    country: "pe",
  },
  {
    id: 33,
    name: "Naplo",
    zone: "Sur Grande",
    district: "Pucusana",
    lat: -12.45,
    lng: -76.72,
    image: require("./Beach/data/PE-LIM-LASSOMBRILLAS.webp"),
    clean: true,
    people: 0,
    country: "pe",
  },
  {
    id: 34,
    name: "Pucusana",
    zone: "Sur Grande",
    district: "Pucusana",
    lat: -12.48,
    lng: -76.68,
    image: require("./Beach/data/PE-LIM-PLAYASENORITAS.webp"),
    clean: true,
    people: 0,
    country: "pe",
  },
  {
    id: 35,
    name: "Asia",
    zone: "Sur Grande",
    district: "Pucusana",
    lat: -12.52,
    lng: -76.65,
    image: require("./Beach/data/PE-LIM-LOSPAVOS.webp"),
    clean: true,
    people: 0,
    country: "pe",
  },
  {
    id: 36,
    name: "Cerro Azul",
    zone: "Sur Grande",
    district: "Cerro Azul",
    lat: -12.55,
    lng: -76.62,
    image: require("./Beach/data/PE-LIM-PLAYACABALLEROS.webp"),
    clean: true,
    people: 0,
    country: "pe",
  },
  {
    id: 37,
    name: "Puerto Viejo",
    zone: "Sur Grande",
    district: "Cerro Azul",
    lat: -12.58,
    lng: -76.59,
    image: require("./Beach/data/PE-LIM-PLAYAHERMOSA.webp"),
    clean: true,
    people: 0,
    country: "pe",
  },
  {
    id: 38,
    name: "Tuquillo",
    zone: "Sur Grande",
    district: "Cerro Azul",
    lat: -12.61,
    lng: -76.56,
    image: require("./Beach/data/PE-LIM-AGUADULCE.webp"),
    clean: true,
    people: 0,
    country: "pe",
  },
];
const LIMA_CENTER = { lat: -12.12, lng: -77.03 };
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};
const getFlag = (district, zone) => {
  const mapping = {
    "Ancón": "pe", "Santa Rosa": "pe", "Miraflores": "pe", "Barranco": "pe",
    "Chorrillos": "pe", "Villa El Salvador": "pe", "Lurín": "pe", "Punta Hermosa": "pe",
    "Lima Norte": "pe", "Lima Centro": "pe", "Lima Sur": "pe", "Sur Chico": "pe", "Sur Grande": "pe",
    "Los Angeles": "us", "Malibu": "us", "Miami Beach": "us", "Honolulu": "us",
    "Orange County": "us", "San Diego": "us", "Clearwater": "us",
    "Quintana Roo": "mx", "Cancún": "mx", "Tulum": "mx", "Isla Mujeres": "mx",
    "Los Cabos": "mx", "Puerto Vallarta": "mx",
    "Rio de Janeiro": "br", "Ceará": "br", "Fernando de Noronha": "br",
    "Cartagena": "co", "La Guajira": "co", "San Andrés": "co",
    "Punta Cana": "do",
    "Culebra": "pr",
    "Buenos Aires": "ar", "Mar del Plata": "ar",
    "Maldonado": "uy", "Punta del Este": "uy",
    "Isla de Pascua": "cl", "Valparaíso": "cl",
    "San Sebastián": "es", "Galicia": "es", "Barcelona": "es", "Formentera": "es",
    "Algarve": "pt",
    "Corsica": "fr", "Saint-Tropez": "fr",
    "Lampedusa": "it",
    "Zakynthos": "gr", "Crete": "gr",
    "Dubai": "ae",
    "Sharm El Sheikh": "eg",
    "Agadir": "ma",
    "Muscat": "om",
    "Goa": "in", "Kerala": "in", "Andaman Islands": "in",
    "Hainan": "cn", "Sanya": "cn",
    "Hong Kong": "hk",
    "Taiwan": "tw",
  };
  return mapping[district] || mapping[zone] || null;
};
const getZoneEmoji = (zone) => {
  const mapping = {
    "all": "all",
    "Lima Norte": "pe",
    "Lima Centro": "pe",
    "Lima Sur": "pe",
    "Sur Chico": "pe",
    "Sur Grande": "pe",
  };
  return mapping[zone] || null;
};
const zoneMapping = {
  "Lima Norte": "map_zone_north",
  "Lima Centro": "map_zone_center",
  "Lima Sur": "map_zone_south",
  "Sur Chico": "map_zone_south_chico",
  "Sur Grande": "map_zone_south_grande",
};
const LANGUAGE_TO_ZONE = {
  es: "map_all_zones",
  en: "map_all_zones",
  zh: "map_all_zones",
  hi: "map_all_zones",
  ar: "map_all_zones",
  fr: "map_all_zones",
  pt: "map_all_zones",
};
const BeachCard = ({ beach, isDark, onPress, t }) => {
  const cardBg = isDark ? "rgba(13, 58, 77, 0.6)" : "#ffffff";
  const textColor = "#ffffff";
  const subTextColor = "rgba(170, 222, 243, 0.8)";
  const statusBg = beach.clean ? BLUE_GREY_BG : "rgba(245, 158, 11, 0.15)";
  const statusColor = beach.clean ? BLUE_GREY : "#f59e0b";
  const flag = getFlag(beach.district, beach.zone);
  const locationText = `${beach.district}`;
  return (
    <TouchableOpacity
      style={[styles.beachCard, { backgroundColor: cardBg }]}
      onPress={() => onPress(beach)}
      activeOpacity={0.7}
    >
      <Image
        source={beach.image}
        style={styles.beachCardImage}
        resizeMode="cover"
      />
      { }
      <View style={styles.locationBadge}>
        <FlagIcon code={flag} size={0.8} />
        <Text style={styles.locationBadgeText}>{locationText}</Text>
      </View>
      <LinearGradient
        colors={
          isDark
            ? ["transparent", "rgba(0, 0, 0, 0.85)"]
            : ["transparent", "rgba(0, 0, 0, 0.70)"]
        }
        style={styles.beachCardGradient}
      >
        <View style={styles.beachCardContent}>
          <View style={[styles.beachCardHeader, { paddingRight: rs(40) }]}>
            <View style={{ flex: 1 }}>
              <Text
                style={[styles.beachCardTitle, { color: textColor }]}
                numberOfLines={1}
              >
                {beach.name}
              </Text>
              <Text style={[styles.beachCardSubtitle, { color: subTextColor }]}>
                {t(zoneMapping[beach.zone] || beach.zone)}
              </Text>
            </View>
          </View>
          <View style={styles.beachCardStats}>
            <View style={[styles.beachCardStat, { backgroundColor: statusBg }]}>
              <Ionicons
                name={beach.clean ? "checkmark-circle" : "alert-circle"}
                size={rs(16)}
                color={statusColor}
              />
              <Text style={[styles.beachCardStatText, { color: statusColor }]}>
                {beach.clean ? t("map_clean") : t("map_dirty")}
              </Text>
            </View>
            <View
              style={[styles.beachCardStat, { backgroundColor: BLUE_GREY_BG }]}
            >
              <Ionicons name="people" size={rs(16)} color={BLUE_GREY} />
              <Text style={[styles.beachCardStatText, { color: BLUE_GREY }]}>
                {beach.people} {t("map_cleaning_count")}
              </Text>
            </View>
          </View>
        </View>

        {/* Absolute Buttons on the right side */}
        <View style={{ position: 'absolute', right: SPACING.md, bottom: rs(48), gap: rs(8), alignItems: 'center', zIndex: 10 }}>
          <TouchableOpacity
            onPress={() => {
              const url = `https://www.google.com/maps/search/?api=1&query=${beach.lat},${beach.lng}`;
              if (Platform.OS !== "web")
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Linking.openURL(url);
            }}
            style={[styles.mapIconBtn, { backgroundColor: BLUE_GREY }]}
          >
            <Ionicons name="location" size={rs(18)} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }
              // Action for report
              if (Platform.OS === 'web') {
                window.alert("Función de reporte en desarrollo");
              }
            }}
            style={[styles.mapIconBtn, { backgroundColor: "#10b981" }]}
          >
            <Ionicons name="document-text-outline" size={rs(18)} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};
export default function BeachMapScreen({ navigation }) {
  const { colors, shadows, isDark } = useTheme();
  const { unlockRegionNFT } = useGame();
  const { t, language } = useLanguage();
  const [search, setSearch] = useState("");
  const [selectedZone, setSelectedZone] = useState("map_all_zones");
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('zona');
  const [dropdownSearch, setDropdownSearch] = useState('');
  const [selectedCleanliness, setSelectedCleanliness] = useState('all');
  const [showCelebration, setShowCelebration] = useState(false);
  useEffect(() => {
    if (language && LANGUAGE_TO_ZONE[language]) {
      setSelectedZone(LANGUAGE_TO_ZONE[language]);
    }
  }, [language]);
  const [lastUnlockedNFT, setLastUnlockedNFT] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const numColumns = isDesktop ? 4 : 1;
  const sidebarOffset = isDesktop ? 250 : 0;
  // Match FlatList paddingHorizontal (SPACING.md * 2) and add 24px safety margin for web scrollbars
  const padding = SPACING.md * 2 + (Platform.OS === 'web' ? 24 : 0);
  const gap = SPACING.md;
  const availableWidth =
    width - sidebarOffset - padding - gap * (numColumns - 1);
  const cardWidth = isDesktop ? availableWidth / numColumns : "100%";
  const zones = [
    "map_all_zones",
    "map_zone_north",
    "map_zone_center",
    "map_zone_south",
    "map_zone_south_chico",
    "map_zone_south_grande",
  ];
  const filteredBeaches = LIMA_BEACHES.filter((beach) => {
    const matchesSearch =
      beach.name.toLowerCase().includes(search.toLowerCase()) ||
      beach.district.toLowerCase().includes(search.toLowerCase()) ||
      t(zoneMapping[beach.zone] || "")
        .toLowerCase()
        .includes(search.toLowerCase());
    // Zone filtering
    let matchesZone =
      selectedZone === "map_all_zones" ||
      zoneMapping[beach.zone] === selectedZone;
    if (!search && selectedZone === "map_all_zones") {
      const preferredCountry = LANGUAGE_LABELS[language]?.code;
      if (preferredCountry) {
        matchesZone = beach.country === preferredCountry;
      }
    }
    
    // Cleanliness filtering
    let matchesCleanliness = true;
    if (selectedCleanliness === 'limpio') {
      matchesCleanliness = beach.clean === true;
    } else if (selectedCleanliness === 'sucio') {
      matchesCleanliness = beach.clean === false;
    } else if (selectedCleanliness === 'muy_sucio') {
      matchesCleanliness = beach.clean === false && beach.id % 2 === 0; // Simulate "muy sucio"
    }

    return matchesSearch && matchesZone && matchesCleanliness;
  });
  const generateSuggestions = (text) => {
    if (!text || text.length < 2) {
      setSuggestions([]);
      return;
    }
    const searchLower = text.toLowerCase();
    const suggestionSet = new Set();
    const maxSuggestions = 5;
    LIMA_BEACHES.forEach((beach) => {
      if (beach.name.toLowerCase().includes(searchLower)) {
        suggestionSet.add(JSON.stringify({ type: 'beach', text: beach.name, beach }));
      }
    });
    LIMA_BEACHES.forEach((beach) => {
      if (beach.district.toLowerCase().includes(searchLower)) {
        suggestionSet.add(JSON.stringify({ type: 'district', text: beach.district }));
      }
    });
    Object.keys(zoneMapping).forEach((zone) => {
      const translatedZone = t(zoneMapping[zone]);
      if (translatedZone.toLowerCase().includes(searchLower)) {
        suggestionSet.add(JSON.stringify({ type: 'zone', text: translatedZone, originalZone: zone }));
      }
    });
    const suggestionsArray = Array.from(suggestionSet)
      .map((s) => JSON.parse(s))
      .slice(0, maxSuggestions);
    setSuggestions(suggestionsArray);
  };
  const handleSearchChange = (text) => {
    setSearch(text);
    generateSuggestions(text);
  };
  const handleSuggestionPress = (suggestion) => {
    if (suggestion.type === 'beach') {
      setSearch(suggestion.text);
    } else if (suggestion.type === 'district') {
      setSearch(suggestion.text);
    } else if (suggestion.type === 'zone') {
      setSearch("");
      setSelectedZone(zoneMapping[suggestion.originalZone]);
    }
    setSuggestions([]);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };
  const textColor = isDark ? colors.text : "#000000";
  const subTextColor = isDark ? colors.textMuted : "#666666";
  const inputBg = isDark ? "rgba(255, 255, 255, 0.1)" : "#ffffff";
  const headerBg = isDark ? BRAND.oceanDark : "#ffffff";
  const navBarHeight = 90;
  const handleBeachPress = (beach) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const newNFT = unlockRegionNFT(beach.name, beach.image);
    if (newNFT) {
      setLastUnlockedNFT(newNFT);
      setShowCelebration(true);
    }

    // Navegar internamente a BeachDetailScreen, sin salir de la app
    navigation.navigate("BeachDetail", { beach });
  };
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <CelebrationModal
        visible={showCelebration}
        onClose={() => setShowCelebration(false)}
        message={
          lastUnlockedNFT
            ? `${t("celebration_thanks")}\n\n${t("celebration_nft_unlocked")}\n${lastUnlockedNFT.title}\n\n${t("celebration_see_rewards")}`
            : t("celebration_thanks")
        }
      />
      { }
      <View style={{ backgroundColor: headerBg, zIndex: 100 }}>
        <SafeAreaView edges={["top"]}>
          <View
            style={[styles.header, { backgroundColor: headerBg }]}
          >
            <Text style={[styles.headerTitle, { color: textColor }]}>
              {t("map_title")}
            </Text>
            <Text style={[styles.headerSubtitle, { color: subTextColor }]}>
              {filteredBeaches.length} {t("map_available")}
            </Text>
          </View>
          { }
          <View style={[styles.searchContainer, { paddingHorizontal: SPACING.md }]}>
            <View style={[
              styles.searchBar,
              {
                backgroundColor: inputBg,
                borderColor: isDark ? "rgba(255,255,255,0.15)" : "transparent",
                borderWidth: isDark ? 1 : 0
              }
            ]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: rs(8) }}>
                <FlagIcon code={LANGUAGE_LABELS[language]?.code} size={0.8} />
                <Ionicons name="search" size={rs(20)} color={BRAND.primary} />
              </View>
              <TextInput
                style={[styles.searchInput, { color: textColor }]}
                placeholder={t("map_search_placeholder") || "Search beaches..."}
                placeholderTextColor={subTextColor}
                value={search}
                onChangeText={handleSearchChange}
              />
              {search.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setSearch("");
                    setSuggestions([]);
                  }}
                  style={styles.clearButton}
                >
                  <Ionicons
                    name="close-circle"
                    size={rs(20)}
                    color={subTextColor}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
          { }
          {suggestions.length > 0 && (
            <View style={[styles.suggestionsContainer, { paddingHorizontal: SPACING.md }]}>
              <View
                style={[
                  styles.suggestionsList,
                  {
                    backgroundColor: isDark ? "rgba(13, 58, 77, 0.95)" : "#ffffff",
                    borderColor: isDark ? "rgba(96, 125, 139, 0.3)" : "rgba(226, 232, 240, 1)",
                  },
                ]}
              >
                {suggestions.map((suggestion, index) => {
                  const isBeach = suggestion.type === 'beach';
                  const isDistrict = suggestion.type === 'district';
                  const isZone = suggestion.type === 'zone';
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.suggestionItem,
                        index < suggestions.length - 1 && {
                          borderBottomWidth: 1,
                          borderBottomColor: isDark ? "rgba(96, 125, 139, 0.2)" : "rgba(226, 232, 240, 1)",
                        },
                      ]}
                      onPress={() => handleSuggestionPress(suggestion)}
                    >
                      <Ionicons
                        name={isBeach ? "location" : isDistrict ? "business" : "globe"}
                        size={rs(18)}
                        color={isBeach ? "#0ea5e9" : isDistrict ? "#8b5cf6" : "#f59e0b"}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.suggestionText, { color: textColor }]}>
                          {suggestion.text}
                        </Text>
                        <Text style={[styles.suggestionLabel, { color: subTextColor }]}>
                          {isBeach ? (t("map_suggestion_beach") || "Playa") : isDistrict ? (t("map_suggestion_district") || "Distrito") : (t("map_suggestion_zone") || "Zona")}
                        </Text>
                      </View>
                      <Ionicons name="arrow-forward" size={rs(16)} color={subTextColor} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
          { }
          { }
          <View style={{ paddingHorizontal: SPACING.md, paddingBottom: SPACING.md, zIndex: 10 }}>
            <TouchableOpacity
              style={[
                styles.githubDropdownButton,
                {
                  backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : "#ffffff",
                  borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(226, 232, 240, 1)",
                  borderWidth: 1,
                }
              ]}
              onPress={() => {
                setDropdownSearch('');
                setDropdownVisible(!isDropdownVisible);
              }}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="filter" size={rs(16)} color={textColor} style={{ marginRight: rs(8) }} />
                <Text style={[styles.githubDropdownButtonText, { color: textColor }]}>
                  {t(selectedZone)}{selectedCleanliness !== 'all' ? ` • ${selectedCleanliness === 'limpio' ? 'Limpio' : selectedCleanliness === 'sucio' ? 'Sucio' : 'Muy sucio'}` : ''}
                </Text>
              </View>
              <Ionicons name={isDropdownVisible ? "caret-up" : "caret-down"} size={rs(12)} color={textColor} style={{ marginLeft: rs(8) }} />
            </TouchableOpacity>

            {isDropdownVisible && (
                <View 
                  style={[
                    styles.githubModal, 
                    { 
                      position: 'absolute',
                      top: rs(40),
                      left: SPACING.md,
                      zIndex: 1000,
                      backgroundColor: isDark ? 'rgba(13, 58, 77, 0.98)' : '#ffffff', 
                      borderColor: isDark ? 'rgba(96, 125, 139, 0.3)' : 'rgba(226, 232, 240, 1)' 
                    }
                  ]}
                >
                  {/* Header */}
                  <View style={[styles.githubModalHeader, { borderBottomColor: isDark ? 'rgba(96, 125, 139, 0.3)' : 'rgba(226, 232, 240, 1)' }]}>
                    <Text style={[styles.githubModalTitle, { color: textColor }]}>
                      Cambiar zona/suciedad
                    </Text>
                    <TouchableOpacity onPress={() => setDropdownVisible(false)} style={{ padding: rs(4) }}>
                      <Ionicons name="close" size={rs(20)} color={subTextColor} />
                    </TouchableOpacity>
                  </View>

                  {/* Search Input */}
                  <View style={styles.githubSearchContainer}>
                    <View style={[styles.githubSearchBox, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.2)' : '#f1f5f9', borderColor: isDark ? 'rgba(96, 125, 139, 0.3)' : 'rgba(226, 232, 240, 1)' }]}>
                      <Ionicons name="search" size={rs(16)} color={subTextColor} />
                      <TextInput
                        style={[styles.githubSearchInput, { color: textColor }]}
                        placeholder={`Buscar ${activeTab}...`}
                        placeholderTextColor={subTextColor}
                        value={dropdownSearch}
                        onChangeText={setDropdownSearch}
                      />
                    </View>
                  </View>

                  {/* Tabs */}
                  <View style={[styles.githubTabs, { borderBottomColor: isDark ? 'rgba(96, 125, 139, 0.3)' : 'rgba(226, 232, 240, 1)' }]}>
                    <TouchableOpacity 
                      style={[styles.githubTab, activeTab === 'zona' && { borderBottomColor: '#0ea5e9' }]} 
                      onPress={() => { setActiveTab('zona'); setDropdownSearch(''); }}
                    >
                      <Text style={[styles.githubTabText, { color: activeTab === 'zona' ? textColor : subTextColor, fontWeight: activeTab === 'zona' ? '600' : '400' }]}>
                        Zona
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.githubTab, activeTab === 'suciedad' && { borderBottomColor: '#0ea5e9' }]} 
                      onPress={() => { setActiveTab('suciedad'); setDropdownSearch(''); }}
                    >
                      <Text style={[styles.githubTabText, { color: activeTab === 'suciedad' ? textColor : subTextColor, fontWeight: activeTab === 'suciedad' ? '600' : '400' }]}>
                        Suciedad
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* List */}
                  <View style={{ maxHeight: rs(250) }}>
                    <FlatList
                      data={
                        activeTab === 'zona' 
                        ? zones.filter(z => t(z).toLowerCase().includes(dropdownSearch.toLowerCase())).map(z => ({ id: z, label: t(z) }))
                        : [
                            { id: 'all', label: 'Todas' },
                            { id: 'limpio', label: 'Limpio' },
                            { id: 'sucio', label: 'Sucio' },
                            { id: 'muy_sucio', label: 'Muy sucio' }
                          ].filter(s => s.label.toLowerCase().includes(dropdownSearch.toLowerCase()))
                      }
                      keyExtractor={(item) => item.id}
                      renderItem={({item}) => {
                        const isSelected = activeTab === 'zona' ? selectedZone === item.id : selectedCleanliness === item.id;
                        return (
                          <TouchableOpacity 
                            style={[styles.githubListItem, { borderBottomColor: isDark ? 'rgba(96, 125, 139, 0.15)' : 'rgba(226, 232, 240, 0.5)' }]}
                            onPress={() => {
                              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              if (activeTab === 'zona') setSelectedZone(item.id);
                              else setSelectedCleanliness(item.id);
                              setDropdownVisible(false);
                            }}
                          >
                            <View style={{ width: rs(24), alignItems: 'center' }}>
                              {isSelected && <Ionicons name="checkmark" size={rs(16)} color={textColor} />}
                            </View>
                            <Text style={[styles.githubListItemText, { color: textColor, fontWeight: isSelected ? '600' : '400' }]}>
                              {item.label}
                            </Text>
                          </TouchableOpacity>
                        )
                      }}
                    />
                  </View>
                </View>
            )}
          </View>
        </SafeAreaView>
      </View>
      { }
      <FlatList
        key={numColumns}
        data={filteredBeaches}
        keyExtractor={(item) => item.id.toString()}
        numColumns={numColumns}
        contentContainerStyle={[styles.beachList, { paddingTop: SPACING.sm }]}
        columnWrapperStyle={numColumns > 1 ? { gap: SPACING.md } : undefined}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={{ width: cardWidth }}>
            <BeachCard beach={item} isDark={isDark} onPress={handleBeachPress} t={t} />
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons
              name="beach-outline"
              size={rs(64)}
              color={subTextColor}
            />
            <Text style={[styles.emptyText, { color: textColor }]}>
              {t("map_no_beaches")}
            </Text>
            <Text style={[styles.emptySubtext, { color: subTextColor }]}>
              {t("map_no_beaches_desc")}
            </Text>
          </View>
        }
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.xs,
  },
  headerTitle: {
    fontSize: rf(24),
    fontWeight: "800",
    marginBottom: rs(2),
  },
  headerSubtitle: {
    fontSize: rf(13),
    marginBottom: SPACING.sm,
  },
  searchContainer: {
    marginBottom: SPACING.sm,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    height: rs(50),
    borderRadius: RADIUS.full,
    gap: SPACING.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: rf(15),
    fontWeight: "500",
  },
  clearButton: {
    padding: rs(4),
  },
  suggestionsContainer: {
    position: 'absolute',
    top: rs(125),
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  suggestionsList: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  suggestionText: {
    fontSize: rf(14),
    fontWeight: "600",
    marginBottom: rs(2),
  },
  suggestionLabel: {
    fontSize: rf(11),
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  zoneFilters: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs,
    paddingBottom: SPACING.md,
  },
  zoneFilterWrapper: {
    marginRight: SPACING.xs,
  },
  zoneFilterBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    gap: rs(6),
    minHeight: rs(36),
  },
  zoneFilterText: {
    fontSize: rf(13),
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  beachList: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
    gap: SPACING.md,
  },
  beachCard: {
    borderRadius: RADIUS.xl,
    overflow: "hidden",
    marginBottom: SPACING.md,
    height: rs(220),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  beachCardImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  locationBadge: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: rs(4),
    paddingHorizontal: rs(10),
    borderRadius: RADIUS.full,
    backdropFilter: 'blur(4px)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(4),
    zIndex: 5
  },
  locationBadgeText: {
    color: '#fff',
    fontSize: rf(12),
    fontWeight: '700',
  },
  beachCardGradient: {
    flex: 1,
    justifyContent: "flex-end",
    padding: SPACING.md,
    position: 'relative',
  },
  beachCardContent: {
    gap: rs(4),
  },
  beachCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: rs(6),
    position: 'relative',
  },
  beachCardTitle: {
    fontSize: rf(18),
    fontWeight: "800",
    letterSpacing: 0.3,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    marginBottom: rs(2),
  },
  beachCardSubtitle: {
    fontSize: rf(12),
    fontWeight: "600",
    opacity: 0.9,
    textShadowColor: "rgba(0, 0, 0, 0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  mapIconBtn: {
    width: rs(36),
    height: rs(36),
    borderRadius: RADIUS.full,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
  },
  beachCardStats: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  beachCardStat: {
    paddingVertical: rs(4),
    paddingHorizontal: rs(8),
    borderRadius: RADIUS.md,
    gap: rs(4),
    flexDirection: "row",
    alignItems: "center",
    minHeight: rs(24),
  },
  beachCardStatText: {
    fontSize: rf(11),
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: rs(80),
    gap: SPACING.sm,
  },
  emptyText: {
    fontSize: rf(16),
    fontWeight: "600",
  },
  emptySubtext: {
    fontSize: rf(13),
  },
  githubDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    height: rs(34),
    borderRadius: RADIUS.sm,
    alignSelf: 'flex-start',
  },
  githubDropdownButtonText: {
    fontSize: rf(13),
    fontWeight: '600',
  },
  githubModal: {
    minWidth: rs(280),
    borderRadius: RADIUS.md,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  githubModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
  },
  githubModalTitle: {
    fontSize: rf(12),
    fontWeight: '700',
  },
  githubSearchContainer: {
    padding: SPACING.sm,
  },
  githubSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    height: rs(32),
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  githubSearchInput: {
    flex: 1,
    fontSize: rf(13),
    marginLeft: rs(6),
    paddingVertical: 0,
    outlineStyle: 'none',
  },
  githubTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  githubTab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  githubTabText: {
    fontSize: rf(13),
  },
  githubListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderBottomWidth: 1,
  },
  githubListItemText: {
    flex: 1,
    fontSize: rf(13),
  },
});
