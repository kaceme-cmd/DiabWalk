import { StyleSheet, Text, View, FlatList, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function MessagesScreen({ route, navigation }) {
  const { destinataire } = route.params || {};
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [userId, setUserId] = useState(null);

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

  return (
    <View style={styles.container} onLayout={() => {}}>
      

      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {destinataire ? destinataire.prenom : 'Messages'}
        </Text>
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
      <View style={styles.inputRow}>
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
    </View>
  );
}const styles = StyleSheet.create({
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
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
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
  },inputRow: {
    flexDirection: 'row',
    padding: 12,
    paddingBottom: 50,
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
});