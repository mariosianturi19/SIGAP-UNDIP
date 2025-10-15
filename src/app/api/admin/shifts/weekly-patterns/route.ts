// src/app/api/admin/shifts/weekly-patterns/route.ts
import { NextRequest, NextResponse } from "next/server";
import { buildApiUrl, log, logError } from "@/lib/apiConfig";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    
    if (!authHeader) {
      return NextResponse.json(
        { message: "Authorization header is required" },
        { status: 401 }
      );
    }

    log("Fetching weekly patterns");

    const response = await fetch(buildApiUrl("/admin/shifts/weekly-patterns"), {
      method: "GET",
      headers: {
        "Authorization": authHeader,
        "Accept": "application/json",
      },
    });

    const responseText = await response.text();
    log("Weekly patterns response:", responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      logError("Failed to parse response as JSON:", e);
      return NextResponse.json(
        { message: "Invalid response from server" },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    logError("Get weekly patterns error:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching weekly patterns" },
      { status: 500 }
    );
  }
}