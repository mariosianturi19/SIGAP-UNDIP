// src/app/api/admin/panic/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { buildApiUrl, log, logError } from "@/lib/apiConfig";

// DELETE - Delete single panic report (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get("Authorization");

    if (!authHeader) {
      return NextResponse.json(
        { message: "Authorization header is required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    log("Deleting panic report:", id);

    const apiUrl = buildApiUrl(`/admin/panic/${id}`);
    const response = await fetch(apiUrl, {
      method: "DELETE",
      headers: {
        "Authorization": authHeader,
        "Accept": "application/json",
      },
    });

    const responseText = await response.text();
    log("External API delete panic response:", responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      logError("Failed to parse delete panic response as JSON:", e);
      return NextResponse.json(
        { message: "Invalid response from server" },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    logError("Delete panic report error:", error);
    return NextResponse.json(
      { message: "An error occurred while deleting panic report" },
      { status: 500 }
    );
  }
}
