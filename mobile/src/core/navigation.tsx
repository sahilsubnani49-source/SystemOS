import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { Colors, Fonts } from './theme';
import { DashboardScreen } from '../presentation/screens/DashboardScreen';
import { CampaignScreen } from '../presentation/screens/CampaignScreen';
import { QuestsScreen } from '../presentation/screens/QuestsScreen';
import { InventoryScreen } from '../presentation/screens/InventoryScreen';
import { StatsScreen } from '../presentation/screens/StatsScreen';
import { TrainingScreen } from '../presentation/screens/TrainingScreen';
import { SettingsScreen } from '../presentation/screens/SettingsScreen';

export type RootStackParamList = {
  Main: undefined;
  Inventory: undefined;
};

export type BottomTabParamList = {
  Dashboard: undefined;
  Campaign: undefined;
  Quests: undefined;
  Stats: undefined;
  Army: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<BottomTabParamList>();

const TAB_ICONS: Record<string, string> = {
  Dashboard: '🏠',
  Campaign: '🎯',
  Quests: '⚔️',
  Stats: '📊',
  Army: '🏋️',
  Settings: '⚙️',
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.surfaceBorder,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        // Press Start 2P glyphs are ~1em wide: with 7 tabs (~56pt each) labels
        // must stay ≤6 chars at 7pt or they truncate.
        tabBarLabelStyle: { fontFamily: Fonts.pixel, fontSize: 7 },
        tabBarIcon: ({ focused }) => (
          <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>
            {TAB_ICONS[route.name]}
          </Text>
        ),
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="Campaign" component={CampaignScreen} options={{ title: 'Camp' }} />
      <Tab.Screen name="Quests" component={QuestsScreen} options={{ title: 'Quests' }} />
      <Tab.Screen name="Stats" component={StatsScreen} options={{ title: 'Stats' }} />
      <Tab.Screen name="Army" component={TrainingScreen} options={{ title: 'Army' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'System' }} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen
          name="Inventory"
          component={InventoryScreen}
          options={{
            headerShown: true,
            title: 'INVENTORY',
            headerStyle: { backgroundColor: Colors.surface },
            headerTintColor: Colors.primary,
            headerTitleStyle: { fontFamily: Fonts.pixel, fontSize: 12, color: Colors.textPrimary },
            headerBackTitle: 'Back',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
