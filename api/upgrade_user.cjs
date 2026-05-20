const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const dotenvContent = fs.readFileSync(envPath, 'utf-8');

const urlMatch = dotenvContent.match(/VITE_SUPABASE_URL="?([^"\s]+)"?/);
const keyMatch = dotenvContent.match(/SUPABASE_SERVICE_ROLE_KEY="?([^"\s]+)"?/);

const SUPABASE_URL = urlMatch ? urlMatch[1] : null;
const SUPABASE_SERVICE_ROLE_KEY = keyMatch ? keyMatch[1] : null;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

async function main() {
  console.log("Listing all users to find similar emails...");
  let page = 1;
  const perPage = 1000;
  const emails = [];

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page: page,
      perPage: perPage
    });

    if (error) {
      console.error("Error listing users:", error);
      process.exit(1);
    }

    const users = data.users || [];
    if (users.length === 0) break;

    users.forEach(u => {
      if (u.email) emails.push(u.email);
    });

    if (users.length < perPage) break;
    page++;
  }

  console.log(`Total users found: ${emails.length}`);
  console.log("All user emails in database:");
  console.log(JSON.stringify(emails, null, 2));
}

main().catch(err => {
  console.error("Unhandled error:", err);
});
