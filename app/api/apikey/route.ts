import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "../../../lib/db";
import { projects } from "../../../lib/db/schemas/projects";
import { apiKeys } from "../../../lib/db/schemas/apikey";
import { eq, and } from "drizzle-orm";

export async function GET(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');

  if (!projectId) {
    return NextResponse.json({ message: "Project ID is required" }, { status: 400 });
  }

  try {
    // First verify the project belongs to the user
    const project = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
      .limit(1);

    if (project.length === 0) {
      return NextResponse.json({ message: "Project not found or unauthorized" }, { status: 404 });
    }

    // Fetch API keys for the project
    const projectApiKeys = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.projectId, projectId));

    console.log("GET /api/apikeys - Fetched API keys for project", projectId, ":", projectApiKeys);
    return NextResponse.json(projectApiKeys);
  } catch (error) {
    console.error("GET /api/apikeys - Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { projectId, name, key } = body;

    if (!projectId || !name || !key) {
      return NextResponse.json(
        { message: "Project ID, name, and key are required" },
        { status: 400 }
      );
    }

    // Verify the project belongs to the user
    const project = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
      .limit(1);

    if (project.length === 0) {
      return NextResponse.json({ message: "Project not found or unauthorized" }, { status: 404 });
    }

    // Optional: Check for duplicate API key names within the same project
    const existingApiKey = await db
      .select()
      .from(apiKeys)
      .where(and(eq(apiKeys.projectId, projectId), eq(apiKeys.name, name.trim())))
      .limit(1);

    if (existingApiKey.length > 0) {
      return NextResponse.json(
        { message: "An API key with this name already exists in this project" },
        { status: 409 }
      );
    }

    // Create the API key
    const newApiKey = await db
      .insert(apiKeys)
      .values({
        projectId,
        name: name.trim(),
        key: key.trim(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    console.log("POST /api/apikeys - Created API key:", newApiKey[0]);
    return NextResponse.json(newApiKey[0], { status: 201 });

  } catch (error: any) {
    console.error("POST /api/apikeys - Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}