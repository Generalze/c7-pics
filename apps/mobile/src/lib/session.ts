import * as SecureStore from "expo-secure-store";
import type { AuthUserProfile } from "./types";

const TOKEN_KEY = "pics.session.token";
const USER_KEY = "pics.session.user";

/**
 * The bearer token and a cached copy of the profile live in the device
 * keystore. The password is never stored anywhere.
 */
export async function readStoredSession(): Promise<{ token: string; user: AuthUserProfile } | null> {
  try {
    const [token, userJson] = await Promise.all([
      SecureStore.getItemAsync(TOKEN_KEY),
      SecureStore.getItemAsync(USER_KEY),
    ]);
    if (!token || !userJson) {
      return null;
    }
    return { token, user: JSON.parse(userJson) as AuthUserProfile };
  } catch {
    return null;
  }
}

export async function writeStoredSession(token: string, user: AuthUserProfile): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(TOKEN_KEY, token),
    SecureStore.setItemAsync(USER_KEY, JSON.stringify(user)),
  ]);
}

export async function clearStoredSession(): Promise<void> {
  await Promise.all([SecureStore.deleteItemAsync(TOKEN_KEY), SecureStore.deleteItemAsync(USER_KEY)]);
}
