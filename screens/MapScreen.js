import { StyleSheet, Text, View, Dimensions, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { supabase } from '../lib/supabase';

const { width, height } = Dimensions.get('window');

function calculerDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function MapScreen({ navigation }) {
  const [location, setLocation] = useState(null);
  const [marcheurs, setMarcheurs] = useState([]);
  const [rayon, setRayon] = useState(10);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    getUser();
    getLocation();
    getMarcheurs();
  }, []);

  async function getUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setUserId(user.id);
  }

  async function getLocation() {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    let loc = await Location.getCurrentPositionAsync({});
    setLocation(loc);
  }

  async function getMarcheurs() {
    const { data } = await supabase
      .from('profiles')
      .select('id, prenom, niveau, latitude, longitude')
      .not('latitude', 'is', null);
    if (data) setMarcheurs(data);
  }

  function getMarcheursProches() {
    if (!location) return marcheurs;
    return marcheurs
      .filter(m => m.id !== userId)
      .map(m => ({
        ...m,
        distance: calculerDistance(
          location.coords.latitude,
          location.coords.longitude,
          m.latitude,
          m.longitude
        )
      }))
      .filter(m => m.distance <= rayon)
      .sort((a, b) => a.distance - b.distance);
  }

  const marcheursProches = getMarcheursProches();

  return (
    <View style={styles.container}>
      <View style={styles.mapPlaceholder}>
        {location ? (
          <MapView
            style={styles.map}
            region={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
          >
            <Marker
              coordinate={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }}
              title="Vous"
              pinColor="#2D7D46"
            />
            {marcheursProches.map(marcheur => (
              <Marker
                key={marcheur.id}
                coordinate={{
                  latitude: marcheur.latitude,
                  longitude: marcheur.longitude,
                }}
                title={marcheur.prenom}
                description={`Niveau ${marcheur.niveau}`}
              />
            ))}
          </MapView>
        ) : (
          <View style={styles.mapInner}>
            <Text style={styles.mapLabelText}>Recherche de votre position...</Text>
          </View>
        )}
      </View>

      <View style={styles.rayonRow}>
        <Text style={styles.rayonLabel}>Rayon de recherche :</Text>
        {[5, 10, 20, 50].map(r => (
          <TouchableOpacity
            key={r}
            style={[styles.rayonBtn, rayon === r && styles.rayonBtnActive]}
            onPress={() => setRayon(r)}>
            <Text style={[styles.rayonText, rayon === r && styles.rayonTextActive]}>
              {r} km
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.liste}>
        <Text style={styles.listeTitle}>
          {marcheursProches.length} marcheur(s) dans un rayon de {rayon} km
        </Text>
        {marcheursProches.length === 0 ? (
          <Text style={styles.emptyText}>Aucun marcheur dans ce rayon</Text>
        ) : (
          marcheursProches.map(marcheur => (
            <View key={marcheur.id} style={styles.card}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{marcheur.prenom.charAt(0)}</Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{marcheur.prenom}</Text>
                <Text style={styles.cardSub}>
                  {marcheur.distance ? marcheur.distance.toFixed(1) + ' km - ' : ''} Niveau {marcheur.niveau}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.inviterBtn}
                onPress={() => navigation.navigate('Messages', { destinataire: marcheur })}>
                <Text style={styles.inviterText}>Inviter</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F7F2' },
  mapPlaceholder: {
    width: width, height: height * 0.25,
    backgroundColor: '#E8F5EC', overflow: 'hidden',
  },
  map: { width: '100%', height: '100%' },
  mapInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  mapLabelText: { fontSize: 13, color: '#555' },
  rayonRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10, gap: 8,
    backgroundColor: '#fff', borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
  },
  rayonLabel: { fontSize: 12, color: '#888', marginRight: 4 },
  rayonBtn: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 12, borderWidth: 1, borderColor: '#ddd',
    backgroundColor: '#FAFAFA',
  },
  rayonBtnActive: {
    backgroundColor: '#2D7D46', borderColor: '#2D7D46',
  },
  rayonText: { fontSize: 12, color: '#888' },
  rayonTextActive: { color: '#fff', fontWeight: '600' },
  liste: { padding: 16, flex: 1 },
  listeTitle: { fontSize: 12, fontWeight: '600', color: '#888' },
  emptyText: { fontSize: 14, color: '#888', textAlign: 'center', marginTop: 20 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 14,
    marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 2,
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#E6F1FB', alignItems: 'center',
    justifyContent: 'center', marginRight: 12,
  },
  avatarText: { fontSize: 16, fontWeight: 'bold', color: '#1A5C8A' },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '600', color: '#333' },
  cardSub: { fontSize: 12, color: '#888', marginTop: 2 },
  inviterBtn: {
    borderWidth: 1.5, borderColor: '#2D7D46',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
  },
  inviterText: { fontSize: 12, color: '#2D7D46', fontWeight: '600' },
});