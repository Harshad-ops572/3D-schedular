import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb, isMongoDBConfigured } from '@/lib/mongodb';
import { comparePassword, signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (isMongoDBConfigured()) {
      const db = await getMongoDb();
      if (!db) {
        return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
      }

      const user = await db.collection('users').findOne({ email: normalizedEmail });
      if (!user) {
        return NextResponse.json(
          { error: 'Invalid credentials. User not found.' },
          { status: 401 }
        );
      }

      const isMatch = await comparePassword(password, user.password);
      if (!isMatch) {
        return NextResponse.json(
          { error: 'Invalid email or password.' },
          { status: 401 }
        );
      }

      const userId = user._id.toString();
      const token = signToken({
        userId,
        email: user.email,
        name: user.name || 'Chronos User',
      });

      const response = NextResponse.json({
        message: 'Signed in successfully',
        user: {
          id: userId,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
        },
        token,
        storage: 'mongodb',
      });

      response.cookies.set('chronos_token', token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,
        path: '/',
      });

      return response;
    } else {
      // Local demo fallback
      const simulatedId = 'local_user_' + normalizedEmail.replace(/[^a-zA-Z0-9]/g, '_');
      const token = signToken({
        userId: simulatedId,
        email: normalizedEmail,
        name: normalizedEmail.split('@')[0],
      });

      const response = NextResponse.json({
        message: 'Signed in (Local Session)',
        user: {
          id: simulatedId,
          name: normalizedEmail.split('@')[0],
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
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed. Please check inputs and try again.' },
      { status: 500 }
    );
  }
}
