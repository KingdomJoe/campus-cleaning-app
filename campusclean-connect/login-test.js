const { createClient } = require('@supabase/supabase-js');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error("Missing environment variables. Make sure to run with --env-file=.env");
  process.exit(1);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function run() {
  try {
    console.log("=== LOGIN TEST START ===");
    console.log("Attempting sign in with client1@student.edu...");
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'client1@student.edu',
      password: 'Password123!',
    });

    if (error) {
      console.error("Login failed! Error:", error.message, "Status:", error.status);
    } else {
      console.log("Login successful! User ID:", data.user.id);
      console.log("User metadata:", data.user.user_metadata);
    }
    console.log("=== LOGIN TEST END ===");
  } catch (err) {
    console.error("Unhandled error:", err);
  }
}

run();
