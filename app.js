let rawData = [];
let dataTableInstance = null;
let onlyFinalAssignment = false;
const activeMultiFilters = {};

document.addEventListener("DOMContentLoaded", () => {
  console.log("Initializing NEET PG Explorer with CSV...");
  loadCSVData('data.csv');

  // Close multi-select dropdowns when clicking outside
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".multiselect-dropdown")) {
      document.querySelectorAll(".multiselect-menu").forEach(menu => menu.classList.remove("show"));
    }
  });
});

function loadCSVData(filePath) {
  const statusEl = document.getElementById("data-status");
  
  Papa.parse(filePath, {
    download: true,
    header: true,
    delimiter: "", // Auto-detect delimiter (works for comma CSV and tab TSV)
    skipEmptyLines: true,
    complete: function (results) {
      console.log("PapaParse complete. Raw results:", results);

      if (!results.data || results.data.length === 0) {
        if (statusEl) statusEl.innerText = "Error: data.csv is empty or could not be read.";
        console.error("Parsed data is empty:", results.errors);
        return;
      }

      rawData = results.data;
      if (statusEl) {
        statusEl.innerText = `${rawData.length.toLocaleString()} records loaded successfully`;
      }
      
      initDataTable(rawData);
    },
    error: function (err) {
      console.error("PapaParse failed to load file:", err);
      if (statusEl) {
        statusEl.innerText = "Error loading data.csv. Make sure the file exists and you are running via a local web server.";
      }
    }
  });
}

function getFieldValue(row, keys) {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null && row[k] !== "") return row[k];
  }
  return "";
}

function initDataTable(data) {
  // Safe field extraction matching variations in CSV column header names
  const tableData = data.map(d => [
    parseInt(getFieldValue(d, ['Rank', 'rank', 'AIR']), 10) || getFieldValue(d, ['Rank', 'rank', 'AIR']) || "-",
    getFieldValue(d, ['Allot_Quota', 'Quota', 'quota', 'Allotted Quota']),
    getFieldValue(d, ['Institute', 'institute', 'College']),
    getFieldValue(d, ['Course', 'course', 'Specialty']),
    getFieldValue(d, ['Allot_Cat', 'allot_cat', 'Allotted Category']),
    getFieldValue(d, ['Cand_Cat', 'cand_cat', 'Candidate Category']),
    getFieldValue(d, ['Round', 'round']),
    getFieldValue(d, ['State', 'state']),
    getFieldValue(d, ['Area', 'area']),
    getFieldValue(d, ['Remarks', 'remarks', 'Remark']),
    getFieldValue(d, ['Round_assignment_status', 'round_assignment_status', 'Status', 'status'])
  ]);

  if ($.fn.DataTable.isDataTable('#neetTable')) {
    $('#neetTable').DataTable().destroy();
    $('#neetTable').empty();
  }

  // Custom DataTables Filter Logic
  $.fn.dataTable.ext.search.push(function (settings, rowData) {
    // 1. Final Assignment Toggle Filter
    if (onlyFinalAssignment) {
      const assignmentStatus = (rowData[10] || "").toString().toLowerCase();
      if (!assignmentStatus.includes("final assignment") && !assignmentStatus.includes("final")) {
        return false;
      }
    }

    // 2. Rank Range Filter
    const minRank = parseInt($('#minRank').val(), 10);
    const maxRank = parseInt($('#maxRank').val(), 10);
    const rankVal = parseFloat(rowData[0]) || 0;

    if (!isNaN(minRank) && rankVal < minRank) return false;
    if (!isNaN(maxRank) && rankVal > maxRank) return false;

    // 3. Multi-Select Dropdowns
    for (const [colIndex, selectedValues] of Object.entries(activeMultiFilters)) {
      if (selectedValues && selectedValues.length > 0) {
        const cellValue = (rowData[colIndex] || "").toString();
        if (!selectedValues.includes(cellValue)) {
          return false;
        }
      }
    }

    return true;
  });

  // Initialize DataTables
  dataTableInstance = $('#neetTable').DataTable({
    data: tableData,
    pageLength: 25,
    lengthMenu: [10, 25, 50, 100, 500],
    order: [[0, 'asc']],
    responsive: true,
    deferRender: true,
    columns: [
      { title: "Rank", className: "rank-col" },
      { title: "Quota" },
      { title: "Institute" },
      { title: "Course" },
      { title: "Allotted Cat" },
      { title: "Cand Cat" },
      { title: "Round" },
      { title: "State" },
      { title: "Area" },
      { 
        title: "Remarks",
        render: function(data) {
          return data && data !== "-" ? `<span class="badge-tag">${data}</span>` : "-";
        } 
      },
      { title: "Status", visible: false }
    ],
    initComplete: function () {
      console.log("DataTable rendering complete.");
      setupMultiSelectFilters(this.api());
    }
  });
}

