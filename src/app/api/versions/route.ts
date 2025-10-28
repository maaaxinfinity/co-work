import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { versions } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { checkOrigin, jsonError } from '@/lib/server/response';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const fileId = searchParams.get('fileId');

    // Single version by ID
    if (id) {
      if (isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const version = await db
        .select()
        .from(versions)
        .where(eq(versions.id, parseInt(id)))
        .limit(1);

      if (version.length === 0) {
        return NextResponse.json(
          { error: 'Version not found', code: 'VERSION_NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(version[0], { status: 200 });
    }

    // List versions for a file
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

    const versionsList = await db
      .select()
      .from(versions)
      .where(eq(versions.fileId, parseInt(fileId)))
      .orderBy(desc(versions.createdAt));

    return NextResponse.json(versionsList, { status: 200 });
  } catch (error) {
    console.error('GET /api/versions error:', error);
    return jsonError(request, error, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const originBlock = checkOrigin(request);
    if (originBlock) return originBlock;

    const body = await request.json();
    const { fileId, title, author, content } = body;

    // Validate required fields
    if (!fileId) {
      return NextResponse.json(
        { error: 'fileId is required', code: 'MISSING_FILE_ID' },
        { status: 400 }
      );
    }

    if (isNaN(parseInt(fileId))) {
      return NextResponse.json(
        { error: 'Valid fileId is required', code: 'INVALID_FILE_ID' },
        { status: 400 }
      );
    }

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json(
        { error: 'title is required and cannot be empty', code: 'MISSING_TITLE' },
        { status: 400 }
      );
    }

    if (!author || typeof author !== 'string' || author.trim() === '') {
      return NextResponse.json(
        { error: 'author is required and cannot be empty', code: 'MISSING_AUTHOR' },
        { status: 400 }
      );
    }

    if (!content || typeof content !== 'string' || content.trim() === '') {
      return NextResponse.json(
        { error: 'content is required and cannot be empty', code: 'MISSING_CONTENT' },
        { status: 400 }
      );
    }

    // Create new version
    const newVersion = await db
      .insert(versions)
      .values({
        fileId: parseInt(fileId),
        title: title.trim(),
        author: author.trim(),
        content: content.trim(),
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newVersion[0], { status: 201 });
  } catch (error) {
    console.error('POST /api/versions error:', error);
    return jsonError(request, error, 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const originBlock = checkOrigin(request);
    if (originBlock) return originBlock;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if version exists
    const existingVersion = await db
      .select()
      .from(versions)
      .where(eq(versions.id, parseInt(id)))
      .limit(1);

    if (existingVersion.length === 0) {
      return NextResponse.json(
        { error: 'Version not found', code: 'VERSION_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete version
    const deleted = await db
      .delete(versions)
      .where(eq(versions.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Version deleted successfully',
        version: deleted[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE /api/versions error:', error);
    return jsonError(request, error, 500);
  }
}