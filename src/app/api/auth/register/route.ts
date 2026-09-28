import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb, isMongoDBConfigured } from '@/lib/mongodb';
import { hashPassword, signToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (isMongoDBConfigured()) {
      const db = await getMongoDb();
      if (!db) {
        return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
      }

      const existingUser = await db.collection('users').findOne({ email: normalizedEmail });
      if (existingUser) {
        return NextResponse.json(
          { error: 'A user with this email already exists' },
          { status: 409 }
        );
      }

      const hashedPassword = await hashPassword(password);
      const newUser = {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        createdAt: new Date().toISOString(),
      };

      const result = await db.collection('users').insertOne(newUser);
      const userId = result.insertedId.toString();

      const token = signToken({
        userId,
        email: normalizedEmail,
        name: newUser.name,
      });

      const response = NextResponse.json({
        message: 'Account created successfully',
        user: {
          id: userId,
          name: newUser.name,
          email: normalizedEmail,
          createdAt: newUser.createdAt,
        },
        token,
        storage: 'mongodb',
      });

      response.cookies.set('chronos_token', token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/',
      });

      return response;
    } else {
      // Offline / Local-first mode fallback
      const simulatedId = 'local_' + Date.now();
      const token = signToken({
        userId: simulatedId,
        email: normalizedEmail,
        name: name.trim(),
      });

      const response = NextResponse.json({
        message: 'Account created in local session (MongoDB not configured)',
        user: {
          id: simulatedId,
          name: name.trim(),
          email: normalizedEmail,
          createdAt: new Date().toISOString(),
        },
        token,
        storage: 'local',
      });

      response.cookies.set('chronos_token', token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,
        path: '/',
      });

      return response;
    }
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed. Please check inputs and try again.' },
      { status: 500 }
    );
  }
}
