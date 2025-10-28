import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { comments } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { checkOrigin, jsonError } from '@/lib/server/response';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const fileId = searchParams.get('fileId');
    const resolvedParam = searchParams.get('resolved');

    // Single comment by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const comment = await db
        .select()
        .from(comments)
        .where(eq(comments.id, parseInt(id)))
        .limit(1);

      if (comment.length === 0) {
        return NextResponse.json(
          { error: 'Comment not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(comment[0], { status: 200 });
    }

    // List comments for a file
    if (!fileId || isNaN(parseInt(fileId))) {
      return NextResponse.json(
        { error: 'Valid fileId is required', code: 'MISSING_FILE_ID' },
        { status: 400 }
      );
    }

    let query = db
      .select()
      .from(comments)
      .where(eq(comments.fileId, parseInt(fileId)))
      .orderBy(asc(comments.createdAt));

    // Filter by resolved status if provided
    if (resolvedParam !== null) {
      const resolved = resolvedParam === 'true';
      query = db
        .select()
        .from(comments)
        .where(
          and(
            eq(comments.fileId, parseInt(fileId)),
            eq(comments.resolved, resolved)
          )
        )
        .orderBy(asc(comments.createdAt));
    }

    const results = await query;
    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET /api/comments error:', error);
    return jsonError(request, error, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const originBlock = checkOrigin(request);
    if (originBlock) return originBlock;

    const body = await request.json();
    const { fileId, author, content, parentCommentId } = body;

    // Validate required fields
    if (!fileId || isNaN(parseInt(fileId))) {
      return NextResponse.json(
        { error: 'Valid fileId is required', code: 'MISSING_FILE_ID' },
        { status: 400 }
      );
    }

    if (!author || typeof author !== 'string' || author.trim() === '') {
      return NextResponse.json(
        { error: 'Author is required and cannot be empty', code: 'MISSING_AUTHOR' },
        { status: 400 }
      );
    }

    if (!content || typeof content !== 'string' || content.trim() === '') {
      return NextResponse.json(
        { error: 'Content is required and cannot be empty', code: 'MISSING_CONTENT' },
        { status: 400 }
      );
    }

    // Validate parentCommentId if provided
    if (parentCommentId !== undefined && parentCommentId !== null && isNaN(parseInt(parentCommentId))) {
      return NextResponse.json(
        { error: 'Valid parentCommentId is required', code: 'INVALID_PARENT_COMMENT_ID' },
        { status: 400 }
      );
    }

    // Prepare insert data
    const insertData: any = {
      fileId: parseInt(fileId),
      author: author.trim(),
      content: content.trim(),
      resolved: false,
      createdAt: new Date().toISOString(),
    };

    if (parentCommentId !== undefined && parentCommentId !== null) {
      insertData.parentCommentId = parseInt(parentCommentId);
    }

    const newComment = await db.insert(comments).values(insertData).returning();

    return NextResponse.json(newComment[0], { status: 201 });
  } catch (error) {
    console.error('POST /api/comments error:', error);
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
    const { resolved, content } = body;

    // Check if comment exists
    const existingComment = await db
      .select()
      .from(comments)
      .where(eq(comments.id, parseInt(id)))
      .limit(1);

    if (existingComment.length === 0) {
      return NextResponse.json(
        { error: 'Comment not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};

    if (resolved !== undefined) {
      if (typeof resolved !== 'boolean') {
        return NextResponse.json(
          { error: 'Resolved must be a boolean', code: 'INVALID_RESOLVED' },
          { status: 400 }
        );
      }
      updateData.resolved = resolved;
    }

    if (content !== undefined) {
      if (typeof content !== 'string' || content.trim() === '') {
        return NextResponse.json(
          { error: 'Content cannot be empty', code: 'INVALID_CONTENT' },
          { status: 400 }
        );
      }
      updateData.content = content.trim();
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update', code: 'NO_UPDATE_FIELDS' },
        { status: 400 }
      );
    }

    const updatedComment = await db
      .update(comments)
      .set(updateData)
      .where(eq(comments.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedComment[0], { status: 200 });
  } catch (error) {
    console.error('PUT /api/comments error:', error);
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

    // Check if comment exists
    const existingComment = await db
      .select()
      .from(comments)
      .where(eq(comments.id, parseInt(id)))
      .limit(1);

    if (existingComment.length === 0) {
      return NextResponse.json(
        { error: 'Comment not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(comments)
      .where(eq(comments.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Comment deleted successfully',
        comment: deleted[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE /api/comments error:', error);
    return jsonError(request, error, 500);
  }
}