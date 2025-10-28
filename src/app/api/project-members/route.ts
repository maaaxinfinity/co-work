import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { projectMembers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { checkOrigin, jsonError } from '@/lib/server/response';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const projectId = searchParams.get('projectId');

    // Single project member by ID
    if (id) {
      if (isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const member = await db
        .select()
        .from(projectMembers)
        .where(eq(projectMembers.id, parseInt(id)))
        .limit(1);

      if (member.length === 0) {
        return NextResponse.json(
          { error: 'Project member not found', code: 'MEMBER_NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(member[0], { status: 200 });
    }

    // List project members - projectId is required
    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required', code: 'MISSING_PROJECT_ID' },
        { status: 400 }
      );
    }

    if (isNaN(parseInt(projectId))) {
      return NextResponse.json(
        { error: 'Valid Project ID is required', code: 'INVALID_PROJECT_ID' },
        { status: 400 }
      );
    }

    const members = await db
      .select()
      .from(projectMembers)
      .where(eq(projectMembers.projectId, parseInt(projectId)));

    return NextResponse.json(members, { status: 200 });
  } catch (error) {
    console.error('GET /api/project-members error:', error);
    return jsonError(request, error, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const originBlock = checkOrigin(request);
    if (originBlock) return originBlock;

    const body = await request.json();
    const { projectId, userId, role } = body;

    // Validate required fields
    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required', code: 'MISSING_PROJECT_ID' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    // Validate projectId is integer
    if (isNaN(parseInt(projectId))) {
      return NextResponse.json(
        { error: 'Valid Project ID is required', code: 'INVALID_PROJECT_ID' },
        { status: 400 }
      );
    }

    // Validate userId is integer
    if (isNaN(parseInt(userId))) {
      return NextResponse.json(
        { error: 'Valid User ID is required', code: 'INVALID_USER_ID' },
        { status: 400 }
      );
    }

    // Validate role if provided
    if (role && !['owner', 'editor', 'viewer'].includes(role)) {
      return NextResponse.json(
        { error: 'Role must be one of: owner, editor, viewer', code: 'INVALID_ROLE' },
        { status: 400 }
      );
    }

    // Create new project member
    const newMember = await db
      .insert(projectMembers)
      .values({
        projectId: parseInt(projectId),
        userId: parseInt(userId),
        role: role || 'viewer',
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newMember[0], { status: 201 });
  } catch (error) {
    console.error('POST /api/project-members error:', error);
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
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if project member exists
    const existingMember = await db
      .select()
      .from(projectMembers)
      .where(eq(projectMembers.id, parseInt(id)))
      .limit(1);

    if (existingMember.length === 0) {
      return NextResponse.json(
        { error: 'Project member not found', code: 'MEMBER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete project member
    const deleted = await db
      .delete(projectMembers)
      .where(eq(projectMembers.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Project member removed successfully',
        member: deleted[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE /api/project-members error:', error);
    return jsonError(request, error, 500);
  }
}