import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';

import HomeScreen from './screens/HomeScreen';
import MapScreen from './screens/MapScreen';
import NutritionScreen from './screens/NutritionScreen';
import RecipesScreen from './screens/RecipesScreen';
import AuthScreen from './screens/AuthScreen';
import MessagesScreen from './screens/MessagesScreen';
import ProfileScreen from './screens/ProfileScreen';
import ActivityScreen from './screens/ActivityScreen';

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
      }}>
      <Tab.Screen
        name="Accueil"
        component={HomeScreen}
        options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>🏠</Text> }}
      />
      <Tab.Screen
        name="Carte"
        component={MapScreen}
        options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>🗺️</Text> }}
      />
      <Tab.Screen
        name="Activite"
        component={ActivityScreen}
        options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>🏅</Text> }}
      />
      <Tab.Screen
        name="Nutrition"
        component={NutritionScreen}
        options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>🥗</Text> }}
      />
      <Tab.Screen
        name="Recettes"
        component={RecipesScreen}
        options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>👨‍🍳</Text> }}
      />
      <Tab.Screen
        name="Profil"
        component={ProfileScreen}
        options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>👤</Text> }}
      />
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