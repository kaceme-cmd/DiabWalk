import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from './screens/HomeScreen';
import MapScreen from './screens/MapScreen';
import NutritionScreen from './screens/NutritionScreen';
import RecipesScreen from './screens/RecipesScreen';
import AuthScreen from './screens/AuthScreen';
import MessagesScreen from './screens/MessagesScreen';
import ProfileScreen from './screens/ProfileScreen';
import ActivityScreen from './screens/ActivityScreen';
import BuddyScreen from './screens/BuddyScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2D7D46',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#eee',
          paddingBottom: 20,
          height: 80,
        },
        tabBarIcon: () => null,
        tabBarIconStyle: { display: 'none' },
        tabBarLabelStyle: { fontSize: 13, fontWeight: '600' },
      }}>
      <Tab.Screen name="Accueil" component={HomeScreen} />
      <Tab.Screen name="Buddy" component={BuddyScreen} />
      <Tab.Screen name="Carte" component={MapScreen} />
      <Tab.Screen name="Activite" component={ActivityScreen} />
      <Tab.Screen name="Profil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="Messages" component={MessagesScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}