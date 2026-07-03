const { createClient } = require('@supabase/supabase-js');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error("Missing environment variables.");
  process.exit(1);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function run() {
  try {
    console.log("=== LOGIN NEW TEST START ===");
    console.log("Attempting sign in with newly created gmail user...");
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'testuser_1783000069841@gmail.com',
      password: 'Password123!',
    });

    if (error) {
      console.error("Login failed! Error:", error.message, "Status:", error.status);
    } else {
      console.log("Login successful! User ID:", data.user.id);
    }
    console.log("=== LOGIN NEW TEST END ===");
  } catch (err) {
    console.error("Unhandled error:", err);
  }
}

run();
