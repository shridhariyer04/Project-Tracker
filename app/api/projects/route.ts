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
<<<<<<< HEAD
    // Fetch projects for the user
=======
    console.log('🚀 [GET /api/projects] - Querying for projects');

>>>>>>> 9b0a46bc028a20f502d3c8b395959f005c0158eb
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

<<<<<<< HEAD
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

=======
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
>>>>>>> 9b0a46bc028a20f502d3c8b395959f005c0158eb
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
<<<<<<< HEAD
  const {
    name,
    description,
    githublink,
    startDate,
    endDate,
    leader,
    apiKeys: submittedApiKeys,
  } = body;
=======

  console.log('🚀 [POST /api/projects] - Received body!', body);

  const { name, description, githublink, startDate, endDate, leader, apiKeys: submittedApiKeys } = body;
>>>>>>> 9b0a46bc028a20f502d3c8b395959f005c0158eb

  if (!name || !githublink || !leader) {
    console.log('❌ [POST /api/projects] - Validation failed');
    return NextResponse.json(
      { message: "Project name, GitHub link, and leader are required" },
      { status: 400 }
    );
  }
  
  try {
<<<<<<< HEAD
    const result = await db.transaction(async (tx) => {
      // Insert project
=======
    console.log('🚀 [POST /api/projects] - Starting transaction');

    const result = await db.transaction(async (tx) => {
      console.log('🚀 [POST /api/projects] - Inserting into projects');
>>>>>>> 9b0a46bc028a20f502d3c8b395959f005c0158eb
      const newProject = await tx
        .insert(projects)
        .values({ 
          name,
          description: description || null,
          githublink,
<<<<<<< HEAD
          leader,
          userId, // ensure this is text() in schema
=======
          leader: leader,
          userId: userId,
>>>>>>> 9b0a46bc028a20f502d3c8b395959f005c0158eb
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          createdAt: new Date(), 
          updatedAt: new Date()
        })
        .returning();

      console.log('🚀 [POST /api/projects] - Project inserted!', newProject[0]);

      const projectId = newProject[0].id;

<<<<<<< HEAD
      // Handle API keys
=======
>>>>>>> 9b0a46bc028a20f502d3c8b395959f005c0158eb
      let insertedApiKeys: typeof apiKeys.$inferSelect[] = [];

      if (submittedApiKeys && submittedApiKeys.length > 0) {
<<<<<<< HEAD
=======
        console.log('🚀 [POST /api/projects] - API keys provided!', { count: submittedApiKeys.length });

>>>>>>> 9b0a46bc028a20f502d3c8b395959f005c0158eb
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
<<<<<<< HEAD
                name: apiKey.name.trim(),
                key: apiKey.key.trim(),
                createdAt: new Date(),
                updatedAt: new Date(),
=======
                name: apiKey.name.trim(), 
                key: apiKey.key.trim(), 
                createdAt: new Date(), 
                updatedAt: new Date()
>>>>>>> 9b0a46bc028a20f502d3c8b395959f005c0158eb
              }))
            )
            .returning();

          console.log('🚀 [POST /api/projects] - API keys successfully inserted!', { count: insertedApiKeys.length });
        }
      }
<<<<<<< HEAD

      return {
        project: newProject[0],
        apiKeys: insertedApiKeys,
      };
    });

    console.log("POST /api/projects - Created project:", result);
=======
  
      return { project: newProject[0], apiKeys: insertedApiKeys };
    });

    console.log('🚀 [POST /api/projects] - Transaction complete!', result);
    return NextResponse.json({ 
      ...result.project, 
      apiKeys: result.apiKeys 
    }, { status: 201 });
>>>>>>> 9b0a46bc028a20f502d3c8b395959f005c0158eb

    return NextResponse.json(
      {
        ...result.project,
        apiKeys: result.apiKeys,
      },
      { status: 201 }
    );
  } catch (error: any) {
<<<<<<< HEAD
    console.error("POST /api/projects - Error:", JSON.stringify(error, null, 2));
    if (error.message?.includes("API key already exists")) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }

    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
=======
    console.error('❌ [POST /api/projects] - Error!', error);
    if (error?.message?.includes("API key already exists")) {
      return NextResponse.json({ message: error?.message }, { status: 409 });
    }
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}


// export async function GET(req: Request) {
//   const { userId } = await auth();

//   console.log("GET /api/projects - userId:", userId);

//   if (!userId) {
//     return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
//   }

