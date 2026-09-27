let rawData = [];
let dataTableInstance = null;
let onlyFinalAssignment = false;
const activeMultiFilters = {};

document.addEventListener("DOMContentLoaded", () => {
  loadTSVData('data.tsv');

  // Close multi-select dropdowns when clicking outside
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".multiselect-dropdown")) {
      document.querySelectorAll(".multiselect-menu").forEach(menu => menu.classList.remove("show"));
    }
  });
});

function loadTSVData(filePath) {
  Papa.parse(filePath, {
    download: true,
    header: true,
    delimiter: "\t",
    skipEmptyLines: true,
    complete: function (results) {
      rawData = results.data;
      if (!rawData || rawData.length === 0) {
        document.getElementById("data-status").innerText = "Error: Dataset is empty.";
        return;
      }
      document.getElementById("data-status").innerText = `${rawData.length.toLocaleString()} records loaded`;
      renderTable(rawData);
    },
    error: function (err) {
      document.getElementById("data-status").innerText = "Failed to load data.tsv file.";
      console.error(err);
    }
  });
}

function renderTable(data) {
  const tableData = data.map(d => [
    parseInt(d.Rank, 10) || d.Rank || "",
    d.Allot_Quota || "",
    d.Institute || "",
    d.Course || "",
    d.Allot_Cat || "",
    d.Cand_Cat || "",
    d.Round || "",
    d.State || "",
    d.Area || "",
    d.Remarks || "",
    d.Round_assignment_status || ""
  ]);

  // Custom DataTables Filter Functions
  $.fn.dataTable.ext.search.push(function (settings, rowData) {
    // 1. Final Assignment Toggle Filter
    if (onlyFinalAssignment) {
      const assignmentStatus = (rowData[10] || "").toLowerCase();
      if (!assignmentStatus.includes("final assignment")) {
        return false;
      }
    }

    // 2. Rank Min/Max Range Filter
    const minRank = parseInt($('#minRank').val(), 10);
    const maxRank = parseInt($('#maxRank').val(), 10);
    const rankVal = parseFloat(rowData[0]) || 0;

    if (!isNaN(minRank) && rankVal < minRank) return false;
    if (!isNaN(maxRank) && rankVal > maxRank) return false;

    // 3. Multi-select Dropdown Filters
    for (const [colIndex, selectedValues] of Object.entries(activeMultiFilters)) {
      if (selectedValues && selectedValues.length > 0) {
        const cellValue = rowData[colIndex] || "";
        if (!selectedValues.includes(cellValue)) {
          return false;
        }
      }
    }

    return true;
  });

  dataTableInstance = $('#neetTable').DataTable({
    data: tableData,
    pageLength: 25,
    lengthMenu: [10, 25, 50, 100, 500],
    order: [[0, 'asc']],
    responsive: true,
    deferRender: true,
    columnDefs: [
      { targets: 0, className: "rank-col" },
      { 
        targets: 9, 
        render: function(data) {
          return data ? `<span class="badge-tag">${data}</span>` : "-";
        } 
      },
      { targets: 10, visible: false } // Hidden column used for final assignment status filtering
    ],
    initComplete: function () {
      setupMultiSelectFilters(this.api());
    }
  });
}

function setupMultiSelectFilters(api) {
  const filterContainer = document.getElementById("filter-container");
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
    const uniqueVals = column.data().unique().toArray().filter(Boolean).sort();

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

        dataTableInstance.draw();
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

  // Rank Range Filter Inputs (Min Rank & Max Rank)
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
    dataTableInstance.draw();
  });
}

// Toggle Final Assignment Filter State
function toggleFinalAssignmentFilter() {
  onlyFinalAssignment = !onlyFinalAssignment;
  const btn = document.getElementById("toggleFinalAssignment");
  const text = document.getElementById("finalStatusText");

  if (onlyFinalAssignment) {
    btn.classList.add("active");
    text.innerText = "(Showing final allotted status only)";
  } else {
    btn.classList.remove("active");
    text.innerText = "(Showing all rounds)";
  }

  dataTableInstance.draw();
}

// Reset All Filters
function resetAllFilters() {
  onlyFinalAssignment = false;
  const btn = document.getElementById("toggleFinalAssignment");
  const text = document.getElementById("finalStatusText");
  btn.classList.remove("active");
  text.innerText = "(Showing all rounds)";

  $('#minRank, #maxRank').val('');

  // Uncheck all multi-select items
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
