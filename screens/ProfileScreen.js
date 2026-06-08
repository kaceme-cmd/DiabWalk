import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function ProfileScreen() {
  const [prenom, setPrenom] = useState('');
  const [ville, setVille] = useState('');
  const [niveau, setNiveau] = useState('Debutant');
  const [age, setAge] = useState('');
  const [distanceKm, setDistanceKm] = useState('3');
  const [frequence, setFrequence] = useState('3');
  const [disponibilite, setDisponibilite] = useState('matin');
  const [objectif, setObjectif] = useState('bien-etre');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getProfile();
  }, []);

  async function getProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setEmail(user.email);
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (data) {
        setPrenom(data.prenom || '');
        setVille(data.ville || '');
        setNiveau(data.niveau || 'Debutant');
        setAge(data.age ? String(data.age) : '');
        setDistanceKm(data.distance_km ? String(data.distance_km) : '3');
        setFrequence(data.frequence_semaine ? String(data.frequence_semaine) : '3');
        setDisponibilite(data.disponibilites || 'matin');
        setObjectif(data.objectif || 'bien-etre');
      }
    }
  }

  async function saveProfile() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase
        .from('profiles')
        .update({
          prenom, ville, niveau,
          age: age ? parseInt(age) : null,
          distance_km: distanceKm ? parseFloat(distanceKm) : 3,
          frequence_semaine: frequence ? parseInt(frequence) : 3,
          disponibilites: disponibilite,
          objectif,
        })
        .eq('id', user.id);
      if (error) Alert.alert('Erreur', error.message);
      else Alert.alert('Profil mis a jour !', 'Vos informations ont ete sauvegardees.');
    }
    setLoading(false);
  }

  const niveaux = ['Debutant', 'Regulier', 'Confirme'];
  const disponibilites = ['matin', 'apres-midi', 'week-end'];
  const objectifs = ['bien-etre', 'glycemie', 'poids', 'social'];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Mon profil</Text>

      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {prenom ? prenom.charAt(0).toUpperCase() : '?'}
          </Text>
        </View>
        <Text style={styles.emailText}>{email}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Informations personnelles</Text>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Prenom</Text>
          <TextInput style={styles.input} value={prenom} onChangeText={setPrenom} placeholder="Votre prenom" />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Age</Text>
          <TextInput style={styles.input} value={age} onChangeText={setAge} placeholder="Votre age" keyboardType="numeric" />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Ville</Text>
          <TextInput style={styles.input} value={ville} onChangeText={setVille} placeholder="Votre ville" />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Habitudes de marche</Text>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Distance habituelle (km)</Text>
          <TextInput style={styles.input} value={distanceKm} onChangeText={setDistanceKm} keyboardType="numeric" />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Frequence (fois par semaine)</Text>
          <TextInput style={styles.input} value={frequence} onChangeText={setFrequence} keyboardType="numeric" />
        </View>
        <Text style={styles.label}>Niveau de marche</Text>
        <View style={styles.niveauxRow}>
          {niveaux.map(n => (
            <TouchableOpacity key={n} style={[styles.niveauBtn, niveau === n && styles.niveauBtnActive]} onPress={() => setNiveau(n)}>
              <Text style={[styles.niveauText, niveau === n && styles.niveauTextActive]}>{n}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.label}>Disponibilite</Text>
        <View style={styles.niveauxRow}>
          {disponibilites.map(d => (
            <TouchableOpacity key={d} style={[styles.niveauBtn, disponibilite === d && styles.niveauBtnActive]} onPress={() => setDisponibilite(d)}>
              <Text style={[styles.niveauText, disponibilite === d && styles.niveauTextActive]}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.label}>Objectif</Text>
        <View style={styles.niveauxRow}>
          {objectifs.map(o => (
            <TouchableOpacity key={o} style={[styles.niveauBtn, objectif === o && styles.niveauBtnActive]} onPress={() => setObjectif(o)}>
              <Text style={[styles.niveauText, objectif === o && styles.niveauTextActive]}>{o}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={saveProfile} disabled={loading}>
        <Text style={styles.saveBtnText}>{loading ? 'Sauvegarde...' : 'Sauvegarder'}</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F7F2' },
  title: {
    fontSize: 24, fontWeight: 'bold', color: '#2D7D46',
    padding: 24, paddingTop: 60, paddingBottom: 12,
  },
  avatarContainer: { alignItems: 'center', marginBottom: 24 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#2D7D46',
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  avatarText: { fontSize: 36, fontWeight: 'bold', color: '#fff' },
  emailText: { fontSize: 14, color: '#888' },
  card: {
    backgroundColor: '#fff', borderRadius: 20,
    padding: 20, marginHorizontal: 16, marginBottom: 16, elevation: 2,
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: '#E0E0E0',
    borderRadius: 12, padding: 14,
    fontSize: 15, color: '#333', backgroundColor: '#FAFAFA',
  },
  niveauxRow: { flexDirection: 'row', gap: 8, marginTop: 8, marginBottom: 16, flexWrap: 'wrap' },
  niveauBtn: {
    paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: 12, borderWidth: 1.5,
    borderColor: '#E0E0E0', alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  niveauBtnActive: { backgroundColor: '#2D7D46', borderColor: '#2D7D46' },
  niveauText: { fontSize: 13, color: '#888', fontWeight: '500' },
  niveauTextActive: { color: '#fff', fontWeight: '600' },
  saveBtn: {
    backgroundColor: '#2D7D46', borderRadius: 30,
    paddingVertical: 16, marginHorizontal: 16,
    alignItems: 'center', marginBottom: 40,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});