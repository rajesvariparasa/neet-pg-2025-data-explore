let dataTable = null;

// Render sticky filter inputs inside top panel
function renderFilterContainer() {
  const container = document.getElementById('filter-container');
  if (!container) return;

  container.innerHTML = `
    <div class="filters-row">
      <div class="filter-item">
        <div class="filter-label">Round</div>
        <div class="multiselect-dropdown" id="dropdown-round">
          <button class="multiselect-btn" type="button" onclick="toggleDropdown('round')">Select Round</button>
          <div class="multiselect-menu" id="menu-round"></div>
        </div>
      </div>
      
      <div class="filter-item">
        <div class="filter-label">Quota</div>
        <div class="multiselect-dropdown" id="dropdown-quota">
          <button class="multiselect-btn" type="button" onclick="toggleDropdown('quota')">Select Quota</button>
          <div class="multiselect-menu" id="menu-quota"></div>
        </div>
      </div>

      <div class="filter-item">
        <div class="filter-label">Category</div>
        <div class="multiselect-dropdown" id="dropdown-category">
          <button class="multiselect-btn" type="button" onclick="toggleDropdown('category')">Select Category</button>
          <div class="multiselect-menu" id="menu-category"></div>
        </div>
      </div>

      <div class="filter-item">
        <div class="filter-label">Course</div>
        <div class="multiselect-dropdown" id="dropdown-course">
          <button class="multiselect-btn" type="button" onclick="toggleDropdown('course')">Select Course</button>
          <div class="multiselect-menu" id="menu-course"></div>
        </div>
      </div>

      <div class="rank-filter-item">
        <div class="filter-label">Rank Range</div>
        <div class="d-flex gap-1">
          <input type="number" id="minRank" class="form-control form-control-sm" placeholder="Min" oninput="filterTable()">
          <input type="number" id="maxRank" class="form-control form-control-sm" placeholder="Max" oninput="filterTable()">
        </div>
      </div>
    </div>
  `;
}

// Fetch CSV file or load mock dataset if CSV fetching is blocked locally
function loadData() {
  const dataStatus = document.getElementById('data-status');

  // Replace 'data.csv' with your local CSV path if applicable
  Papa.parse("data.csv", {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: function (results) {
      if (results.data && results.data.length > 0) {
        initDataTable(results.data);
        if (dataStatus) dataStatus.textContent = `${results.data.length} Records Loaded`;
      } else {
        loadFallbackMockData();
      }
    },
    error: function () {
      // If fetching fails (e.g. running directly via file:// protocol), load sample data
      loadFallbackMockData();
    }
  });
}

// Fallback sample data to ensure table loads cleanly
function loadFallbackMockData() {
  const mockData = [
    { Rank: "125", Round: "Round 1", Quota: "All India", Category: "General", Course: "MD Radio Diagnosis", College: "MAMC Delhi" },
    { Rank: "450", Round: "Round 1", Quota: "All India", Category: "OBC", Course: "General Medicine", College: "KGMU Lucknow" },
    { Rank: "890", Round: "Round 2", Quota: "State Quota", Category: "SC", Course: "MS General Surgery", College: "MMC Chennai" },
    { Rank: "1250", Round: "Round 2", Quota: "All India", Category: "EWS", Course: "MD Pediatrics", College: "BJMC Ahmedabad" }
  ];

  initDataTable(mockData);
  const dataStatus = document.getElementById('data-status');
  if (dataStatus) dataStatus.textContent = `${mockData.length} Records Loaded (Sample Data)`;
}

// Initialize DataTables with fetched array
function initDataTable(data) {
  if ($.fn.DataTable.isDataTable('#neetTable')) {
    $('#neetTable').DataTable().destroy();
    $('#neetTable').empty();
  }

  const columns = Object.keys(data[0]).map(key => ({
    title: key,
    data: key,
    className: key.toLowerCase().includes('rank') ? 'rank-col' : ''
  }));

  dataTable = $('#neetTable').DataTable({
    data: data,
    columns: columns,
    pageLength: 25,
    responsive: true,
    order: [[0, 'asc']]
  });
}

function toggleFinalAssignmentFilter() {
  const toggleSwitch = document.getElementById('toggleFinalAssignment');
  const statusText = document.getElementById('finalStatusText');

  if (toggleSwitch && toggleSwitch.checked) {
    statusText.textContent = '(Final allotment only)';
  } else {
    statusText.textContent = '(Showing all rounds)';
  }
}

function toggleDropdown(id) {
  const menu = document.getElementById(`menu-${id}`);
  if (menu) {
    menu.classList.toggle('show');
  }
}

function resetAllFilters() {
  const toggleSwitch = document.getElementById('toggleFinalAssignment');
  if (toggleSwitch) {
    toggleSwitch.checked = false;
    toggleFinalAssignmentFilter();
  }
  const minRank = document.getElementById('minRank');
  const maxRank = document.getElementById('maxRank');
  if (minRank) minRank.value = '';
  if (maxRank) maxRank.value = '';

  if (dataTable) {
    dataTable.search('').columns().search('').draw();
  }
}

function copyShareLink() {
  navigator.clipboard.writeText(window.location.href);
  alert("Link copied to clipboard!");
}

document.addEventListener('DOMContentLoaded', () => {
  renderFilterContainer();
  loadData();
});
