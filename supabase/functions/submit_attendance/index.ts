import { serve } from 'https://deno.land/std/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js';

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5; // 5 requests per minute per email
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Environment configuration
const ALLOWED_ORIGINS = [
  'https://herely.io',
  'https://www.herely.io',
  // Add localhost for development
  ...(Deno.env.get('ENVIRONMENT') === 'development' ? ['http://localhost:3000', 'http://localhost:8000'] : [])
];

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://herely.io", // Will be set dynamically
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
};

serve(async (req) => {
  // Dynamic CORS handling
  const origin = req.headers.get('origin');
  const corsHeaders = {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin || '') ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Parse request body with error handling
  let course_id, email, initials;
  try {
    const body = await req.json();
    course_id = body.course_id;
    email = body.email;
    initials = body.initials;
  } catch (error) {
    return new Response("Invalid JSON in request body", { status: 400, headers: corsHeaders });
  }
  const currentTime = new Date().toISOString();

  // Input validation
  if (!course_id || typeof course_id !== 'string') {
    return new Response("Invalid course_id", { status: 400, headers: corsHeaders });
  }

  if (!email || typeof email !== 'string') {
    return new Response("Email is required", { status: 400, headers: corsHeaders });
  }

  if (!initials || typeof initials !== 'string') {
    return new Response("Initials are required", { status: 400, headers: corsHeaders });
  }

  email = email.trim().toLowerCase();
  initials = initials.trim();

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return new Response("Invalid email format", { status: 400, headers: corsHeaders });
  }

  // Validate initials length
  if (initials.length < 1 || initials.length > 5) {
    return new Response("Initials must be 1-5 characters", { status: 400, headers: corsHeaders });
  }

  // Validate initials format (letters only)
  const initialsRegex = /^[A-Za-z]+$/;
  if (!initialsRegex.test(initials)) {
    return new Response("Initials must contain only letters", { status: 400, headers: corsHeaders });
  }

  // Validate course_id format (UUID)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(course_id)) {
    return new Response("Invalid course_id format", { status: 400, headers: corsHeaders });
  }

  // Rate limiting check
  const now = Date.now();
  const rateLimitKey = `${email}:${course_id}`;
  const rateLimit = rateLimitMap.get(rateLimitKey);
  
  if (rateLimit && now < rateLimit.resetTime) {
    if (rateLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
      return new Response("Too many requests. Please wait before trying again.", { 
        status: 429, 
        headers: corsHeaders 
      });
    }
    rateLimit.count++;
  } else {
    rateLimitMap.set(rateLimitKey, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
  }

  // Step 1: Validate meeting
  const { data: meeting, error: mErr } = await supabase
    .from('meetings')
    .select('id, meeting_date, latitude, longitude')
    .eq('course_id', course_id)
    .gte('expires_at', currentTime)
    .order('meeting_date', { ascending: true })
    .order('start_time', { ascending: true })
    .limit(1)
    .single();

  if (mErr || !meeting) {
    return new Response("Could not identify a valid meeting at this time", { status: 400, headers: corsHeaders });
  }

  // Step 2: Validate roster
  const { data: rosterEntry } = await supabase
    .from('roster')
    .select('participant_id')
    .eq('course_id', course_id)
    .eq('participant_id', email)
    .eq('dropped', false)
    .single();

  if (!rosterEntry) {
    return new Response("Your email is not in the course roster. Please contact your instructor", { status: 403, headers: corsHeaders });
  }

  // Step 3: Check for existing attendance to prevent duplicates
  const { data: existingAttendance } = await supabase
    .from('attendance')
    .select('id')
    .eq('course_id', course_id)
    .eq('meeting_id', meeting.id)
    .eq('entered_participant_id', email)
    .single();

  if (existingAttendance) {
    return new Response("Attendance already submitted for this meeting", { status: 409, headers: corsHeaders });
  }

  // Step 4: Advanced features (currently disabled)
  // TODO: Implement signature upload, verification, and distance calculation
  // These features are commented out to simplify the current implementation

  // Step 8: Insert attendance record
  const { error: insertErr } = await supabase.from('attendance').insert([{
    course_id,
    meeting_id: meeting.id,
    entered_participant_id: email,
    meeting_date: meeting.meeting_date,
    attestation: true,
    initials: initials
  }]);

  if (insertErr) {
    return new Response("Failed to record attendance", { status: 500, headers: corsHeaders });
  }

  return new Response("Attendance submitted", { status: 200, headers: corsHeaders });
});