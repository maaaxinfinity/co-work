import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tasks } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import type { InferInsertModel } from 'drizzle-orm';
import { checkOrigin, jsonError } from '@/lib/server/response';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const fileId = searchParams.get('fileId');
    const status = searchParams.get('status');

    // Single task by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const task = await db.select()
        .from(tasks)
        .where(eq(tasks.id, parseInt(id)))
        .limit(1);

      if (task.length === 0) {
        return NextResponse.json(
          { error: 'Task not found', code: 'TASK_NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(task[0], { status: 200 });
    }

    // List tasks for a file
    if (!fileId) {
      return NextResponse.json(
        { error: 'fileId parameter is required', code: 'MISSING_FILE_ID' },
        { status: 400 }
      );
    }

    if (isNaN(parseInt(fileId))) {
      return NextResponse.json(
        { error: 'Valid fileId is required', code: 'INVALID_FILE_ID' },
        { status: 400 }
      );
    }

    let query = db.select()
      .from(tasks)
      .where(eq(tasks.fileId, parseInt(fileId)));

    // Filter by status if provided
    if (status) {
      const validStatuses = ['pending', 'in_progress', 'completed'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status. Must be one of: pending, in_progress, completed', code: 'INVALID_STATUS' },
          { status: 400 }
        );
      }

      query = db.select()
        .from(tasks)
        .where(and(
          eq(tasks.fileId, parseInt(fileId)),
          eq(tasks.status, status)
        ));
    }

    const results = await query.orderBy(desc(tasks.createdAt));

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET /api/tasks error:', error);
    return jsonError(request, error, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const originBlock = checkOrigin(request);
    if (originBlock) return originBlock;

    const body = await request.json();
    const { fileId, title, status } = body;

    // Validate required fields
    if (!fileId) {
      return NextResponse.json(
        { error: 'fileId is required', code: 'MISSING_FILE_ID' },
        { status: 400 }
      );
    }

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json(
        { error: 'title is required and must be a non-empty string', code: 'MISSING_TITLE' },
        { status: 400 }
      );
    }

    if (isNaN(parseInt(fileId))) {
      return NextResponse.json(
        { error: 'Valid fileId is required', code: 'INVALID_FILE_ID' },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (status) {
      const validStatuses = ['pending', 'in_progress', 'completed'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status. Must be one of: pending, in_progress, completed', code: 'INVALID_STATUS' },
          { status: 400 }
        );
      }
    }

    const now = new Date().toISOString();

    const newTask = await db.insert(tasks)
      .values({
        fileId: parseInt(fileId),
        title: title.trim(),
        status: status || 'pending',
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json(newTask[0], { status: 201 });
  } catch (error) {
    console.error('POST /api/tasks error:', error);
    return jsonError(request, error, 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const originBlock = checkOrigin(request);
    if (originBlock) return originBlock;

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const { title, status } = (await request.json()) as {
      title?: string;
      status?: 'pending' | 'in_progress' | 'completed';
    };

    // Check if task exists
    const existingTask = await db.select()
      .from(tasks)
      .where(eq(tasks.id, parseInt(id)))
      .limit(1);

    if (existingTask.length === 0) {
      return NextResponse.json(
        { error: 'Task not found', code: 'TASK_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Validate status if provided
    if (status) {
      const validStatuses = ['pending', 'in_progress', 'completed'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status. Must be one of: pending, in_progress, completed', code: 'INVALID_STATUS' },
          { status: 400 }
        );
      }
    }

    // Validate title if provided
    if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
      return NextResponse.json(
        { error: 'title must be a non-empty string', code: 'INVALID_TITLE' },
        { status: 400 }
      );
    }

    const updates: Partial<InferInsertModel<typeof tasks>> = {
      updatedAt: new Date(),
    };

    if (title !== undefined) {
      updates.title = title.trim();
    }

    if (status !== undefined) {
      updates.status = status;
    }

    const updatedTask = await db.update(tasks)
      .set(updates)
      .where(eq(tasks.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedTask[0], { status: 200 });
  } catch (error) {
    console.error('PUT /api/tasks error:', error);
    return jsonError(request, error, 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const originBlock = checkOrigin(request);
    if (originBlock) return originBlock;

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if task exists
    const existingTask = await db.select()
      .from(tasks)
      .where(eq(tasks.id, parseInt(id)))
      .limit(1);

    if (existingTask.length === 0) {
      return NextResponse.json(
        { error: 'Task not found', code: 'TASK_NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db.delete(tasks)
      .where(eq(tasks.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Task deleted successfully',
        task: deleted[0]
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE /api/tasks error:', error);
    return jsonError(request, error, 500);
  }
}
