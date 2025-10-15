// src/app/api/volunteer/reports/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { buildApiUrl, log, logError } from "@/lib/apiConfig";

// PATCH - Update status laporan oleh volunteer
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params karena sekarang berupa Promise
    const { id } = await params;
    
    const authHeader = request.headers.get("Authorization");
    
    if (!authHeader) {
      return NextResponse.json(
        { message: "Authorization header is required" },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const reportId = id;
    log(`Updating report ${reportId} with:`, body);

    const response = await fetch(buildApiUrl(`/reports/${reportId}`), {
      method: "PATCH",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(body),
    });
    
    const responseText = await response.text();
    log(`Update report ${reportId} response:`, responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      logError("Failed to parse update response as JSON:", e);
      return NextResponse.json(
        { message: "Invalid response from server" },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    logError("Update report error:", error);
    return NextResponse.json(
      { message: "An error occurred while updating report" },
      { status: 500 }
    );
  }
}