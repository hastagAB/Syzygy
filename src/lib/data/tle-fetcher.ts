import { CELESTRAK_BASE_URL, NOMINATIM_USER_AGENT } from "@/lib/config";
import type { TLERecord } from "@/types";

export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

/**
 * Parse TLE epoch (YYDDD.DDDDDDDD) into a JS Date.
 * Field 1.7 = 2-digit year, Field 1.8 = fractional day of year.
 */
function parseEpoch(line1: string): Date {
  const epochStr = line1.substring(18, 32).trim();
  const year2 = parseInt(epochStr.substring(0, 2), 10);
  const dayFraction = parseFloat(epochStr.substring(2));

  // NORAD convention: 57-99 = 1957-1999, 00-56 = 2000-2056
  const year = year2 >= 57 ? 1900 + year2 : 2000 + year2;

  const jan1 = new Date(Date.UTC(year, 0, 1));
  const epochMs = jan1.getTime() + (dayFraction - 1) * 86_400_000;
  return new Date(epochMs);
}

/** Extract NORAD catalog number from TLE line 1 */
function parseNoradId(line1: string): number {
  return parseInt(line1.substring(2, 7).trim(), 10);
}

/** Validate a TLE line has the right length and line number */
function isValidTleLine(line: string, lineNum: 1 | 2): boolean {
  return line.length >= 69 && line.charAt(0) === String(lineNum);
}

/**
 * Parse raw 3-line TLE text into structured TLERecord objects.
 * Handles single or multiple satellites in one text block.
 */
export function parseTleText(text: string): TLERecord[] {
  const lines = text.trim().split("\n").map((l) => l.trim()).filter(Boolean);
  const records: TLERecord[] = [];

  let i = 0;
  while (i < lines.length) {
    // Look for a line that starts with "1 " (TLE line 1)
    if (lines[i].startsWith("1 ") && i + 1 < lines.length && lines[i + 1].startsWith("2 ")) {
      // No name line - just line1 and line2
      const line1 = lines[i];
      const line2 = lines[i + 1];
      if (isValidTleLine(line1, 1) && isValidTleLine(line2, 2)) {
        records.push({
          name: `NORAD ${parseNoradId(line1)}`,
          noradId: parseNoradId(line1),
          line1,
          line2,
          epoch: parseEpoch(line1),
        });
      }
      i += 2;
    } else if (
      !lines[i].startsWith("1 ") &&
      !lines[i].startsWith("2 ") &&
      i + 2 < lines.length
    ) {
      // Name line + line1 + line2
      const name = lines[i];
      const line1 = lines[i + 1];
      const line2 = lines[i + 2];
      if (isValidTleLine(line1, 1) && isValidTleLine(line2, 2)) {
        records.push({
          name,
          noradId: parseNoradId(line1),
          line1,
          line2,
          epoch: parseEpoch(line1),
        });
        i += 3;
      } else {
        i += 1;
      }
    } else {
      i += 1;
    }
  }

  return records;
}

/**
 * Fetch TLE data for a satellite from CelesTrak by NORAD ID.
 */
export async function fetchTle(noradId: number): Promise<Result<TLERecord>> {
  try {
    const url = `${CELESTRAK_BASE_URL}?CATNR=${noradId}&FORMAT=TLE`;
    const response = await fetch(url, {
      headers: { "User-Agent": NOMINATIM_USER_AGENT },
    });

    if (!response.ok) {
      return {
        ok: false,
        error: `CelesTrak returned HTTP ${response.status} for NORAD ID ${noradId}`,
      };
    }

    const text = await response.text();
    const records = parseTleText(text);

    if (records.length === 0) {
      return {
        ok: false,
        error: `No valid TLE data found for NORAD ID ${noradId}`,
      };
    }

    return { ok: true, value: records[0] };
  } catch (err) {
    return {
      ok: false,
      error: `Failed to fetch TLE for NORAD ID ${noradId}: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
