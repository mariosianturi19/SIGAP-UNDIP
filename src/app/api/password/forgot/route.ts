// src/app/api/password/forgot/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    console.log("[FORGOT PASSWORD] Requesting OTP for:", body.email);
    console.log("[FORGOT PASSWORD] Timestamp:", new Date().toISOString());
    
    // Add timeout untuk prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://sigap-undip-api-bda67d2f2eb2.herokuapp.com/";
      const response = await fetch(`${apiUrl}api/password/forgot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ email: body.email }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseText = await response.text();
      console.log("[FORGOT PASSWORD] Response status:", response.status);
      console.log("[FORGOT PASSWORD] Response body:", responseText.substring(0, 500));
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("[FORGOT PASSWORD] Failed to parse response:", e);
        console.error("[FORGOT PASSWORD] Raw response:", responseText);
        return NextResponse.json(
          { 
            message: "Invalid response from server. Please try again.",
            debug: responseText.substring(0, 200)
          },
          { status: 500 }
        );
      }

      // Log success/failure
      if (response.ok) {
        console.log("[FORGOT PASSWORD] ✅ OTP sent successfully to:", body.email);
      } else {
        console.error("[FORGOT PASSWORD] ❌ Failed to send OTP:", data.message || "Unknown error");
      }

      return NextResponse.json(data, { status: response.status });
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error("[FORGOT PASSWORD] ⏱️ Request timeout after 30 seconds");
        return NextResponse.json(
          { 
            message: "Request timeout. Email server is slow. Please try again.",
            timeout: true
          },
          { status: 504 }
        );
      }
      
      throw fetchError;
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : "";
    console.error("[FORGOT PASSWORD] ❌ Error:", errorMessage);
    console.error("[FORGOT PASSWORD] Stack:", errorStack);
    
    return NextResponse.json(
      { 
        message: "An error occurred while sending OTP. Please check your internet connection and try again.",
        error: errorMessage 
      },
      { status: 500 }
    );
  }
}
