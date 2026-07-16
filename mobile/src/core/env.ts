/**
 * Environment configuration.
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

const DEV_API_URL = __DEV__
  ? `http://${PHYSICAL_DEVICE_IP}:8000`
  : 'https://your-production-api.com'; // ← replace with production URL when deploying

export const ENV = {
  API_BASE_URL: DEV_API_URL,
  IS_DEV: __DEV__,
  REQUEST_TIMEOUT_MS: 10_000,
} as const;
