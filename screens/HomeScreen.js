import { StyleSheet, Text, View, TouchableOpacity, Alert, ScrollView, Image, Modal } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import * as Location from 'expo-location';
import { Pedometer } from 'expo-sensors';
import { supabase } from '../lib/supabase';
import { demarrerRappelsMarche, arreterRappelsMarche } from '../lib/hydratation';
import { enregistrerMarche } from '../lib/marche';
import { verifierMeteo } from '../lib/meteo';

export default function HomeScreen({ navigation }) {
  const [prenom, setPrenom] = useState('');
  const [locationSaved, setLocationSaved] = useState(false);
  const [pas, setPas] = useState(0);
  const [userId, setUserId] = useState(null);
  const [nbInvitations, setNbInvitations] = useState(0);

  // États de la marche en cours
  const [marcheEnCours, setMarcheEnCours] = useState(false);
  const [chrono, setChrono] = useState(0); // en secondes

  // Affichage de l'écran d'avertissement avant la marche
  const [avertissementVisible, setAvertissementVisible] = useState(false);
  // Case à cocher de confirmation (obligatoire avant de démarrer)
  const [caseCochee, setCaseCochee] = useState(false);

  // Références pour gérer le podomètre et le chrono
  const subscriptionRef = useRef(null);
  const chronoRef = useRef(null);
  const pasDebutRef = useRef(0);

  useEffect(() => {
    getProfile();
    saveLocation();

    // Sécurité : au chargement de l'accueil, si aucune marche n'est en cours,
    // on annule tout rappel d'hydratation résiduel
    if (!marcheEnCours) {
      arreterRappelsMarche();
    }

    return () => {
      if (subscriptionRef.current) subscriptionRef.current.remove();
      if (chronoRef.current) clearInterval(chronoRef.current);
    };
  }, []);

  // À chaque fois que l'accueil redevient actif, on rafraîchit le compteur d'invitations
  useFocusEffect(
    useCallback(() => {
      compterInvitations();
    }, [userId])
  );

  async function compterInvitations() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('invitations')
      .select('id')
      .eq('destinataire_id', user.id)
      .eq('statut', 'en_attente');
    setNbInvitations(data ? data.length : 0);
  }

  async function getProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      let loc = await Location.getCurrentPositionAsync({});

      const { error } = await supabase
        .from('profiles')
        .update({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        })
        .eq('id', session.user.id);

      if (error) {
        console.log('Sauvegarde position differee:', error.message);
        return;
      }
      setLocationSaved(true);
    } catch (error) {
      console.log('Erreur position:', error);
    }
  }

  // Ouvre l'écran d'avertissement (appelé par le bouton "Démarrer ma marche")
  function ouvrirAvertissement() {
    setCaseCochee(false); // la case est décochée à chaque ouverture
    setAvertissementVisible(true);
  }

  // L'utilisateur a lu l'avertissement, coché la case et confirme : on lance la marche
  function confirmerDepart() {
    setAvertissementVisible(false);
    demarrerMarche();
  }

  // Démarre une marche : pas à 0, chrono, podomètre, rappels hydratation, météo
  async function demarrerMarche() {
    try {
      const dispo = await Pedometer.isAvailableAsync();
      if (!dispo) {
        Alert.alert('Indisponible', "Le podomètre n'est pas disponible sur cet appareil.");
        return;
      }
      const permission = await Pedometer.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission requise', 'Autorisez le podomètre pour suivre vos pas.');
        return;
      }

      // Remise à zéro
      setPas(0);
      setChrono(0);
      pasDebutRef.current = 0;

      // Suivi des pas (à partir de maintenant)
      subscriptionRef.current = Pedometer.watchStepCount(result => {
        setPas(result.steps);
      });

      // Chrono : +1 seconde chaque seconde
      chronoRef.current = setInterval(() => {
        setChrono(prev => prev + 1);
      }, 1000);

      // La marche est officiellement lancée
      setMarcheEnCours(true);

      // Rappels d'hydratation (si la préférence est active dans le Profil)
      const rappelsActifs = await demarrerRappelsMarche();

      // Message de démarrage AFFICHÉ TOUT DE SUITE
      if (rappelsActifs) {
        Alert.alert('C\'est parti ! 🚶', 'Bonne marche ! Pensez à bien vous hydrater. 💧');
      } else {
        Alert.alert('C\'est parti ! 🚶', 'Bonne marche !');
      }

      // Vérification météo APRÈS (appel réseau, peut être plus lent)
      try {
        const { status: statusLoc } = await Location.requestForegroundPermissionsAsync();
        if (statusLoc === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          const messageMeteo = await verifierMeteo(loc.coords.latitude, loc.coords.longitude);
          if (messageMeteo) {
            Alert.alert('Vigilance météo', messageMeteo);
          }
        }
      } catch (e) {
        console.log('Météo non vérifiée:', e.message);
      }
    } catch (e) {
      Alert.alert('Erreur', e.message);
    }
  }

  // Termine la marche : arrête tout, enregistre, affiche le résumé
  async function terminerMarche() {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }
    if (chronoRef.current) {
      clearInterval(chronoRef.current);
      chronoRef.current = null;
    }

    await arreterRappelsMarche();

    setMarcheEnCours(false);

    const dureeMinutes = Math.max(1, Math.round(chrono / 60));
    const distance = (pas * 0.75 / 1000).toFixed(1);

    let messagePoints = '';
    if (userId) {
      const resultat = await enregistrerMarche(userId, dureeMinutes, pas);
      messagePoints = `\n\n${resultat.message}`;
    }

    Alert.alert(
      'Marche terminée ! 🐧',
      `👣 ${pas.toLocaleString()} pas\n📏 ${distance} km\n⏱️ ${dureeMinutes} min${messagePoints}`
    );
  }

  async function handleLogout() {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            await arreterRappelsMarche();
            await supabase.auth.signOut();
            navigation.replace('Auth');
          }
        }
      ]
    );
  }

  const distanceKm = (pas * 0.75 / 1000).toFixed(1);

  function formatChrono(secondes) {
    const min = Math.floor(secondes / 60);
    const sec = secondes % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  }

  const tuiles = [
    { nom: 'Parcours', emoji: '🚶', ecran: 'Parcours' },
    { nom: 'Mon activité', emoji: '🏆', ecran: 'Activite' },
    { nom: 'Marcher ensemble', emoji: '👥', ecran: 'Buddy' },
    { nom: 'Carte', emoji: '🗺️', ecran: 'Carte' },
    { nom: 'Nutrition', emoji: '🥗', ecran: 'Nutrition' },
    { nom: 'Recettes', emoji: '👨‍🍳', ecran: 'Recettes' },
    { nom: 'Profil', emoji: '👤', ecran: 'Profil' },
    { nom: 'Coach Kroki', image: true, ecran: 'Coach' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Écran d'avertissement avant le départ */}
      <Modal
        visible={avertissementVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setAvertissementVisible(false)}>
        <View style={styles.avertContainer}>
          <ScrollView contentContainerStyle={styles.avertContent}>
            <Image source={require('../assets/kroki.png')} style={styles.avertKroki} />
            <Text style={styles.avertTitre}>Avant de commencer votre marche</Text>

            <Text style={styles.avertTexte}>
              La marche est une activité bénéfique pour la santé lorsqu'elle est pratiquée dans des conditions adaptées à votre âge, à votre état de santé et à vos capacités physiques.
            </Text>

            <Text style={styles.avertTexte}>Avant de partir, assurez-vous :</Text>

            <Text style={styles.avertPuce}>• d'être en condition physique pour marcher aujourd'hui ;</Text>
            <Text style={styles.avertPuce}>• d'avoir de l'eau et, si nécessaire, vos médicaments ou votre matériel médical habituel ;</Text>
            <Text style={styles.avertPuce}>• d'avoir informé un proche de votre sortie ou activé vos contacts d'urgence ;</Text>
            <Text style={styles.avertPuce}>• de choisir un parcours adapté à votre niveau.</Text>

            <Text style={styles.avertTexte}>
              En cas de fatigue inhabituelle, de douleur, de malaise, d'essoufflement important ou de tout autre symptôme préoccupant, arrêtez immédiatement votre activité et contactez les secours si nécessaire.
            </Text>

            <Text style={styles.avertMention}>
              Movidia facilite les rencontres entre marcheurs mais ne fournit aucun avis médical, n'assure aucune surveillance en temps réel et ne peut garantir la sécurité des déplacements ou des participants.
            </Text>

            <Text style={styles.avertMention}>
              En démarrant votre marche, vous reconnaissez pratiquer cette activité sous votre propre responsabilité.
            </Text>

            {/* Case à cocher de confirmation (obligatoire) */}
            <TouchableOpacity
              style={styles.caseRow}
              onPress={() => setCaseCochee(!caseCochee)}
              activeOpacity={0.7}>
              <View style={[styles.caseCarre, caseCochee && styles.caseCarreCoche]}>
                {caseCochee && <Text style={styles.caseCheck}>✓</Text>}
              </View>
              <Text style={styles.caseTexte}>
                Je confirme être en état de réaliser cette marche et avoir pris les précautions nécessaires liées à ma santé.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.avertBtnDepart, !caseCochee && styles.avertBtnDepartDesactive]}
              onPress={confirmerDepart}
              disabled={!caseCochee}>
              <Text style={styles.avertBtnDepartText}>🚶  Je démarre ma marche</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.avertBtnAnnuler} onPress={() => setAvertissementVisible(false)}>
              <Text style={styles.avertBtnAnnulerText}>Annuler</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      <View style={styles.header}>
        <Text style={styles.title}>Movidia</Text>
        {prenom ? (
          <Text style={styles.welcome}>Bonjour {prenom} !</Text>
        ) : (
          <Text style={styles.subtitle}>Marchons ensemble vers la santé</Text>
        )}
        {locationSaved && (
          <Text style={styles.locationBadge}>Position partagée</Text>
        )}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{pas.toLocaleString()}</Text>
          <Text style={styles.statLbl}>{marcheEnCours ? 'pas (marche en cours)' : 'pas'}</Text>
          <Text style={styles.statDistance}>{distanceKm} km</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{marcheEnCours ? formatChrono(chrono) : '—'}</Text>
          <Text style={styles.statLbl}>durée</Text>
        </View>
      </View>

      {/* Bouton Démarrer / Terminer la marche */}
      <TouchableOpacity
        style={[styles.btnMarche, marcheEnCours && styles.btnMarcheActif]}
        onPress={marcheEnCours ? terminerMarche : ouvrirAvertissement}>
        <Text style={styles.btnMarcheText}>
          {marcheEnCours ? '⏸️  Terminer ma marche' : '🚶  Démarrer ma marche'}
        </Text>
      </TouchableOpacity>

      <View style={styles.grid}>
        {tuiles.map((tuile) => (
          <TouchableOpacity
            key={tuile.ecran}
            style={styles.tuile}
            onPress={() => navigation.navigate(tuile.ecran)}>
            <View style={styles.tuileIcone}>
              {tuile.image ? (
                <Image source={require('../assets/kroki.png')} style={styles.tuileImage} />
              ) : (
                <Text style={styles.tuileEmoji}>{tuile.emoji}</Text>
              )}
            </View>
            <Text style={styles.tuileTexte}>{tuile.nom}</Text>
            {/* Badge invitations sur la tuile "Marcher ensemble" */}
            {tuile.ecran === 'Buddy' && nbInvitations > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{nbInvitations}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Bandeau d'invitations en attente */}
      {nbInvitations > 0 && (
        <TouchableOpacity
          style={styles.invitationBanner}
          onPress={() => navigation.navigate('Invitations')}>
          <Text style={styles.invitationBannerText}>
            📨 Vous avez {nbInvitations} invitation{nbInvitations > 1 ? 's' : ''} à marcher !
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.btnSOS}
        onPress={() => navigation.navigate('SOS')}>
        <Text style={styles.btnSOSText}>🆘  SOS Urgence</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Déconnexion</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F7F2',
  },
  content: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: { fontSize: 36, fontWeight: 'bold', color: '#2D7D46', marginBottom: 8 },
  welcome: { fontSize: 18, color: '#2D7D46', fontWeight: '600', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#555', textAlign: 'center' },
  locationBadge: {
    fontSize: 12, color: '#2D7D46', marginTop: 8,
    backgroundColor: '#E8F5EC', paddingHorizontal: 12,
    paddingVertical: 4, borderRadius: 20,
  },
  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 20 },
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
  btnMarche: {
    backgroundColor: '#2D7D46',
    borderRadius: 20,
    paddingVertical: 18,
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
    elevation: 3,
  },
  btnMarcheActif: { backgroundColor: '#E07B2A' },
  btnMarcheText: { color: '#fff', fontSize: 19, fontWeight: 'bold' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  tuile: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '47%',
    height: 130,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  tuileIcone: {
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  tuileEmoji: { fontSize: 44 },
  tuileImage: { width: 65, height: 65, resizeMode: 'contain' },
  tuileTexte: { fontSize: 17, fontWeight: '600', color: '#333', textAlign: 'center', paddingHorizontal: 4 },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#D32F2F',
    borderRadius: 14,
    minWidth: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  invitationBanner: {
    backgroundColor: '#E07B2A',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  invitationBannerText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  btnSOS: {
    backgroundColor: '#D32F2F',
    borderRadius: 20,
    paddingVertical: 20,
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  btnSOSText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  logoutBtn: { paddingVertical: 16, marginTop: 8 },
  logoutText: { fontSize: 14, color: '#888' },

  // Styles de l'écran d'avertissement (Modal)
  avertContainer: {
    flex: 1,
    backgroundColor: '#F0F7F2',
  },
  avertContent: {
    padding: 24,
    paddingTop: 50,
    paddingBottom: 40,
    alignItems: 'center',
  },
  avertKroki: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    marginBottom: 12,
  },
  avertTitre: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D7D46',
    textAlign: 'center',
    marginBottom: 20,
  },
  avertTexte: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 14,
    textAlign: 'left',
    alignSelf: 'stretch',
  },
  avertPuce: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 8,
    alignSelf: 'stretch',
    paddingLeft: 8,
  },
  avertMention: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    lineHeight: 21,
    marginBottom: 14,
    alignSelf: 'stretch',
  },
  caseRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    alignSelf: 'stretch',
    marginTop: 20,
    marginBottom: 4,
  },
  caseCarre: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#2D7D46',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  caseCarreCoche: {
    backgroundColor: '#2D7D46',
  },
  caseCheck: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  caseTexte: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    lineHeight: 21,
  },
  avertBtnDepart: {
    backgroundColor: '#2D7D46',
    borderRadius: 20,
    paddingVertical: 18,
    width: '100%',
    alignItems: 'center',
    marginTop: 16,
    elevation: 3,
  },
  avertBtnDepartDesactive: {
    backgroundColor: '#A5C8B0',
    elevation: 0,
  },
  avertBtnDepartText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  avertBtnAnnuler: {
    paddingVertical: 16,
    marginTop: 8,
  },
  avertBtnAnnulerText: { fontSize: 15, color: '#888', textAlign: 'center' },
});