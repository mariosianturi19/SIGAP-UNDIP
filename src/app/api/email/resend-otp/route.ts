import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://sigap-undip-api-bda67d2f2eb2.herokuapp.com/";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    console.log(`[RESEND EMAIL OTP] ${new Date().toISOString()} - Starting resend OTP...`);
    console.log("[RESEND EMAIL OTP] Email:", email);

    // Validation
    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout

    try {
      const response = await fetch(`${API_BASE_URL}api/email/resend-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (response.ok) {
        console.log(`[RESEND EMAIL OTP] ${new Date().toISOString()} - ✅ OTP sent successfully`);
        return NextResponse.json(data, { status: 200 });
      } else {
        console.log(`[RESEND EMAIL OTP] ${new Date().toISOString()} - ❌ Failed:`, data.message);
        return NextResponse.json(
          { message: data.message || "Failed to send OTP" },
          { status: response.status }
        );
      }
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);

      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        console.error(`[RESEND EMAIL OTP] ${new Date().toISOString()} - ⏱️ Request timeout after 30 seconds`);
        return NextResponse.json(
          {
            message: "Request timeout. Please try again.",
            timeout: true,
          },
          { status: 408 }
        );
      }

      throw fetchError;
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`[RESEND EMAIL OTP] ${new Date().toISOString()} - ❌ Error:`, errorMessage);
    return NextResponse.json(
      { message: "Failed to resend OTP. Please try again." },
      { status: 500 }
    );
  }
}
