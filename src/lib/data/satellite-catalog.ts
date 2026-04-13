import type { SatelliteInfo } from "@/types/satellite";

export const SATELLITE_CATALOG: readonly SatelliteInfo[] = [
  {
    id: "iss",
    name: "ISS (ZARYA)",
    noradId: 25544,
    sizeMeters: 109,
    difficulty: "easy",
    description: "International Space Station - largest, easiest to spot",
  },
  {
    id: "hst",
    name: "HST (Hubble)",
    noradId: 20580,
    sizeMeters: 13.2,
    difficulty: "hard",
    description: "Hubble Space Telescope - small, hard to resolve",
  },
  {
    id: "tiangong",
    name: "CSS (Tiangong)",
    noradId: 48274,
    sizeMeters: 55,
    difficulty: "medium",
    description: "Chinese Space Station - medium size, moderate difficulty",
  },
] as const;

export function getSatelliteByNoradId(noradId: number): SatelliteInfo | undefined {
  return SATELLITE_CATALOG.find((s) => s.noradId === noradId);
}

export function getSatelliteById(id: string): SatelliteInfo | undefined {
  return SATELLITE_CATALOG.find((s) => s.id === id);
}
