const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing env variables. Make sure you load .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function test() {
  console.log("Testing connection to Supabase...");
  
  // Test a simple select on businesses table
  const { data, error } = await supabase.from('businesses').select('id').limit(1);
  if (error) {
    if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
      console.log("❌ Tables do not exist yet. We need to create them.");
    } else {
      console.error("Error querying 'businesses':", error);
    }
  } else {
    console.log("✅ Success! 'businesses' table exists.");
  }
}

test();
