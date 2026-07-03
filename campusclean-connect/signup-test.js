const { createClient } = require('@supabase/supabase-js');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error("Missing environment variables.");
  process.exit(1);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function run() {
  try {
    console.log("=== SIGNUP TEST START ===");
    const testEmail = `testuser_${Date.now()}@gmail.com`;
    console.log(`Attempting sign up with: ${testEmail}...`);

    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: 'Password123!',
      options: {
        data: {
          full_name: 'Test User',
          phone: `+233${Math.floor(100000000 + Math.random() * 900000000)}`,
          role: 'client'
        }
      }
    });

    if (error) {
      console.error("Signup failed! Error:", error.message, "Status:", error.status);
    } else {
      console.log("Signup successful! User ID:", data.user?.id);
    }
    console.log("=== SIGNUP TEST END ===");
  } catch (err) {
    console.error("Unhandled error:", err);
  }
}

run();
