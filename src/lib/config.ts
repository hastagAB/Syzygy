export const CELESTRAK_BASE_URL =
  process.env.CELESTRAK_BASE_URL ?? "https://celestrak.org/NORAD/elements/gp.php";

export const NOMINATIM_BASE_URL =
  process.env.NOMINATIM_BASE_URL ?? "https://nominatim.openstreetmap.org";

export const NOMINATIM_USER_AGENT =
  process.env.NOMINATIM_USER_AGENT ?? "Syzygy/1.0 (satellite-transit-finder)";

export const DEFAULT_COARSE_INTERVAL_SEC = Number(
  process.env.DEFAULT_COARSE_INTERVAL_SEC ?? 10,
);

export const DEFAULT_FINE_INTERVAL_SEC = Number(
  process.env.DEFAULT_FINE_INTERVAL_SEC ?? 0.1,
);

export const DEFAULT_CANDIDATE_THRESHOLD_DEG = Number(
  process.env.DEFAULT_CANDIDATE_THRESHOLD_DEG ?? 5,
);

export const DEFAULT_RADIUS_KM = Number(process.env.DEFAULT_RADIUS_KM ?? 100);

export const DEFAULT_DATE_RANGE_DAYS = Number(process.env.DEFAULT_DATE_RANGE_DAYS ?? 30);

export const MAX_DATE_RANGE_DAYS = Number(process.env.MAX_DATE_RANGE_DAYS ?? 90);

export const MIN_RADIUS_KM = Number(process.env.MIN_RADIUS_KM ?? 10);

export const MAX_RADIUS_KM = Number(process.env.MAX_RADIUS_KM ?? 500);

export const GRID_SPACING_KM = Number(process.env.GRID_SPACING_KM ?? 2);

export const TLE_CACHE_TTL_MS = Number(process.env.TLE_CACHE_TTL_MS ?? 7_200_000);

export const EARTH_RADIUS_KM = 6371;

export const MIN_TARGET_ALTITUDE_DEG = 5;

/** Default satellite size for angular diameter calculation (ISS ~109m) */
export const DEFAULT_SATELLITE_SIZE_METERS = 109;
