const { createClient } = require('@supabase/supabase-js');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing env vars");
  process.exit(1);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log("Testing fetchClientBookings query...");
  // Use a valid client ID from our diagnostic run, e.g. Joseph (56fe93e1-c700-461f-91fc-df54d724a032)
  const clientId = '56fe93e1-c700-461f-91fc-df54d724a032';

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      service_type:service_types(*),
      cleaner:profiles!bookings_cleaner_id_fkey(*)
    `)
    .eq('client_id', clientId);

  if (error) {
    console.error("Query failed:", error.message);
    console.error("Error details:", error);
  } else {
    console.log("Query succeeded! Fetched rows:", data.length);
    if (data.length > 0) {
      console.log("First booking details:");
      console.log(JSON.stringify(data[0], null, 2));
    }
  }
}

run();
