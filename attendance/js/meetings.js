export function populateMeetingDropdown(meetings) {
  const select = document.getElementById("edit-meeting-id");
  select.innerHTML = '';
  meetings.forEach(m => {
    const date = new Date(`${m.meeting_date}T${m.start_time}`);
    const dateStr = date.toLocaleDateString('en-US');
    const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    const opt = document.createElement("option");
    opt.value = m.id;
    opt.textContent = `${dateStr} ${timeStr}`;
    select.appendChild(opt);
  });
}

export function setupMeetingModal(supabase, courseId, loadAttendance) {
  const statusEl = document.getElementById("edit-meeting-status");

  document.getElementById("edit-meeting-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const meetingId = document.getElementById("edit-meeting-id").value;
    const newDate = document.getElementById("edit-meeting-date").value;
    const newTime = document.getElementById("edit-meeting-time").value;
    const isRemote = document.getElementById("edit-is-remote").checked;

    const { error } = await supabase
      .from('meetings')
      .update({ meeting_date: newDate, start_time: newTime, remote: isRemote })
      .eq('id', meetingId);

    if (error) {
      statusEl.textContent = "Error updating meeting.";
    } else {
      statusEl.textContent = "Meeting updated.";
      await loadAttendance();
    }
  });

  document.getElementById("delete-meeting").addEventListener("click", async () => {
    const meetingId = document.getElementById("edit-meeting-id").value;

    if (!confirm("Are you sure you want to delete this meeting? This cannot be undone.")) return;

    const { error } = await supabase
      .from('meetings')
      .update({ deleted: true }) 
      .eq('id', meetingId);

    if (error) {
      statusEl.textContent = "Error deleting meeting.";
    } else {
      statusEl.textContent = "Meeting deleted.";
      await loadAttendance();
    }
  });

  document.getElementById("open-meeting-manager").onclick = () => {
    document.getElementById("meeting-modal").classList.remove("hidden");
  };
  document.getElementById("close-meeting-modal").onclick = () => {
    document.getElementById("meeting-modal").classList.add("hidden");
  };
}