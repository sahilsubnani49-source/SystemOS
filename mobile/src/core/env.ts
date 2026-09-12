/**
 * Environment configuration.
 *
 * Dev builds talk to a backend on your machine; release builds talk to Cloud Run.
 *
 * On a simulator/emulator, localhost resolves to the host machine.
 * On a physical device, replace PHYSICAL_DEVICE_IP with your machine's
 * local network IP (e.g. 192.168.1.42).
 *
 * Find your IP:
 *   macOS: System Settings → Wi-Fi → Details
 *   Linux: ip addr show
 *   Windows: ipconfig
 */

// iOS simulator talks to the host machine via plain "localhost".
// Android emulator needs "10.0.2.2" to reach the host.
// For a physical device on Wi-Fi, set PHYSICAL_DEVICE_IP to your Mac's local IP.
const PHYSICAL_DEVICE_IP = 'localhost';

// Release builds read the Cloud Run service URL from EXPO_PUBLIC_API_URL, which the
// babel preset inlines as a literal string at bundle time. It comes from the `env`
// block of the active eas.json build profile (or a local .env for `expo start`), so
// staging and production binaries ship different URLs without a code change.
const PROD_API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!__DEV__ && !PROD_API_URL) {
  // Fail loudly at startup rather than shipping a binary that silently treats every
  // request as "offline" and never leaves rule-based fallback mode.
  throw new Error(
    'EXPO_PUBLIC_API_URL is not set. Add it to the eas.json build profile before building for release.',
  );
}

const API_BASE_URL = __DEV__ ? `http://${PHYSICAL_DEVICE_IP}:8000` : PROD_API_URL!;

export const ENV = {
  API_BASE_URL,
  IS_DEV: __DEV__,
  REQUEST_TIMEOUT_MS: 10_000,
} as const;