//   try {
//     // Fetch projects with their API keys
//     const userProjects = await db
//       .select({
//         id: projects.id,
//         name: projects.name,
//         description: projects.description,
//         startDate: projects.startDate,
//         endDate: projects.endDate,
//         githublink: projects.githublink,
//         leader: projects.leader,
//         userId: projects.userId,
//         createdAt: projects.createdAt,
//         updatedAt: projects.updatedAt,
//       })
//       .from(projects)
//       .where(eq(projects.userId, userId));

//     // Fetch API keys for each project
//     const projectsWithApiKeys = await Promise.all(
//       userProjects.map(async (project) => {
//         const projectApiKeys = await db
//           .select()
//           .from(apiKeys)
//           .where(eq(apiKeys.projectId, project.id));
        
//         return {
//           ...project,
//           apiKeys: projectApiKeys
//         };
//       })
//     );

//     console.log("GET /api/projects - Fetched projects for user", userId, ":", projectsWithApiKeys);
//     return NextResponse.json(projectsWithApiKeys);
//   } catch (error) {
//     console.error("GET /api/projects - Error:", error);
//     return NextResponse.json({ message: "Internal server error" }, { status: 500 });
//   }
// }

// export async function POST(req: Request) {
//   const { userId } = await auth();

//   if (!userId) {
//     return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
//   }

//   const body = await req.json();
//   const { name, description, githublink, startDate, endDate, leader, apiKeys: submittedApiKeys } = body;

//   if (!name || !githublink || !leader) {
//     return NextResponse.json(
//       { message: "Project name, GitHub link, and leader are required" },
//       { status: 400 }
//     );
//   }

//   try {
//     // Start a transaction to ensure data consistency
//     const result = await db.transaction(async (tx) => {
//       // Create the project with user-entered values
//       const newProject = await tx
//         .insert(projects)
//         .values({
//           name,
//           description: description || null,
//           githublink,
//           leader: leader, // Use the user-entered leader name, not userId
//           userId: userId, // Keep userId for ownership tracking
//           startDate: startDate ? new Date(startDate) : null,
//           endDate: endDate ? new Date(endDate) : null,
//           createdAt: new Date(),
//           updatedAt: new Date(),
//         })
//         .returning();

//       const projectId = newProject[0].id;

//       // If API keys were provided, insert them
//       let insertedApiKeys: typeof apiKeys.$inferSelect[] = [];
//       if (submittedApiKeys && submittedApiKeys.length > 0) {
//         // Validate that API keys have both name and key
//         const validApiKeys = submittedApiKeys.filter(
//           (apiKey: any) => apiKey.name?.trim() && apiKey.key?.trim()
//         );

//         if (validApiKeys.length > 0) {
//           // Optional: Check for duplicate API keys across all projects
//           // Comment out this section if you want to allow duplicate API keys across projects
//           /*
//           const existingKeys = await tx
//             .select({ key: apiKeys.key })
//             .from(apiKeys);
          
//           const existingKeyValues = existingKeys.map(k => k.key);
//           const duplicateKeys = validApiKeys.filter(
//             (apiKey: any) => existingKeyValues.includes(apiKey.key)
//           );

//           if (duplicateKeys.length > 0) {
//             throw new Error(`API key already exists: ${duplicateKeys[0].key}`);
//           }
//           */

//           // Insert API keys
//           insertedApiKeys = await tx
//             .insert(apiKeys)
//             .values(
//               validApiKeys.map((apiKey: any) => ({
//                 projectId: projectId,
//                 name: apiKey.name.trim(),
//                 key: apiKey.key.trim(),
//                 createdAt: new Date(),
//                 updatedAt: new Date(),
//               }))
//             )
//             .returning();
//         }
//       }

//       return {
//         project: newProject[0],
//         apiKeys: insertedApiKeys
//       };
//     });

//     console.log("POST /api/projects - Created project:", result);
//     return NextResponse.json({
//       ...result.project,
//       apiKeys: result.apiKeys
//     }, { status: 201 });

//   } catch (error: any) {
//     console.error("POST /api/projects - Error:", error);
    
//     if (error.message?.includes("API key already exists")) {
//       return NextResponse.json(
//         { message: error.message },
//         { status: 409 }
//       );
//     }
    
//     return NextResponse.json({ message: "Internal server error" }, { status: 500 });
//   }
// }
>>>>>>> 9b0a46bc028a20f502d3c8b395959f005c0158eb
