import { supabase } from './supabaseClient.js';

const courseId = window.courseId;
const user = window.supabaseUser;

export let currentOverrideStudent = null;

export async function loadModals() {
  const container = document.getElementById("modals-container");

  const [meetingModal, overrideModal, suspiciousModal] = await Promise.all([
    fetch('/attendance/partials/meetingModal.html').then(r => r.text()),
    fetch('/attendance/partials/overrideModal.html').then(r => r.text()),
    fetch('/attendance/partials/suspiciousModal.html').then(r => r.text())
  ]);

  container.innerHTML = meetingModal + overrideModal + suspiciousModal;

  // Setup modal close handlers
  setupModalCloseHandlers();
}

function setupModalCloseHandlers() {
  // Meeting modal close
  document.getElementById('close-meeting-modal')?.addEventListener('click', () => {
    document.getElementById('meeting-modal').classList.add('hidden');
  });

  // Override modal close
  document.getElementById('close-override-modal')?.addEventListener('click', () => {
    document.getElementById('override-modal').classList.add('hidden');
  });

  // Suspicious modal close
  document.getElementById('close-suspicious-modal')?.addEventListener('click', () => {
    document.getElementById('suspicious-modal').classList.add('hidden');
  });

  // Cancel override button
  document.getElementById('cancel-override')?.addEventListener('click', () => {
    document.getElementById('override-modal').classList.add('hidden');
  });

  // Dismiss suspicious button
  document.getElementById('dismiss-suspicious')?.addEventListener('click', () => {
    document.getElementById('suspicious-modal').classList.add('hidden');
  });

  // Acknowledge suspicious button
  document.getElementById('acknowledge-suspicious')?.addEventListener('click', () => {
    document.getElementById('suspicious-modal').classList.add('hidden');
  });
}

