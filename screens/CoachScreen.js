import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';

export default function CoachScreen() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Coucou ! Je suis Kroki, ton compagnon de marche. Comment puis-je t\'aider aujourd\'hui ?' }
  ]);
  const [saisie, setSaisie] = useState('');
  const [chargement, setChargement] = useState(false);
  const scrollRef = useRef(null);

  async function envoyer() {
    if (!saisie.trim()) return;

    const messageUtilisateur = { role: 'user', content: saisie };
    const nouveauxMessages = [...messages, messageUtilisateur];
    setMessages(nouveauxMessages);
    setSaisie('');
    setChargement(true);

    try {
      const { data, error } = await supabase.functions.invoke('coach-kroki', {
        body: {
          messages: nouveauxMessages.map(m => ({ role: m.role, content: m.content })),
        },
      });

      if (error) throw error;

      const reponseKroki = data.reponse || 'Desole, je n\'ai pas pu repondre.';
      setMessages([...nouveauxMessages, { role: 'assistant', content: reponseKroki }]);
    } catch (erreur) {
      console.log('Erreur Kroki:', erreur);
      setMessages([...nouveauxMessages, { role: 'assistant', content: 'Oups, je n\'arrive pas a me connecter. Reessaie dans un instant.' }]);
    } finally {
      setChargement(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>

      

      <ScrollView
        ref={scrollRef}
        style={styles.chat}
        contentContainerStyle={styles.chatContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>

        {messages.map((message, index) => (
          <View
            key={index}
            style={[
              styles.bulle,
              message.role === 'user' ? styles.bulleUser : styles.bulleKroki,
            ]}>
            {message.role === 'assistant' && (
              <Image source={require('../assets/kroki-icone.png')} style={styles.bulleAvatar} />
            )}
            <Text style={message.role === 'user' ? styles.texteUser : styles.texteKroki}>
              {message.content}
            </Text>
          </View>
        ))}

        {chargement && (
          <View style={[styles.bulle, styles.bulleKroki]}>
            <Image source={require('../assets/kroki-icone.png')} style={styles.bulleAvatar} />
            <ActivityIndicator color="#2D7D46" />
          </View>
        )}
      </ScrollView>

      <View style={styles.barreSaisie}>
        <TextInput
          style={styles.input}
          placeholder="Pose ta question a Kroki..."
          placeholderTextColor="#999"
          value={saisie}
          onChangeText={setSaisie}
          multiline
        />
        <TouchableOpacity style={styles.boutonEnvoyer} onPress={envoyer} disabled={chargement}>
          <Text style={styles.boutonEnvoyerTexte}>➤</Text>
        </TouchableOpacity>
      </View>

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
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#2D7D46' },
  headerSub: { fontSize: 12, color: '#888' },
  chat: { flex: 1 },
  chatContent: { padding: 16 },
  bulle: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bulleUser: {
    backgroundColor: '#2D7D46',
    alignSelf: 'flex-end',
  },
  bulleKroki: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    elevation: 1,
  },
  bulleAvatar: { width: 40, height: 40, marginRight: 8, resizeMode: 'contain' },
  texteUser: { color: '#fff', fontSize: 15, flex: 1 },
  texteKroki: { color: '#333', fontSize: 15, flex: 1, lineHeight: 21 },
  barreSaisie: {
    flexDirection: 'row',
    padding: 10,
    paddingBottom: 45,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#F0F7F2',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    color: '#333',
  },
  boutonEnvoyer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2D7D46',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  boutonEnvoyerTexte: { color: '#fff', fontSize: 18 },
});