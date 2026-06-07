import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function ProfileScreen() {
  const [prenom, setPrenom] = useState('');
  const [ville, setVille] = useState('');
  const [niveau, setNiveau] = useState('DÃ©butant');
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
        setNiveau(data.niveau || 'DÃ©butant');
      }
    }
  }

  async function saveProfile() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase
        .from('profiles')
        .update({ prenom, ville, niveau })
        .eq('id', user.id);
      if (error) Alert.alert('Erreur', error.message);
      else Alert.alert('Profil mis a  jour !', 'Vos informations ont ete sauvegardees.');
    }
    setLoading(false);
  }

  const niveaux = ['Debutant', 'Regulier', 'Confirme'];

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
          <TextInput
            style={styles.input}
            value={prenom}
            onChangeText={setPrenom}
            placeholder="Votre prenom"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Ville</Text>
          <TextInput
            style={styles.input}
            value={ville}
            onChangeText={setVille}
            placeholder="Votre ville"
          />
        </View>

        <Text style={styles.label}>Niveau de marche</Text>
        <View style={styles.niveauxRow}>
          {niveaux.map(n => (
            <TouchableOpacity
              key={n}
              style={[styles.niveauBtn, niveau === n && styles.niveauBtnActive]}
              onPress={() => setNiveau(n)}>
              <Text style={[styles.niveauText, niveau === n && styles.niveauTextActive]}>
                {n}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={saveProfile} disabled={loading}>
        <Text style={styles.saveBtnText}>
          {loading ? 'Sauvegarde...' : 'Sauvegarder'}
        </Text>
      </TouchableOpacity>

    </ScrollView>
  );
}const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F7F2',
  },
  title: {
    fontSize: 24, fontWeight: 'bold', color: '#2D7D46',
    padding: 24, paddingTop: 60, paddingBottom: 12,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#2D7D46',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  avatarText: { fontSize: 36, fontWeight: 'bold', color: '#fff' },
  emailText: { fontSize: 14, color: '#888' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16, fontWeight: 'bold', color: '#333',
    marginBottom: 16,
  },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: '#E0E0E0',
    borderRadius: 12, padding: 14,
    fontSize: 15, color: '#333', backgroundColor: '#FAFAFA',
  },
  niveauxRow: {
    flexDirection: 'row', gap: 8, marginTop: 8, marginBottom: 8,
  },
  niveauBtn: {
    flex: 1, paddingVertical: 10,
    borderRadius: 12, borderWidth: 1.5,
    borderColor: '#E0E0E0', alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  niveauBtnActive: {
    backgroundColor: '#2D7D46', borderColor: '#2D7D46',
  },
  niveauText: { fontSize: 13, color: '#888', fontWeight: '500' },
  niveauTextActive: { color: '#fff', fontWeight: '600' },
  saveBtn: {
    backgroundColor: '#2D7D46',
    borderRadius: 30, paddingVertical: 16,
    marginHorizontal: 16, alignItems: 'center',
    marginBottom: 40,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