// Attendance modal
export async function showAttendanceModal(att, fullName, sid, meetingDateTime, meetingId) {
  const modal = document.getElementById("suspicious-modal");
  const modalTitle = modal.querySelector("h3");
  const modalBody = modal.querySelector(".space-y-4");

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

  modalBody.innerHTML = `
    <div>
      <p class="text-sm text-gray-700 leading-relaxed">
        <strong>${window.labelForStudent}:</strong> ${fullName}
      </p>
      <p class="text-sm text-gray-700 leading-relaxed">
        <strong>Meeting:</strong> ${meetingDateTime.toLocaleString()}
      </p>
    </div>
    
    <div class="border border-gray-200 rounded-sm p-4 bg-gray-50">
      <p class="text-sm text-gray-600 mb-2">Submitted Initials:</p>
      <div class="text-3xl font-mono tracking-wide text-primary">${initials}</div>
    </div>
    
    <div>
      <p class="text-sm font-medium text-gray-700 mb-3">Attendance Status:</p>
      <div class="flex gap-3" id="attendance-buttons">
        <button data-status="present"
          class="status-btn px-4 py-2 rounded-sm border border-green-600 text-green-700 hover:bg-green-50 transition-colors">
          Present
        </button>
        <button data-status="absent"
          class="status-btn px-4 py-2 rounded-sm border border-red-600 text-red-700 hover:bg-red-50 transition-colors">
          Absent
        </button>
        <button data-status="excused"
          class="status-btn px-4 py-2 rounded-sm border border-gray-400 text-gray-600 hover:bg-gray-100 transition-colors">
          Excused
        </button>
      </div>
      <p id="modal-feedback" class="text-sm text-gray-500 mt-3"></p>
    </div>
    
    <div class="flex gap-4 mt-6">
      <button id="save-attendance" class="bg-primary text-white px-6 py-3 rounded-sm hover:bg-blue-800 transition-colors font-medium">Save Changes</button>
      <button id="cancel-attendance" class="bg-white text-gray-600 border border-gray-300 px-6 py-3 rounded-sm hover:bg-gray-50 transition-colors font-medium">Cancel</button>
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
        activeBtn.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
      }
    }
  }, 100);

  // Status button handlers
  document.querySelectorAll('.status-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove ring from all buttons
      document.querySelectorAll('.status-btn').forEach(b => 
        b.classList.remove('ring-2', 'ring-primary', 'ring-offset-2')
      );
      // Add ring to clicked button
      btn.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
    });
  });

  // Save button handler
  document.getElementById('save-attendance').addEventListener('click', async () => {
    const activeBtn = document.querySelector('.status-btn.ring-2');
    if (!activeBtn) {
      feedback.textContent = "Please select a status";
      return;
    }

    const status = activeBtn.getAttribute('data-status');
    let attestation;
    if (status === 'present') attestation = true;
    else if (status === 'absent') attestation = false;
    else if (status === 'excused') attestation = null;

    try {
      if (att) {
        // Update existing record
        const { error } = await supabase
          .from('attendance')
          .update({ attestation })
          .eq('id', att.id);
        
        if (error) throw error;
      } else {
        // Create new record
        const { error } = await supabase
          .from('attendance')
          .insert({
            course_id: courseId,
            meeting_id: meetingId,
            entered_participant_id: sid,
            attestation
          });
        
        if (error) throw error;
      }

      feedback.textContent = "Attendance updated successfully!";
      feedback.className = "text-sm text-green-600 mt-3";
      
      // Close modal after a short delay
      setTimeout(() => {
        modal.classList.add('hidden');
        // Trigger table reload if needed
        if (window.reloadAttendanceTable) {
          window.reloadAttendanceTable();
        }
      }, 1500);

    } catch (error) {
      console.error('Error updating attendance:', error);
      feedback.textContent = "Error updating attendance. Please try again.";
      feedback.className = "text-sm text-red-600 mt-3";
    }
  });

  // Cancel button handler
  document.getElementById('cancel-attendance').addEventListener('click', () => {
    modal.classList.add('hidden');
  });
}

// Override modal
export function showOverrideModal(student, meetingId, currentStatus) {
  const modal = document.getElementById("override-modal");
  
  // Populate modal with student and meeting info
  document.getElementById("override-student-name").textContent = student.full_name;
  document.getElementById("override-meeting-info").textContent = `Meeting ID: ${meetingId}`;
  document.getElementById("override-current-status").textContent = currentStatus || "Not recorded";
  
  // Set current status as default in dropdown
  const statusSelect = document.getElementById("override-new-status");
  if (currentStatus === "Present") {
    statusSelect.value = "present";
  } else if (currentStatus === "Absent") {
    statusSelect.value = "absent";
  } else if (currentStatus === "Excused") {
    statusSelect.value = "excused";
  }

  modal.classList.remove("hidden");

  // Form submission handler
  const form = document.getElementById("override-form");
  const statusElement = document.getElementById("override-status");

  form.onsubmit = async (e) => {
    e.preventDefault();
    
    const newStatus = document.getElementById("override-new-status").value;
    const reason = document.getElementById("override-reason").value;
    
    let attestation;
    if (newStatus === 'present') attestation = true;
    else if (newStatus === 'absent') attestation = false;
    else if (newStatus === 'excused') attestation = null;

    try {
      // Update or create attendance record
      const { error } = await supabase
        .from('attendance')
        .upsert({
          course_id: courseId,
          meeting_id: meetingId,
          entered_participant_id: student.participant_id,
          attestation,
          override_reason: reason || null
        });
      
      if (error) throw error;

      statusElement.textContent = "Override applied successfully!";
      statusElement.className = "text-sm mt-2 text-green-600";
      
      // Close modal after a short delay
      setTimeout(() => {
        modal.classList.add('hidden');
        // Trigger table reload if needed
        if (window.reloadAttendanceTable) {
          window.reloadAttendanceTable();
        }
      }, 1500);

    } catch (error) {
      console.error('Error applying override:', error);
      statusElement.textContent = "Error applying override. Please try again.";
      statusElement.className = "text-sm mt-2 text-red-600";
    }
  };
}