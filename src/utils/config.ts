import Constants from 'expo-constants';
import { Platform } from 'react-native';

function getExtra(): any {
  // Support multiple environments (Expo Go, EAS, Web)
  const c: any = Constants as any;
  return c?.expoConfig?.extra ?? c?.manifestExtra ?? c?.extra ?? {};
}

export const EXTRA = getExtra();

function resolveApiBaseUrl(): string {
  let url = (EXTRA.apiBaseUrl as string) || 'http://localhost:5000/api';

  // On native, localhost refers to the device/emulator. Try to use the Expo host IP.
  if (Platform.OS !== 'web') {
    try {
      const c: any = Constants as any;
      const hostUri: string | undefined = c?.expoConfig?.hostUri || c?.manifest?.hostUri || c?.hostUri;
      // hostUri often looks like "192.168.1.5:19000" or "exp://192.168.1.5:19000"
      if (hostUri && /localhost|127\.0\.0\.1/.test(url)) {
        const withoutScheme = hostUri.replace(/^.*:\/\//, '');
        const hostPart = withoutScheme.split(':')[0];
        if (hostPart && /\d+\.\d+\.\d+\.\d+/.test(hostPart)) {
          // Keep the same API path
          const path = url.replace(/^https?:\/\/[^/]+/, '');
          url = `http://${hostPart}${path}`;
        }
      }
    } catch {}
  }
  return url;
}

export const API_BASE_URL: string = resolveApiBaseUrl();
export const FORCE_LOGOUT_ON_START: boolean = !!EXTRA.forceLogoutOnStart;
export const DEMO_AUTH_ENABLED: boolean =
  typeof (EXTRA.demoAuthEnabled) !== 'undefined'
    ? !!EXTRA.demoAuthEnabled
    : (typeof __DEV__ !== 'undefined' ? __DEV__ : false);
export const DEMO_EMAIL: string = (EXTRA.demoEmail as string) || 'demo@gmail.com';
export const DEMO_PASSWORD: string = (EXTRA.demoPassword as string) || 'demo123';
