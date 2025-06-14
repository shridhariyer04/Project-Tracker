import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "../../../lib/db";
import { issues, projects } from "../../../lib/db/schemas";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json({ message: "Project ID is required" }, { status: 400 });
  }

  try {
    const projectIssues = await db
      .select()
      .from(issues)
      .where(eq(issues.projectId, projectId));
    console.log("GET /api/issues - Fetched issues:", projectIssues);
    return NextResponse.json(projectIssues);
  } catch (error) {
    console.error("GET /api/issues - Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { userId } = await auth();

  console.log("POST /api/issues - userId:", userId);

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { title, description, priority, status, projectId } = body;

  console.log("POST /api/issues - Request Body:", body);

  if (!title || !projectId) {
    return NextResponse.json(
      { message: "Title and project ID are required" },
      { status: 400 }
    );
  }

  try {
    // Validate projectId exists in projects table
    const projectExists = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (projectExists.length === 0) {
      console.log("POST /api/issues - Project not found:", projectId);
      return NextResponse.json(
        { message: "Project not found" },
        { status: 404 }
      );
    }

    const newIssue = await db
      .insert(issues)
      .values({
        title,
        description: description || null,
        priority: priority || "low",
        status: status || "open",
        projectId,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(), // Optional, since defaultNow() will handle it
      })
      .returning();

    console.log("POST /api/issues - Created issue:", newIssue);
    return NextResponse.json(newIssue[0], { status: 201 });
  } catch (error: any) {
    console.error("POST /api/issues - Error:", error.message, error.cause);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { issueId, priority } = body;

  if (!issueId || !priority) {
    return NextResponse.json(
      { message: "Issue ID and priority are required" },
      { status: 400 }
    );
  }

  try {
    const updatedIssue = await db
      .update(issues)
      .set({
        priority,
        updatedAt: new Date(), // Update the timestamp on modification
      })
      .where(eq(issues.id, issueId))
      .returning();
    console.log("PUT /api/issues - Updated issue:", updatedIssue);
    return NextResponse.json(updatedIssue[0]);
  } catch (error) {
    console.error("PUT /api/issues - Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { issueId } = body;

  if (!issueId) {
    return NextResponse.json({ message: "Issue ID is required" }, { status: 400 });
  }

  try {
    await db.delete(issues).where(eq(issues.id, issueId));
    console.log("DELETE /api/issues - Deleted issue:", issueId);
    return NextResponse.json({ message: "Issue deleted" });
  } catch (error) {
    console.error("DELETE /api/issues - Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}