import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from './mongodb';

export interface ServerAuthUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  photoUrl?: string;
}

export async function getServerAuthUser(): Promise<ServerAuthUser | null> {
  try {
    const token = cookies().get('token')?.value;
    if (!token) {
      return null;
    }

    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, secret) as { userId: string };
    const { db } = await connectToDatabase();
    if (!db) {
      return null;
    }

    const user = await db.collection('users').findOne(
      { _id: new ObjectId(decoded.userId) },
      { projection: { password: 0 } }
    );

    if (!user) {
      return null;
    }

    const { _id, name, email, role, photoUrl } = user as any;
    return {
      _id: _id.toString(),
      name,
      email,
      role,
      photoUrl,
    };
  } catch (error) {
    return null;
  }
}


