import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { messages } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { checkOrigin, jsonError } from '@/lib/server/response';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single message by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const message = await db
        .select()
        .from(messages)
        .where(eq(messages.id, parseInt(id)))
        .limit(1);

      if (message.length === 0) {
        return NextResponse.json(
          { error: 'Message not found', code: 'MESSAGE_NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(message[0], { status: 200 });
    }

    // List messages with filters
    const projectId = searchParams.get('projectId');
    const pinnedParam = searchParams.get('pinned');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // projectId is required for listing
    if (!projectId || isNaN(parseInt(projectId))) {
      return NextResponse.json(
        { error: 'Valid projectId is required', code: 'MISSING_PROJECT_ID' },
        { status: 400 }
      );
    }

    let conditions = [eq(messages.projectId, parseInt(projectId))];

    // Filter by pinned status if provided
    if (pinnedParam !== null) {
      const isPinned = pinnedParam === 'true';
      conditions.push(eq(messages.pinned, isPinned));
    }

    const results = await db
      .select()
      .from(messages)
      .where(and(...conditions))
      .orderBy(desc(messages.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET /api/messages error:', error);
    return jsonError(request, error, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const originBlock = checkOrigin(request);
    if (originBlock) return originBlock;

    const body = await request.json();
    const { projectId, role, content, quotedMessageId } = body;

    // Validate required fields
    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required', code: 'MISSING_PROJECT_ID' },
        { status: 400 }
      );
    }

    if (isNaN(parseInt(projectId))) {
      return NextResponse.json(
        { error: 'projectId must be a valid integer', code: 'INVALID_PROJECT_ID' },
        { status: 400 }
      );
    }

    if (!role) {
      return NextResponse.json(
        { error: 'role is required', code: 'MISSING_ROLE' },
        { status: 400 }
      );
    }

    if (role !== 'user' && role !== 'assistant') {
      return NextResponse.json(
        { error: 'role must be "user" or "assistant"', code: 'INVALID_ROLE' },
        { status: 400 }
      );
    }

    if (!content || content.trim() === '') {
      return NextResponse.json(
        { error: 'content is required and cannot be empty', code: 'MISSING_CONTENT' },
        { status: 400 }
      );
    }

    // Validate quotedMessageId if provided
    if (quotedMessageId !== undefined && quotedMessageId !== null) {
      if (isNaN(parseInt(quotedMessageId))) {
        return NextResponse.json(
          { error: 'quotedMessageId must be a valid integer', code: 'INVALID_QUOTED_MESSAGE_ID' },
          { status: 400 }
        );
      }
    }

    const insertData: {
      projectId: number;
      role: string;
      content: string;
      quotedMessageId?: number;
      pinned: boolean;
      createdAt: string;
    } = {
      projectId: parseInt(projectId),
      role: role.trim(),
      content: content.trim(),
      pinned: false,
      createdAt: new Date().toISOString(),
    };

    if (quotedMessageId !== undefined && quotedMessageId !== null) {
      insertData.quotedMessageId = parseInt(quotedMessageId);
    }

    const newMessage = await db.insert(messages).values(insertData).returning();

    return NextResponse.json(newMessage[0], { status: 201 });
  } catch (error) {
    console.error('POST /api/messages error:', error);
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

    const body = await request.json();
    const { pinned, content } = body;

    // Check if message exists
    const existingMessage = await db
      .select()
      .from(messages)
      .where(eq(messages.id, parseInt(id)))
      .limit(1);

    if (existingMessage.length === 0) {
      return NextResponse.json(
        { error: 'Message not found', code: 'MESSAGE_NOT_FOUND' },
        { status: 404 }
      );
    }

    const updates: {
      pinned?: boolean;
      content?: string;
    } = {};

    if (pinned !== undefined) {
      if (typeof pinned !== 'boolean') {
        return NextResponse.json(
          { error: 'pinned must be a boolean', code: 'INVALID_PINNED' },
          { status: 400 }
        );
      }
      updates.pinned = pinned;
    }

    if (content !== undefined) {
      if (typeof content !== 'string' || content.trim() === '') {
        return NextResponse.json(
          { error: 'content must be a non-empty string', code: 'INVALID_CONTENT' },
          { status: 400 }
        );
      }
      updates.content = content.trim();
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update', code: 'NO_UPDATES' },
        { status: 400 }
      );
    }

    const updatedMessage = await db
      .update(messages)
      .set(updates)
      .where(eq(messages.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedMessage[0], { status: 200 });
  } catch (error) {
    console.error('PUT /api/messages error:', error);
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

    // Check if message exists
    const existingMessage = await db
      .select()
      .from(messages)
      .where(eq(messages.id, parseInt(id)))
      .limit(1);

    if (existingMessage.length === 0) {
      return NextResponse.json(
        { error: 'Message not found', code: 'MESSAGE_NOT_FOUND' },
        { status: 404 }
      );
    }

    const deletedMessage = await db
      .delete(messages)
      .where(eq(messages.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Message deleted successfully',
        deleted: deletedMessage[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE /api/messages error:', error);
    return jsonError(request, error, 500);
  }
}