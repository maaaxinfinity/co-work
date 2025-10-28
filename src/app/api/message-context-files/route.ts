import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { messageContextFiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { checkOrigin, jsonError } from '@/lib/server/response';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const messageId = searchParams.get('messageId');

    // Single record by ID
    if (id) {
      if (isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: 'Valid ID is required',
          code: 'INVALID_ID' 
        }, { status: 400 });
      }

      const contextFile = await db.select()
        .from(messageContextFiles)
        .where(eq(messageContextFiles.id, parseInt(id)))
        .limit(1);

      if (contextFile.length === 0) {
        return NextResponse.json({ 
          error: 'Context file not found',
          code: 'NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(contextFile[0], { status: 200 });
    }

    // List context files for a message
    if (messageId) {
      if (isNaN(parseInt(messageId))) {
        return NextResponse.json({ 
          error: 'Valid messageId is required',
          code: 'INVALID_MESSAGE_ID' 
        }, { status: 400 });
      }

      const contextFiles = await db.select()
        .from(messageContextFiles)
        .where(eq(messageContextFiles.messageId, parseInt(messageId)));

      return NextResponse.json(contextFiles, { status: 200 });
    }

    return NextResponse.json({ 
      error: 'Either id or messageId parameter is required',
      code: 'MISSING_PARAMETER' 
    }, { status: 400 });

  } catch (error) {
    console.error('GET /api/message-context-files error:', error);
    return jsonError(request, error, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const originBlock = checkOrigin(request);
    if (originBlock) return originBlock;

    const body = await request.json();
    const { messageId, fileId } = body;

    // Validate required fields
    if (!messageId) {
      return NextResponse.json({ 
        error: 'messageId is required',
        code: 'MISSING_MESSAGE_ID' 
      }, { status: 400 });
    }

    if (!fileId) {
      return NextResponse.json({ 
        error: 'fileId is required',
        code: 'MISSING_FILE_ID' 
      }, { status: 400 });
    }

    // Validate messageId is integer
    if (isNaN(parseInt(messageId))) {
      return NextResponse.json({ 
        error: 'messageId must be a valid integer',
        code: 'INVALID_MESSAGE_ID' 
      }, { status: 400 });
    }

    // Validate fileId is integer
    if (isNaN(parseInt(fileId))) {
      return NextResponse.json({ 
        error: 'fileId must be a valid integer',
        code: 'INVALID_FILE_ID' 
      }, { status: 400 });
    }

    // Create new context file association
    const newContextFile = await db.insert(messageContextFiles)
      .values({
        messageId: parseInt(messageId),
        fileId: parseInt(fileId),
        createdAt: new Date().toISOString()
      })
      .returning();

    return NextResponse.json(newContextFile[0], { status: 201 });

  } catch (error) {
    console.error('POST /api/message-context-files error:', error);
    return jsonError(request, error, 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const originBlock = checkOrigin(request);
    if (originBlock) return originBlock;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate ID parameter
    if (!id) {
      return NextResponse.json({ 
        error: 'ID parameter is required',
        code: 'MISSING_ID' 
      }, { status: 400 });
    }

    if (isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    // Check if record exists
    const existingRecord = await db.select()
      .from(messageContextFiles)
      .where(eq(messageContextFiles.id, parseInt(id)))
      .limit(1);

    if (existingRecord.length === 0) {
      return NextResponse.json({ 
        error: 'Context file not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    // Delete the record
    const deleted = await db.delete(messageContextFiles)
      .where(eq(messageContextFiles.id, parseInt(id)))
      .returning();

    return NextResponse.json({ 
      message: 'Context file deleted successfully',
      deletedRecord: deleted[0]
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE /api/message-context-files error:', error);
    return jsonError(request, error, 500);
  }
}
