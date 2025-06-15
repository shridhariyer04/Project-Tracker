import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "../../../../lib/db";
import { projects } from "../../../../lib/db/schemas/projects";
import { apiKeys } from "../../../../lib/db/schemas/apikey";
import { eq, and } from "drizzle-orm";

// GET single API key
export async function GET(
  request: NextRequest,
  { params }: { params: Record<string, string> }
) {
  const id = params.id;
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get the API key with project info to verify ownership
    const result = await db
      .select({ apiKey: apiKeys, project: projects })
      .from(apiKeys)
      .innerJoin(projects, eq(apiKeys.projectId, projects.id))
      .where(and(eq(apiKeys.id, id), eq(projects.userId, userId)))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { message: "API key not found or unauthorized" },
        { status: 404 }
      );
    }

    console.log("GET /api/apikeys/[id] - Fetched API key:", result[0].apiKey);
    return NextResponse.json(result[0].apiKey);
  } catch (error) {
    console.error("GET /api/apikeys/[id] - Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// UPDATE API key
export async function PUT(
  request: NextRequest,
  { params }: { params: Record<string, string> }
) {
  const id = params.id;
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, key } = body;

    if (!name || !key) {
      return NextResponse.json(
        { message: "Name and key are required" },
        { status: 400 }
      );
    }

    // First verify the API key belongs to a project owned by the user
    const existingResult = await db
      .select({ apiKey: apiKeys, project: projects })
      .from(apiKeys)
      .innerJoin(projects, eq(apiKeys.projectId, projects.id))
      .where(and(eq(apiKeys.id, id), eq(projects.userId, userId)))
      .limit(1);

    if (existingResult.length === 0) {
      return NextResponse.json(
        { message: "API key not found or unauthorized" },
        { status: 404 }
      );
    }

    const projectId = existingResult[0].apiKey.projectId;

    // Check for duplicate name within the same project (excluding current API key)
    const duplicateCheck = await db
      .select()
      .from(apiKeys)
      .where(
        and(
          eq(apiKeys.projectId, projectId),
          eq(apiKeys.name, name.trim()),
          eq(apiKeys.id, id) // Exclude current API key from check
        )
      )
      .limit(1);

    // If we found a duplicate that's not the current API key, return error
    if (duplicateCheck.length > 0 && duplicateCheck[0].id !== id) {
      return NextResponse.json(
        { message: "An API key with this name already exists in this project" },
        { status: 409 }
      );
    }

    // Update the API key
    const updatedApiKey = await db
      .update(apiKeys)
      .set({ name: name.trim(), key: key.trim(), updatedAt: new Date() })
      .where(eq(apiKeys.id, id))
      .returning();

    console.log("PUT /api/apikeys/[id] - Updated API key:", updatedApiKey[0]);
    return NextResponse.json(updatedApiKey[0]);
  } catch (error: any) {
    console.error("PUT /api/apikeys/[id] - Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// DELETE API key
export async function DELETE(
  request: NextRequest,
  { params }: { params: Record<string, string> }
) {
  const id = params.id;
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    // First verify the API key belongs to a project owned by the user
    const existingResult = await db
      .select({ apiKey: apiKeys, project: projects })
      .from(apiKeys)
      .innerJoin(projects, eq(apiKeys.projectId, projects.id))
      .where(and(eq(apiKeys.id, id), eq(projects.userId, userId)))
      .limit(1);

    if (existingResult.length === 0) {
      return NextResponse.json(
        { message: "API key not found or unauthorized" },
        { status: 404 }
      );
    }

    // Delete the API key
    await db.delete(apiKeys).where(eq(apiKeys.id, id));

    console.log("DELETE /api/apikeys/[id] - Deleted API key:", id);
    return NextResponse.json({ message: "API key deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/apikeys/[id] - Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
