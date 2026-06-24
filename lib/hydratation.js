// lib/hydratation.js
// Gestion des rappels d'hydratation par notifications locales

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Clés de stockage pour mémoriser les réglages de l'utilisateur
const CLE_ACTIF = 'hydratation_actif';
const CLE_FREQUENCE = 'hydratation_frequence';

// Identifiant du canal de notification Android
const CANAL_ID = 'hydratation';

// Configure la façon dont les notifications s'affichent quand l'app est ouverte
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Crée le canal de notification Android (son + vibration)
async function creerCanalAndroid() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CANAL_ID, {
      name: "Rappels d'hydratation",
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 400, 200, 400],
      enableVibrate: true,
    });
  }
}

// Demande la permission d'envoyer des notifications
export async function demanderPermissionNotifications() {
  const { status: statutExistant } = await Notifications.getPermissionsAsync();
  let statutFinal = statutExistant;

  if (statutExistant !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    statutFinal = status;
  }

  return statutFinal === 'granted';
}

// --- PRÉFÉRENCE (réglée dans le Profil) ---

// Enregistre la préférence d'activation (sans rien déclencher)
export async function definirPreferenceHydratation(actif) {
  await AsyncStorage.setItem(CLE_ACTIF, actif ? 'true' : 'false');
}

// Enregistre la fréquence choisie (sans rien déclencher)
export async function definirFrequence(frequenceMinutes) {
  await AsyncStorage.setItem(CLE_FREQUENCE, String(frequenceMinutes));
}

// Lit la préférence d'activation mémorisée
export async function estActif() {
  const valeur = await AsyncStorage.getItem(CLE_ACTIF);
  return valeur === 'true';
}

// Lit la fréquence mémorisée (30 min par défaut)
export async function getFrequence() {
  const valeur = await AsyncStorage.getItem(CLE_FREQUENCE);
  return valeur ? parseInt(valeur) : 30;
}

// --- DÉCLENCHEMENT RÉEL (piloté par la marche) ---

// Démarre les rappels pendant une marche (si la préférence est active)
// Renvoie true si les rappels ont démarré, false sinon
export async function demarrerRappelsMarche() {
  const actif = await estActif();
  if (!actif) return false;

  const autorise = await demanderPermissionNotifications();
  if (!autorise) return false;

  await creerCanalAndroid();

  const frequenceMinutes = await getFrequence();

  // On annule d'éventuels rappels existants avant d'en programmer un nouveau
  await Notifications.cancelAllScheduledNotificationsAsync();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '💧 Pensez à vous hydrater !',
      body: "Une petite gorgée d'eau pendant votre marche, c'est important. 🐧",
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: frequenceMinutes * 60,
      repeats: true,
      channelId: CANAL_ID,
    },
  });

  return true;
}

// Arrête les rappels (à la fin d'une marche)
export async function arreterRappelsMarche() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Nettoie toutes les notifications programmées (à appeler au démarrage de l'app)
export async function nettoyerNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}