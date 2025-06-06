// src/app/api/panic/[id]/status/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
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

    // Validate required fields
    if (!body.status) {
      return NextResponse.json(
        { message: "Status is required" },
        { status: 400 }
      );
    }

    // Validate status values
    const validStatuses = ['handling', 'resolved'];
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json(
        { message: "Invalid status. Must be 'handling' or 'resolved'" },
        { status: 400 }
      );
    }

    console.log(`Updating panic ${panicId} status:`, body);
    
    const response = await fetch(`https://sigap-api-5hk6r.ondigitalocean.app/api/panic/${panicId}/status`, {
      method: "PUT",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(body),
    });

    const responseText = await response.text();
    console.log(`Update panic ${panicId} status response:`, responseText);
    
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
    console.error("Update panic status error:", error);
    return NextResponse.json(
      { message: "An error occurred while updating panic status" },
      { status: 500 }
    );
  }
}