const { createClient } = require('@supabase/supabase-js');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing environment variables. Make sure to run with --env-file=.env");
  process.exit(1);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  try {
    console.log("=== DB DIAGNOSTIC START ===");
    console.log("URL:", process.env.SUPABASE_URL);

    // 1. Fetch profiles
    const { data: profiles, error: pError } = await supabase.from('profiles').select('*');
    if (pError) {
      console.error("Error fetching profiles:", pError.message);
    } else {
      console.log(`Successfully fetched profiles. Count: ${profiles.length}`);
      console.log("Profiles list:");
      profiles.forEach(p => {
        console.log(`- ID: ${p.id}, Name: "${p.full_name}", Email: "${p.email}", Role: "${p.role}", Phone: "${p.phone}"`);
      });
    }

    // 2. Fetch cleaner profiles
    const { data: cleanerProfiles, error: cpError } = await supabase.from('cleaner_profiles').select('*');
    if (cpError) {
      console.error("Error fetching cleaner profiles:", cpError.message);
    } else {
      console.log(`Successfully fetched cleaner_profiles. Count: ${cleanerProfiles.length}`);
      cleanerProfiles.forEach(cp => {
        console.log(`- User ID: ${cp.user_id}, Status: "${cp.verification_status}", Availability: "${cp.availability}"`);
      });
    }

    // 3. Fetch bookings
    const { data: bookings, error: bError } = await supabase.from('bookings').select('*');
    if (bError) {
      console.error("Error fetching bookings:", bError.message);
    } else {
      console.log(`Successfully fetched bookings. Count: ${bookings.length}`);
      bookings.forEach(b => {
        console.log(`- Booking ID: ${b.id}, Client: ${b.client_id}, Cleaner: ${b.cleaner_id}, Status: "${b.status}", Total: GH₵${b.total_price}`);
      });
    }

    // 4. Try auth test (does Kwame Mensah exist in auth?)
    const { data: users, error: uError } = await supabase.auth.admin.listUsers();
    if (uError) {
      console.error("Error fetching auth users:", uError.message);
    } else {
      console.log(`Successfully fetched auth users. Count: ${users.users.length}`);
      users.users.forEach(u => {
        console.log(`- Auth User ID: ${u.id}, Email: "${u.email}", Confirmed At: ${u.email_confirmed_at}`);
      });
    }

    console.log("=== DB DIAGNOSTIC END ===");
  } catch (err) {
    console.error("Unhandled error:", err);
  }
}

run();
