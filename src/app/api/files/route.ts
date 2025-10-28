import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { files } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { checkOrigin, jsonError } from '@/lib/server/response';

const ALLOWED_FILE_TYPES = ['txt', 'md', 'docx', 'doc'] as const;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single file fetch by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const file = await db
        .select()
        .from(files)
        .where(eq(files.id, parseInt(id)))
        .limit(1);

      if (file.length === 0) {
        return NextResponse.json(
          { error: 'File not found', code: 'FILE_NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(file[0], { status: 200 });
    }

    // List files with filtering and pagination
    const projectId = searchParams.get('projectId');
    const ownerType = searchParams.get('ownerType');
    const userId = searchParams.get('userId');
    const parentId = searchParams.get('parentId');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // projectId is required for listing files
    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required', code: 'MISSING_PROJECT_ID' },
        { status: 400 }
      );
    }

    const numericProjectId = Number(projectId);
    if (!Number.isFinite(numericProjectId)) {
      return NextResponse.json(
        { error: 'Valid projectId is required', code: 'INVALID_PROJECT_ID' },
        { status: 400 }
      );
    }

    // Build where conditions
    const conditions = [eq(files.projectId, parseInt(projectId))];

    if (ownerType) {
      if (ownerType !== 'team' && ownerType !== 'private') {
        return NextResponse.json(
          { error: 'ownerType must be "team" or "private"', code: 'INVALID_OWNER_TYPE' },
          { status: 400 }
        );
      }
      conditions.push(eq(files.ownerType, ownerType));
    }

    if (userId) {
      if (isNaN(parseInt(userId))) {
        return NextResponse.json(
          { error: 'Valid userId is required', code: 'INVALID_USER_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(files.ownerId, parseInt(userId)));
    }

    if (parentId !== null) {
      if (parentId === '' || parentId === 'null') {
        conditions.push(isNull(files.parentId));
      } else {
        if (isNaN(parseInt(parentId))) {
          return NextResponse.json(
            { error: 'Valid parentId is required', code: 'INVALID_PARENT_ID' },
            { status: 400 }
          );
        }
        conditions.push(eq(files.parentId, parseInt(parentId)));
      }
    }

    const results = await db
      .select()
      .from(files)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET /api/files error:', error);
    return jsonError(request, error, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Basic CSRF/Origin protection for mutating requests
    const originBlock = checkOrigin(request);
    if (originBlock) return originBlock;

    const body = await request.json();
    const { projectId, name, type, ownerType, parentId, fileType, content, ownerId, status } = body;

    // Validate required fields
    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required', code: 'MISSING_PROJECT_ID' },
        { status: 400 }
      );
    }

    if (isNaN(parseInt(projectId))) {
      return NextResponse.json(
        { error: 'Valid projectId is required', code: 'INVALID_PROJECT_ID' },
        { status: 400 }
      );
    }

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'name is required and cannot be empty', code: 'MISSING_NAME' },
        { status: 400 }
      );
    }

    if (!type) {
      return NextResponse.json(
        { error: 'type is required', code: 'MISSING_TYPE' },
        { status: 400 }
      );
    }

    if (type !== 'file' && type !== 'folder') {
      return NextResponse.json(
        { error: 'type must be "file" or "folder"', code: 'INVALID_TYPE' },
        { status: 400 }
      );
    }

    if (!ownerType) {
      return NextResponse.json(
        { error: 'ownerType is required', code: 'MISSING_OWNER_TYPE' },
        { status: 400 }
      );
    }

    if (ownerType !== 'team' && ownerType !== 'private') {
      return NextResponse.json(
        { error: 'ownerType must be "team" or "private"', code: 'INVALID_OWNER_TYPE' },
        { status: 400 }
      );
    }

    if (ownerType === 'team') {
      return NextResponse.json(
        { error: 'Team files are read-only', code: 'TEAM_FILES_READ_ONLY' },
        { status: 403 }
      );
    }

    // Validate optional integer fields
    const parsedParentId =
      parentId === undefined || parentId === null ? null : Number(parentId);
    if (parsedParentId !== null && Number.isNaN(parsedParentId)) {
      return NextResponse.json(
        { error: 'Valid parentId is required', code: 'INVALID_PARENT_ID' },
        { status: 400 }
      );
    }

    const parsedOwnerId =
      ownerId === undefined || ownerId === null ? null : Number(ownerId);
    if (parsedOwnerId !== null && Number.isNaN(parsedOwnerId)) {
      return NextResponse.json(
        { error: 'Valid ownerId is required', code: 'INVALID_OWNER_ID' },
        { status: 400 }
      );
    }

    // Validate fileType if provided
    let normalizedFileType: (typeof ALLOWED_FILE_TYPES)[number] | undefined;
    if (fileType !== undefined && fileType !== null && fileType !== '') {
      const ft = String(fileType).toLowerCase();
      if (!(ALLOWED_FILE_TYPES as readonly string[]).includes(ft)) {
        return NextResponse.json(
          { error: 'fileType must be one of: txt, md, docx, doc', code: 'INVALID_FILE_TYPE' },
          { status: 400 }
        );
      }
      normalizedFileType = ft as (typeof ALLOWED_FILE_TYPES)[number];
    }

    if (type === 'file' && !normalizedFileType) {
      return NextResponse.json(
        { error: 'fileType is required for file entries', code: 'MISSING_FILE_TYPE' },
        { status: 400 },
      );
    }

    // Validate status if provided
    if (status && !['modified', 'new', 'synced'].includes(status)) {
      return NextResponse.json(
        { error: 'status must be one of: modified, new, synced', code: 'INVALID_STATUS' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // When parent provided ensure it exists and remains private
    if (parsedParentId !== null) {
      const parentRecord = await db
        .select()
        .from(files)
        .where(eq(files.id, parsedParentId))
        .limit(1);

      if (parentRecord.length === 0) {
        return NextResponse.json(
          { error: 'Parent folder not found', code: 'PARENT_NOT_FOUND' },
          { status: 404 }
        );
      }

      const parent = parentRecord[0];

      if (parent.ownerType === 'team') {
        return NextResponse.json(
          { error: 'Cannot create items inside team folders', code: 'TEAM_FILES_READ_ONLY' },
          { status: 403 }
        );
      }

      if (parent.ownerType !== ownerType) {
        return NextResponse.json(
          { error: 'Owner type must match parent folder', code: 'OWNER_TYPE_MISMATCH' },
          { status: 400 }
        );
      }

      if (parent.type !== 'folder') {
        return NextResponse.json(
          { error: 'Parent must be a folder', code: 'INVALID_PARENT_TYPE' },
          { status: 400 }
        );
      }
    }

    const insertData: any = {
      projectId: numericProjectId,
      name: name.trim(),
      type,
      ownerType,
      status: status || 'new',
      modifiedAt: now,
      createdAt: now,
    };

    if (parsedParentId !== null) {
      insertData.parentId = parsedParentId;
    }

    if (normalizedFileType) {
      insertData.fileType = normalizedFileType;
    }

    if (content !== undefined && content !== null) {
      insertData.content = content;
    }

    if (parsedOwnerId !== null) {
      insertData.ownerId = parsedOwnerId;
    }

    const newFile = await db.insert(files).values(insertData).returning();

    return NextResponse.json(newFile[0], { status: 201 });
  } catch (error) {
    console.error('POST /api/files error:', error);
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
    const { name, content, status, parentId, fileType } = body;

    // Check if file exists
    const existingFile = await db
      .select()
      .from(files)
      .where(eq(files.id, parseInt(id)))
      .limit(1);

    if (existingFile.length === 0) {
      return NextResponse.json(
        { error: 'File not found', code: 'FILE_NOT_FOUND' },
        { status: 404 }
      );
    }

    const currentFile = existingFile[0];

    if (currentFile.ownerType === 'team') {
      return NextResponse.json(
        { error: 'Team files are read-only', code: 'TEAM_FILES_READ_ONLY' },
        { status: 403 }
      );
    }

    // Validate inputs if provided
    if (name !== undefined && name.trim() === '') {
      return NextResponse.json(
        { error: 'name cannot be empty', code: 'INVALID_NAME' },
        { status: 400 }
      );
    }

    if (status && !['modified', 'new', 'synced'].includes(status)) {
      return NextResponse.json(
        { error: 'status must be one of: modified, new, synced', code: 'INVALID_STATUS' },
        { status: 400 }
      );
    }

    let parsedParentId: number | null | undefined = undefined;
    if (parentId !== undefined) {
      if (parentId === null || parentId === 'null') {
        parsedParentId = null;
      } else {
        const numericParent = Number(parentId);
        if (Number.isNaN(numericParent)) {
          return NextResponse.json(
            { error: 'Valid parentId is required', code: 'INVALID_PARENT_ID' },
            { status: 400 }
          );
        }
        parsedParentId = numericParent;
      }
    }

    if (
      fileType !== undefined &&
      fileType !== null &&
      fileType !== '' &&
      !(ALLOWED_FILE_TYPES as readonly string[]).includes(String(fileType).toLowerCase())
    ) {
      return NextResponse.json(
        { error: 'fileType must be one of: txt, md, docx, doc', code: 'INVALID_FILE_TYPE' },
        { status: 400 }
      );
    }

    if (parsedParentId !== undefined && parsedParentId !== null) {
      const parentRecord = await db
        .select()
        .from(files)
        .where(eq(files.id, parsedParentId))
        .limit(1);

      if (parentRecord.length === 0) {
        return NextResponse.json(
          { error: 'Parent folder not found', code: 'PARENT_NOT_FOUND' },
          { status: 404 }
        );
      }

      const parent = parentRecord[0];

      if (parent.ownerType === 'team') {
        return NextResponse.json(
          { error: 'Cannot move into team folders', code: 'TEAM_FILES_READ_ONLY' },
          { status: 403 }
        );
      }

      if (parent.ownerType !== currentFile.ownerType) {
        return NextResponse.json(
          { error: 'Owner type must match parent folder', code: 'OWNER_TYPE_MISMATCH' },
          { status: 400 }
        );
      }

      if (parent.type !== 'folder') {
        return NextResponse.json(
          { error: 'Parent must be a folder', code: 'INVALID_PARENT_TYPE' },
          { status: 400 }
        );
      }
    }

    const updates: any = {
      updatedAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    };

    if (name !== undefined) {
      updates.name = name.trim();
    }

    if (content !== undefined) {
      updates.content = content;
    }

    if (status !== undefined) {
      updates.status = status;
    }

    if (parsedParentId !== undefined) {
      updates.parentId = parsedParentId;
    }

    if (fileType !== undefined) {
      updates.fileType =
        fileType === null || fileType === ''
          ? null
          : String(fileType).toLowerCase();
    }

    const updated = await db
      .update(files)
      .set(updates)
      .where(eq(files.id, parseInt(id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: 'File not found', code: 'FILE_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT /api/files error:', error);
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

    // Check if file exists
    const existingFile = await db
      .select()
      .from(files)
      .where(eq(files.id, parseInt(id)))
      .limit(1);

    if (existingFile.length === 0) {
      return NextResponse.json(
        { error: 'File not found', code: 'FILE_NOT_FOUND' },
        { status: 404 }
      );
    }

    if (existingFile[0].ownerType === 'team') {
      return NextResponse.json(
        { error: 'Team files are read-only', code: 'TEAM_FILES_READ_ONLY' },
        { status: 403 }
      );
    }

    const deleted = await db
      .delete(files)
      .where(eq(files.id, parseInt(id)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: 'File not found', code: 'FILE_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: 'File deleted successfully',
        file: deleted[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE /api/files error:', error);
    return jsonError(request, error, 500);
  }
}
