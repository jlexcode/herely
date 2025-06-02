export function formatDateTime(dateStr, timeStr) {
  const date = new Date(`${dateStr}T${timeStr}`);
  const dateFormatted = date.toLocaleDateString('en-US');
  const timeFormatted = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  });
  return `${dateFormatted} ${timeFormatted}`;
}

export function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove("hidden");
}

export function hideModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add("hidden");
}

export function createCell(content, className = "") {
  const td = document.createElement("td");
  td.className = className;
  td.textContent = content;
  return td;
}

export function createMeetingOption(meeting) {
  const option = document.createElement("option");
  option.value = meeting.id;
  option.textContent = formatDateTime(meeting.meeting_date, meeting.start_time);
  return option;
}