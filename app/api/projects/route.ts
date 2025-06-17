import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "../../../lib/db";
import { projects } from "../../../lib/db/schemas/projects";
import { apiKeys } from "@/lib/db/schemas/apikey";
import { eq } from "drizzle-orm";
export async function GET(req: Request) {
  console.log('🚀 [GET /api/projects] - Started');
  const { userId } = await auth();

  console.log('🚀 [GET /api/projects] - Auth finished, userId?', userId);

  if (!userId) {
    console.log('❌ [GET /api/projects] - Unauthorized');
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  
  try {
    console.log('🚀 [GET /api/projects] - Querying for projects');

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

    console.log('🚀 [GET /api/projects] - Fetched projects!', { count: userProjects.length });

    const projectsWithApiKeys = [];

    for (const project of userProjects) {
      console.log('🚀 [GET /api/projects] - Querying API keys for projectId=', project.id);
      const projectApiKeys = await db
        .select()
        .from(apiKeys)
        .where(eq(apiKeys.projectId, project.id));

      console.log('🚀 [GET /api/projects] - API keys fetched!', { count: projectApiKeys.length });

      projectsWithApiKeys.push({ 
        ...project, 
        apiKeys: projectApiKeys 
      });
    }
  
    console.log('🚀 [GET /api/projects] - Returning', { total: projectsWithApiKeys.length });

    return NextResponse.json(projectsWithApiKeys);
  } catch (error) {
    console.error('❌ [GET /api/projects] - Error!', error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  console.log('🚀 [POST /api/projects] - Started');
  const { userId } = await auth();

  console.log('🚀 [POST /api/projects] - Auth finished, userId?', userId);

  if (!userId) {
    console.log('❌ [POST /api/projects] - Unauthorized');
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  
  const body = await req.json();

  console.log('🚀 [POST /api/projects] - Received body!', body);

  const { name, description, githublink, startDate, endDate, leader, apiKeys: submittedApiKeys } = body;

  if (!name || !githublink || !leader) {
    console.log('❌ [POST /api/projects] - Validation failed');
    return NextResponse.json(
      { message: "Project name, GitHub link, and leader are required" },
      { status: 400 }
    );
  }
  
  try {
    console.log('🚀 [POST /api/projects] - Starting transaction');

    const result = await db.transaction(async (tx) => {
      console.log('🚀 [POST /api/projects] - Inserting into projects');
      const newProject = await tx
        .insert(projects)
        .values({ 
          name,
          description: description || null,
          githublink,
          leader: leader,
          userId: userId,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          createdAt: new Date(), 
          updatedAt: new Date()
        })
        .returning();

      console.log('🚀 [POST /api/projects] - Project inserted!', newProject[0]);

      const projectId = newProject[0].id;

      let insertedApiKeys: typeof apiKeys.$inferSelect[] = [];

      if (submittedApiKeys && submittedApiKeys.length > 0) {
        console.log('🚀 [POST /api/projects] - API keys provided!', { count: submittedApiKeys.length });

        const validApiKeys = submittedApiKeys.filter(
          (apiKey: any) => apiKey.name?.trim() && apiKey.key?.trim()
        );

        console.log('🚀 [POST /api/projects] - Valid API keys!', { count: validApiKeys.length });

        if (validApiKeys.length > 0) {
          insertedApiKeys = await tx
            .insert(apiKeys)
            .values(
              validApiKeys.map((apiKey: any) => ({
                projectId,
                name: apiKey.name.trim(), 
                key: apiKey.key.trim(), 
                createdAt: new Date(), 
                updatedAt: new Date()
              }))
            )
            .returning();

          console.log('🚀 [POST /api/projects] - API keys successfully inserted!', { count: insertedApiKeys.length });
        }
      }
  
      return { project: newProject[0], apiKeys: insertedApiKeys };
    });

    console.log('🚀 [POST /api/projects] - Transaction complete!', result);
    return NextResponse.json({ 
      ...result.project, 
      apiKeys: result.apiKeys 
    }, { status: 201 });

  } catch (error: any) {
    console.error('❌ [POST /api/projects] - Error!', error);
    if (error?.message?.includes("API key already exists")) {
      return NextResponse.json({ message: error?.message }, { status: 409 });
    }
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}