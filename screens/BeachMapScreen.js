import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Platform,
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
    name: "Venice Beach",
    zone: "North America",
    district: "Los Angeles",
    lat: 33.985,
    lng: -118.4695,
    image: require("./Beach/data/USA-VENICEBEACH.webp"),
    clean: true,
    people: 0,
    country: "us",
  },
  {
    id: 30,
    name: "Santa Monica Beach",
    zone: "North America",
    district: "Los Angeles",
    lat: 34.0099,
    lng: -118.4965,
    image: require("./Beach/data/USA-SANTAMONICABEACH.webp"),
    clean: true,
    people: 0,
    country: "us",
  },
  {
    id: 31,
    name: "Malibu Beach",
    zone: "North America",
    district: "Malibu",
    lat: 34.0259,
    lng: -118.7798,
    image: require("./Beach/data/USA-MALIBUBEACH.webp"),
    clean: true,
    people: 0,
    country: "us",
  },
  {
    id: 32,
    name: "South Beach",
    zone: "North America",
    district: "Miami Beach",
    lat: 25.7907,
    lng: -80.13,
    image: require("./Beach/data/USA-SOUTHBEACH.webp"),
    clean: true,
    people: 0,
    country: "us",
  },
  {
    id: 33,
    name: "Waikiki Beach",
    zone: "North America",
    district: "Honolulu",
    lat: 21.2793,
    lng: -157.8294,
    image: require("./Beach/data/USA-WAIKIKIBEACH.webp"),
    clean: true,
    people: 0,
    country: "us",
  },
  {
    id: 34,
    name: "Laguna Beach",
    zone: "North America",
    district: "Orange County",
    lat: 33.5427,
    lng: -117.7854,
    image: require("./Beach/data/USA-LAGUNABEACH.webp"),
    clean: true,
    people: 0,
    country: "us",
  },
  {
    id: 35,
    name: "Coronado Beach",
    zone: "North America",
    district: "San Diego",
    lat: 32.6859,
    lng: -117.1831,
    image: require("./Beach/data/USA-CORONADOBEACH.webp"),
    clean: true,
    people: 0,
    country: "us",
  },
  {
    id: 36,
    name: "Clearwater Beach",
    zone: "North America",
    district: "Clearwater",
    lat: 27.9659,
    lng: -82.8315,
    image: require("./Beach/data/USA-CLEARWATERBEACH.webp"),
    clean: true,
    people: 0,
    country: "us",
  },
  {
    id: 37,
    name: "Playa del Carmen",
    zone: "North America",
    district: "Quintana Roo",
    lat: 20.6296,
    lng: -87.0739,
    image: require("./Beach/data/MEX-PLAYADELCARMEN.webp"),
    clean: true,
    people: 0,
    country: "mx",
  },
  {
    id: 38,
    name: "Cancún Beach",
    zone: "North America",
    district: "Cancún",
    lat: 21.1619,
    lng: -86.8515,
    image: require("../public/un-atractivo-valioso.jpg"),
    clean: true,
    people: 0,
    country: "mx",
  },
  {
    id: 39,
    name: "Tulum Beach",
    zone: "North America",
    district: "Tulum",
    lat: 20.2114,
    lng: -87.4654,
    image: require("../public/un-atractivo-valioso.jpg"),
    clean: true,
    people: 0,
    country: "mx",
  },
  {
    id: 40,
    name: "Playa Norte",
    zone: "North America",
    district: "Isla Mujeres",
    lat: 21.2623,
    lng: -86.731,
    image: require("../public/un-atractivo-valioso.jpg"),
    clean: true,
    people: 0,
    country: "mx",
  },
  {
    id: 41,
    name: "Cabo San Lucas Beach",
    zone: "North America",
    district: "Los Cabos",
    lat: 22.8905,
    lng: -109.9167,
    image: require("../public/un-atractivo-valioso.jpg"),
    clean: true,
    people: 0,
    country: "mx",
  },
  {
    id: 42,
    name: "Puerto Vallarta Beach",
    zone: "North America",
    district: "Puerto Vallarta",
    lat: 20.6534,
    lng: -105.2253,
    image: require("../public/un-atractivo-valioso.jpg"),
    clean: true,
    people: 0,
    country: "mx",
  },
  {
    id: 43,
    name: "Copacabana",
    zone: "South America",
    district: "Rio de Janeiro",
    lat: -22.9711,
    lng: -43.1822,
    image: require("./Beach/data/BRA-COPACABANA.webp"),
    clean: true,
    people: 0,
    country: "br",
  },
  {
    id: 44,
    name: "Ipanema",
    zone: "South America",
    district: "Rio de Janeiro",
    lat: -22.9838,
    lng: -43.2096,
    image: require("./Beach/data/BRA-IPANEMA.webp"),
    clean: true,
    people: 0,
    country: "br",
  },
  {
    id: 45,
    name: "Praia de Jericoacoara",
    zone: "South America",
    district: "Ceará",
    lat: -2.7938,
    lng: -40.5147,
    image: require("../public/un-atractivo-valioso.jpg"),
    clean: true,
    people: 0,
    country: "br",
  },
  {
    id: 46,
    name: "Praia do Sancho",
    zone: "South America",
    district: "Fernando de Noronha",
    lat: -3.8572,
    lng: -32.4297,
    image: require("./Beach/data/MEX-PRAIADOSANCHO.webp"),
    clean: true,
    people: 0,
    country: "br",
  },
  {
    id: 47,
    name: "Baia do Sancho",
    zone: "South America",
    district: "Fernando de Noronha",
    lat: -3.8439,
    lng: -32.4393,
    image: require("./Beach/data/BRA-BAIADOSANCHO.webp"),
    clean: true,
    people: 0,
    country: "br",
  },
  {
    id: 48,
    name: "Playa Blanca",
    zone: "South America",
    district: "Cartagena",
    lat: 10.2166,
    lng: -75.5833,
    image: require("./Beach/data/COL-PLAYABLANCA.webp"),
    clean: true,
    people: 0,
    country: "co",
  },
  {
    id: 49,
    name: "Playa de Palomino",
    zone: "South America",
    district: "La Guajira",
    lat: 11.2456,
    lng: -73.5783,
    image: require("./Beach/data/COL-PLAYADEPALOMINO.webp"),
    clean: true,
    people: 0,
    country: "co",
  },
  {
    id: 50,
    name: "San Andrés Beach",
    zone: "South America",
    district: "San Andrés",
    lat: 12.5847,
    lng: -81.7006,
    image: require("../public/un-atractivo-valioso.jpg"),
    clean: true,
    people: 0,
    country: "co",
  },
  {
    id: 51,
    name: "Punta Cana Beach",
    zone: "Caribbean",
    district: "Punta Cana",
    lat: 18.5601,
    lng: -68.3725,
    image: require("./Beach/data/REPDOMI-PUNTACANABEACH.webp"),
    clean: true,
    people: 0,
    country: "do",
  },
  {
    id: 52,
    name: "Bavaro Beach",
    zone: "Caribbean",
    district: "Punta Cana",
    lat: 18.6812,
    lng: -68.4419,
    image: require("./Beach/data/REPDOMI-BAVAROBEACH.webp"),
    clean: true,
    people: 0,
    country: "do",
  },
  {
    id: 53,
    name: "Flamenco Beach",
    zone: "Caribbean",
    district: "Culebra",
    lat: 18.3216,
    lng: -65.3044,
    image: require("./Beach/data/PUERTORICO-FLAMENCOBEACH.webp"),
    clean: true,
    people: 0,
    country: "pr",
  },
  {
    id: 54,
    name: "Mar del Plata",
    zone: "South America",
    district: "Buenos Aires",
    lat: -38.0055,
    lng: -57.5426,
    image: require("./Beach/data/ARG-MARDEPLATA.webp"),
    clean: true,
    people: 0,
    country: "ar",
  },
  {
    id: 55,
    name: "Playa Bristol",
    zone: "South America",
    district: "Mar del Plata",
    lat: -38.0025,
    lng: -57.5345,
    image: require("../public/un-atractivo-valioso.jpg"),
    clean: true,
    people: 0,
    country: "ar",
  },
  {
    id: 56,
    name: "Punta del Este",
    zone: "South America",
    district: "Maldonado",
    lat: -34.9489,
    lng: -54.9574,
    image: require("./Beach/data/URU-PUNTADELESTE.webp"),
    clean: true,
    people: 0,
    country: "uy",
  },
  {
    id: 57,
    name: "Playa Brava",
    zone: "South America",
    district: "Punta del Este",
    lat: -34.9167,
    lng: -54.9167,
    image: require("./Beach/data/URU-PLAYABRAVA.webp"),
    clean: true,
    people: 0,
    country: "uy",
  },
  {
    id: 58,
    name: "Playa Anakena",
    zone: "South America",
    district: "Isla de Pascua",
    lat: -27.0747,
    lng: -109.3219,
    image: require("./Beach/data/CHI-PLAYAANAKENA.webp"),
    clean: true,
    people: 0,
    country: "cl",
  },
  {
    id: 59,
    name: "Viña del Mar",
    zone: "South America",
    district: "Valparaíso",
    lat: -33.0244,
    lng: -71.5517,
    image: require("./Beach/data/CHI-VIÑADELMAR.webp"),
    clean: true,
    people: 0,
    country: "cl",
  },
  {
    id: 60,
    name: "Playa de la Concha",
    zone: "Europe",
    district: "San Sebastián",
    lat: 43.3213,
    lng: -1.9812,
    image: require("./Beach/data/ESP-PLAYADELACONCHA.webp"),
    clean: true,
    people: 0,
    country: "es",
  },
  {
    id: 61,
    name: "Playa de las Catedrales",
    zone: "Europe",
    district: "Galicia",
    lat: 43.5525,
    lng: -7.16,
    image: require("./Beach/data/ESP-PLAYADELASCATEDRALES.webp"),
    clean: true,
    people: 0,
    country: "es",
  },
  {
    id: 62,
    name: "Barceloneta Beach",
    zone: "Europe",
    district: "Barcelona",
    lat: 41.3806,
    lng: 2.19,
    image: require("./Beach/data/ESP-BARCELONETABEACH.webp"),
    clean: true,
    people: 0,
    country: "es",
  },
  {
    id: 63,
    name: "Playa de Ses Illetes",
    zone: "Europe",
    district: "Formentera",
    lat: 38.7734,
    lng: 1.4589,
    image: require("./Beach/data/ESP-PLAYADESESILLETES.webp"),
    clean: true,
    people: 0,
    country: "es",
  },
  {
    id: 64,
    name: "Praia da Marinha",
    zone: "Europe",
    district: "Algarve",
    lat: 37.0896,
    lng: -8.4126,
    image: require("./Beach/data/PORTUGAL-PRAIADEMARINHA.webp"),
    clean: true,
    people: 0,
    country: "pt",
  },
  {
    id: 65,
    name: "Praia de Benagil",
    zone: "Europe",
    district: "Algarve",
    lat: 37.0877,
    lng: -8.4267,
    image: require("./Beach/data/PORTUGAL-PRAIADEBENAGIL.webp"),
    clean: true,
    people: 0,
    country: "pt",
  },
  {
    id: 66,
    name: "Plage de Palombaggia",
    zone: "Europe",
    district: "Corsica",
    lat: 41.5854,
    lng: 9.3675,
    image: require("./Beach/data/FRANCIA-PLAGEDEPALOMBAGGIA.webp"),
    clean: true,
    people: 0,
    country: "fr",
  },
  {
    id: 67,
    name: "Plage de Pampelonne",
    zone: "Europe",
    district: "Saint-Tropez",
    lat: 43.2228,
    lng: 6.6525,
    image: require("./Beach/data/FRANCIA-PLAGEDEPAMPELONNE.webp"),
    clean: true,
    people: 0,
    country: "fr",
  },
  {
    id: 68,
    name: "Spiaggia dei Conigli",
    zone: "Europe",
    district: "Lampedusa",
    lat: 35.5166,
    lng: 12.5666,
    image: require("./Beach/data/ITA-SPIAGGIADELCONIGLI.webp"),
    clean: true,
    people: 0,
    country: "it",
  },
  {
    id: 69,
    name: "Navagio Beach",
    zone: "Europe",
    district: "Zakynthos",
    lat: 37.8594,
    lng: 20.6244,
    image: require("../public/un-atractivo-valioso.jpg"),
    clean: true,
    people: 0,
    country: "gr",
  },
  {
    id: 70,
    name: "Elafonissi Beach",
    zone: "Europe",
    district: "Crete",
    lat: 35.2725,
    lng: 23.5408,
    image: require("../public/un-atractivo-valioso.jpg"),
    clean: true,
    people: 0,
    country: "gr",
  },
  {
    id: 71,
    name: "Jumeirah Beach",
    zone: "Middle East",
    district: "Dubai",
    lat: 25.232,
    lng: 55.2589,
    image: require("../public/un-atractivo-valioso.jpg"),
    clean: true,
    people: 0,
    country: "ae",
  },
  {
    id: 72,
    name: "Sharm El Sheikh Beach",
    zone: "Middle East",
    district: "Sharm El Sheikh",
    lat: 27.9158,
    lng: 34.33,
    image: require("../public/un-atractivo-valioso.jpg"),
    clean: true,
    people: 0,
    country: "eg",
  },
  {
    id: 73,
    name: "Agadir Beach",
    zone: "Middle East",
    district: "Agadir",
    lat: 30.4278,
    lng: -9.5981,
    image: require("../public/un-atractivo-valioso.jpg"),
    clean: true,
    people: 0,
    country: "ma",
  },
  {
    id: 74,
    name: "Qurum Beach",
    zone: "Middle East",
    district: "Muscat",
    lat: 23.5926,
    lng: 58.4639,
    image: require("../public/un-atractivo-valioso.jpg"),
    clean: true,
    people: 0,
    country: "om",
  },
  {
    id: 75,
    name: "Palolem Beach",
    zone: "Asia",
    district: "Goa",
    lat: 15.0099,
    lng: 74.0233,
    image: require("../public/un-atractivo-valioso.jpg"),
    clean: true,
    people: 0,
    country: "in",
  },
  {
    id: 76,
    name: "Anjuna Beach",
    zone: "Asia",
    district: "Goa",
    lat: 15.5736,
    lng: 73.7407,
    image: require("../public/un-atractivo-valioso.jpg"),
    clean: true,
    people: 0,
    country: "in",
  },
  {
    id: 77,
    name: "Varkala Beach",
    zone: "Asia",
    district: "Kerala",
    lat: 8.7379,
    lng: 76.7163,
    image: require("../public/un-atractivo-valioso.jpg"),
    clean: true,
    people: 0,
    country: "in",
  },
  {
    id: 78,
    name: "Radhanagar Beach",
    zone: "Asia",
    district: "Andaman Islands",
    lat: 11.9831,
    lng: 92.9598,
    image: require("../public/un-atractivo-valioso.jpg"),
    clean: true,
    people: 0,
    country: "in",
  },
  {
    id: 79,
    name: "Yalong Bay",
    zone: "Asia",
    district: "Hainan",
    lat: 18.2311,
    lng: 109.6628,
    image: require("../public/un-atractivo-valioso.jpg"),
    clean: true,
    people: 0,
    country: "cn",
  },
  {
    id: 80,
    name: "Dadonghai Beach",
    zone: "Asia",
    district: "Sanya",
    lat: 18.2128,
    lng: 109.4752,
    image: require("../public/un-atractivo-valioso.jpg"),
    clean: true,
    people: 0,
    country: "cn",
  },
  {
    id: 81,
    name: "Repulse Bay",
    zone: "Asia",
    district: "Hong Kong",
    lat: 22.2342,
    lng: 114.195,
    image: require("../public/un-atractivo-valioso.jpg"),
    clean: true,
    people: 0,
    country: "hk",
  },
  {
    id: 82,
    name: "Kenting Beach",
    zone: "Asia",
    district: "Taiwan",
    lat: 21.9456,
    lng: 120.8044,
    image: require("../public/un-atractivo-valioso.jpg"),
    clean: true,
    people: 0,
    country: "tw",
  },
  {
    id: 83,
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
    id: 84,
    name: "Punta Negra",
    zone: "Sur Chico",
    district: "Punta Negra",
    lat: -12.365,
    lng: -76.795,
    image: require("../public/un-atractivo-valioso.jpg"),
    clean: true,
    people: 0,
    country: "pe",
  },
  {
    id: 85,
    name: "San Bartolo",
    zone: "Sur Chico",
    district: "San Bartolo",
    lat: -12.383,
    lng: -76.782,
    image: require("../public/un-atractivo-valioso.jpg"),
    clean: true,
    people: 0,
    country: "pe",
  },
  {
    id: 86,
    name: "Santa María",
    zone: "Sur Chico",
    district: "Santa María",
    lat: -12.405,
    lng: -76.767,
    image: require("../public/un-atractivo-valioso.jpg"),
    clean: true,
    people: 0,
    country: "pe",
  },
  {
    id: 87,
    name: "Naplo",
    zone: "Sur Grande",
    district: "Pucusana",
    lat: -12.45,
    lng: -76.72,
    image: require("../public/un-atractivo-valioso.jpg"),
    clean: true,
    people: 0,
    country: "pe",
  },
  {
    id: 88,
    name: "Pucusana",
    zone: "Sur Grande",
    district: "Pucusana",
    lat: -12.48,
    lng: -76.68,
    image: require("../public/un-atractivo-valioso.jpg"),
    clean: true,
    people: 0,
    country: "pe",
  },
  {
    id: 89,
    name: "Asia",
    zone: "Sur Grande",
    district: "Pucusana",
    lat: -12.52,
    lng: -76.65,
    image: require("../public/un-atractivo-valioso.jpg"),
    clean: true,
    people: 0,
    country: "pe",
  },
  {
    id: 90,
    name: "Cerro Azul",
    zone: "Sur Grande",
    district: "Cerro Azul",
    lat: -12.55,
    lng: -76.62,
    image: require("../public/un-atractivo-valioso.jpg"),
    clean: true,
    people: 0,
    country: "pe",
  },
  {
    id: 91,
    name: "Puerto Viejo",
    zone: "Sur Grande",
    district: "Cerro Azul",
    lat: -12.58,
    lng: -76.59,
    image: require("../public/un-atractivo-valioso.jpg"),
    clean: true,
    people: 0,
    country: "pe",
  },
  {
    id: 92,
    name: "Tuquillo",
    zone: "Sur Grande",
    district: "Cerro Azul",
    lat: -12.61,
    lng: -76.56,
    image: require("../public/un-atractivo-valioso.jpg"),
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
    "North America": "us",
    "South America": "br",
    "Caribbean": "do",
    "Europe": "eu",
    "Middle East": "ae",
    "Asia": "cn",
  };
  return mapping[zone] || null;
};
const zoneMapping = {
  "Lima Norte": "map_zone_north",
  "Lima Centro": "map_zone_center",
  "Lima Sur": "map_zone_south",
  "Sur Chico": "map_zone_south_chico",
  "Sur Grande": "map_zone_south_grande",
  "North America": "map_zone_north_america",
  "South America": "map_zone_south_america",
  Caribbean: "map_zone_caribbean",
  Europe: "map_zone_europe",
  "Middle East": "map_zone_middle_east",
  Asia: "map_zone_asia",
};
const LANGUAGE_TO_ZONE = {
  es: "map_all_zones",
  en: "map_zone_north_america",
  zh: "map_zone_asia",
  hi: "map_zone_asia",
  ar: "map_zone_middle_east",
  fr: "map_zone_europe",
  pt: "map_zone_south_america",
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
          <View style={styles.beachCardHeader}>
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
  const padding = SPACING.lg * 2;
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
    "map_zone_north_america",
    "map_zone_south_america",
    "map_zone_caribbean",
    "map_zone_europe",
    "map_zone_middle_east",
    "map_zone_asia",
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
    return matchesSearch && matchesZone;
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
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={zones}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.zoneFilters}
            renderItem={({ item }) => {
              const isSelected = selectedZone === item;
              return (
                <TouchableOpacity
                  onPress={() => {
                    if (Platform.OS !== "web") {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setSelectedZone(item);
                  }}
                  style={styles.zoneFilterWrapper}
                >
                  {isSelected ? (
                    <LinearGradient
                      colors={["#0ea5e9", "#3b82f6"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[
                        styles.zoneFilterBtn,
                        {
                          shadowColor: "#3b82f6",
                          shadowOffset: { width: 0, height: 3 },
                          shadowOpacity: 0.3,
                          shadowRadius: 6,
                          elevation: 5,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.zoneFilterText,
                          { color: "#fff", fontWeight: "700", flexDirection: 'row', alignItems: 'center' },
                        ]}
                      >
                        <FlagIcon code={getZoneEmoji(item)} size={0.7} style={{ marginRight: 4 }} />
                        {t(item)}
                      </Text>
                    </LinearGradient>
                  ) : (
                    <View
                      style={[
                        styles.zoneFilterBtn,
                        {
                          backgroundColor: isDark
                            ? "rgba(96, 125, 139, 0.15)"
                            : "rgba(241, 245, 249, 1)",
                          borderWidth: 1,
                          borderColor: isDark
                            ? "rgba(96, 125, 139, 0.3)"
                            : "rgba(226, 232, 240, 1)",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.zoneFilterText,
                          { color: isDark ? "#fff" : "#475569", flexDirection: 'row', alignItems: 'center' },
                        ]}
                      >
                        <FlagIcon code={getZoneEmoji(item)} size={0.7} style={{ marginRight: 4 }} />
                        {t(item)}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
          />
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
  },
  beachCardContent: {
    gap: rs(4),
  },
  beachCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: rs(6),
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
});
