const { createClient } = require('@supabase/supabase-js');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing environment variables.");
  process.exit(1);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  try {
    console.log("=== ADMIN CONFIRM TEST ===");
    const userId = 'cb647824-5111-4dba-86bc-87b9e96a8176'; // our new user's ID
    console.log(`Confirming email for user ${userId}...`);

    console.log("Listing users using admin API...");
    const { data, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error("Admin listUsers failed! Error:", error.message, "Status:", error.status);
    } else {
      console.log("Admin listUsers successful! Count:", data.users?.length);
    }
  } catch (err) {
    console.error("Unhandled error:", err);
  }
}

run();
