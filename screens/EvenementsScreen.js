import { StyleSheet, Text, View, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function EvenementsScreen() {
  const [evenements, setEvenements] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [userId, setUserId] = useState(null);
  // { evenementId: { compte: 3, interesse: true } }
  const [interets, setInterets] = useState({});

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setUserId(user.id);
    await chargerEvenements(user ? user.id : null);
  }

  async function chargerEvenements(monId) {
    setChargement(true);

    // 1. Charger les événements
    const { data: evs, error } = await supabase
      .from('evenements')
      .select('*')
      .order('date_evenement', { ascending: true });

    if (error || !evs) {
      setChargement(false);
      return;
    }
    setEvenements(evs);

    // 2. Charger tous les intérêts (pour compter et savoir si je suis intéressé)
    const { data: tousInterets } = await supabase
      .from('evenements_interesses')
      .select('evenement_id, user_id');

    const map = {};
    evs.forEach(ev => {
      map[ev.id] = { compte: 0, interesse: false };
    });

    if (tousInterets) {
      tousInterets.forEach(i => {
        if (map[i.evenement_id]) {
          map[i.evenement_id].compte += 1;
          if (monId && i.user_id === monId) {
            map[i.evenement_id].interesse = true;
          }
        }
      });
    }

    setInterets(map);
    setChargement(false);
  }

  async function basculerInteret(evenementId) {
    if (!userId) return;

    const etatActuel = interets[evenementId] || { compte: 0, interesse: false };

    // Mise à jour optimiste de l'affichage (immédiate)
    if (etatActuel.interesse) {
      // Je retire mon intérêt
      setInterets(prev => ({
        ...prev,
        [evenementId]: { compte: etatActuel.compte - 1, interesse: false },
      }));
      await supabase
        .from('evenements_interesses')
        .delete()
        .eq('evenement_id', evenementId)
        .eq('user_id', userId);
    } else {
      // J'ajoute mon intérêt
      setInterets(prev => ({
        ...prev,
        [evenementId]: { compte: etatActuel.compte + 1, interesse: true },
      }));
      await supabase
        .from('evenements_interesses')
        .insert({ evenement_id: evenementId, user_id: userId });
    }
  }

  // Transforme "2026-07-05" en "5 juillet 2026"
  function formaterDate(dateStr) {
    const mois = [
      'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
      'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
    ];
    const d = new Date(dateStr);
    return `${d.getDate()} ${mois[d.getMonth()]} ${d.getFullYear()}`;
  }

  if (chargement) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2D7D46" />
        <Text style={styles.loadingText}>Chargement des événements...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {evenements.length === 0 ? (
        <View style={styles.vide}>
          <Text style={styles.videTitre}>Aucun événement pour le moment</Text>
          <Text style={styles.videTexte}>
            De nouvelles marches collectives et sorties seront bientôt proposées près de chez vous.
          </Text>
        </View>
      ) : (
        evenements.map(ev => {
          const etat = interets[ev.id] || { compte: 0, interesse: false };
          return (
            <View key={ev.id} style={styles.card}>
              <Text style={styles.cardTitre}>{ev.titre}</Text>

              <View style={styles.ligneInfo}>
                <Text style={styles.infoLabel}>📅 Date</Text>
                <Text style={styles.infoValeur}>
                  {formaterDate(ev.date_evenement)}{ev.heure_rdv ? ` à ${ev.heure_rdv}` : ''}
                </Text>
              </View>

              <View style={styles.ligneInfo}>
                <Text style={styles.infoLabel}>📍 Lieu</Text>
                <Text style={styles.infoValeur}>{ev.lieu}</Text>
              </View>

              {(ev.distance_km || ev.duree_min) && (
                <View style={styles.ligneInfo}>
                  <Text style={styles.infoLabel}>🚶 Marche</Text>
                  <Text style={styles.infoValeur}>
                    {ev.distance_km ? `${ev.distance_km} km` : ''}
                    {ev.distance_km && ev.duree_min ? ' · ' : ''}
                    {ev.duree_min ? `environ ${ev.duree_min} min` : ''}
                  </Text>
                </View>
              )}

              {ev.description ? (
                <Text style={styles.description}>{ev.description}</Text>
              ) : null}

              {ev.contact ? (
                <Text style={styles.contact}>Organisé par : {ev.contact}</Text>
              ) : null}

              {/* Bouton Intéressé(e) + compteur */}
              <View style={styles.interetRow}>
                <TouchableOpacity
                  style={[styles.interetBtn, etat.interesse && styles.interetBtnActif]}
                  onPress={() => basculerInteret(ev.id)}>
                  <Text style={[styles.interetBtnText, etat.interesse && styles.interetBtnTextActif]}>
                    {etat.interesse ? '✓ Intéressé(e)' : 'Intéressé(e) ?'}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.compteText}>
                  {etat.compte} {etat.compte > 1 ? 'personnes intéressées' : 'personne intéressée'}
                </Text>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F7F2',
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F0F7F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  vide: {
    marginTop: 60,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  videTitre: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D7D46',
    marginBottom: 10,
    textAlign: 'center',
  },
  videTexte: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  cardTitre: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D7D46',
    marginBottom: 12,
  },
  ligneInfo: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    width: 90,
    fontSize: 14,
    color: '#888',
    fontWeight: '600',
  },
  infoValeur: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  description: {
    fontSize: 14,
    color: '#555',
    lineHeight: 21,
    marginTop: 8,
    marginBottom: 4,
  },
  contact: {
    fontSize: 13,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 8,
  },
  interetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  interetBtn: {
    backgroundColor: '#F0F7F2',
    borderWidth: 1.5,
    borderColor: '#2D7D46',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
  },
  interetBtnActif: {
    backgroundColor: '#2D7D46',
  },
  interetBtnText: {
    fontSize: 14,
    color: '#2D7D46',
    fontWeight: '600',
  },
  interetBtnTextActif: {
    color: '#fff',
  },
  compteText: {
    fontSize: 13,
    color: '#888',
    flex: 1,
  },
});