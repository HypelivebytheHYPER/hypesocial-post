import { NextRequest, NextResponse } from "next/server";
import { larkSearchRecords, larkCreateRecords, filterAnd, eq } from "@/lib/lark";
import { randomUUID } from "crypto";

const TABLE_ID = process.env.LARK_MOODBOARD_PROJECTS_TABLE_ID!;

/**
 * GET /api/moodboard/projects
 * List all non-archived projects.
 */
export async function GET() {
  try {
    const data = await larkSearchRecords(
      TABLE_ID,
      filterAnd(eq("archived", false)),
    );

    const projects = (data.items || []).map((r) => ({
      id: r.fields.project_id as string,
      record_id: r.record_id,
      name: r.fields.name as string,
      description: (r.fields.description as string) || "",
      created_at: r.fields.created_at as string,
      updated_at: r.fields.updated_at as string,
      week_notes: r.fields.week_notes
        ? JSON.parse(r.fields.week_notes as string)
        : {},
    }));

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("[API] List projects error:", error);
    return NextResponse.json(
      { error: "Failed to list projects" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/moodboard/projects
 * Create a new project.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body?.name) {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const projectId = randomUUID();

    const records = await larkCreateRecords(TABLE_ID, [
      {
        project_id: projectId,
        name: body.name,
        description: body.description || "",
        created_at: now,
        updated_at: now,
        created_by: body.created_by || "",
        week_notes: "{}",
        archived: false,
      },
    ]);

    return NextResponse.json(
      {
        id: projectId,
        record_id: records[0]?.record_id,
        name: body.name,
        description: body.description || "",
        created_at: now,
        updated_at: now,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[API] Create project error:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 },
    );
  }
}
