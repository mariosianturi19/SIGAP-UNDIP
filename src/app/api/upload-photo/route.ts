// src/app/api/upload-photo/route.ts
import { NextRequest, NextResponse } from "next/server";

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

    // Ambil form data
    const formData = await request.formData();
    
    // Log isi formData untuk debugging
    console.log("Received form data keys:", Array.from(formData.keys()));
    
    // Pastikan ada file foto
    const photo = formData.get('photo') as File;
    if (!photo) {
      return NextResponse.json(
        { message: "No photo file provided" },
        { status: 400 }
      );
    }
    
    // Teruskan ke API external
    const uploadFormData = new FormData();
    uploadFormData.append('photo', photo);
    
    // Kirim ke API eksternal
    const response = await fetch("https://sigap-api-5hk6r.ondigitalocean.app/api/upload-photo", {
      method: "POST",
      headers: {
        "Authorization": authHeader, // Gunakan token dari request
        "Accept": "application/json",
      },
      body: uploadFormData,
    });

    // Ambil response sebagai text untuk debugging
    const responseText = await response.text();
    console.log("External API upload photo response:", responseText);
    
    // Parse sebagai JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse upload photo response as JSON:", e);
      return NextResponse.json(
        { message: "Invalid response from server" },
        { status: 500 }
      );
    }

    // Kembalikan response dengan status yang sama
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Photo upload error:", error);
    return NextResponse.json(
      { message: "An error occurred during photo upload" },
      { status: 500 }
    );
  }
}