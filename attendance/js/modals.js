import { supabase } from './supabaseClient.js';

const courseId = window.courseId;
const user = window.supabaseUser;

export let currentOverrideStudent = null;

export async function loadModals() {
  const container = document.getElementById("modals-container");

  const [override, meeting, suspicious] = await Promise.all([
    fetch('/attendance/partials/meetingModal.html').then(r => r.text()),
    fetch('/attendance/partials/suspiciousModal.html').then(r => r.text())
  ]);

  container.innerHTML = override + meeting + suspicious;
  container.innerHTML = override + meeting;

  document.querySelectorAll('#override-color-options button').forEach(btn => {
    btn.addEventListener('click', () => {
      // Clear existing selections
         document.querySelectorAll('#override-color-options button').forEach(b =>
           b.classList.remove('ring')
              );
      // Highlight selected button
      btn.classList.add('ring');
      // Set hidden input value
      const value = btn.getAttribute('data-value');
      document.getElementById('override-value').value = value;
    });
  });
}

//attendance modal

export async function showAttendanceModal(att, fullName, sid, meetingDateTime, meetingId) {
  const modal = document.getElementById("suspicious-modal");
  const body = document.getElementById("suspicious-modal-body");
  const modalTitle = modal.querySelector("h2");

  modalTitle.textContent = "Attendance Record";

  const initials = att?.initials ?? "(none)";
  let currentStatus;
  if (!att || !("attestation" in att)) {
    currentStatus = "Absent"; // fallback for missing records
  } else if (att.attestation === true) {
    currentStatus = "Present";
  } else if (att.attestation === null) {
    currentStatus = "Excused";
  } else if (att.attestation === false) {
    currentStatus = "Absent";
  }

  body.innerHTML = `
    <p><strong>${window.labelForStudent}:</strong> ${fullName}</p>
    <p><strong>Meeting:</strong> ${meetingDateTime.toLocaleString()}</p>
    <div class="mt-4 border rounded p-4 bg-gray-50">
    <p class="text-sm text-gray-600 mb-1">Submitted Initials:</p>
    <div class="text-3xl font-mono tracking-wide text-primary">${initials}</div>
    </div>
    <div class="mt-4">
  <p class="text-sm font-semibold text-gray-700 mb-2">Attendance Status:</p>
  <div class="flex gap-2" id="attendance-buttons">
    <button data-status="present"
      class="status-btn px-3 py-1 rounded border border-green-600 text-green-700 hover:bg-green-50">
      Present
    </button>
    <button data-status="absent"
      class="status-btn px-3 py-1 rounded border border-red-600 text-red-700 hover:bg-red-50">
      Absent
    </button>
    <button data-status="excused"
      class="status-btn px-3 py-1 rounded border border-gray-400 text-gray-600 hover:bg-gray-100">
      Excused
    </button>
  </div>
  <p id="modal-feedback" class="text-sm text-gray-500 mt-2"></p>
</div>
  `;

  modal.classList.remove("hidden");

  const feedback = document.getElementById("modal-feedback");

// Highlight the current status button
setTimeout(() => {
  let selector = "";
  if (currentStatus === "Present") {
    selector = '[data-status="present"]';
  } else if (currentStatus === "Absent") {
    selector = '[data-status="absent"]';
  } else if (currentStatus === "Excused") {
    selector = '[data-status="excused"]';
  }

  if (selector) {
    const activeBtn = document.querySelector(selector);
    if (activeBtn) {
      activeBtn.classList.add('ring', 'ring-2', 'ring-offset-2');
    }
  }
}, 0);

  document.querySelectorAll(".status-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const value = btn.getAttribute("data-status");
      let newAttestation = null;
      if (value === "present") newAttestation = true;
      else if (value === "absent") newAttestation = false;
      else if (value === "excused") newAttestation = null;

      feedback.textContent = "Updating...";
      const { error: upsertError } = await supabase.from("attendance").upsert({
        course_id: window.courseId,
        meeting_id: meetingId,
        entered_participant_id: sid,
        attestation: newAttestation
      }, { onConflict: ['entered_participant_id', 'meeting_id'] });

      const { error: logError } = await supabase.from("attendance_log").insert([{
        course_id: window.courseId,
        entered_participant_id: sid,
        attestation: newAttestation,
        meeting_id: meetingId,
        modified_by: window.supabaseUser.id
      }]);

      if (upsertError || logError) {
        feedback.textContent = "❌ Error updating attendance.";
        return;
      }

      feedback.textContent = "Attendance updated.";
setTimeout(async () => {
  modal.classList.add("hidden");

  const { loadAttendanceTable } = await import('./attendance.js');
  const headerRow = document.getElementById("header-row");
  const tbody = document.getElementById("attendance-body");
  await loadAttendanceTable(supabase, window.courseId, headerRow, tbody);
}, 1000);

    });
  });
}