import { NextResponse } from 'next/server';
import { registerUser } from '@/services/auth';

export async function POST(req: Request) {
  try {
    const userData = await req.json();
    const user = await registerUser(userData);
    return NextResponse.json(user);
  } catch (error: any) {
    // Log all errors for debugging
    console.error('Registration error:', error);
    
    // Return 400 for all user-related errors
    return NextResponse.json(
      { error: error.message || 'Registration failed' },
      { status: 400 }
    );
  }
} 