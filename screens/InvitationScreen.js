import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function InvitationsScreen({ navigation }) {
  const [invitations, setInvitations] = useState([]);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);
    await chargerInvitations(user.id);
    setLoading(false);
  }

  // Charge les invitations REÇUES en attente, avec le prénom de l'expéditeur
  async function chargerInvitations(monId) {
    const { data: invits } = await supabase
      .from('invitations')
      .select('*')
      .eq('destinataire_id', monId)
      .eq('statut', 'en_attente')
      .order('created_at', { ascending: false });

    if (!invits || invits.length === 0) {
      setInvitations([]);
      return;
    }

    // On récupère les prénoms des expéditeurs
    const expediteurIds = invits.map(i => i.expediteur_id);
    const { data: profils } = await supabase
      .from('profiles')
      .select('id, prenom, age, ville')
      .in('id', expediteurIds);

    // On associe chaque invitation au profil de son expéditeur
    const invitationsCompletes = invits.map(inv => {
      const profil = profils?.find(p => p.id === inv.expediteur_id);
      return {
        ...inv,
        prenom: profil?.prenom || 'Marcheur',
        age: profil?.age,
        ville: profil?.ville,
      };
    });

    setInvitations(invitationsCompletes);
  }

  async function accepter(invitation) {
    const { error } = await supabase
      .from('invitations')
      .update({ statut: 'acceptee' })
      .eq('id', invitation.id);

    if (error) {
      Alert.alert('Erreur', "L'invitation n'a pas pu être acceptée. Réessayez.");
      return;
    }

    // On retire l'invitation de la liste et on ouvre la messagerie
    setInvitations(prev => prev.filter(i => i.id !== invitation.id));
    Alert.alert(
      'Invitation acceptée ! 🎉',
      `Vous pouvez maintenant discuter avec ${invitation.prenom}.`,
      [
        {
          text: 'Discuter',
          onPress: () => navigation.navigate('Messages', {
            destinataire: { id: invitation.expediteur_id, prenom: invitation.prenom }
          })
        },
        { text: 'Plus tard', style: 'cancel' },
      ]
    );
  }

  async function refuser(invitation) {
    const { error } = await supabase
      .from('invitations')
      .update({ statut: 'refusee' })
      .eq('id', invitation.id);

    if (error) {
      Alert.alert('Erreur', "L'invitation n'a pas pu être refusée. Réessayez.");
      return;
    }

    setInvitations(prev => prev.filter(i => i.id !== invitation.id));
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.subtitle}>
        Marcheurs qui souhaitent marcher avec vous
      </Text>

      {loading ? (
        <View style={styles.loadingBox}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      ) : invitations.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>Aucune invitation</Text>
          <Text style={styles.emptyText}>
            Vous n'avez pas d'invitation en attente pour le moment.
          </Text>
        </View>
      ) : (
        invitations.map(inv => (
          <View key={inv.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {inv.prenom ? inv.prenom.charAt(0).toUpperCase() : '?'}
                </Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.nom}>{inv.prenom}</Text>
                <Text style={styles.details}>
                  {inv.age ? `${inv.age} ans` : ''} {inv.ville ? `- ${inv.ville}` : ''}
                </Text>
                <Text style={styles.invitationText}>
                  vous invite à marcher ensemble 🚶
                </Text>
              </View>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.btnRefuser} onPress={() => refuser(inv)}>
                <Text style={styles.btnRefuserText}>Refuser</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnAccepter} onPress={() => accepter(inv)}>
                <Text style={styles.btnAccepterText}>Accepter</Text>
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
  loadingBox: { alignItems: 'center', padding: 40 },
  loadingText: { fontSize: 16, color: '#888' },
  emptyBox: {
    margin: 24, padding: 24,
    backgroundColor: '#fff', borderRadius: 20,
    alignItems: 'center', elevation: 2,
  },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#888', textAlign: 'center' },
  card: {
    backgroundColor: '#fff', borderRadius: 20,
    marginHorizontal: 16, marginBottom: 12,
    padding: 16, elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 16,
  },
  avatar: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: '#2D7D46', alignItems: 'center',
    justifyContent: 'center', marginRight: 12,
  },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  info: { flex: 1 },
  nom: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  details: { fontSize: 12, color: '#888', marginTop: 2 },
  invitationText: { fontSize: 13, color: '#2D7D46', marginTop: 4, fontWeight: '500' },
  actions: {
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 0.5,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  btnRefuser: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingVertical: 10,
    alignItems: 'center',
  },
  btnRefuserText: { fontSize: 14, color: '#888', fontWeight: '600' },
  btnAccepter: {
    flex: 1,
    backgroundColor: '#2D7D46',
    borderRadius: 20,
    paddingVertical: 10,
    alignItems: 'center',
  },
  btnAccepterText: { fontSize: 14, color: '#fff', fontWeight: '600' },
});