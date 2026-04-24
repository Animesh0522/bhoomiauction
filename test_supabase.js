require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("URL:", supabaseUrl ? "Present" : "Missing");
console.log("Key:", supabaseKey ? "Present (Starts with: " + supabaseKey.substring(0, 10) + ")" : "Missing");

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.auth.signInWithOtp({
    email: 'test@example.com',
  });
  console.log("Result:", { data, error });
}
test();
