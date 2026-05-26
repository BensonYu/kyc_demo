import { StatusBar } from 'expo-status-bar';
import 'react-native-worklets';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { KycApp } from './src/KycApp';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <KycApp />
    </SafeAreaProvider>
  );
}
