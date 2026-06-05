import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import HomeScreen from './screens/HomeScreen';
import MapScreen from './screens/MapScreen';
import NutritionScreen from './screens/NutritionScreen';
import RecipesScreen from './screens/RecipesScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#2D7D46',
          tabBarInactiveTintColor: '#888',
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopColor: '#eee',
            paddingBottom: 5,
            height: 60,
          },
        }}>
        <Tab.Screen
          name="Accueil"
          component={HomeScreen}
          options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🏠</Text> }}
        />
        <Tab.Screen
          name="Carte"
          component={MapScreen}
          options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🗺️</Text> }}
        />
        <Tab.Screen
          name="Nutrition"
          component={NutritionScreen}
          options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🥗</Text> }}
        />
        <Tab.Screen
          name="Recettes"
          component={RecipesScreen}
          options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>👨‍🍳</Text> }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}