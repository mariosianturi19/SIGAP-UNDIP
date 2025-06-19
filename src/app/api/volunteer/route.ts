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

    // Try multiple endpoints for volunteers
    const endpoints = [
      "https://sigap-api-5hk6r.ondigitalocean.app/api/admin/relawan",
      "https://sigap-api-5hk6r.ondigitalocean.app/api/admin/users?role=volunteer",
      "https://sigap-api-5hk6r.ondigitalocean.app/api/relawan"
    ];

    let lastError = null;
    
    for (const endpoint of endpoints) {
      try {
        console.log("Trying endpoint:", endpoint);
        
        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            "Authorization": authHeader,
            "Accept": "application/json",
            "Content-Type": "application/json",
          },
        });

        console.log(`Response from ${endpoint}:`, response.status);
        
        const responseText = await response.text();
        console.log(`Response text from ${endpoint}:`, responseText.substring(0, 500));
        
        // Check if response is HTML (error page)
        if (responseText.includes('<!DOCTYPE html>') || responseText.includes('<html>')) {
          console.log(`Endpoint ${endpoint} returned HTML, trying next...`);
          continue;
        }

        if (response.ok) {
          let data;
          try {
            data = JSON.parse(responseText);
            console.log(`Successfully parsed data from ${endpoint}:`, Object.keys(data));
            return NextResponse.json(data, { status: response.status });
          } catch (e) {
            console.error(`Failed to parse JSON from ${endpoint}:`, e);
            continue;
          }
        } else {
          console.log(`Endpoint ${endpoint} failed with status ${response.status}`);
          lastError = responseText;
        }
      } catch (error) {
        console.log(`Error with endpoint ${endpoint}:`, error);
        lastError = error;
      }
    }

    // If all endpoints failed
    return NextResponse.json(
      { 
        message: "All volunteer endpoints failed", 
        details: lastError instanceof Error ? lastError.message : String(lastError),
        data: [] // Return empty array instead of error
      },
      { status: 200 } // Return 200 with empty data instead of error
    );
    
  } catch (error) {
    console.error("Volunteer fetch error:", error);
    const errorMessage = (error instanceof Error) ? error.message : String(error);
    return NextResponse.json(
      { message: "An error occurred while fetching volunteers", error: errorMessage, data: [] },
      { status: 200 } // Return 200 with empty data instead of 500
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