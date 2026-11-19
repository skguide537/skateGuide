import { NextResponse } from 'next/server';
import { loginUser } from '@/services/auth';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const user = await loginUser(email, password);
    
    // Set the token as an HTTP-only cookie
    const response = NextResponse.json(user);
    response.cookies.set('token', user.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });
    
    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message === 'Invalid credentials' ? 401 : 500 }
    );
  }
} 