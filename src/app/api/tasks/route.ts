import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getMongoDb, isMongoDBConfigured } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { TaskItem } from '@/lib/models';

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    const userId = user?.userId || 'guest';
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const category = searchParams.get('category');
    const completed = searchParams.get('completed');

    if (isMongoDBConfigured() && userId !== 'guest' && !userId.startsWith('local_')) {
      const db = await getMongoDb();
      if (db) {
        const query: Record<string, unknown> = { userId };
        if (date) query.date = date;
        if (category && category !== 'all') query.category = category;
        if (completed !== null && completed !== undefined && completed !== '') {
          query.completed = completed === 'true';
        }

        const tasks = await db
          .collection('tasks')
          .find(query)
          .sort({ date: 1, startTime: 1 })
          .toArray();

        const formattedTasks = tasks.map((t) => ({
          ...t,
          id: t._id.toString(),
          _id: t._id.toString(),
        }));

        return NextResponse.json({
          tasks: formattedTasks,
          source: 'mongodb',
          mongoConfigured: true,
        });
      }
    }

    return NextResponse.json({
      tasks: [],
      source: 'local_storage_expected',
      mongoConfigured: isMongoDBConfigured(),
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    const userId = user?.userId || 'guest';
    const body = await req.json();

    const {
      title,
      description = '',
      date,
      startTime = '09:00',
      endTime = '10:00',
      priority = 'medium',
      category = 'work',
      reminderMinutesBefore = 15,
      subtasks = [],
      tags = [],
    } = body;

    if (!title || !date) {
      return NextResponse.json({ error: 'Title and date are required' }, { status: 400 });
    }

    const newTask: Omit<TaskItem, 'id' | '_id'> = {
      userId,
      title: title.trim(),
      description: description.trim(),
      date,
      startTime,
      endTime,
      priority,
      category,
      completed: false,
      reminderMinutesBefore: Number(reminderMinutesBefore),
      reminderTriggered: false,
      subtasks: subtasks || [],
      tags: tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isMongoDBConfigured() && userId !== 'guest' && !userId.startsWith('local_')) {
      const db = await getMongoDb();
      if (db) {
        const result = await db.collection('tasks').insertOne(newTask);
        return NextResponse.json({
          task: { ...newTask, id: result.insertedId.toString(), _id: result.insertedId.toString() },
          source: 'mongodb',
        });
      }
    }

    // Local fallback
    const localId = 'task_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    return NextResponse.json({
      task: { ...newTask, id: localId, _id: localId },
      source: 'local',
    });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    const userId = user?.userId || 'guest';
    const body = await req.json();
    const { id, _id, ...updates } = body;

    const taskId = id || _id;
    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    updates.updatedAt = new Date().toISOString();
    if (updates.completed === true && !updates.completedAt) {
      updates.completedAt = new Date().toISOString();
    } else if (updates.completed === false) {
      updates.completedAt = null;
    }

    if (isMongoDBConfigured() && userId !== 'guest' && !userId.startsWith('local_')) {
      const db = await getMongoDb();
      if (db && ObjectId.isValid(taskId)) {
        await db.collection('tasks').updateOne(
          { _id: new ObjectId(taskId), userId },
          { $set: updates }
        );
        return NextResponse.json({ success: true, source: 'mongodb' });
      }
    }

    return NextResponse.json({ success: true, source: 'local' });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    const userId = user?.userId || 'guest';
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get('id');

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    if (isMongoDBConfigured() && userId !== 'guest' && !userId.startsWith('local_')) {
      const db = await getMongoDb();
      if (db && ObjectId.isValid(taskId)) {
        await db.collection('tasks').deleteOne({ _id: new ObjectId(taskId), userId });
        return NextResponse.json({ success: true, source: 'mongodb' });
      }
    }

    return NextResponse.json({ success: true, source: 'local' });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
