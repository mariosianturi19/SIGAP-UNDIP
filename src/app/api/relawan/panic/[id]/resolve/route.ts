// src/app/api/relawan/panic/[id]/resolve/route.ts
import { NextRequest, NextResponse } from "next/server";

// POST - Resolve Panic Report (Relawan)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get("Authorization");
    
    if (!authHeader) {
      return NextResponse.json(
        { message: "Authorization header is required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const panicId = params.id;

    console.log(`Resolving panic report ${panicId}:`, body);
    
    const response = await fetch(`https://sigap-api-5hk6r.ondigitalocean.app/api/relawan/panic/${panicId}/resolve`, {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(body),
    });

    const responseText = await response.text();
    console.log(`Resolve panic ${panicId} response:`, responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse response as JSON:", e);
      return NextResponse.json(
        { message: "Invalid response from server" },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Resolve panic error:", error);
    return NextResponse.json(
      { message: "An error occurred while resolving panic report" },
      { status: 500 }
    );
  }
}