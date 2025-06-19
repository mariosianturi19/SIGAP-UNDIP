// src/app/api/relawan/panic/[id]/handle/route.ts
import { NextRequest, NextResponse } from "next/server";

// POST - Handle Panic Report (Relawan)
export async function POST(
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
    const panicId = id;

    console.log(`Handling panic report ${panicId}:`, body);
    
    const response = await fetch(`https://sigap-api-5hk6r.ondigitalocean.app/api/relawan/panic/${panicId}/handle`, {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(body),
    });

    const responseText = await response.text();
    console.log(`Handle panic ${panicId} response:`, responseText);
    
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
    console.error("Handle panic error:", error);
    return NextResponse.json(
      { message: "An error occurred while handling panic report" },
      { status: 500 }
    );
  }
}