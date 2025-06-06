// src/app/api/volunteers/route.ts
import { NextRequest, NextResponse } from "next/server";

// GET all volunteers
export async function GET(request: NextRequest) {
  try {
    // Get authorization header from the request
    const authHeader = request.headers.get("Authorization");
    
    if (!authHeader) {
      return NextResponse.json(
        { message: "Authorization header is required" },
        { status: 401 }
      );
    }

    console.log("Fetching volunteers with auth:", authHeader.substring(0, 20) + "...");

    // Use the correct API endpoint based on documentation
    const response = await fetch("https://sigap-api-5hk6r.ondigitalocean.app/api/admin/relawan", {
      method: "GET",
      headers: {
        "Authorization": authHeader,
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
    });

    console.log("External API response status:", response.status);
    console.log("External API response headers:", Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log("External API response text:", responseText);
    
    // Check if response is HTML (error page)
    if (responseText.includes('<!DOCTYPE html>') || responseText.includes('<html>')) {
      console.error("Received HTML instead of JSON, API endpoint might be wrong");
      return NextResponse.json(
        { message: "API endpoint not found or server error" },
        { status: 404 }
      );
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse volunteers response as JSON:", e);
      return NextResponse.json(
        { message: "Invalid JSON response from server", details: responseText.substring(0, 200) },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Volunteer fetch error:", error);
    const errorMessage = (error instanceof Error) ? error.message : String(error);
    return NextResponse.json(
      { message: "An error occurred while fetching volunteers", error: errorMessage },
      { status: 500 }
    );
  }
}

// POST create new volunteer
export async function POST(request: NextRequest) {
  try {
    // Get authorization header from the request
    const authHeader = request.headers.get("Authorization");
    
    if (!authHeader) {
      return NextResponse.json(
        { message: "Authorization header is required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log("Creating volunteer with data:", { ...body, password: "[HIDDEN]" });

    // Validate required fields
    const requiredFields = ['name', 'email', 'nik', 'no_telp', 'password'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { message: `Field ${field} is required` },
          { status: 400 }
        );
      }
    }

    // Ensure role is set to 'volunteer' or 'relawan'
    const volunteerData = {
      ...body,
      role: "volunteer" // or "relawan" based on API requirements
    };

    // Use the correct API endpoint for creating volunteers
    const response = await fetch("https://sigap-api-5hk6r.ondigitalocean.app/api/admin/register-relawan", {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(volunteerData),
    });

    console.log("Create volunteer response status:", response.status);
    
    const responseText = await response.text();
    console.log("Create volunteer response text:", responseText);
    
    // Check if response is HTML (error page)
    if (responseText.includes('<!DOCTYPE html>') || responseText.includes('<html>')) {
      console.error("Received HTML instead of JSON when creating volunteer");
      return NextResponse.json(
        { message: "API endpoint not found or server error during volunteer creation" },
        { status: 404 }
      );
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse create volunteer response as JSON:", e);
      return NextResponse.json(
        { message: "Invalid JSON response from server", details: responseText.substring(0, 200) },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Create volunteer error:", error);
    const errorMessage = (error instanceof Error) ? error.message : String(error);
    return NextResponse.json(
      { message: "An error occurred while creating volunteer", error: errorMessage },
      { status: 500 }
    );
  }
}