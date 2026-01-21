// src/app/api/password/reset/route.ts
import { NextRequest, NextResponse } from "next/server";
import { buildApiUrl } from "@/lib/apiConfig";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.email || !body.otp || !body.password || !body.password_confirmation) {
      return NextResponse.json(
        { message: "Email, OTP, password, and password confirmation are required" },
        { status: 400 }
      );
    }

    if (body.password !== body.password_confirmation) {
      return NextResponse.json(
        { message: "Passwords do not match" },
        { status: 400 }
      );
    }

    if (body.password.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    console.log("Resetting password for:", body.email);
    
    const apiUrl = buildApiUrl("/password/reset");
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        email: body.email,
        otp: body.otp,
        password: body.password,
        password_confirmation: body.password_confirmation
      }),
    });

    const responseText = await response.text();
    console.log("Reset password response:", responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse reset password response:", e);
      return NextResponse.json(
        { message: "Invalid response from server" },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { message: "An error occurred while resetting password" },
      { status: 500 }
    );
  }
}
