import { NextResponse } from 'next/server';
import { registerUser } from '@/services/auth';

export async function POST(req: Request) {
  try {
    const userData = await req.json();
    const user = await registerUser(userData);
    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message === 'User already exists' ? 400 : 500 }
    );
  }
} 