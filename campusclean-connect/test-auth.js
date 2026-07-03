const { createClient } = require('@supabase/supabase-js');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing environment variables. Make sure to run with --env-file=.env");
  process.exit(1);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  try {
    console.log("=== AUTH DIAGNOSTIC START ===");
    const { data, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error("Error object:", JSON.stringify(error, null, 2));
      console.error("Error keys:", Object.keys(error));
      console.error("Error properties:", error.message, error.status, error.name);
    } else {
      console.log(`Users count: ${data.users.length}`);
    }
    console.log("=== AUTH DIAGNOSTIC END ===");
  } catch (err) {
    console.error("Unhandled error:", err);
  }
}

run();
