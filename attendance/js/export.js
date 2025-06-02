export function setupExport(sortedMeetings) {
  document.getElementById("export-csv").addEventListener("click", () => {
    let csv = [];

    // Grab headers
    let headerCells = document.querySelectorAll("thead tr th");
    let headerRow = [];
    headerCells.forEach((th, i) => {
      let text = th.innerText.replace(/"/g, '""');
      if (i === 2) text = "Attended";
      else if (i === 3) text = "Missed";
      else if (i === 4) text = "% Absent";
      else if (i >= 5 && i < 5 + sortedMeetings.length) {
        const meeting = sortedMeetings[i - 5];
        text = `${meeting.meeting_date} ${meeting.start_time?.slice(0, 5)}`;
      } else if (text.includes('✏️')) {
        text = "Edit";
      }
      headerRow.push(`"${text}"`);
    });
    csv.push(headerRow.join(","));

    // Grab body rows
    const rows = document.querySelectorAll("tbody tr");
    rows.forEach(row => {
      const cols = row.querySelectorAll("td");
      const rowData = [];

      cols.forEach((col, index) => {
        if (index >= 5 && index < headerCells.length - 1) {
          const div = col.querySelector("div");
          if (!div) {
            rowData.push('""');
            return;
          }

          const cls = div.className;

          let val;
          if (cls.includes("bg-green-200")) val = 1;
          else if (cls.includes("bg-red-200")) val = 0;
          else if (cls.includes("bg-orange-200")) val = 1;
          else if (cls.includes("bg-gray-100")) val = null;
          else val = "";

          rowData.push(`"${val}"`);
        } else {
          let text = col.innerText.trim().replace(/"/g, '""');
          rowData.push(`"${text}"`);
        }
      });

      csv.push(rowData.join(","));
    });

    const blob = new Blob([csv.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "attendance_export.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  });
}