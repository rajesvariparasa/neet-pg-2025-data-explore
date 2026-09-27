/* Helper function to generate dynamic filters inside #filter-container */
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
          <input type="number" id="minRank" class="form-control form-control-sm" placeholder="Min">
          <input type="number" id="maxRank" class="form-control form-control-sm" placeholder="Max">
        </div>
      </div>
    </div>
  `;
}

/* Handler for the Final Allotment Round Only switch */
function toggleFinalAssignmentFilter() {
  const toggleSwitch = document.getElementById('toggleFinalAssignment');
  const statusText = document.getElementById('finalStatusText');

  if (toggleSwitch && toggleSwitch.checked) {
    statusText.textContent = '(Final allotment only)';
    // Implement custom data table filtering logic here
  } else {
    statusText.textContent = '(Showing all rounds)';
    // Reset or show all rounds filtering logic here
  }
}

/* Helper to toggle dropdown visibility */
function toggleDropdown(id) {
  const menu = document.getElementById(`menu-${id}`);
  if (menu) {
    menu.classList.toggle('show');
  }
}

/* Helper to reset all filters */
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
}

// Initialize on page DOM load
document.addEventListener('DOMContentLoaded', () => {
  renderFilterContainer();
});
