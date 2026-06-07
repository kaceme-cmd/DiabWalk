import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function ActivityScreen() {
  const [activites, setActivites] = useState([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [userId, setUserId] = useState(null);
  const [dejaMarcheAujourdhui, setDejaMarcheAujourdhui] = useState(false);

  useEffect(() => {
    getUser();
  }, []);

  useEffect(() => {
    if (userId) {
      getActivites();
    }
  }, [userId]);

  async function getUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setUserId(user.id);
  }

  async function getActivites() {
    const { data } = await supabase
      .from('activites')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    if (data) {
      setActivites(data);
      calculerStats(data);
    }
  }

  function calculerStats(data) {
    const total = data.reduce((sum, a) => sum + a.points, 0);
    setTotalPoints(total);
    const today = new Date().toISOString().split('T')[0];
    const marchesAujourdhui = data.filter(a => a.date === today).length;
setDejaMarcheAujourdhui(marchesAujourdhui >= 2);
    let currentStreak = 0;
    const dates = data.map(a => a.date);
    const uniqueDates = [...new Set(dates)].sort().reverse();
    for (let i = 0; i < uniqueDates.length; i++) {
      const expected = new Date();
      expected.setDate(expected.getDate() - i);
      const expectedStr = expected.toISOString().split('T')[0];
      if (uniqueDates[i] === expectedStr) {
        currentStreak++;
      } else {
        break;
      }
    }
    setStreak(currentStreak);
  }

  async function enregistrerMarche(duree) {
    if (dejaMarcheAujourdhui) {
      Alert.alert('Deja enregistre !', 'Vous avez deja enregistre 2 marches aujourd\'hui.');
      return;
    }
    const points = duree >= 30 ? 2 : 1;
    const { error } = await supabase.from('activites').insert({
      user_id: userId,
      duree_minutes: duree,
      points: points,
    });
    if (!error) {
      Alert.alert('Bravo !', `+${points} point(s) ! Continuez comme ca !`);
      getActivites();
    }
  }

  function getBadge() {
    if (totalPoints >= 100) return { emoji: 'M', label: 'Maitre marcheur', color: '#FFD700' };
    if (totalPoints >= 50) return { emoji: 'E', label: 'Expert', color: '#C0C0C0' };
    if (totalPoints >= 20) return { emoji: 'R', label: 'Regulier', color: '#CD7F32' };
    return { emoji: 'D', label: 'Debutant', color: '#2D7D46' };
  }

  const badge = getBadge();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Mon activite</Text>

      <View style={styles.scoreCard}>
        <View style={styles.badgeCircle} style={[styles.badgeCircle, { backgroundColor: badge.color }]}>
          <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
        </View>
        <Text style={styles.badgeLabel}>{badge.label}</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{totalPoints}</Text>
            <Text style={styles.statLbl}>points total</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{streak}</Text>
            <Text style={styles.statLbl}>jours consecutifs</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Enregistrer une marche</Text>
      <View style={styles.butonskRow}>
        <TouchableOpacity
          style={[styles.marcheBtn, dejaMarcheAujourdhui && styles.marcheBtnDisabled]}
          onPress={() => enregistrerMarche(15)}>
          <Text style={styles.marcheBtnTitle}>15 min</Text>
          <Text style={styles.marcheBtnPoints}>+1 point</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.marcheBtn, dejaMarcheAujourdhui && styles.marcheBtnDisabled]}
          onPress={() => enregistrerMarche(30)}>
          <Text style={styles.marcheBtnTitle}>30 min</Text>
          <Text style={styles.marcheBtnPoints}>+2 points</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.marcheBtn, dejaMarcheAujourdhui && styles.marcheBtnDisabled]}
          onPress={() => enregistrerMarche(60)}>
          <Text style={styles.marcheBtnTitle}>60 min</Text>
          <Text style={styles.marcheBtnPoints}>+2 points</Text>
        </TouchableOpacity>
      </View>

      {streak >= 7 && (
        <View style={styles.streakBanner}>
          <Text style={styles.streakText}>7 jours consecutifs ! Impressionnant !</Text>
        </View>
      )}
      {streak >= 30 && (
        <View style={[styles.streakBanner, { backgroundColor: '#FFD700' }]}>
          <Text style={styles.streakText}>30 jours ! Vous etes un champion !</Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>Historique</Text>
      {activites.slice(0, 7).map(activite => (
        <View key={activite.id} style={styles.historyCard}>
          <Text style={styles.historyDate}>{activite.date}</Text>
          <Text style={styles.historyDuree}>{activite.duree_minutes} min</Text>
          <Text style={styles.historyPoints}>+{activite.points} pt</Text>
        </View>
      ))}
    </ScrollView>
  );
}const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F7F2' },
  title: {
    fontSize: 24, fontWeight: 'bold', color: '#2D7D46',
    padding: 24, paddingTop: 60, paddingBottom: 12,
  },
  scoreCard: {
    backgroundColor: '#fff',
    borderRadius: 20, margin: 16,
    padding: 24, alignItems: 'center',
    elevation: 3,
  },
  badgeCircle: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  badgeEmoji: { fontSize: 36, fontWeight: 'bold', color: '#fff' },
  badgeLabel: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 16 },
  statBox: {
    backgroundColor: '#F0F7F2', borderRadius: 12,
    padding: 16, alignItems: 'center', minWidth: 120,
  },
  statNum: { fontSize: 32, fontWeight: 'bold', color: '#2D7D46' },
  statLbl: { fontSize: 12, color: '#888', marginTop: 4 },
  sectionTitle: {
    fontSize: 16, fontWeight: 'bold', color: '#333',
    paddingHorizontal: 16, marginTop: 8, marginBottom: 12,
  },
  butonskRow: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 16, marginBottom: 16,
  },
  marcheBtn: {
    flex: 1, backgroundColor: '#2D7D46',
    borderRadius: 16, padding: 16, alignItems: 'center',
  },
  marcheBtnDisabled: { backgroundColor: '#aaa' },
  marcheBtnTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  marcheBtnPoints: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  streakBanner: {
    backgroundColor: '#2D7D46', margin: 16,
    borderRadius: 12, padding: 16, alignItems: 'center',
  },
  streakText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  historyCard: {
    backgroundColor: '#fff', marginHorizontal: 16,
    marginBottom: 8, borderRadius: 12, padding: 14,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', elevation: 1,
  },
  historyDate: { fontSize: 13, color: '#555', flex: 1 },
  historyDuree: { fontSize: 14, fontWeight: '600', color: '#333' },
  historyPoints: { fontSize: 14, fontWeight: 'bold', color: '#2D7D46', marginLeft: 12 },
});