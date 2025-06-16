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
    // Fetch projects for the user
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
      .where(eq(projects.userId, userId)); // ensure userId column is text()

    console.log("Projects fetched:", userProjects);

    // Fetch API keys for each project
    const projectsWithApiKeys = await Promise.all(
      userProjects.map(async (project) => {
        console.log("Fetching API keys for project:", project.id);

        const projectApiKeys = await db
          .select()
          .from(apiKeys)
          .where(eq(apiKeys.projectId, project.id)); // ensure projectId is correct type

        return {
          ...project,
          apiKeys: projectApiKeys,
        };
      })
    );

    console.log(
      "GET /api/projects - Final response for user",
      userId,
      ":",
      projectsWithApiKeys
    );

    return NextResponse.json(projectsWithApiKeys);
  } catch (error: any) {
    console.error("GET /api/projects - Error:", JSON.stringify(error, null, 2));
    if (error instanceof Error) {
      console.error("Error.message:", error.message);
      console.error("Error.stack:", error.stack);
    }

    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    name,
    description,
    githublink,
    startDate,
    endDate,
    leader,
    apiKeys: submittedApiKeys,
  } = body;

  if (!name || !githublink || !leader) {
    return NextResponse.json(
      { message: "Project name, GitHub link, and leader are required" },
      { status: 400 }
    );
  }

  try {
    const result = await db.transaction(async (tx) => {
      // Insert project
      const newProject = await tx
        .insert(projects)
        .values({
          name,
          description: description || null,
          githublink,
          leader,
          userId, // ensure this is text() in schema
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      const projectId = newProject[0].id;

      // Handle API keys
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
                projectId,
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
        apiKeys: insertedApiKeys,
      };
    });

    console.log("POST /api/projects - Created project:", result);

    return NextResponse.json(
      {
        ...result.project,
        apiKeys: result.apiKeys,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/projects - Error:", JSON.stringify(error, null, 2));
    if (error.message?.includes("API key already exists")) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }

    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
