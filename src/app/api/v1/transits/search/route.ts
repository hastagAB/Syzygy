import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { searchTransits } from "@/lib/engine/search-orchestrator";
import { fetchTle } from "@/lib/data/tle-fetcher";
import { getSatelliteByNoradId } from "@/lib/data/satellite-catalog";
import { TleCache } from "@/lib/data/tle-cache";
import {
  MAX_DATE_RANGE_DAYS,
  MIN_RADIUS_KM,
  MAX_RADIUS_KM,
} from "@/lib/config";

const tleCache = new TleCache();

const SearchRequestSchema = z.object({
  location: z.object({
    lat: z.number().min(-90).max(90),
    lon: z.number().min(-180).max(180),
  }),
  dateRange: z.object({
    start: z.string().datetime(),
    end: z.string().datetime(),
  }),
  radiusKm: z.number().min(MIN_RADIUS_KM).max(MAX_RADIUS_KM),
  satellites: z.array(z.number().int().positive()).min(1).max(10),
  targets: z
    .array(z.enum(["sun", "moon"]))
    .min(1)
    .max(2),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = SearchRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request parameters",
            details: parsed.error.issues,
          },
        },
        { status: 400 },
      );
    }

    const { location, dateRange, radiusKm, satellites, targets } = parsed.data;

    // Validate date range
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    const rangeDays =
      (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000);

    if (rangeDays <= 0 || rangeDays > MAX_DATE_RANGE_DAYS) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_DATE_RANGE",
            message: `Date range must be between 1 and ${MAX_DATE_RANGE_DAYS} days`,
            details: null,
          },
        },
        { status: 400 },
      );
    }

    // Fetch TLEs for requested satellites
    const satelliteInputs = [];
    for (const noradId of satellites) {
      const catalogEntry = getSatelliteByNoradId(noradId);
      if (!catalogEntry) {
        return NextResponse.json(
          {
            error: {
              code: "UNKNOWN_SATELLITE",
              message: `Satellite with NORAD ID ${noradId} not found in catalog`,
              details: null,
            },
          },
          { status: 400 },
        );
      }

      let tle = tleCache.get(noradId);
      if (!tle) {
        const fetchResult = await fetchTle(noradId);
        if (!fetchResult.ok) {
          return NextResponse.json(
            {
              error: {
                code: "TLE_FETCH_ERROR",
                message: `Failed to fetch TLE for ${catalogEntry.name}`,
                details: null,
              },
            },
            { status: 502 },
          );
        }
        tle = {
          line1: fetchResult.value.line1,
          line2: fetchResult.value.line2,
        };
        tleCache.set(noradId, tle);
      }

      satelliteInputs.push({
        noradId,
        name: catalogEntry.name,
        line1: tle.line1,
        line2: tle.line2,
        sizeMeters: catalogEntry.sizeMeters,
      });
    }

    const result = searchTransits({
      observer: location,
      dateRange: { start, end },
      radiusKm,
      satellites: satelliteInputs,
      targets,
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
          details: null,
        },
      },
      { status: 500 },
    );
  }
}
