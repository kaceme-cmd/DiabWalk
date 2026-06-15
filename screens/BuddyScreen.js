import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';

function calculerScore(moi, autre, distance) {
  let score = 0;
  if (distance <= 2) score += 40;
  else if (distance <= 5) score += 30;
  else if (distance <= 10) score += 20;
  else score += 10;
  if (moi.age && autre.age) {
    const diffAge = Math.abs(moi.age - autre.age);
    if (diffAge <= 5) score += 20;
    else if (diffAge <= 10) score += 10;
  } else score += 10;
  if (moi.distance_km && autre.distance_km) {
    const diffDist = Math.abs(moi.distance_km - autre.distance_km);
    if (diffDist <= 1) score += 20;
    else if (diffDist <= 2) score += 10;
  } else score += 10;
  if (moi.disponibilites === autre.disponibilites) score += 10;
  if (moi.objectif === autre.objectif) score += 10;
  return Math.min(score, 100);
}

export default function BuddyScreen({ navigation }) {
  const [buddies, setBuddies] = useState([]);
  const [monProfil, setMonProfil] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profil } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    setMonProfil(profil);
    let { status } = await Location.requestForegroundPermissionsAsync();
    let loc = null;
    if (status === 'granted') {
      loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
    }
    if (profil && loc) {
      const { data: autresProfils } = await supabase.rpc('get_nearby_walkers', {
        ma_lat: loc.coords.latitude,
        ma_lon: loc.coords.longitude,
      });
      if (autresProfils) {
        const buddiesScores = autresProfils
          .map(autre => {
            const score = calculerScore(profil, autre, autre.distance);
            return { ...autre, score };
          })
          .filter(b => b.score >= 30)
          .sort((a, b) => b.score - a.score);
        setBuddies(buddiesScores);
      }
    }
    setLoading(false);
  }

  function getScoreColor(score) {
    if (score >= 80) return '#2D7D46';
    if (score >= 60) return '#E07B2A';
    return '#1A5C8A';
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.subtitle}>Vos partenaires de marche ideaux</Text>

      {loading ? (
        <View style={styles.loadingBox}>
          <Text style={styles.loadingText}>Recherche de partenaires...</Text>
        </View>
      ) : buddies.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>Aucun partenaire trouve</Text>
          <Text style={styles.emptyText}>Completez votre profil pour ameliorer le matching !</Text>
        </View>
      ) : (
        buddies.map(buddy => (
          <View key={buddy.id} style={styles.buddyCard}>
            <View style={styles.buddyHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{buddy.prenom ? buddy.prenom.charAt(0) : '?'}</Text>
              </View>
              <View style={styles.buddyInfo}>
                <Text style={styles.buddyName}>{buddy.prenom || 'Marcheur'}</Text>
                <Text style={styles.buddyDetails}>
                  {buddy.age ? `${buddy.age} ans` : ''}
                </Text>
                <Text style={styles.buddyDetails}>
                  {buddy.distance_km ? `${buddy.distance_km} km` : ''} {buddy.disponibilites ? `- ${buddy.disponibilites}` : ''}
                </Text>
              </View>
              <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(buddy.score) }]}>
                <Text style={styles.scoreText}>{buddy.score}%</Text>
              </View>
            </View>
            <View style={styles.buddyFooter}>
              <Text style={styles.distanceText}>
                A {buddy.distance.toFixed(1)} km de vous
              </Text>
              <TouchableOpacity
                style={styles.inviterBtn}
                onPress={() => navigation.navigate('Messages', { destinataire: buddy })}>
                <Text style={styles.inviterText}>Contacter</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F7F2', paddingTop: 16 },
  subtitle: {
    fontSize: 14, color: '#888',
    paddingHorizontal: 24, marginBottom: 16,
  },
  loadingBox: {
    alignItems: 'center', padding: 40,
  },
  loadingText: { fontSize: 16, color: '#888' },
  emptyBox: {
    margin: 24, padding: 24,
    backgroundColor: '#fff', borderRadius: 20,
    alignItems: 'center', elevation: 2,
  },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#888', textAlign: 'center' },
  buddyCard: {
    backgroundColor: '#fff', borderRadius: 20,
    marginHorizontal: 16, marginBottom: 12,
    padding: 16, elevation: 2,
  },
  buddyHeader: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 12,
  },
  avatar: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: '#2D7D46', alignItems: 'center',
    justifyContent: 'center', marginRight: 12,
  },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  buddyInfo: { flex: 1 },
  buddyName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  buddyDetails: { fontSize: 12, color: '#888', marginTop: 2 },
  scoreBadge: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
  },
  scoreText: { fontSize: 14, fontWeight: 'bold', color: '#fff' },
  buddyFooter: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 0.5, borderTopColor: '#eee', paddingTop: 12,
  },
  distanceText: { fontSize: 13, color: '#888' },
  inviterBtn: {
    backgroundColor: '#2D7D46', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  inviterText: { fontSize: 13, color: '#fff', fontWeight: '600' },
});