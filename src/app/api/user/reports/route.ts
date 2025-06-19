import { NextRequest, NextResponse } from "next/server";

// Define the minimum type for a report based on expected usage
type Report = {
  status?: string;
  problem_type?: string;
  [key: string]: unknown;
};

// Define type for paginated response
type PaginatedResponse = {
  data: Report[];
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
  from?: number;
  to?: number;
  first_page_url?: string;
  last_page_url?: string;
  next_page_url?: string | null;
  prev_page_url?: string | null;
  path?: string;
  links?: Array<{
    url: string | null;
    label: string;
    active: boolean;
  }>;
};

// Define type for reports response that might have reports array
type ReportsResponse = {
  reports?: Report[];
  report?: Report;
} & Record<string, unknown>;

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
    let data: unknown;
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
    let reports: Report[] = [];
    let paginationData: Omit<PaginatedResponse, 'data'> | null = null;

    // Handle different response structures
    if (Array.isArray(data)) {
      reports = data as Report[];
    } else if (typeof data === "object" && data !== null && "data" in data && Array.isArray((data as PaginatedResponse).data)) {
      const paginatedData = data as PaginatedResponse;
      reports = paginatedData.data;
      paginationData = {
        current_page: paginatedData.current_page ?? 1,
        last_page: paginatedData.last_page ?? 1,
        per_page: paginatedData.per_page ?? 10,
        total: paginatedData.total ?? reports.length,
        from: paginatedData.from ?? 1,
        to: paginatedData.to ?? reports.length,
        first_page_url: paginatedData.first_page_url ?? '',
        last_page_url: paginatedData.last_page_url ?? '',
        next_page_url: paginatedData.next_page_url ?? null,
        prev_page_url: paginatedData.prev_page_url ?? null,
        path: paginatedData.path ?? '',
        links: paginatedData.links ?? []
      };
    } else if (typeof data === "object" && data !== null && "reports" in data && Array.isArray((data as ReportsResponse).reports)) {
      reports = (data as ReportsResponse).reports || [];
    } else if (typeof data === "object" && data !== null && "report" in data) {
      reports = [(data as ReportsResponse).report as Report];
    }

    // Filter berdasarkan status dan problem_type jika diperlukan (client-side filtering)
    if (status && status !== '') {
      reports = reports.filter((report) => report.status === status);
    }
    
    if (problem_type && problem_type !== '') {
      reports = reports.filter((report) => report.problem_type === problem_type);
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