/**
 * Build-time configuration. EXPO_PUBLIC_* values are inlined by Expo at build
 * time; eas.json sets them per profile. The fallback is production so a build
 * without an explicit profile still talks to the real API rather than nothing.
 */
const DEFAULT_API_BASE_URL = "https://pics.consummate7.com/api";

export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, "");

/** How often the duty screen sends a location ping while checked in. */
export const LOCATION_PING_INTERVAL_MS = 5 * 60 * 1000;

/** Election-day report photos are limited by the API to 2 MB. */
export const REPORT_PHOTO_MAX_BYTES = 2 * 1024 * 1024;

/** The API requires exactly this many vote entries, each for a different party. */
export const VOTE_ENTRY_COUNT = 5;
