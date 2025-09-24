import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Log request metadata
  console.log(`Request received: ${request.method} ${request.url}`);

  // Return JSON response with welcome message
  return NextResponse.json({
    message: "Welcome to the API!",
    metadata: {
      method: request.method,
      path: request.url,
      timestamp: new Date().toISOString()
    }
  });
}
