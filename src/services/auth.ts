import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

interface RegisterUserData {
  name: string;
  email: string;
  password: string;
  photoUrl?: string;
  photoId?: string;
}

export async function registerUser(userData: RegisterUserData) {
  try {
    const { db } = await connectToDatabase();
    const { name, email, password, photoUrl, photoId } = userData;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      throw new Error('User already exists');
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      photoUrl,
      photoId,
    });

    // Generate token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );

    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      token,
    };
  } catch (error) {
    throw error;
  }
}

export async function loginUser(email: string, password: string) {
  try {
    const { db } = await connectToDatabase();

    // Check for user email
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );

    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      token,
    };
  } catch (error) {
    throw error;
  }
}
