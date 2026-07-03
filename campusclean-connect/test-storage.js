const { createClient } = require('@supabase/supabase-js');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing environment variables.");
  process.exit(1);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const BUCKETS = ['avatars', 'documents', 'booking-photos'];

async function run() {
  try {
    console.log("Checking Supabase Storage buckets...");
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error("Failed to list buckets:", listError.message);
      return;
    }

    const existingNames = buckets.map(b => b.name);
    console.log("Existing buckets:", existingNames);

    for (const name of BUCKETS) {
      if (!existingNames.includes(name)) {
        console.log(`Bucket "${name}" is missing. Creating it...`);
        const { data, error } = await supabase.storage.createBucket(name, {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/png'],
          fileSizeLimit: 10485760 // 10MB
        });

        if (error) {
          console.error(`Failed to create bucket "${name}":`, error.message);
        } else {
          console.log(`Successfully created bucket "${name}".`);
        }
      } else {
        console.log(`Bucket "${name}" already exists.`);
        // Ensure it is public
        const { error } = await supabase.storage.updateBucket(name, {
          public: true
        });
        if (error) {
          console.error(`Failed to ensure public bucket "${name}":`, error.message);
        }
      }
    }

    console.log("Storage check complete.");
  } catch (err) {
    console.error("Unhandled error:", err);
  }
}

run();
