// src/app/api/password/resend-otp/route.ts
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

    console.log("[RESEND OTP] Resending OTP for:", body.email);
    console.log("[RESEND OTP] Timestamp:", new Date().toISOString());
    
    // Add timeout untuk prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch("https://sigap-api-5hk6r.ondigitalocean.app/api/password/resend-otp", {
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
      console.log("[RESEND OTP] Response status:", response.status);
      console.log("[RESEND OTP] Response body:", responseText.substring(0, 500));
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("[RESEND OTP] Failed to parse response:", e);
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
        console.log("[RESEND OTP] ✅ OTP resent successfully to:", body.email);
      } else {
        console.error("[RESEND OTP] ❌ Failed to resend OTP:", data.message || "Unknown error");
      }

      return NextResponse.json(data, { status: response.status });
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error("[RESEND OTP] ⏱️ Request timeout after 30 seconds");
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
    console.error("[RESEND OTP] ❌ Error:", errorMessage);
    console.error("[RESEND OTP] Stack:", errorStack);
    
    return NextResponse.json(
      { 
        message: "An error occurred while resending OTP. Please try again.",
        error: errorMessage 
      },
      { status: 500 }
    );
  }
}