function setupMultiSelectFilters(api) {
  const filterContainer = document.getElementById("filter-container");
  if (!filterContainer) return;
  filterContainer.innerHTML = "";

  const filterColumns = [
    { index: 1, name: "Quota" },
    { index: 3, name: "Course" },
    { index: 4, name: "Allotted Cat" },
    { index: 5, name: "Cand Cat" },
    { index: 6, name: "Round" },
    { index: 7, name: "State" }
  ];

  filterColumns.forEach(col => {
    const column = api.column(col.index);
    const uniqueVals = column.data().unique().toArray().filter(v => v && v !== "-").sort();

    activeMultiFilters[col.index] = [];

    const colDiv = document.createElement("div");
    colDiv.className = "col-md-2 col-sm-4";

    const label = document.createElement("div");
    label.className = "filter-label";
    label.innerText = col.name;

    const dropdown = document.createElement("div");
    dropdown.className = "multiselect-dropdown";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "multiselect-btn";
    btn.id = `btn-col-${col.index}`;
    btn.innerText = "(all)";

    const menu = document.createElement("div");
    menu.className = "multiselect-menu";

    btn.addEventListener("click", () => {
      document.querySelectorAll(".multiselect-menu").forEach(m => {
        if (m !== menu) m.classList.remove("show");
      });
      menu.classList.toggle("show");
    });

    uniqueVals.forEach(val => {
      const item = document.createElement("label");
      item.className = "multiselect-item";
      
      const chk = document.createElement("input");
      chk.type = "checkbox";
      chk.value = val;

      chk.addEventListener("change", () => {
        const checked = Array.from(menu.querySelectorAll("input:checked")).map(c => c.value);
        activeMultiFilters[col.index] = checked;

        if (checked.length === 0) {
          btn.innerText = "(all)";
        } else if (checked.length === 1) {
          btn.innerText = checked[0];
        } else {
          btn.innerText = `${checked.length} selected`;
        }

        if (dataTableInstance) dataTableInstance.draw();
      });

      item.appendChild(chk);
      item.appendChild(document.createTextNode(val));
      menu.appendChild(item);
    });

    dropdown.appendChild(btn);
    dropdown.appendChild(menu);
    colDiv.appendChild(label);
    colDiv.appendChild(dropdown);
    filterContainer.appendChild(colDiv);
  });

  // Min / Max Rank Range Controls
  const rankDiv = document.createElement("div");
  rankDiv.className = "col-md-4 col-sm-8 d-flex gap-2 align-items-end";
  rankDiv.innerHTML = `
    <div class="w-50">
      <div class="filter-label">Min Rank</div>
      <input type="number" id="minRank" class="form-control form-control-sm" placeholder="1">
    </div>
    <div class="w-50">
      <div class="filter-label">Max Rank</div>
      <input type="number" id="maxRank" class="form-control form-control-sm" placeholder="100000">
    </div>
  `;

  filterContainer.appendChild(rankDiv);

  $('#minRank, #maxRank').on('keyup change', function () {
    if (dataTableInstance) dataTableInstance.draw();
  });
}

function toggleFinalAssignmentFilter() {
  onlyFinalAssignment = !onlyFinalAssignment;
  const btn = document.getElementById("toggleFinalAssignment");
  const text = document.getElementById("finalStatusText");

  if (onlyFinalAssignment) {
    if (btn) btn.classList.add("active");
    if (text) text.innerText = "(Showing final allotted status only)";
  } else {
    if (btn) btn.classList.remove("active");
    if (text) text.innerText = "(Showing all rounds)";
  }

  if (dataTableInstance) dataTableInstance.draw();
}

function resetAllFilters() {
  onlyFinalAssignment = false;
  const btn = document.getElementById("toggleFinalAssignment");
  const text = document.getElementById("finalStatusText");
  if (btn) btn.classList.remove("active");
  if (text) text.innerText = "(Showing all rounds)";

  $('#minRank, #maxRank').val('');

  document.querySelectorAll(".multiselect-item input").forEach(chk => chk.checked = false);
  for (const key in activeMultiFilters) {
    activeMultiFilters[key] = [];
  }
  document.querySelectorAll(".multiselect-btn").forEach(b => b.innerText = "(all)");

  if (dataTableInstance) {
    dataTableInstance.draw();
  }
}

function copyShareLink() {
  navigator.clipboard.writeText(window.location.href).then(() => {
    alert("Page URL copied to clipboard!");
  });
}
