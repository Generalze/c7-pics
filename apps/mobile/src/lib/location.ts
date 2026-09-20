import * as Location from "expo-location";
import type { Coordinates } from "./types";

export class LocationPermissionError extends Error {
  constructor() {
    super("Location permission is required to record where you are. Enable it in your phone settings.");
    this.name = "LocationPermissionError";
  }
}

/**
 * Asks for foreground location permission if needed and returns a fresh fix.
 * Accuracy is passed through so the server can gate geofence decisions on it.
 */
export async function getCurrentCoordinates(): Promise<Coordinates> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    throw new LocationPermissionError();
  }
  const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  const accuracy = position.coords.accuracy;
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    // The API rejects non-positive accuracy and anything above 5 km.
    ...(accuracy && accuracy > 0 && accuracy <= 5000 ? { accuracyMeters: accuracy } : {}),
  };
}

export function formatCoordinates(
  coordinates: { latitude: number; longitude: number; accuracyMeters?: number | null } | null | undefined,
): string {
  if (!coordinates) return "no fix";
  const accuracy = coordinates.accuracyMeters ? ` (±${Math.round(coordinates.accuracyMeters)} m)` : "";
  return `${coordinates.latitude.toFixed(5)}, ${coordinates.longitude.toFixed(5)}${accuracy}`;
}
