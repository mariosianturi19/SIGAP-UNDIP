// src/app/api/password/verify-otp/route.ts
import { NextRequest, NextResponse } from "next/server";
import { buildApiUrl } from "@/lib/apiConfig";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.email || !body.otp) {
      return NextResponse.json(
        { message: "Email and OTP are required" },
        { status: 400 }
      );
    }

    console.log("Verifying OTP for:", body.email);
    
    const apiUrl = buildApiUrl("/password/verify-otp");
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        email: body.email,
        otp: body.otp
      }),
    });

    const responseText = await response.text();
    console.log("Verify OTP response:", responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse verify OTP response:", e);
      return NextResponse.json(
        { message: "Invalid response from server" },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { message: "An error occurred while verifying OTP" },
      { status: 500 }
    );
  }
}
