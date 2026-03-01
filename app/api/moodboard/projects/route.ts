import { NextRequest, NextResponse } from "next/server";
import {
  larkSearchRecords,
  larkCreateRecords,
  filterAnd,
  eq,
  larkDateToISO,
  larkText,
} from "@/lib/lark";
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

    const projects = (data.items || [])
      .filter((r) => larkText(r.fields.project_id)) // skip empty records
      .map((r) => ({
        id: larkText(r.fields.project_id),
        record_id: r.record_id,
        name: larkText(r.fields.name),
        description: larkText(r.fields.description),
        created_at: larkDateToISO(r.fields.created_at),
        updated_at: larkDateToISO(r.fields.updated_at),
        week_notes: (() => {
          const raw = larkText(r.fields.week_notes);
          try {
            return raw ? JSON.parse(raw) : {};
          } catch {
            return {};
          }
        })(),
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

    const now = Date.now();
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
        created_at: new Date(now).toISOString(),
        updated_at: new Date(now).toISOString(),
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
