const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://hnmuhjcigluohtqxunfk.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhubXVoamNpZ2x1b2h0cXh1bmZrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzc5OTcyNiwiZXhwIjoyMDkzMzc1NzI2fQ.l01MfoS4qOIjgiynFlLiWkPCqTKxo_n2o5S-8axirZU";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

async function main() {
  const targetEmail = "bleuebrand@gmail.com";
  console.log(`Searching for user with email: ${targetEmail}`);

  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error("Error listing users:", listError);
    process.exit(1);
  }

  const user = users.find(u => u.email?.toLowerCase() === targetEmail.toLowerCase());
  if (!user) {
    console.error(`User with email ${targetEmail} not found!`);
    process.exit(1);
  }

  console.log(`Found user: ID=${user.id}, Email=${user.email}`);

  // Calculate annual expiration date (1 year from now)
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  console.log(`Upgrading user profile to VIP. Expiration: ${expiresAt.toISOString()}`);

  // Update profiles table
  const { data: profileUpdate, error: profileError } = await supabase
    .from('profiles')
    .update({
      is_vip: true,
      vip_expires_at: expiresAt.toISOString(),
      last_license_key: "MANUAL-ANNUAL-UPGRADE"
    })
    .eq('user_id', user.id);

  if (profileError) {
    console.error("Error updating profile by user_id:", profileError);
  } else {
    console.log("Successfully updated profile by user_id:", profileUpdate);
  }

  // Just in case id is different, let's also try by id if user_id update didn't affect any rows
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (existingProfile) {
    const { error: profileIdError } = await supabase
      .from('profiles')
      .update({
        is_vip: true,
        vip_expires_at: expiresAt.toISOString(),
        last_license_key: "MANUAL-ANNUAL-UPGRADE"
      })
      .eq('id', user.id);
    if (profileIdError) {
      console.error("Error updating profile by id:", profileIdError);
    } else {
      console.log("Successfully updated profile by id");
    }
  }

  // Also update user metadata to ensure is_vip: true is set there
  const { data: userUpdate, error: userError } = await supabase.auth.admin.updateUserById(
    user.id,
    { user_metadata: { ...user.user_metadata, is_vip: true } }
  );

  if (userError) {
    console.error("Error updating user metadata:", userError);
  } else {
    console.log("Successfully updated user metadata!");
  }

  console.log("Upgrade completed successfully!");
}

main().catch(err => {
  console.error("Unhandled error:", err);
});
