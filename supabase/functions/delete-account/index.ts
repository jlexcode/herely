import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://herely.io", // Restrict to your domain
  "Access-Control-Allow-Headers": "Authorization, content-type, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS, DELETE",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  if (req.method !== "DELETE") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const authHeader = req.headers.get("authorization");
if (!authHeader || !authHeader.startsWith("Bearer ")) {
  return new Response("Unauthorized", { status: 401, headers: corsHeaders });
}

const token = authHeader.replace("Bearer ", "").trim();

const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  

  if (authError || !user) {
    return new Response("Unauthorized", { status: 401, headers: corsHeaders });
  }

  // Delete user-related rows
  const { error: dbError1 } = await supabase
    .from("courses")
    .delete()
    .eq("professor_id", user.id);

  const { error: dbError2 } = await supabase
    .from("users")
    .delete()
    .eq("id", user.id);

  if (dbError1 || dbError2) {
    return new Response("Database error", {
      status: 500,
      headers: corsHeaders,
    });
  }

  const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(user.id);
  if (deleteAuthError) {
    return new Response("Auth deletion error", {
      status: 500,
      headers: corsHeaders,
    });
  }

  return new Response("Account deleted", {
    status: 200,
    headers: corsHeaders,
  });
});