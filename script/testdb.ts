// import { db } from "../lib/db";
// import { projects } from "../lib/db/schemas";


// async function testConnection() {
//   try {
//     const inserted = await db.insert(projects).values({
//       name: "Test Project",
//       description: "Testing",
//       githublink: "https://github.com/test",
//       leader: "Shridhar",
//       apikey: `test-${Date.now()}`
//     }).returning();

//     console.log("✅ Inserted:", inserted);
//   } catch (err) {
//     console.error("❌ Error:", err);
//   }
// }

// testConnection();
