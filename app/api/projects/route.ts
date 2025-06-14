import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "../../../lib/db";
import { projects } from "../../../lib/db/schemas/projects";
import { apiKeys } from "@/lib/db/schemas/apikey";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  const { userId } = await auth();

  console.log("GET /api/projects - userId:", userId);

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch projects with their API keys
    const userProjects = await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        startDate: projects.startDate,
        endDate: projects.endDate,
        githublink: projects.githublink,
        leader: projects.leader,
        userId: projects.userId,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
      })
      .from(projects)
      .where(eq(projects.userId, userId));

    // Fetch API keys for each project
    const projectsWithApiKeys = await Promise.all(
      userProjects.map(async (project) => {
        const projectApiKeys = await db
          .select()
          .from(apiKeys)
          .where(eq(apiKeys.projectId, project.id));
        
        return {
          ...project,
          apiKeys: projectApiKeys
        };
      })
    );

    console.log("GET /api/projects - Fetched projects for user", userId, ":", projectsWithApiKeys);
    return NextResponse.json(projectsWithApiKeys);
  } catch (error) {
    console.error("GET /api/projects - Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, description, githublink, startDate, endDate, leader, apiKeys: submittedApiKeys } = body;

  if (!name || !githublink || !leader) {
    return NextResponse.json(
      { message: "Project name, GitHub link, and leader are required" },
      { status: 400 }
    );
  }

  try {
    // Start a transaction to ensure data consistency
    const result = await db.transaction(async (tx) => {
      // Create the project with user-entered values
      const newProject = await tx
        .insert(projects)
        .values({
          name,
          description: description || null,
          githublink,
          leader: leader, // Use the user-entered leader name, not userId
          userId: userId, // Keep userId for ownership tracking
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      const projectId = newProject[0].id;

      // If API keys were provided, insert them
      let insertedApiKeys: typeof apiKeys.$inferSelect[] = [];
      if (submittedApiKeys && submittedApiKeys.length > 0) {
        // Validate that API keys have both name and key
        const validApiKeys = submittedApiKeys.filter(
          (apiKey: any) => apiKey.name?.trim() && apiKey.key?.trim()
        );

        if (validApiKeys.length > 0) {
          // Optional: Check for duplicate API keys across all projects
          // Comment out this section if you want to allow duplicate API keys across projects
          /*
          const existingKeys = await tx
            .select({ key: apiKeys.key })
            .from(apiKeys);
          
          const existingKeyValues = existingKeys.map(k => k.key);
          const duplicateKeys = validApiKeys.filter(
            (apiKey: any) => existingKeyValues.includes(apiKey.key)
          );

          if (duplicateKeys.length > 0) {
            throw new Error(`API key already exists: ${duplicateKeys[0].key}`);
          }
          */

          // Insert API keys
          insertedApiKeys = await tx
            .insert(apiKeys)
            .values(
              validApiKeys.map((apiKey: any) => ({
                projectId: projectId,
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
        project: newProject[0],
        apiKeys: insertedApiKeys
      };
    });

    console.log("POST /api/projects - Created project:", result);
    return NextResponse.json({
      ...result.project,
      apiKeys: result.apiKeys
    }, { status: 201 });

  } catch (error: any) {
    console.error("POST /api/projects - Error:", error);
    
    if (error.message?.includes("API key already exists")) {
      return NextResponse.json(
        { message: error.message },
        { status: 409 }
      );
    }
    
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}