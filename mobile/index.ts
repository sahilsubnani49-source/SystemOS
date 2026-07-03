// MUST be the first import: polyfills global.crypto.getRandomValues so the `uuid`
// package works under Hermes (otherwise uuidv4() throws "property 'crypto' doesn't exist").
import 'react-native-get-random-values';

import { registerRootComponent } from 'expo';

// Must be imported at module level so TaskManager.defineTask runs before any component mounts
import './src/core/backgroundTasks';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
