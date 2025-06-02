// Imports
import { loadAttendanceTable } from './attendance.js';
import { setupMeetingModal } from './meetings.js';
import { setupExport } from './export.js';
import { loadModals } from './modals.js';
import { supabase } from './supabaseClient.js';

// Get current user
import { requireAuth } from '/js/authUtils.js';
const user = await requireAuth(supabase);

window.supabaseUser = user;

const userId = user.id;


// Get course ID from URL
const params = new URLSearchParams(window.location.search);
const courseId = params.get("course_id");
if (!courseId) {
  alert("Missing course_id. Please return to dashboard.");
  throw new Error("Missing course_id");
}
window.courseId = courseId;

// Fetch course metadata
const { data: course, error } = await supabase
  .from('courses')
  .select('audience_type, professor_id')
  .eq('id', courseId)
  .single();

if (error || !course) {
  alert("Could not load course info.");
  throw error || new Error("No course data");
}

if (course.professor_id !== userId) {
  alert("You do not have permission to manage this course.");
  window.location.href = '/admin.html';
  }


const audienceType = course.audience_type;
const labelForStudent = audienceType === 'org' ? 'Participant' : 'Student';
window.labelForStudent = labelForStudent;



// Load modals
await loadModals();

// Load table + init handlers
const headerRow = document.getElementById("header-row");
const tbody = document.getElementById("attendance-body");

// Load attendance and get sorted meetings
const sortedMeetings = await loadAttendanceTable(supabase, courseId, headerRow, tbody, labelForStudent);

// Setup meetings modal with reloader
setupMeetingModal(supabase, courseId, () =>
  loadAttendanceTable(supabase, courseId, headerRow, tbody, labelForStudent)
);

// Setup CSV export
setupExport(sortedMeetings);

//unshimmer
document.getElementById("shimmer")?.remove();
document.getElementById("content-wrapper")?.classList.remove("hidden");