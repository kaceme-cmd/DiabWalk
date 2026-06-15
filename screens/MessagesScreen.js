import { StyleSheet, Text, View, FlatList, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Modal, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';

const MOTIFS = [
  'Spam ou publicité',
  'Harcèlement ou intimidation',
  'Contenu inapproprié',
  'Comportement suspect',
  'Autre',
];

export default function MessagesScreen({ route, navigation }) {
  const { destinataire } = route.params || {};
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [userId, setUserId] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [signalementVisible, setSignalementVisible] = useState(false);

  useEffect(() => {
    getUser();
  }, []);

  useEffect(() => {
    if (userId && destinataire) {
      getMessages();
    }
  }, [userId, destinataire]);

  async function getUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setUserId(user.id);
  }

  async function getMessages() {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(expediteur_id.eq.${userId},destinataire_id.eq.${destinataire.id}),and(expediteur_id.eq.${destinataire.id},destinataire_id.eq.${userId})`)
      .order('created_at', { ascending: true });
    if (data) setMessages(data);
  }

  async function sendMessage() {
    if (!newMessage.trim()) return;
    const { error } = await supabase.from('messages').insert({
      expediteur_id: userId,
      destinataire_id: destinataire.id,
      contenu: newMessage.trim(),
    });
    if (!error) {
      setNewMessage('');
      getMessages();
    }
  }

  async function bloquerUtilisateur() {
    setMenuVisible(false);
    const { error } = await supabase.from('blocages').insert({
      bloqueur_id: userId,
      bloque_id: destinataire.id,
    });
    if (!error) {
      Alert.alert('Utilisateur bloqué', `${destinataire.prenom} ne pourra plus vous contacter.`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } else {
      Alert.alert('Information', 'Cet utilisateur est déjà bloqué.');
    }
  }

  async function signalerUtilisateur(motif) {
    setSignalementVisible(false);
    const { error } = await supabase.from('signalements').insert({
      signaleur_id: userId,
      signale_id: destinataire.id,
      motif: motif,
    });
    if (!error) {
      Alert.alert('Signalement envoyé', 'Merci. Nous examinerons ce signalement.');
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {destinataire ? destinataire.prenom : 'Messages'}
        </Text>
        {destinataire && (
          <TouchableOpacity style={styles.menuBtn} onPress={() => setMenuVisible(true)}>
            <Text style={styles.menuBtnText}>⋮</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={messages}
        keyExtractor={item => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        renderItem={({ item }) => (
          <View style={[
            styles.messageBubble,
            item.expediteur_id === userId ? styles.myMessage : styles.theirMessage
          ]}>
            <Text style={[
              styles.messageText,
              item.expediteur_id === userId ? styles.myMessageText : styles.theirMessageText
            ]}>
              {item.contenu}
            </Text>
            <Text style={[
              styles.messageTime,
              item.expediteur_id === userId ? styles.myMessageTime : styles.theirMessageTime
            ]}>
              {new Date(item.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Commencez la conversation ! 👋</Text>
          </View>
        }
      />
      <View style={[styles.inputRow, { paddingBottom: insets.bottom + 12 }]}>
        <TextInput
          style={styles.input}
          placeholder="Votre message..."
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
        />
        <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
          <Text style={styles.sendBtnText}>Envoyer</Text>
        </TouchableOpacity>
      </View>

      {/* Menu Bloquer / Signaler */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setMenuVisible(false)}>
          <View style={styles.menuBox}>
            <TouchableOpacity style={styles.menuItem} onPress={bloquerUtilisateur}>
              <Text style={styles.menuItemText}>Bloquer cet utilisateur</Text>
            </TouchableOpacity>
            <View style={styles.menuSeparator} />
            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); setSignalementVisible(true); }}>
              <Text style={styles.menuItemText}>Signaler cet utilisateur</Text>
            </TouchableOpacity>
            <View style={styles.menuSeparator} />
            <TouchableOpacity style={styles.menuItem} onPress={() => setMenuVisible(false)}>
              <Text style={styles.menuItemCancel}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Choix du motif de signalement */}
      <Modal
        visible={signalementVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSignalementVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSignalementVisible(false)}>
          <View style={styles.menuBox}>
            <Text style={styles.menuTitle}>Motif du signalement</Text>
            {MOTIFS.map(motif => (
              <TouchableOpacity key={motif} style={styles.menuItem} onPress={() => signalerUtilisateur(motif)}>
                <Text style={styles.menuItemText}>{motif}</Text>
              </TouchableOpacity>
            ))}
            <View style={styles.menuSeparator} />
            <TouchableOpacity style={styles.menuItem} onPress={() => setSignalementVisible(false)}>
              <Text style={styles.menuItemCancel}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F7F2' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
    gap: 16,
  },
  backBtn: { fontSize: 16, color: '#2D7D46', fontWeight: '500' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', flex: 1 },
  menuBtn: { paddingHorizontal: 8 },
  menuBtnText: { fontSize: 24, color: '#333', fontWeight: 'bold' },
  messagesList: { flex: 1 },
  messagesContent: { padding: 16, flexGrow: 1 },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  myMessage: {
    backgroundColor: '#2D7D46',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    elevation: 1,
  },
  messageText: { fontSize: 15 },
  myMessageText: { color: '#fff' },
  theirMessageText: { color: '#333' },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  myMessageTime: { color: 'rgba(255,255,255,0.7)' },
  theirMessageTime: { color: '#aaa' },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: { fontSize: 16, color: '#888' },
  inputRow: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 0.5,
    borderTopColor: '#eee',
    gap: 8,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333',
    backgroundColor: '#FAFAFA',
    maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: '#2D7D46',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sendBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '80%',
    paddingVertical: 8,
    elevation: 5,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#888',
    textAlign: 'center',
    paddingVertical: 12,
  },
  menuItem: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  menuItemText: { fontSize: 16, color: '#333', textAlign: 'center' },
  menuItemCancel: { fontSize: 16, color: '#999', textAlign: 'center' },
  menuSeparator: { height: 0.5, backgroundColor: '#eee' },
});