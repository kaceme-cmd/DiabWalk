import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { nettoyerNotifications } from './lib/hydratation';
import EvenementsScreen from './screens/EvenementsScreen';
import HomeScreen from './screens/HomeScreen';
import MapScreen from './screens/MapScreen';
import NutritionScreen from './screens/NutritionScreen';
import RecipesScreen from './screens/RecipesScreen';
import AuthScreen from './screens/AuthScreen';
import MessagesScreen from './screens/MessagesScreen';
import ProfileScreen from './screens/ProfileScreen';
import SOSScreen from './screens/SOSScreen';
import RecipeDetailScreen from './screens/RecipeDetailScreen';
import CoachScreen from './screens/CoachScreen';
import ParcoursScreen from './screens/ParcoursScreen';
import ParcoursDetailScreen from './screens/ParcoursDetailScreen';
import ActivityScreen from './screens/ActivityScreen';
import BuddyScreen from './screens/BuddyScreen';
import InvitationScreen from './screens/InvitationScreen';
import { MarcheursProvider } from './contexts/MarcheursContext';
// On empeche le splash de disparaitre tout seul
SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();

export default function App() {
  useEffect(() => {
    // Nettoie les anciennes notifications résiduelles au lancement
    nettoyerNotifications();

    const timer = setTimeout(async () => {
      await SplashScreen.hideAsync();
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <MarcheursProvider>
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#2D7D46' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
          headerBackTitle: 'Retour',
        }}>
        <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Main" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Carte" component={MapScreen} options={{ title: 'Carte des marcheurs' }} />
        <Stack.Screen name="Parcours" component={ParcoursScreen} options={{ title: 'Parcours validés' }} />
        <Stack.Screen name="Activite" component={ActivityScreen} options={{ title: 'Mon activité' }} />
        <Stack.Screen name="Buddy" component={BuddyScreen} options={{ title: 'Marchons ensemble' }} />
        <Stack.Screen name="Evenements" component={EvenementsScreen} options={{ title: 'Événements à proximité' }} />
        <Stack.Screen name="Invitations" component={InvitationScreen} options={{ title: 'Mes invitations' }} />
        <Stack.Screen name="Nutrition" component={NutritionScreen} options={{ title: 'Nutrition' }} />
        <Stack.Screen name="Recettes" component={RecipesScreen} options={{ title: 'Recettes' }} />
        <Stack.Screen name="Profil" component={ProfileScreen} options={{ title: 'Mon profil' }} />
        <Stack.Screen name="Coach" component={CoachScreen} options={{ title: 'Coach Kroki' }} />
        <Stack.Screen name="SOS" component={SOSScreen} options={{ title: 'SOS Urgence' }} />
        <Stack.Screen name="Messages" component={MessagesScreen} options={{ headerShown: false }} />
        <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ParcoursDetail" component={ParcoursDetailScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
   </NavigationContainer>
    </MarcheursProvider>
  );
}