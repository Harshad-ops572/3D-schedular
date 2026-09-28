import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getMongoDb, isMongoDBConfigured } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req);
  const mongoActive = isMongoDBConfigured();

  if (!user) {
    return NextResponse.json(
      { authenticated: false, mongoConfigured: mongoActive },
      { status: 200 }
    );
  }

  if (mongoActive && !user.userId.startsWith('local_')) {
    try {
      const db = await getMongoDb();
      if (db) {
        const dbUser = await db.collection('users').findOne({ _id: new ObjectId(user.userId) });
        if (dbUser) {
          return NextResponse.json({
            authenticated: true,
            mongoConfigured: true,
            user: {
              id: dbUser._id.toString(),
              name: dbUser.name,
              email: dbUser.email,
              createdAt: dbUser.createdAt,
            },
          });
        }
      }
    } catch {
      // Fallback to token payload
    }
  }

  return NextResponse.json({
    authenticated: true,
    mongoConfigured: mongoActive,
    user: {
      id: user.userId,
      name: user.name,
      email: user.email,
      createdAt: new Date().toISOString(),
    },
  });
}
