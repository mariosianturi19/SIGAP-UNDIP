import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = "https://sigap-api-5hk6r.ondigitalocean.app/api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp } = body;

    console.log("[VERIFY EMAIL OTP] Starting verification...");
    console.log("[VERIFY EMAIL OTP] Email:", email);
    console.log("[VERIFY EMAIL OTP] OTP length:", otp?.length);

    // Validation
    if (!email || !otp) {
      return NextResponse.json(
        { message: "Email and OTP are required" },
        { status: 400 }
      );
    }

    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { message: "OTP must be 6 digits" },
        { status: 400 }
      );
    }

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout

    try {
      const response = await fetch(`${API_BASE_URL}/email/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (response.ok) {
        console.log("[VERIFY EMAIL OTP] ✅ Verification successful");
        return NextResponse.json(data, { status: 200 });
      } else {
        console.log("[VERIFY EMAIL OTP] ❌ Verification failed:", data.message);
        return NextResponse.json(
          { message: data.message || "Invalid or expired OTP" },
          { status: response.status }
        );
      }
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);

      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        console.error("[VERIFY EMAIL OTP] ⏱️ Request timeout after 30 seconds");
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
    console.error("[VERIFY EMAIL OTP] ❌ Error:", errorMessage);
    return NextResponse.json(
      { message: "Failed to verify OTP. Please try again." },
      { status: 500 }
    );
  }
}
