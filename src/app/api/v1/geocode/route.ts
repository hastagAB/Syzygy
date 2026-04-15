import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { geocodeAddress, reverseGeocode } from "@/lib/data/geocoder";

const GeocodeQuerySchema = z.object({
  q: z.string().min(1).max(200).optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lon: z.coerce.number().min(-180).max(180).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const parsed = GeocodeQuerySchema.safeParse(params);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid query parameters",
            details: parsed.error.issues,
          },
        },
        { status: 400 },
      );
    }

    const { q, lat, lon } = parsed.data;

    if (q) {
      const result = await geocodeAddress(q);
      if (!result.ok) {
        return NextResponse.json(
          {
            error: {
              code: "GEOCODE_NOT_FOUND",
              message: result.error,
              details: null,
            },
          },
          { status: 404 },
        );
      }
      return NextResponse.json(result.value);
    }

    if (lat !== undefined && lon !== undefined) {
      const result = await reverseGeocode({ lat, lon });
      if (!result.ok) {
        return NextResponse.json(
          {
            error: {
              code: "REVERSE_GEOCODE_ERROR",
              message: result.error,
              details: null,
            },
          },
          { status: 502 },
        );
      }
      return NextResponse.json({ lat, lon, displayName: result.value });
    }

    return NextResponse.json(
      {
        error: {
          code: "MISSING_PARAMS",
          message: "Provide either 'q' for forward geocoding or 'lat'+'lon' for reverse",
          details: null,
        },
      },
      { status: 400 },
    );
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
