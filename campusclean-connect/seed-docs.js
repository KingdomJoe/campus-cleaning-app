const { createClient } = require('@supabase/supabase-js');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing environment variables.");
  process.exit(1);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const CLEANERS = [
  'c01a0000-0000-0000-0000-000000000004', // cleaner1
  'c01a0000-0000-0000-0000-000000000005', // cleaner2
  'c01a0000-0000-0000-0000-000000000006'  // cleaner3
];

async function run() {
  try {
    console.log("Seeding documents for test cleaners...");
    
    for (const cleanerId of CLEANERS) {
      // Check if cleaner has ghana_card
      const { data: hasCard } = await supabase
        .from('cleaner_documents')
        .select('*')
        .eq('cleaner_id', cleanerId)
        .eq('document_type', 'ghana_card')
        .maybeSingle();

      if (!hasCard) {
        console.log(`Inserting ghana_card for cleaner: ${cleanerId}`);
        await supabase.from('cleaner_documents').insert({
          cleaner_id: cleanerId,
          document_type: 'ghana_card',
          file_url: 'https://mock.url/ghana_card.jpg'
        });
      }

      // Check if cleaner has selfie
      const { data: hasSelfie } = await supabase
        .from('cleaner_documents')
        .select('*')
        .eq('cleaner_id', cleanerId)
        .eq('document_type', 'selfie')
        .maybeSingle();

      if (!hasSelfie) {
        console.log(`Inserting selfie for cleaner: ${cleanerId}`);
        await supabase.from('cleaner_documents').insert({
          cleaner_id: cleanerId,
          document_type: 'selfie',
          file_url: 'https://mock.url/selfie.jpg'
        });
      }
    }
    console.log("Documents seeding complete.");
  } catch (err) {
    console.error("Error seeding documents:", err);
  }
}

run();
