import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { Pedometer } from 'expo-sensors';
import { supabase } from '../lib/supabase';

export default function HomeScreen({ navigation }) {
  const [prenom, setPrenom] = useState('');
  const [locationSaved, setLocationSaved] = useState(false);
  const [pas, setPas] = useState(0);

  useEffect(() => {
    getProfile();
    saveLocation();

    let subscription;

    async function demarrerPodometre() {
      const dispo = await Pedometer.isAvailableAsync();
      if (!dispo) {
        console.log('Podometre non disponible sur cet appareil');
        return;
      }

      const permission = await Pedometer.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        console.log('Permission podometre refusee');
        return;
      }

      subscription = Pedometer.watchStepCount(result => {
        setPas(result.steps);
      });
    }

    demarrerPodometre();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  async function getProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('prenom')
        .eq('id', user.id)
        .single();
      if (data) setPrenom(data.prenom);
    }
  }

  async function saveLocation() {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      let loc = await Location.getCurrentPositionAsync({});
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          })
          .eq('id', user.id);
        setLocationSaved(true);
      }
    } catch (error) {
      console.log('Erreur position:', error);
    }
  }

  async function handleLogout() {
    Alert.alert(
      'Deconnexion',
      'Voulez-vous vous deconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Deconnexion',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            navigation.replace('Auth');
          }
        }
      ]
    );
  }

  // Conversion des pas en distance (0,75 m par pas en moyenne)
  const distanceKm = (pas * 0.75 / 1000).toFixed(1);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Movidia</Text>
        {prenom ? (
          <Text style={styles.welcome}>Bonjour {prenom} !</Text>
        ) : (
          <Text style={styles.subtitle}>Marchons ensemble vers la sante</Text>
        )}
        {locationSaved && (
          <Text style={styles.locationBadge}>Position partagee</Text>
        )}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{pas.toLocaleString()}</Text>
          <Text style={styles.statLbl}>pas (depuis ouverture)</Text>
          <Text style={styles.statDistance}>{distanceKm} km</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>3</Text>
          <Text style={styles.statLbl}>marcheurs proches</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Carte')}>
        <Text style={styles.buttonText}>Trouver des marcheurs</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.buttonOutline}
        onPress={() => navigation.navigate('Nutrition')}>
        <Text style={styles.buttonOutlineText}>Bons plans nutrition</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Deconnexion</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F7F2',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: { fontSize: 36, fontWeight: 'bold', color: '#2D7D46', marginBottom: 8 },
  welcome: { fontSize: 18, color: '#2D7D46', fontWeight: '600', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#555', textAlign: 'center' },
  locationBadge: {
    fontSize: 12, color: '#2D7D46', marginTop: 8,
    backgroundColor: '#E8F5EC', paddingHorizontal: 12,
    paddingVertical: 4, borderRadius: 20,
  },
  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 40 },
  statBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    minWidth: 130,
    elevation: 2,
  },
  statNum: { fontSize: 28, fontWeight: 'bold', color: '#2D7D46' },
  statLbl: { fontSize: 12, color: '#888', marginTop: 4 },
  statDistance: { fontSize: 14, color: '#2D7D46', fontWeight: '600', marginTop: 6 },
  button: {
    backgroundColor: '#2D7D46',
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  buttonOutline: {
    borderWidth: 2,
    borderColor: '#2D7D46',
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonOutlineText: { color: '#2D7D46', fontSize: 16, fontWeight: '600' },
  logoutBtn: { paddingVertical: 10 },
  logoutText: { fontSize: 14, color: '#888' },
});