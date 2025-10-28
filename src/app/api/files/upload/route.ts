import { NextRequest, NextResponse } from 'next/server';
import { Buffer } from 'node:buffer';
import { checkOrigin, jsonError } from '@/lib/server/response';
import { db } from '@/db';
import { files } from '@/db/schema';
import { eq } from 'drizzle-orm';

const ALLOWED_FILE_TYPES = ['txt', 'md', 'docx', 'doc'] as const;
const MAX_UPLOAD_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  try {
    const originBlock = checkOrigin(request);
    if (originBlock) return originBlock;

    const formData = await request.formData();
    const rawFile = formData.get('file');
    const projectIdRaw = formData.get('projectId');
    const ownerTypeRaw = formData.get('ownerType');
    const parentIdRaw = formData.get('parentId');
    const ownerIdRaw = formData.get('ownerId');

    if (!rawFile || !(rawFile instanceof File)) {
      return NextResponse.json(
        { error: 'Valid file is required', code: 'INVALID_FILE' },
        { status: 400 }
      );
    }

    if (!projectIdRaw) {
      return NextResponse.json(
        { error: 'projectId is required', code: 'MISSING_PROJECT_ID' },
        { status: 400 }
      );
    }

    const projectId = Number(projectIdRaw);
    if (!Number.isFinite(projectId)) {
      return NextResponse.json(
        { error: 'Valid projectId is required', code: 'INVALID_PROJECT_ID' },
        { status: 400 }
      );
    }

    if (!ownerTypeRaw) {
      return NextResponse.json(
        { error: 'ownerType is required', code: 'MISSING_OWNER_TYPE' },
        { status: 400 }
      );
    }

    const ownerType = String(ownerTypeRaw);
    if (ownerType !== 'private') {
      return NextResponse.json(
        { error: 'Team files are read-only and cannot accept uploads', code: 'TEAM_FILES_READ_ONLY' },
        { status: 403 }
      );
    }

    if (rawFile.size > MAX_UPLOAD_SIZE) {
      return NextResponse.json(
        { error: 'File exceeds the 5MB limit', code: 'FILE_TOO_LARGE' },
        { status: 413 }
      );
    }

    const extension = rawFile.name.split('.').pop()?.toLowerCase();
    if (!extension || !(ALLOWED_FILE_TYPES as readonly string[]).includes(extension)) {
      return NextResponse.json(
        { error: 'Only txt, md, docx, doc files are supported', code: 'INVALID_FILE_TYPE' },
        { status: 400 }
      );
    }

    let parsedParentId: number | null = null;
    if (parentIdRaw !== null && parentIdRaw !== '' && parentIdRaw !== 'null') {
      const numericParent = Number(parentIdRaw);
      if (Number.isNaN(numericParent)) {
        return NextResponse.json(
          { error: 'Valid parentId is required', code: 'INVALID_PARENT_ID' },
          { status: 400 }
        );
      }
      parsedParentId = numericParent;
    }

    let parsedOwnerId: number | null = null;
    if (ownerIdRaw !== null && ownerIdRaw !== '' && ownerIdRaw !== 'null') {
      const numericOwner = Number(ownerIdRaw);
      if (Number.isNaN(numericOwner)) {
        return NextResponse.json(
          { error: 'Valid ownerId is required', code: 'INVALID_OWNER_ID' },
          { status: 400 }
        );
      }
      parsedOwnerId = numericOwner;
    }

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
          { error: 'Cannot upload into team folders', code: 'TEAM_FILES_READ_ONLY' },
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

    let content: string | null = null;
    if (extension === 'txt' || extension === 'md') {
      content = await rawFile.text();
    } else {
      const buffer = Buffer.from(await rawFile.arrayBuffer());
      content = buffer.toString('base64');
    }

    const now = new Date().toISOString();

    const insertData: any = {
      projectId,
      name: rawFile.name,
      type: 'file',
      ownerType,
      fileType: extension,
      content,
      status: 'new',
      modifiedAt: now,
      createdAt: now,
    };

    if (parsedParentId !== null) {
      insertData.parentId = parsedParentId;
    }

    if (parsedOwnerId !== null) {
      insertData.ownerId = parsedOwnerId;
    }

    const inserted = await db.insert(files).values(insertData).returning();

    return NextResponse.json(inserted[0], { status: 201 });
  } catch (error) {
    console.error('POST /api/files/upload error:', error);
    return jsonError(request, error, 500);
  }
}
