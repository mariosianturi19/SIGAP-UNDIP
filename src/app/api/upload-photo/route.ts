// src/app/api/upload-photo/route.ts
import { NextRequest, NextResponse } from "next/server";
import { buildApiUrl, log, logError } from "@/lib/apiConfig";

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
    log("Received form data keys:", Array.from(formData.keys()));
    
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
    const response = await fetch(buildApiUrl("/upload-photo"), {
      method: "POST",
      headers: {
        "Authorization": authHeader, // Gunakan token dari request
        "Accept": "application/json",
      },
      body: uploadFormData,
    });

    // Ambil response sebagai text untuk debugging
    const responseText = await response.text();
    log("External API upload photo response status:", response.status);
    log("External API upload photo response body:", responseText.substring(0, 500));

    // Check response status first
    if (!response.ok) {
      let errorMessage = "Failed to upload photo";
      let errorDetails = responseText;
      
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorMessage;
        errorDetails = JSON.stringify(errorData);
      } catch (e) {
        logError("Failed to parse error response:", e);
      }
      
      logError("Backend API upload photo error:", {
        status: response.status,
        message: errorMessage,
        details: errorDetails
      });
      
      // Return specific error messages
      if (response.status === 401) {
        return NextResponse.json(
          { message: "Token autentikasi tidak valid atau telah kadaluarsa" },
          { status: 401 }
        );
      } else if (response.status === 413) {
        return NextResponse.json(
          { message: "File terlalu besar untuk diupload" },
          { status: 413 }
        );
      } else if (response.status === 422) {
        return NextResponse.json(
          { message: "File tidak valid atau format tidak didukung" },
          { status: 422 }
        );
      } else if (response.status === 500) {
        return NextResponse.json(
          { 
            message: "Server backend sedang mengalami masalah saat upload foto",
            technical: errorMessage 
          },
          { status: 500 }
        );
      } else if (response.status === 503) {
        return NextResponse.json(
          { 
            message: "Service upload foto sementara tidak tersedia",
            technical: errorMessage,
            suggestion: "Silakan coba lagi dalam beberapa saat atau hubungi administrator"
          },
          { status: 503 }
        );
      }
      
      return NextResponse.json(
        { message: errorMessage, technical: errorDetails },
        { status: response.status }
      );
    }

    // Parse sebagai JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      logError("Failed to parse upload photo response as JSON:", e);
      logError("Response text:", responseText);
      return NextResponse.json(
        { message: "Invalid response from server", details: responseText.substring(0, 200) },
        { status: 500 }
      );
    }

    log("Photo uploaded successfully:", data);
    // Kembalikan response dengan status yang sama
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    logError("Photo upload error:", error);
    return NextResponse.json(
      { 
        message: "An error occurred during photo upload",
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}