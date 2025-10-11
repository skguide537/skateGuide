import { NextResponse, NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  // Delete token cookie via response
  const response = NextResponse.json({ message: 'Logged out successfully' });
  response.cookies.delete('token');
  return response;
}
