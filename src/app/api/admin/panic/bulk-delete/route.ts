// src/app/api/admin/panic/bulk-delete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { buildApiUrl, log, logError } from "@/lib/apiConfig";

// POST - Bulk delete panic reports by date range (Admin only)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");

    if (!authHeader) {
      return NextResponse.json(
        { message: "Authorization header is required" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.start_date || !body.end_date) {
      return NextResponse.json(
        { message: "start_date and end_date are required" },
        { status: 400 }
      );
    }

    log("Bulk deleting panic reports:", body);

    const apiUrl = buildApiUrl("/admin/panic/bulk-delete");
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        start_date: body.start_date,
        end_date: body.end_date,
        status: body.status,
      }),
    });

    const responseText = await response.text();
    log("External API bulk delete panic response:", responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      logError("Failed to parse bulk delete panic response as JSON:", e);
      return NextResponse.json(
        { message: "Invalid response from server" },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    logError("Bulk delete panic reports error:", error);
    return NextResponse.json(
      { message: "An error occurred while bulk deleting panic reports" },
      { status: 500 }
    );
  }
}
