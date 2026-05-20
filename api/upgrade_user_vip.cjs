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
  const targetEmail = "bleuebrand@gmail.com";
  console.log(`Searching for user with email: ${targetEmail}`);

  let page = 1;
  const perPage = 1000;
  let targetUser = null;

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

    targetUser = users.find(u => u.email?.toLowerCase() === targetEmail.toLowerCase());
    if (targetUser) break;

    if (users.length < perPage) break;
    page++;
  }

  if (!targetUser) {
    console.error(`User ${targetEmail} not found in auth.users.`);
    process.exit(1);
  }

  const userId = targetUser.id;
  console.log(`Found user: ${targetUser.email} with ID: ${userId}`);

  // 1. Update Auth user_metadata and app_metadata
  console.log("Updating auth user metadata...");
  const { data: authUpdate, error: authError } = await supabase.auth.admin.updateUserById(userId, {
    user_metadata: { is_vip: true, plan: "annuel" },
    app_metadata: { is_vip: true, plan: "annuel" }
  });

  if (authError) {
    console.error("Error updating auth user:", authError);
    process.exit(1);
  }
  console.log("Auth metadata updated successfully!");

  // 2. Update profiles table
  console.log("Checking if profile exists in profiles table...");
  const { data: profile, error: profileGetError } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileGetError) {
    console.error("Error checking profile:", profileGetError);
  }

  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
  const expiresAt = oneYearFromNow.toISOString();

  if (!profile) {
    console.log("Profile not found. Creating profile...");
    const { error: profileInsertError } = await supabase
      .from("profiles")
      .insert({
        user_id: userId,
        is_vip: true,
        vip_expires_at: expiresAt,
        display_name: targetEmail.split('@')[0]
      });

    if (profileInsertError) {
      console.error("Error creating profile:", profileInsertError);
      process.exit(1);
    }
    console.log("Profile created and upgraded to VIP successfully!");
  } else {
    console.log("Profile found. Updating profile...");
    const { error: profileUpdateError } = await supabase
      .from("profiles")
      .update({
        is_vip: true,
        vip_expires_at: expiresAt
      })
      .eq("user_id", userId);

    if (profileUpdateError) {
      console.error("Error updating profile:", profileUpdateError);
      process.exit(1);
    }
    console.log("Profile upgraded to VIP successfully!");
  }

  console.log(`\n🎉 User ${targetEmail} successfully upgraded to VIP Plan (Annuel) expiring on ${expiresAt}!`);
}

main().catch(err => {
  console.error("Unhandled error:", err);
});
