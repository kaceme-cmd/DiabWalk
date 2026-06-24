import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ScrollView, Linking } from 'react-native';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  definirPreferenceHydratation,
  definirFrequence,
  estActif,
  getFrequence,
} from '../lib/hydratation';

export default function ProfileScreen({ navigation }) {
  const [prenom, setPrenom] = useState('');
  const [ville, setVille] = useState('');
  const [niveau, setNiveau] = useState('Débutant');
  const [age, setAge] = useState('');
  const [distanceKm, setDistanceKm] = useState('3');
  const [frequence, setFrequence] = useState('3');
  // Disponibilités : maintenant un TABLEAU (sélection multiple)
  const [disponibilites, setDisponibilites] = useState(['matin']);
  const [objectif, setObjectif] = useState('bien-etre');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  // États pour l'hydratation (préférence)
  const [hydraActif, setHydraActif] = useState(false);
  const [hydraFreq, setHydraFreq] = useState(30);

  useEffect(() => {
    getProfile();
    chargerReglagesHydratation();
  }, []);

  async function chargerReglagesHydratation() {
    const actif = await estActif();
    const freq = await getFrequence();
    setHydraActif(actif);
    setHydraFreq(freq);
  }

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
        setNiveau(data.niveau || 'Débutant');
        setAge(data.age ? String(data.age) : '');
        setDistanceKm(data.distance_km ? String(data.distance_km) : '3');
        setFrequence(data.frequence_semaine ? String(data.frequence_semaine) : '3');
        // On transforme la chaîne stockée ("matin,apres-midi") en tableau
        if (data.disponibilites) {
          setDisponibilites(data.disponibilites.split(',').filter(d => d.length > 0));
        } else {
          setDisponibilites([]);
        }
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
          // On recolle le tableau en chaîne ("matin,apres-midi") pour le stockage
          disponibilites: disponibilites.join(','),
          objectif,
        })
        .eq('id', user.id);
      if (error) Alert.alert('Erreur', error.message);
      else Alert.alert('Profil mis à jour !', 'Vos informations ont été sauvegardées.');
    }
    setLoading(false);
  }

  // Ajoute ou retire un créneau de disponibilité (sélection multiple)
  function toggleDisponibilite(creneau) {
    setDisponibilites(prev => {
      if (prev.includes(creneau)) {
        // Déjà sélectionné → on le retire
        return prev.filter(d => d !== creneau);
      } else {
        // Pas encore sélectionné → on l'ajoute
        return [...prev, creneau];
      }
    });
  }

  // Active ou désactive la préférence de rappels d'hydratation
  async function toggleHydratation() {
    const nouvelEtat = !hydraActif;
    setHydraActif(nouvelEtat);
    await definirPreferenceHydratation(nouvelEtat);
    if (nouvelEtat) {
      Alert.alert(
        'Rappels activés',
        'Vous recevrez des rappels pour boire pendant vos marches (au démarrage d\'une marche).'
      );
    } else {
      Alert.alert('Rappels désactivés', 'Vous ne recevrez plus de rappel pendant vos marches.');
    }
  }

  // Change la fréquence des rappels
  async function choisirFrequence(minutes) {
    setHydraFreq(minutes);
    await definirFrequence(minutes);
  }

  // Demande de suppression du compte (avec double confirmation)
  function confirmerSuppression() {
    Alert.alert(
      'Supprimer mon compte',
      'Cette action est définitive. Toutes vos données (profil, marches, messages, invitations) seront effacées et ne pourront pas être récupérées. Voulez-vous continuer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: deuxiemeConfirmation,
        },
      ]
    );
  }

  function deuxiemeConfirmation() {
    Alert.alert(
      'Êtes-vous vraiment sûr ?',
      'Votre compte sera supprimé immédiatement et définitivement.',
      [
        { text: 'Non, annuler', style: 'cancel' },
        {
          text: 'Oui, supprimer',
          style: 'destructive',
          onPress: supprimerCompte,
        },
      ]
    );
  }

  async function supprimerCompte() {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        Alert.alert('Erreur', 'Vous devez être connecté.');
        setLoading(false);
        return;
      }

      const { error } = await supabase.functions.invoke('supprimer-mon-compte', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) {
        Alert.alert('Erreur', "La suppression a échoué. Réessayez plus tard.");
        setLoading(false);
        return;
      }

      // Suppression réussie : on déconnecte et on revient à l'écran de connexion
      await supabase.auth.signOut();
      Alert.alert('Compte supprimé', 'Votre compte a été supprimé. À bientôt peut-être !', [
        { text: 'OK', onPress: () => navigation.replace('Auth') },
      ]);
    } catch (e) {
      Alert.alert('Erreur', e.message);
      setLoading(false);
    }
  }

  const niveaux = ['Débutant', 'Régulier', 'Confirmé'];
  const disponibilitesOptions = ['matin', 'apres-midi', 'week-end'];
  const objectifs = ['bien-etre', 'glycemie', 'poids', 'social'];
  const frequencesHydra = [15, 30, 45, 60];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
          <Text style={styles.label}>Prénom</Text>
          <TextInput style={styles.input} value={prenom} onChangeText={setPrenom} placeholder="Votre prénom" />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Âge</Text>
          <TextInput style={styles.input} value={age} onChangeText={setAge} placeholder="Votre âge" keyboardType="numeric" />
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
          <Text style={styles.label}>Fréquence (fois par semaine)</Text>
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
        <Text style={styles.label}>Disponibilités (plusieurs choix possibles)</Text>
        <View style={styles.niveauxRow}>
          {disponibilitesOptions.map(d => (
            <TouchableOpacity
              key={d}
              style={[styles.niveauBtn, disponibilites.includes(d) && styles.niveauBtnActive]}
              onPress={() => toggleDisponibilite(d)}>
              <Text style={[styles.niveauText, disponibilites.includes(d) && styles.niveauTextActive]}>{d}</Text>
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

      {/* Section Rappels d'hydratation */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>💧 Rappels d'hydratation</Text>
        <Text style={styles.hydraInfo}>
          Recevez un rappel régulier pour penser à boire pendant vos marches. Les rappels se déclenchent quand vous démarrez une marche depuis l'accueil.
        </Text>

        <TouchableOpacity
          style={[styles.hydraToggle, hydraActif && styles.hydraToggleActif]}
          onPress={toggleHydratation}>
          <Text style={[styles.hydraToggleText, hydraActif && styles.hydraToggleTextActif]}>
            {hydraActif ? '✓ Rappels activés' : 'Activer les rappels'}
          </Text>
        </TouchableOpacity>

        {hydraActif && (
          <>
            <Text style={[styles.label, { marginTop: 16 }]}>Fréquence du rappel</Text>
            <View style={styles.niveauxRow}>
              {frequencesHydra.map(f => (
                <TouchableOpacity
                  key={f}
                  style={[styles.niveauBtn, hydraFreq === f && styles.niveauBtnActive]}
                  onPress={() => choisirFrequence(f)}>
                  <Text style={[styles.niveauText, hydraFreq === f && styles.niveauTextActive]}>
                    {f} min
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={saveProfile} disabled={loading}>
        <Text style={styles.saveBtnText}>{loading ? 'Veuillez patienter...' : 'Sauvegarder'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => Linking.openURL('https://movidia-confidentialite.netlify.app')}>
        <Text style={styles.privacyLink}>Politique de confidentialité</Text>
      </TouchableOpacity>

      {/* Bouton Supprimer mon compte */}
      <TouchableOpacity style={styles.deleteBtn} onPress={confirmerSuppression} disabled={loading}>
        <Text style={styles.deleteBtnText}>Supprimer mon compte</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F7F2' },
  content: { paddingTop: 20, paddingBottom: 80 },
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
  hydraInfo: { fontSize: 13, color: '#888', marginBottom: 16, lineHeight: 18 },
  hydraToggle: {
    borderWidth: 1.5, borderColor: '#2D7D46',
    borderRadius: 12, paddingVertical: 12,
    alignItems: 'center', backgroundColor: '#FAFAFA',
  },
  hydraToggleActif: { backgroundColor: '#2D7D46' },
  hydraToggleText: { fontSize: 15, color: '#2D7D46', fontWeight: '600' },
  hydraToggleTextActif: { color: '#fff' },
  saveBtn: {
    backgroundColor: '#2D7D46', borderRadius: 30,
    paddingVertical: 16, marginHorizontal: 16,
    alignItems: 'center', marginBottom: 16,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  privacyLink: {
    textAlign: 'center',
    color: '#2D7D46',
    fontSize: 13,
    textDecorationLine: 'underline',
    marginBottom: 24,
  },
  deleteBtn: {
    marginHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: '#D32F2F',
    marginBottom: 30,
  },
  deleteBtnText: { color: '#D32F2F', fontSize: 15, fontWeight: '600' },
});