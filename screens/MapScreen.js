import { StyleSheet, Text, View, Dimensions, TouchableOpacity, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { supabase } from '../lib/supabase';

const { width, height } = Dimensions.get('window');

export default function MapScreen({ navigation }) {
  const [location, setLocation] = useState(null);
  const [marcheurs, setMarcheurs] = useState([]);
  const [rayon, setRayon] = useState(10);
  const [userId, setUserId] = useState(null);
  // Statut des invitations : { marcheurId: 'en_attente' | 'acceptee' | 'refusee' | 'recue' }
  const [statutsInvitations, setStatutsInvitations] = useState({});

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (location) getMarcheurs();
  }, [location]);

  async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      await chargerStatutsInvitations(user.id);
    }
    await getLocation();
  }

  async function getLocation() {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    let loc = await Location.getCurrentPositionAsync({});
    setLocation(loc);
  }

  async function getMarcheurs() {
    const { data, error } = await supabase.rpc('get_nearby_walkers', {
      ma_lat: location.coords.latitude,
      ma_lon: location.coords.longitude,
    });
    if (!error && data) setMarcheurs(data);
  }

  async function chargerStatutsInvitations(monId) {
    const { data } = await supabase
      .from('invitations')
      .select('*')
      .or(`expediteur_id.eq.${monId},destinataire_id.eq.${monId}`);

    if (data) {
      const statuts = {};
      data.forEach(inv => {
        if (inv.expediteur_id === monId) {
          // J'ai envoyé cette invitation
          statuts[inv.destinataire_id] = inv.statut; // en_attente / acceptee / refusee
        } else {
          // J'ai reçu cette invitation
          statuts[inv.expediteur_id] = inv.statut === 'acceptee' ? 'acceptee' : 'recue';
        }
      });
      setStatutsInvitations(statuts);
    }
  }

  async function inviterMarcheur(marcheur) {
    const { error } = await supabase.from('invitations').insert({
      expediteur_id: userId,
      destinataire_id: marcheur.id,
    });

    if (error) {
      if (error.code === '23505') {
        Alert.alert('Déjà envoyée', `Vous avez déjà invité ${marcheur.prenom || 'ce marcheur'}.`);
      } else {
        Alert.alert('Erreur', "L'invitation n'a pas pu être envoyée. Réessayez.");
      }
      return;
    }

    setStatutsInvitations(prev => ({ ...prev, [marcheur.id]: 'en_attente' }));
    Alert.alert(
      'Invitation envoyée ! 🚶',
      `${marcheur.prenom || 'Ce marcheur'} recevra votre invitation à marcher ensemble. Vous pourrez discuter dès qu'elle sera acceptée.`
    );
  }

  // Détermine le texte et l'action du bouton selon le statut de l'invitation
  function renderBoutonAction(marcheur) {
    const statut = statutsInvitations[marcheur.id];

    if (statut === 'acceptee') {
      return (
        <TouchableOpacity
          style={styles.inviterBtn}
          onPress={() => navigation.navigate('Messages', { destinataire: marcheur })}>
          <Text style={styles.inviterText}>Discuter</Text>
        </TouchableOpacity>
      );
    }

    if (statut === 'en_attente') {
      return (
        <View style={[styles.inviterBtn, styles.btnEnAttente]}>
          <Text style={styles.btnEnAttenteText}>En attente...</Text>
        </View>
      );
    }

    if (statut === 'recue') {
      return (
        <TouchableOpacity
          style={[styles.inviterBtn, styles.btnRecue]}
          onPress={() => navigation.navigate('Invitations')}>
          <Text style={styles.inviterText}>Répondre</Text>
        </TouchableOpacity>
      );
    }

    if (statut === 'refusee') {
      return (
        <View style={[styles.inviterBtn, styles.btnEnAttente]}>
          <Text style={styles.btnEnAttenteText}>Refusée</Text>
        </View>
      );
    }

    // Aucune invitation encore → bouton Inviter
    return (
      <TouchableOpacity
        style={styles.inviterBtn}
        onPress={() => inviterMarcheur(marcheur)}>
        <Text style={styles.inviterText}>Inviter</Text>
      </TouchableOpacity>
    );
  }

  const marcheursProches = marcheurs
    .filter(m => m.distance <= rayon)
    .sort((a, b) => a.distance - b.distance);

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
              {renderBoutonAction(marcheur)}
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
    backgroundColor: '#2D7D46', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  inviterText: { fontSize: 12, color: '#fff', fontWeight: '600' },
  btnEnAttente: {
    backgroundColor: '#E0E0E0',
  },
  btnEnAttenteText: { fontSize: 12, color: '#888', fontWeight: '600' },
  btnRecue: {
    backgroundColor: '#E07B2A',
  },
});