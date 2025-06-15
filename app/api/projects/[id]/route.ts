import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schemas/projects";
import { apiKeys } from "@/lib/db/schemas/apikey";
import { eq, and } from "drizzle-orm";

// Define the proper type for params
interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET single project by ID
export async function GET(
  req: Request,
  context: RouteContext
) {
  const { id } = await context.params;
  const { userId } = await auth();

  console.log("GET /api/projects/[id] - userId:", userId, "projectId:", id);

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const project = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.userId, userId)))
      .limit(1);

    if (project.length === 0) {
      return NextResponse.json({ message: "Project not found" }, { status: 404 });
    }

    // Fetch API keys for this project
    const projectApiKeys = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.projectId, id));

    const projectWithApiKeys = {
      ...project[0],
      apiKeys: projectApiKeys
    };

    console.log("GET /api/projects/[id] - Found project:", projectWithApiKeys);
    return NextResponse.json(projectWithApiKeys);
  } catch (error) {
    console.error("GET /api/projects/[id] - Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// PUT update project by ID
export async function PUT(
  req: Request,
  context: RouteContext
) {
  const { id } = await context.params;
  const { userId } = await auth();

  console.log("PUT /api/projects/[id] - userId:", userId, "projectId:", id);

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, description, githublink, startDate, endDate, leader, apiKeys: submittedApiKeys } = body;

  console.log("PUT /api/projects/[id] - Request body:", body);

  if (!name || !githublink || !leader) {
    return NextResponse.json(
      { message: "Project name, GitHub link, and leader are required" },
      { status: 400 }
    );
  }

  try {
    // Start a transaction to ensure data consistency
    const result = await db.transaction(async (tx) => {
      // First check if the project exists and belongs to the user
      const existingProject = await tx
        .select()
        .from(projects)
        .where(and(eq(projects.id, id), eq(projects.userId, userId)))
        .limit(1);

      if (existingProject.length === 0) {
        throw new Error("Project not found or access denied");
      }

      // Update the project
      const updatedProject = await tx
        .update(projects)
        .set({
          name,
          description: description || null,
          githublink,
          leader: leader, // Use the user-entered leader name
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          updatedAt: new Date(),
        })
        .where(and(eq(projects.id, id), eq(projects.userId, userId)))
        .returning();

      if (updatedProject.length === 0) {
        throw new Error("Failed to update project");
      }

      // Handle API keys update
      // First, delete all existing API keys for this project
      await tx
        .delete(apiKeys)
        .where(eq(apiKeys.projectId, id));

      // Then insert new API keys if provided
      let insertedApiKeys: typeof apiKeys.$inferSelect[] = [];
      if (submittedApiKeys && submittedApiKeys.length > 0) {
        const validApiKeys = submittedApiKeys.filter(
          (apiKey: any) => apiKey.name?.trim() && apiKey.key?.trim()
        );

        if (validApiKeys.length > 0) {
          insertedApiKeys = await tx
            .insert(apiKeys)
            .values(
              validApiKeys.map((apiKey: any) => ({
                projectId: id,
                name: apiKey.name.trim(),
                key: apiKey.key.trim(),
                createdAt: new Date(),
                updatedAt: new Date(),
              }))
            )
            .returning();
        }
      }

      return {
        project: updatedProject[0],
        apiKeys: insertedApiKeys
      };
    });

    console.log("PUT /api/projects/[id] - Updated project:", result);
    return NextResponse.json({
      ...result.project,
      apiKeys: result.apiKeys
    });
  } catch (error: any) {
    console.error("PUT /api/projects/[id] - Error:", error);
    
    if (error.message?.includes("Project not found") || error.message?.includes("Failed to update")) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// PATCH update project by ID (alternative method)
export async function PATCH(
  req: Request,
  context: RouteContext
) {
  return PUT(req, context); // Reuse PUT logic
}

// DELETE project by ID
export async function DELETE(
  req: Request,
  context: RouteContext
) {
  const { id } = await context.params;
  const { userId } = await auth();

  console.log("DELETE /api/projects/[id] - userId:", userId, "projectId:", id);

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    // The cascade delete will automatically remove associated API keys
    const deletedProject = await db
      .delete(projects)
      .where(and(eq(projects.id, id), eq(projects.userId, userId)))
      .returning();

    if (deletedProject.length === 0) {
      return NextResponse.json({ message: "Project not found or access denied" }, { status: 404 });
    }

    console.log("DELETE /api/projects/[id] - Deleted project:", deletedProject[0]);
    return NextResponse.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/projects/[id] - Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}