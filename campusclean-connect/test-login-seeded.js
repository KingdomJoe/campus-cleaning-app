const { createClient } = require('@supabase/supabase-js');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error("Missing environment variables.");
  process.exit(1);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function run() {
  try {
    console.log("=== SEEDED USER LOGIN TEST ===");
    console.log("Attempting login as client1@gmail.com...");
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'client1@gmail.com',
      password: 'Password123!',
    });

    if (error) {
      console.error("Login failed! Error:", error.message, "Status:", error.status);
    } else {
      console.log("Login successful! User ID:", data.user.id);
      console.log("Session Access Token starts with:", data.session.access_token.substring(0, 15));
    }
  } catch (err) {
    console.error("Unhandled error:", err);
  }
}

run();
