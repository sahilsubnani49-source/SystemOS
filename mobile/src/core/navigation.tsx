import React from 'react';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { Colors, Fonts } from './theme';
import { DashboardScreen } from '../presentation/screens/DashboardScreen';
import { CampaignScreen } from '../presentation/screens/CampaignScreen';
import { QuestsScreen } from '../presentation/screens/QuestsScreen';
import { InventoryScreen } from '../presentation/screens/InventoryScreen';
import { TaskDetailScreen } from '../presentation/screens/TaskDetailScreen';
import { StatsScreen } from '../presentation/screens/StatsScreen';
import { TrainingScreen } from '../presentation/screens/TrainingScreen';
import { SettingsScreen } from '../presentation/screens/SettingsScreen';
import { KotodamaScreen } from '../presentation/screens/KotodamaScreen';
import { LoginScreen } from '../presentation/screens/LoginScreen';
import { SignupScreen } from '../presentation/screens/SignupScreen';
import { useAuthStore } from '../presentation/stores/useAuthStore';

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Main: undefined;
  Inventory: undefined;
  TaskDetail: { categoryId: string };
  /** The Kotodama game, opened from the Stats-tab portal. */
  Kotodama: undefined;
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
        sceneStyle: { backgroundColor: 'transparent' },
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
          <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{TAB_ICONS[route.name]}</Text>
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

// Shared header for stack screens pushed over the tabs (Inventory, TaskDetail).
const detailHeader = {
  headerShown: true,
  headerStyle: { backgroundColor: Colors.surface },
  headerTintColor: Colors.primary,
  headerTitleStyle: {
    fontFamily: Fonts.pixel,
    fontSize: 12,
    color: Colors.textPrimary,
  },
  headerBackTitle: 'Back',
} as const;

// Transparent scene background so the SpaceBackground mounted in App.tsx
// stays visible behind every screen.
const spaceTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: 'transparent',
    card: Colors.surface,
    primary: Colors.primary,
    text: Colors.textPrimary,
    border: Colors.surfaceBorder,
  },
};

export function AppNavigator() {
  // Declarative auth gate: swapping which screens are registered lets React
  // Navigation switch stacks automatically — no imperative navigate() on
  // login/logout. While status is 'unknown', bootstrap still shows its splash,
  // so render nothing here to avoid a flash of the wrong stack.
  const status = useAuthStore((s) => s.status);

  return (
    <NavigationContainer theme={spaceTheme}>
      <Stack.Navigator
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}
      >
        {status === 'unknown' ? null : status === 'loggedIn' ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="Inventory"
              component={InventoryScreen}
              options={{ ...detailHeader, title: 'INVENTORY' }}
            />
            <Stack.Screen
              name="TaskDetail"
              component={TaskDetailScreen}
              options={{ ...detailHeader, title: 'TASK' }}
            />
            <Stack.Screen
              name="Kotodama"
              component={KotodamaScreen}
              options={{ presentation: 'fullScreenModal', headerShown: false, animation: 'fade' }}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
