import { showAttendanceModal } from './modals.js';
import { populateMeetingDropdown } from './meetings.js';
import { escapeHtml } from '/js/utils.js';

let currentSortKey = null;
let currentSortAsc = true;
let sortedMeetings = [];
let meetingKeys = [];

export function attachSortHandlers(loadAttendance) {
  const headers = document.querySelectorAll("#header-row th");
  headers.forEach((th, i) => {
    if (i < 5) {
      th.style.cursor = "pointer";
      th.addEventListener("click", () => {
        let key;
        if (i === 0) key = "full_name";
        else if (i === 1) key = "participant_id";
        else if (i === 2) key = "attended";
        else if (i === 3) key = "missed";
        else if (i === 4) key = "percentAbsent";
        else return;

        if (currentSortKey === key) {
          currentSortAsc = !currentSortAsc;
        } else {
          currentSortKey = key;
          currentSortAsc = true;
        }

        loadAttendance(currentSortKey, currentSortAsc);
      });
    }
  });
}

export async function loadAttendanceTable(supabase, courseId, headerRow, tbody) {
  const [{ data: roster }, { data: meetings }, { data: attendance }] = await Promise.all([
    supabase.from('roster').select('*').eq('course_id', courseId).eq('dropped', false),
    supabase.from('meetings')
      .select('id, meeting_date, start_time, remote')
      .eq('course_id', courseId)
      .eq('deleted', false),
    supabase.from('attendance').select('*').eq('course_id', courseId)
  ]);

  sortedMeetings = [...meetings].sort((a, b) =>
    `${a.meeting_date}T${a.start_time}`.localeCompare(`${b.meeting_date}T${b.start_time}`)
  );
  populateMeetingDropdown(sortedMeetings)
  ;

  headerRow.innerHTML = `
    <th class="p-2 border-r text-left sticky-header" style="left:0px; width:144px">${escapeHtml(window.labelForStudent)}</th>
    <th class="p-2 border-r text-left" style="width:112px">${escapeHtml(window.labelForStudent)} ID</th>
    <th class="p-2 border-r text-center fixed-col-width">Attended</th>
    <th class="p-2 border-r text-center fixed-col-width">Missed</th>
    <th class="p-2 border-r text-center fixed-col-width">% Absent</th>
  `;

  meetingKeys = [];
  for (const m of sortedMeetings) {
    const datePart = new Date(`${m.meeting_date}T00:00:00`).toLocaleDateString(undefined, {
      month: 'numeric', day: 'numeric'
    });
    const th = document.createElement('th');
    th.textContent = datePart;
    th.className = "meeting-cell bg-gray-100 sticky top-0 z-10";
    headerRow.appendChild(th);
    meetingKeys.push(m.id);
  }

  
  const attendanceMap = {};
  for (const entry of attendance) {
    const key = `${entry.entered_participant_id}_${entry.meeting_id}`;
    attendanceMap[key] = entry;
  }

  tbody.innerHTML = "";
  const studentData = roster.map(student => {
    const fullName = student.full_name;  
    let attended = 0, missed = 0;
    const now = new Date();

    for (const meeting of sortedMeetings) {
      const meetingDateTime = new Date(`${meeting.meeting_date}T${meeting.start_time}`);
      const joinedDateTime = student.joined_at ? new Date(student.joined_at) : null;
      const key = `${student.participant_id}_${meeting.id}`;
      const att = attendanceMap[key];

      //attendance exclusions
      if (meetingDateTime > now) continue;
      // Skip if student joined after meeting and no attendance record exists
      if (joinedDateTime && meetingDateTime.getTime() < joinedDateTime.getTime() - 60000 && !att) continue;

      if (att?.attestation === null) continue;
      if (att?.attestation === true) attended++;
      else if (att?.attestation === false || !att) missed++;
    }
    const percentAbsent = attended + missed > 0 ? missed / (attended + missed) : null;
    return { student, attended, missed, percentAbsent };
  });

  if (currentSortKey) {
    studentData.sort((a, b) => {
      let valA = currentSortKey === "percentAbsent" ? a.percentAbsent : a.student[currentSortKey];
      let valB = currentSortKey === "percentAbsent" ? b.percentAbsent : b.student[currentSortKey];
      if (valA === null) return 1;
      if (valB === null) return -1;
      return (valA > valB ? 1 : -1) * (currentSortAsc ? 1 : -1);
    });
  }

  for (const { student, attended, missed, percentAbsent } of studentData) {
    const sid = student.participant_id;
    const fullName = student.full_name;

    const tr = document.createElement("tr");
    tr.className = "hover:bg-gray-50 hover:shadow-sm transition-shadow";

    const tdName = document.createElement("td");
    tdName.className = "p-2 font-medium border-r sticky-cell";
    tdName.style.whiteSpace = "nowrap";
    tdName.style.overflow = "hidden";
    tdName.style.textOverflow = "ellipsis";
    tdName.style.left = "0px";
    tdName.style.width = "144px";
    tdName.textContent = fullName; // Using textContent is safe for user data
    tr.appendChild(tdName);

    const tdId = document.createElement("td");
    tdId.className = "p-2 border-r text-gray-600 text-sm";
    tdId.style.width = "112px";
    tdId.textContent = sid; // Using textContent is safe for user data
    tr.appendChild(tdId);

    [
      { value: attended },
      { value: missed },
      { value: percentAbsent !== null ? Math.round(percentAbsent * 100) + "%" : "–" }
    ].forEach(({ value }) => {
      const td = document.createElement("td");
      td.className = "meeting-cell fixed-col-width text-center";
      td.textContent = value; // Using textContent is safe for calculated values
      tr.appendChild(td);
    });

    for (const meeting of sortedMeetings) {
      const td = document.createElement("td");
      td.className = "meeting-cell";
      const inner = document.createElement("div");
      inner.className = "w-full h-full rounded-md flex items-center justify-center text-xs";
      const key = `${sid}_${meeting.id}`;
      const att = attendanceMap[key];
      const meetingDateTime = new Date(`${meeting.meeting_date}T${meeting.start_time}`);
      const joinedDateTime = student.joined_at ? new Date(student.joined_at) : null;

      const now = new Date();

      if (meetingDateTime > now) {
        inner.classList.add("bg-gray-50");
        inner.textContent = "";
        inner.title = "Class has not occurred yet";
      } else if ((joinedDateTime && meetingDateTime.getTime() < joinedDateTime.getTime() - 60000 && !att) || (att && att.attestation === null)) {
        inner.classList.add("bg-gray-200", "cursor-pointer");
        inner.textContent = "";
        inner.title = (joinedDateTime && meetingDateTime.getTime() < joinedDateTime.getTime() - 60000) ? "Not enrolled" : "Excused";
        inner.onclick = () => showAttendanceModal(att, fullName, sid, meetingDateTime, meeting.id);
      }
       else if (!att || att.attestation === false) {
        inner.classList.add("bg-red-200", "cursor-pointer");
        inner.title = "Absent";
        inner.onclick = () => showAttendanceModal(att, fullName, sid, meetingDateTime,meeting.id);
      } else {
        const isRemote = meeting.remote === true;
        const tooFar = att.distance_from_meeting > 150;
        const lowMatch = att.signature_similarity !== null && att.signature_similarity < 0.85;
        const flagDistance = !isRemote && tooFar;
        const flagSignature = lowMatch;

        inner.classList.add(flagDistance || flagSignature ? "bg-orange-200" : "bg-green-200", "cursor-pointer");
        //inner.title = flagDistance || flagSignature
        //  ? `Suspicious: ${flagDistance ? `distance ${Math.round(att.distance_from_meeting)}m` : ""}${flagDistance && flagSignature ? " | " : ""}${flagSignature ? `match ${(att.signature_similarity * 100).toFixed(1)}%` : ""}`.trim()
        //  : "Present";
        inner.onclick = () => showAttendanceModal(att, fullName, sid, meetingDateTime, meeting.id);
      }

      td.appendChild(inner);
      tr.appendChild(td);
    }

    tbody.appendChild(tr);
  }

  attachSortHandlers(() => loadAttendanceTable(supabase, courseId, headerRow, tbody));
  return sortedMeetings;
}