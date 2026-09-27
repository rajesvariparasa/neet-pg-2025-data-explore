let rawData = [];
let dataTableInstance = null;
let courseChartInstance = null;
let mapInstance = null;

document.addEventListener("DOMContentLoaded", () => {
  loadTSVData('data.tsv');
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
      document.getElementById("data-status").innerText = `Loaded ${rawData.length.toLocaleString()} records`;
      initDashboard(rawData);
    },
    error: function (err) {
      document.getElementById("data-status").innerText = "Failed to load data.tsv file.";
      console.error(err);
    }
  });
}

function initDashboard(data) {
  // Metrics
  document.getElementById("metric-total-rows").innerText = data.length.toLocaleString();

  const uniqueColleges = new Set(data.map(d => d.Institute).filter(Boolean)).size;
  const uniqueCourses = new Set(data.map(d => d.Course).filter(Boolean)).size;

  document.getElementById("metric-colleges").innerText = uniqueColleges.toLocaleString();
  document.getElementById("metric-courses").innerText = uniqueCourses.toLocaleString();

  const ranks = data.map(d => parseInt(d.Rank, 10)).filter(n => !isNaN(n));
  if (ranks.length > 0) {
    const minRank = Math.min(...ranks);
    const maxRank = Math.max(...ranks);
    document.getElementById("metric-rank-range").innerText = `${minRank.toLocaleString()} - ${maxRank.toLocaleString()}`;
  }

  renderChart(data);
  initMap(data);
  renderTable(data);
}

function renderChart(data) {
  const courseCounts = {};
  data.forEach(d => {
    const course = d.Course || "Unspecified";
    courseCounts[course] = (courseCounts[course] || 0) + 1;
  });

  const sortedCourses = Object.entries(courseCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  if (courseChartInstance) {
    courseChartInstance.destroy();
  }

  const ctx = document.getElementById("courseChart").getContext("2d");
  courseChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: sortedCourses.map(c => c[0]),
      datasets: [{
        label: "Seats Allotted",
        data: sortedCourses.map(c => c[1]),
        backgroundColor: "#0d6efd"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false, // Allows chart to respect the .chart-container height
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { font: { size: 9 }, callback: function(val, index) {
          const label = this.getLabelForValue(val);
          return label.length > 20 ? label.substr(0, 20) + '...' : label;
        }}}
      }
    }
  });
}

function initMap(data) {
  if (mapInstance) {
    mapInstance.remove();
  }

  mapInstance = L.map('map').setView([20.5937, 78.9629], 4.5);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap'
  }).addTo(mapInstance);

  const collegeMap = new Map();

  data.forEach(d => {
    const lat = parseFloat(d.Lat);
    const lon = parseFloat(d.Lon);
    if (!isNaN(lat) && !isNaN(lon) && d.Institute) {
      if (!collegeMap.has(d.Institute)) {
        collegeMap.set(d.Institute, { lat, lon, name: d.Institute, state: d.State, count: 0 });
      }
      collegeMap.get(d.Institute).count++;
    }
  });

  collegeMap.forEach(col => {
    L.circleMarker([col.lat, col.lon], {
      radius: Math.min(12, 4 + Math.sqrt(col.count)),
      fillColor: "#dc3545",
      color: "#fff",
      weight: 1,
      opacity: 1,
      fillOpacity: 0.7
    })
    .bindPopup(`<b>${col.name}</b><br>${col.state || ''}<br>Total Allotments: <b>${col.count}</b>`)
    .addTo(mapInstance);
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
    d.Area || ""
  ]);

  // Add custom Rank Range Filter to DataTables
  $.fn.dataTable.ext.search.push(function (settings, data) {
    const min = parseInt($('#minRank').val(), 10);
    const max = parseInt($('#maxRank').val(), 10);
    const rank = parseFloat(data[0]) || 0;

    if ((isNaN(min) && isNaN(max)) ||
        (isNaN(min) && rank <= max) ||
        (min <= rank && isNaN(max)) ||
        (min <= rank && rank <= max)) {
      return true;
    }
    return false;
  });

  dataTableInstance = $('#neetTable').DataTable({
    data: tableData,
    pageLength: 25,
    lengthMenu: [10, 25, 50, 100, 500],
    order: [[0, 'asc']],
    responsive: true,
    deferRender: true,
    initComplete: function () {
      setupFilters(this.api());
    }
  });
}

function setupFilters(api) {
  const filterContainer = document.getElementById("filter-container");
  filterContainer.innerHTML = "";

  // Column Index Mapping
  const filterColumns = [
    { index: 1, name: "Quota" },
    { index: 3, name: "Course" },
    { index: 4, name: "Allotted Cat" },
    { index: 5, name: "Cand Cat" },
    { index: 6, name: "Round" },
    { index: 7, name: "State" }
  ];

  // Dropdown Select Filters
  filterColumns.forEach(col => {
    const column = api.column(col.index);
    const uniqueVals = column.data().unique().toArray().filter(Boolean).sort();

    const colDiv = document.createElement("div");
    colDiv.className = "col-md-2 col-sm-4";

    const label = document.createElement("div");
    label.className = "filter-label";
    label.innerText = col.name;

    const select = document.createElement("select");
    select.className = "form-select form-select-sm filter-control";
    select.innerHTML = `<option value="">All ${col.name}s</option>` +
      uniqueVals.map(v => `<option value="${v}">${v}</option>`).join("");

    select.addEventListener("change", function () {
      const val = $.fn.dataTable.util.escapeRegex($(this).val());
      column.search(val ? `^${val}$` : '', true, false).draw();
    });

    colDiv.appendChild(label);
    colDiv.appendChild(select);
    filterContainer.appendChild(colDiv);
  });

  // Rank Range Filter Inputs (Min Rank & Max Rank)
  const rankDiv = document.createElement("div");
  rankDiv.className = "col-md-4 col-sm-8 d-flex gap-2 align-items-end";
  rankDiv.innerHTML = `
    <div class="w-50">
      <div class="filter-label">Min Rank</div>
      <input type="number" id="minRank" class="form-control form-control-sm filter-control" placeholder="e.g. 1">
    </div>
    <div class="w-50">
      <div class="filter-label">Max Rank</div>
      <input type="number" id="maxRank" class="form-control form-control-sm filter-control" placeholder="e.g. 5000">
    </div>
  `;

  filterContainer.appendChild(rankDiv);

  $('#minRank, #maxRank').on('keyup change', function () {
    dataTableInstance.draw();
  });
}

function resetAllFilters() {
  $('.filter-control').val('');
  if (dataTableInstance) {
    dataTableInstance.columns().search('').draw();
    $.fn.dataTable.ext.search.pop(); // Clear rank search
    dataTableInstance.draw();
  }
}

function copyShareLink() {
  navigator.clipboard.writeText(window.location.href).then(() => {
    alert("Page URL copied to clipboard!");
  });
}
