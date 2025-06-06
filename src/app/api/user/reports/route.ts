// src/app/api/user/reports/route.ts
import { NextRequest, NextResponse } from "next/server";

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

    // Get query parameters for pagination and filtering
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const status = searchParams.get('status') || '';
    const problem_type = searchParams.get('problem_type') || '';
    
    console.log("Fetching user reports with params:", { page, status, problem_type });

    // Forward the request to the external API - menggunakan endpoint reports biasa
    // API akan otomatis filter berdasarkan user yang login (berdasarkan token)
    const response = await fetch("https://sigap-api-5hk6r.ondigitalocean.app/api/reports", {
      method: "GET",
      headers: {
        "Authorization": authHeader,
        "Accept": "application/json",
      },
    });

    // Get the response as text first (for debugging)
    const responseText = await response.text();
    console.log("External API reports response:", responseText);
    
    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse reports response as JSON:", e);
      return NextResponse.json(
        { message: "Invalid response from server" },
        { status: 500 }
      );
    }

    // Check if response is successful
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    // Transform data untuk user reports
    let reports = [];
    let paginationData = null;

    // Handle different response structures
    if (Array.isArray(data)) {
      reports = data;
    } else if (data.data && Array.isArray(data.data)) {
      reports = data.data;
      paginationData = {
        current_page: data.current_page || 1,
        last_page: data.last_page || 1,
        per_page: data.per_page || 10,
        total: data.total || reports.length,
        from: data.from || 1,
        to: data.to || reports.length,
        first_page_url: data.first_page_url || '',
        last_page_url: data.last_page_url || '',
        next_page_url: data.next_page_url || null,
        prev_page_url: data.prev_page_url || null,
        path: data.path || '',
        links: data.links || []
      };
    } else if (data.reports && Array.isArray(data.reports)) {
      reports = data.reports;
    } else if (data.report) {
      reports = [data.report];
    }

    // Filter berdasarkan status dan problem_type jika diperlukan (client-side filtering)
    if (status && status !== '') {
      reports = reports.filter((report: any) => report.status === status);
    }
    
    if (problem_type && problem_type !== '') {
      reports = reports.filter((report: any) => report.problem_type === problem_type);
    }

    // Create pagination response structure
    const responseData = paginationData ? {
      ...paginationData,
      data: reports
    } : {
      current_page: 1,
      data: reports,
      first_page_url: '',
      from: 1,
      last_page: 1,
      last_page_url: '',
      links: [
        { url: null, label: '&laquo; Previous', active: false },
        { url: '', label: '1', active: true },
        { url: null, label: 'Next &raquo;', active: false }
      ],
      next_page_url: null,
      path: '',
      per_page: reports.length,
      prev_page_url: null,
      to: reports.length,
      total: reports.length
    };

    // Return the response
    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error("User reports fetch error:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching user reports" },
      { status: 500 }
    );
  }
}