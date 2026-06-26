import { StyleSheet, Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

export default function AuthScreen({ navigation }) {
  const [isLogin, setIsLogin] = useState(true);
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationEnCours, setVerificationEnCours] = useState(true);

  // Au démarrage, on vérifie s'il existe déjà une session active
  useEffect(() => {
    verifierSession();
  }, []);

  async function verifierSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      navigation.replace('Main');
    } else {
      setVerificationEnCours(false);
    }
  }

  function motDePasseValide(mdp) {
    if (mdp.length < 8) return false;
    const aUneLettre = /[a-zA-Z]/.test(mdp);
    const aUnChiffre = /[0-9]/.test(mdp);
    return aUneLettre && aUnChiffre;
  }

  async function handleAuth() {
    if (!isLogin && prenom.trim().length < 2) {
      Alert.alert(
        'Prénom requis',
        'Merci d\'indiquer votre prénom pour créer votre compte. Il sera affiché aux autres marcheurs.'
      );
      return;
    }

    if (!isLogin && !motDePasseValide(password)) {
      Alert.alert(
        'Mot de passe trop simple',
        'Pour protéger votre compte, votre mot de passe doit contenir au moins 8 caractères, dont au moins une lettre et un chiffre.'
      );
      return;
    }

    setLoading(true);
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.toLowerCase().includes('not confirmed') || error.message.toLowerCase().includes('confirm')) {
          Alert.alert(
            'Email non confirmé',
            'Votre compte n\'est pas encore activé. Vérifiez votre boîte mail (et vos spams) et cliquez sur le lien de confirmation, puis revenez vous connecter.'
          );
        } else {
          Alert.alert('Erreur connexion', 'Email ou mot de passe incorrect. Réessayez.');
        }
      } else {
        navigation.replace('Main');
      }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { prenom: prenom.trim() } }
      });
      if (error) {
        Alert.alert('Erreur inscription', error.message);
      } else if (data.user && data.user.identities && data.user.identities.length === 0) {
        Alert.alert(
          'Adresse déjà utilisée',
          'Un compte existe déjà avec cette adresse email. Essayez de vous connecter, ou utilisez "Mot de passe oublié" si besoin.'
        );
        setIsLogin(true);
        setPassword('');
      } else {
        Alert.alert(
          'Vérifiez votre email !',
          'Votre compte a été créé. Nous vous avons envoyé un email de confirmation. Ouvrez-le (pensez à vérifier vos spams) et cliquez sur le lien pour activer votre compte, puis revenez vous connecter.'
        );
        setIsLogin(true);
        setPassword('');
      }
    }
    setLoading(false);
  }

  // Connexion via Google (OAuth)
  async function handleGoogle() {
    setLoading(true);
    try {
      // L'adresse de retour vers l'app (notre deep link movidia://)
     const redirectUrl = 'movidia://login-callback';

      // On demande à Supabase l'URL de connexion Google
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        Alert.alert('Erreur', "La connexion Google n'a pas pu démarrer. Réessayez.");
        setLoading(false);
        return;
      }

      // On ouvre le navigateur sur la page de connexion Google
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

      if (result.type === 'success' && result.url) {
        // Google nous a renvoyé vers movidia:// avec les jetons de session
        const url = result.url;

        // Les jetons sont après le # dans l'URL de retour
        const params = url.includes('#') ? url.split('#')[1] : '';
        const parametres = new URLSearchParams(params);
        const access_token = parametres.get('access_token');
        const refresh_token = parametres.get('refresh_token');

        if (access_token && refresh_token) {
          // On crée la session Supabase à partir des jetons reçus
          const { error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });

          if (sessionError) {
            Alert.alert('Erreur', "La session n'a pas pu être créée. Réessayez.");
            setLoading(false);
            return;
          }

          // Connexion réussie
          navigation.replace('Main');
        } else {
          Alert.alert('Erreur', "La connexion Google a échoué. Réessayez.");
          setLoading(false);
        }
      } else {
        // L'utilisateur a annulé ou fermé le navigateur
        setLoading(false);
      }
    } catch (e) {
      Alert.alert('Erreur', e.message);
      setLoading(false);
    }
  }

  async function handleMotDePasseOublie() {
    if (!email) {
      Alert.alert('Email requis', 'Entre d\'abord ton adresse email, puis appuie sur "Mot de passe oublié".');
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://kaleidoscopic-florentine-683394.netlify.app',
    });
    if (error) {
      Alert.alert('Erreur', error.message);
    } else {
      Alert.alert('Email envoyé', 'Si un compte existe avec cette adresse, tu vas recevoir un email pour réinitialiser ton mot de passe.');
    }
  }

  if (verificationEnCours) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.emoji}>🚶</Text>
        <Text style={styles.title}>Movidia</Text>
        <ActivityIndicator size="large" color="#2D7D46" style={{ marginTop: 24 }} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.header}>
        <Text style={styles.emoji}>🚶</Text>
        <Text style={styles.title}>Movidia</Text>
        <Text style={styles.subtitle}>Marchons ensemble vers la santé</Text>
      </View>
      <View style={styles.card}>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, isLogin && styles.toggleBtnActive]}
            onPress={() => setIsLogin(true)}>
            <Text style={[styles.toggleText, isLogin && styles.toggleTextActive]}>Connexion</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, !isLogin && styles.toggleBtnActive]}
            onPress={() => setIsLogin(false)}>
            <Text style={[styles.toggleText, !isLogin && styles.toggleTextActive]}>Inscription</Text>
          </TouchableOpacity>
        </View>
        {!isLogin && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Prénom</Text>
            <TextInput
              style={styles.input}
              placeholder="Votre prénom"
              value={prenom}
              onChangeText={setPrenom}
              autoCapitalize="words"
            />
          </View>
        )}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="votre@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Mot de passe</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          {!isLogin && (
            <Text style={styles.passwordHint}>
              Au moins 8 caractères, avec une lettre et un chiffre.
            </Text>
          )}
        </View>
        <TouchableOpacity style={styles.button} onPress={handleAuth} disabled={loading}>
          <Text style={styles.buttonText}>
            {loading ? 'Chargement...' : isLogin ? 'Se connecter' : 'Créer mon compte'}
          </Text>
        </TouchableOpacity>

        {/* Séparateur "ou" */}
        <View style={styles.separateur}>
          <View style={styles.ligne} />
          <Text style={styles.ouTexte}>ou</Text>
          <View style={styles.ligne} />
        </View>

        {/* Bouton Connexion Google */}
        <TouchableOpacity style={styles.googleBtn} onPress={handleGoogle} disabled={loading}>
          <Text style={styles.googleG}>G</Text>
          <Text style={styles.googleText}>Continuer avec Google</Text>
        </TouchableOpacity>

        {isLogin && (
          <TouchableOpacity onPress={handleMotDePasseOublie}>
            <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
          <Text style={styles.switchText}>
            {isLogin ? "Pas encore de compte ? S'inscrire" : "Déjà un compte ? Se connecter"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F7F2',
    justifyContent: 'center',
    padding: 24,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F0F7F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  emoji: { fontSize: 48, marginBottom: 8 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#2D7D46' },
  subtitle: { fontSize: 14, color: '#555', marginTop: 4, textAlign: 'center' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#F0F7F2',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  toggleBtnActive: { backgroundColor: '#2D7D46' },
  toggleText: { fontSize: 14, color: '#888', fontWeight: '500' },
  toggleTextActive: { color: '#fff', fontWeight: '600' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6 },
  input: {
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#333',
    backgroundColor: '#FAFAFA',
  },
  passwordHint: {
    fontSize: 12,
    color: '#888',
    marginTop: 6,
    marginLeft: 4,
  },
  button: {
    backgroundColor: '#2D7D46',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  separateur: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  ligne: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  ouTexte: {
    marginHorizontal: 12,
    color: '#888',
    fontSize: 13,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 16,
  },
  googleG: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4285F4',
    marginRight: 10,
  },
  googleText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '600',
  },
  forgotText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 13,
    marginBottom: 12,
    textDecorationLine: 'underline',
  },
  switchText: {
    textAlign: 'center',
    color: '#2D7D46',
    fontSize: 13,
    fontWeight: '500',
  },
});