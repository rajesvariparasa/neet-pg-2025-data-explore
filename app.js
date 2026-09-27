let rawData = [];
let dataTableInstance = null;
let mapInstance = null;

document.addEventListener("DOMContentLoaded", () => {
  loadCSVData('data.csv');
});

function loadCSVData(filePath) {
  Papa.parse(filePath, {
    download: true,
    header: true,
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
      document.getElementById("data-status").innerText = "Failed to load data.csv file.";
      console.error(err);
    }
  });
}

function initDashboard(data) {
  // Metric Calculations
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

  new Chart(document.getElementById("courseChart"), {
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
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { font: { size: 10 } } }
      }
    }
  });
}

function initMap(data) {
  mapInstance = L.map('map').setView([20.5937, 78.9629], 4.5); // India center

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(mapInstance);

  const collegeMap = new Map();

  // Group lat/lon by institute
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
    .bindPopup(`<b>${col.name}</b><br>${col.state || ''}<br>Total Seat Allotments: <b>${col.count}</b>`)
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

  dataTableInstance = $('#neetTable').DataTable({
    data: tableData,
    pageLength: 25,
    lengthMenu: [10, 25, 50, 100, 500],
    order: [[0, 'asc']], // Order by Rank ascending
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

  // Column Index Mapping: 1: Quota, 3: Course, 4: Allot Cat, 6: Round, 7: State
  const filterColumns = [
    { index: 1, name: "Quota" },
    { index: 3, name: "Course" },
    { index: 4, name: "Category" },
    { index: 6, name: "Round" },
    { index: 7, name: "State" }
  ];

  filterColumns.forEach(col => {
    const column = api.column(col.index);
    const uniqueVals = column.data().unique().toArray().filter(Boolean).sort();

    const colDiv = document.createElement("div");
    colDiv.className = "col-md-2.4 col-sm-6";

    const select = document.createElement("select");
    select.className = "form-select form-select-sm";
    select.innerHTML = `<option value="">All ${col.name}s</option>` +
      uniqueVals.map(v => `<option value="${v}">${v}</option>`).join("");

    select.addEventListener("change", function () {
      const val = $.fn.dataTable.util.escapeRegex($(this).val());
      column.search(val ? `^${val}$` : '', true, false).draw();
    });

    colDiv.appendChild(select);
    filterContainer.appendChild(colDiv);
  });
}

function copyShareLink() {
  navigator.clipboard.writeText(window.location.href).then(() => {
    alert("Dashboard link copied to clipboard!");
  });
}