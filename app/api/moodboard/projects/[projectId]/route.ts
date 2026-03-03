import { NextRequest, NextResponse } from "next/server";
import {
  larkSearchRecords,
  larkUpdateRecords,
  filterAnd,
  eq,
  larkDateToISO,
  larkText,
} from "@/lib/lark";
import { parseBody } from "@/lib/validations";
import { UpdateProjectSchema } from "@/lib/validations/moodboard";

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
        { error: "Not Found", message: "Project not found", statusCode: 404 },
        { status: 404 },
      );
    }

    const weekNotesRaw = larkText(record.fields.week_notes);
    let weekNotes = {};
    try {
      weekNotes = weekNotesRaw ? JSON.parse(weekNotesRaw) : {};
    } catch {
      weekNotes = {};
    }

    return NextResponse.json({
      id: larkText(record.fields.project_id),
      record_id: record.record_id,
      name: larkText(record.fields.name),
      description: larkText(record.fields.description),
      created_at: larkDateToISO(record.fields.created_at),
      updated_at: larkDateToISO(record.fields.updated_at),
      week_notes: weekNotes,
    });
  } catch (error) {
    console.error("[API] Get project error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to get project", statusCode: 500 },
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
        { error: "Not Found", message: "Project not found", statusCode: 404 },
        { status: 404 },
      );
    }

    const jsonBody = await request.json().catch(() => null);

    const parsed = parseBody(UpdateProjectSchema, jsonBody);
    if (!parsed.success) return parsed.response;

    const body = parsed.data;
    const fields: Record<string, unknown> = {
      updated_at: Date.now(),
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
      { error: "Internal Server Error", message: "Failed to update project", statusCode: 500 },
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
        { error: "Not Found", message: "Project not found", statusCode: 404 },
        { status: 404 },
      );
    }

    await larkUpdateRecords(TABLE_ID, [
      {
        record_id: record.record_id,
        fields: { archived: true, updated_at: Date.now() },
      },
    ]);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[API] Delete project error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to delete project", statusCode: 500 },
      { status: 500 },
    );
  }
}
