import { NextRequest, NextResponse } from "next/server";
import {
  larkSearchRecords,
  larkUpdateRecords,
  filterAnd,
  eq,
} from "@/lib/lark";

const TABLE_ID = process.env.LARK_MOODBOARD_PROJECTS_TABLE_ID!;

async function findProject(projectId: string) {
  const data = await larkSearchRecords(
    TABLE_ID,
    filterAnd(eq("project_id", projectId)),
    1,
  );
  return data.items?.[0] ?? null;
}

/**
 * GET /api/moodboard/projects/[projectId]
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params;
    const record = await findProject(projectId);

    if (!record) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      id: record.fields.project_id as string,
      record_id: record.record_id,
      name: record.fields.name as string,
      description: (record.fields.description as string) || "",
      created_at: record.fields.created_at as string,
      updated_at: record.fields.updated_at as string,
      week_notes: record.fields.week_notes
        ? JSON.parse(record.fields.week_notes as string)
        : {},
    });
  } catch (error) {
    console.error("[API] Get project error:", error);
    return NextResponse.json(
      { error: "Failed to get project" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/moodboard/projects/[projectId]
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params;
    const record = await findProject(projectId);

    if (!record) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 },
      );
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    const fields: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (body.name !== undefined) fields.name = body.name;
    if (body.description !== undefined) fields.description = body.description;
    if (body.week_notes !== undefined)
      fields.week_notes = JSON.stringify(body.week_notes);
    if (body.archived !== undefined) fields.archived = body.archived;

    await larkUpdateRecords(TABLE_ID, [
      { record_id: record.record_id, fields },
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Update project error:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/moodboard/projects/[projectId]
 * Soft delete (archive).
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params;
    const record = await findProject(projectId);

    if (!record) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 },
      );
    }

    await larkUpdateRecords(TABLE_ID, [
      {
        record_id: record.record_id,
        fields: { archived: true, updated_at: new Date().toISOString() },
      },
    ]);

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("[API] Delete project error:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 },
    );
  }
}
