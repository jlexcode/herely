import { serve } from 'https://deno.land/std/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",//restrict later
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  let { course_id, email, initials } = await req.json();
  const now = new Date().toISOString();

  email = email.trim().toLowerCase();
  initials = initials.trim();

  // Step 1: Validate meeting
  const { data: meeting, error: mErr } = await supabase
    .from('meetings')
    .select('id, meeting_date, latitude, longitude')
    .eq('course_id', course_id)
    .gte('expires_at', now)
    .order('meeting_date', { ascending: true })
    .order('start_time', { ascending: true })
    .limit(1)
    .single();

  if (mErr || !meeting) return new Response("🚫 Could not identify a valid meeting at this time.", { status: 400, headers: corsHeaders });

  // Step 2: Validate roster
  const { data: rosterEntry } = await supabase
    .from('roster')
    .select('participant_id')
    .eq('course_id', course_id)
    .eq('participant_id', email)
    .eq('dropped', false)
    .single();

  if (!rosterEntry) return new Response("Your email is not the roster. Please contact instructor.", { status: 403, headers: corsHeaders });

  // Step 3: Upload image to storage
  //const imageBuffer = Uint8Array.from(atob(image_data_url.split(',')[1]), c => c.charCodeAt(0));
  //const filePath = `signatures/${course_id}/${email}-${Date.now()}.png`;

  //const { error: uploadErr } = await supabase.storage
//    .from('signatures')
  //  .upload(filePath, imageBuffer, { contentType: 'image/png' });

  //if (uploadErr) return new Response("Upload failed", { status: 500, headers: corsHeaders });

  // Step 4: Store signature path if no reference exists
//  const { data: existingRef } = await supabase
//    .from('signature_reference')
//    .select('id')
//    .eq('course_id', course_id)
//    .eq('participant_id', email)
//    .maybeSingle();

//  if (!existingRef) {
//    await supabase.from('signature_reference').insert({
//      course_id,
//      participant_id: email,
//      signature_path,
//      signature_image_url: filePath,
//    });
//  }

  // Step 5: Call verification service
//  let similarity = null;
//  try {
//    const res = await fetch("https://signature-verify-api-1.onrender.com/verify", {
//      method: "POST",
//      headers: { "Content-Type": "application/json" },
//      body: JSON.stringify({ participant_id: email, signature_path: JSON.parse(signature_path) })
//    });
//
//    if (res.ok) similarity = (await res.json()).score;
//  } catch {}

  // Step 6: Compute distance
//  const participantLat = lat;
//  const participantLng = lng;
//  const classroomLat = meeting.latitude;
//  const classroomLng = meeting.longitude;

//  let distanceFromClassroom = null;
//  try {
//    const res = await fetch("https://hmnpqnzmtanepowfoodn.functions.supabase.co/compute-distance", {
//      method: "POST",
//      headers: {
//        "Content-Type": "application/json",
//        "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`
//      },
//      body: JSON.stringify({
//        lat1: participantLat,
//        lon1: participantLng,
//        lat2: classroomLat,
//        lon2: classroomLng
//      })
//    });
//
//    if (res.ok) {
//      const result = await res.json();
//      distanceFromClassroom = result.meters;
//    }
//  } catch {}

  // Step 7: Insert attendance record
  const { error: insertErr } = await supabase.from('attendance').insert([{
    course_id,
    meeting_id: meeting.id,
    entered_participant_id: email,
    meeting_date: meeting.meeting_date,
    attestation: true,
    initials: initials
  }]);

  if (insertErr) return new Response("Failed to record attendance", { status: 500, headers: corsHeaders });

  return new Response("Attendance submitted", { status: 200, headers: corsHeaders });

        //      if (insertError) {
//        status.textContent = 'Error submitting attendance. Did you already submit?';
//        status.className = "text-center mt-4 text-sm text-red-600";
//      } else {
//        window.location.href = '/thank_you.html';
//      }

});