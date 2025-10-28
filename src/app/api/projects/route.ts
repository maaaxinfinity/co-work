import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq, like } from 'drizzle-orm';
import { checkOrigin, jsonError } from '@/lib/server/response';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single project by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const project = await db.select()
        .from(projects)
        .where(eq(projects.id, parseInt(id)))
        .limit(1);

      if (project.length === 0) {
        return NextResponse.json({ 
          error: 'Project not found',
          code: "PROJECT_NOT_FOUND" 
        }, { status: 404 });
      }

      return NextResponse.json(project[0], { status: 200 });
    }

    // List all projects with pagination and search
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');

    let query = db.select().from(projects);

    if (search) {
      query = query.where(like(projects.name, `%${search}%`));
    }

    const results = await query
      .limit(limit)
      .offset(offset)
      .orderBy(projects.createdAt);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET /api/projects error:', error);
    return jsonError(request, error, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const originBlock = checkOrigin(request);
    if (originBlock) return originBlock;

    const body = await request.json();
    const { name, status } = body;

    // Validate required field
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ 
        error: "Name is required and cannot be empty",
        code: "MISSING_NAME" 
      }, { status: 400 });
    }

    // Validate status if provided
    if (status && !['saved', 'unsaved'].includes(status)) {
      return NextResponse.json({ 
        error: "Status must be either 'saved' or 'unsaved'",
        code: "INVALID_STATUS" 
      }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Create new project
    const newProject = await db.insert(projects)
      .values({
        name: name.trim(),
        status: status || 'unsaved',
        createdAt: now,
        updatedAt: now
      })
      .returning();

    return NextResponse.json(newProject[0], { status: 201 });
  } catch (error) {
    console.error('POST /api/projects error:', error);
    return jsonError(request, error, 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const originBlock = checkOrigin(request);
    if (originBlock) return originBlock;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if project exists
    const existingProject = await db.select()
      .from(projects)
      .where(eq(projects.id, parseInt(id)))
      .limit(1);

    if (existingProject.length === 0) {
      return NextResponse.json({ 
        error: 'Project not found',
        code: "PROJECT_NOT_FOUND" 
      }, { status: 404 });
    }

    const body = await request.json();
    const { name, status } = body;

    // Validate name if provided
    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
      return NextResponse.json({ 
        error: "Name cannot be empty",
        code: "INVALID_NAME" 
      }, { status: 400 });
    }

    // Validate status if provided
    if (status !== undefined && !['saved', 'unsaved'].includes(status)) {
      return NextResponse.json({ 
        error: "Status must be either 'saved' or 'unsaved'",
        code: "INVALID_STATUS" 
      }, { status: 400 });
    }

    // Prepare updates
    const updates: { name?: string; status?: string; updatedAt: string } = {
      updatedAt: new Date().toISOString()
    };

    if (name !== undefined) {
      updates.name = name.trim();
    }

    if (status !== undefined) {
      updates.status = status;
    }

    // Update project
    const updatedProject = await db.update(projects)
      .set(updates)
      .where(eq(projects.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedProject[0], { status: 200 });
  } catch (error) {
    console.error('PUT /api/projects error:', error);
    return jsonError(request, error, 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const originBlock = checkOrigin(request);
    if (originBlock) return originBlock;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if project exists
    const existingProject = await db.select()
      .from(projects)
      .where(eq(projects.id, parseInt(id)))
      .limit(1);

    if (existingProject.length === 0) {
      return NextResponse.json({ 
        error: 'Project not found',
        code: "PROJECT_NOT_FOUND" 
      }, { status: 404 });
    }

    // Delete project
    const deletedProject = await db.delete(projects)
      .where(eq(projects.id, parseInt(id)))
      .returning();

    return NextResponse.json({ 
      message: 'Project deleted successfully',
      project: deletedProject[0]
    }, { status: 200 });
  } catch (error) {
    console.error('DELETE /api/projects error:', error);
    return jsonError(request, error, 500);
  }
}