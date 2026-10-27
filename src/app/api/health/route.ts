import { NextResponse } from 'next/server';

/**
 * Health check endpoint.
 * Returns application status, version, and uptime information.
 */
export async function GET() {
  return NextResponse.json(
    {
      status: 'healthy',
      version: process.env.npm_package_version || '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    },
    { status: 200 }
  );
}
