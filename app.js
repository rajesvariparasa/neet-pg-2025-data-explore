let rawData = [];
let filteredData = [];
let dataTable = null;

const filterState = {
  round: [],
  quota: [],
  category: [],
  course: [],
  minRank: null,
  maxRank: null,
  finalOnly: false
};

const FILTER_CONFIG = {
  round: { field: "Round", label: "Round" },
  quota: { field: "Allot_Quota", label: "Quota" },
  category: { field: "Allot_Cat", label: "Allotment Category" },
  course: { field: "Course", label: "Course" }
};

function renderFilterContainer() {
  const container = document.getElementById("filter-container");
  if (!container) return;

  container.innerHTML = `
    <div class="filters-row">
      ${renderMultiselect("round", "Round")}
      ${renderMultiselect("quota", "Quota")}
      ${renderMultiselect("category", "Category")}
      ${renderMultiselect("course", "Course")}
      <div class="rank-filter-item">
        <div class="filter-label">Rank Range</div>
        <div class="rank-inputs">
          <input type="number" id="minRank" class="form-control form-control-sm"
                 placeholder="Min" min="1" inputmode="numeric" aria-label="Minimum rank">
          <input type="number" id="maxRank" class="form-control form-control-sm"
                 placeholder="Max" min="1" inputmode="numeric" aria-label="Maximum rank">
        </div>
      </div>
    </div>
  `;
}

function renderMultiselect(id, label) {
  const searchable = id === "course";

  return `
    <div class="filter-item">
      <div class="filter-label">${label}</div>
      <div class="multiselect-dropdown" id="dropdown-${id}">
        <button class="multiselect-btn" type="button"
                aria-expanded="false" aria-controls="menu-${id}"
                data-dropdown-toggle="${id}">
          Select ${label}
        </button>
        <div class="multiselect-menu" id="menu-${id}" role="group"
             aria-label="${label} options">
          ${searchable ? `
            <div class="filter-search-wrap">
              <input type="search"
                     class="filter-search"
                     id="courseSearch"
                     placeholder="Search courses..."
                     autocomplete="off"
                     aria-label="Search courses">
            </div>
          ` : ""}
          <div class="filter-options" id="options-${id}"></div>
        </div>
      </div>
    </div>
  `;
}

function cleanValue(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function normalizeRow(row) {
  const normalized = {};

  Object.keys(row).forEach(key => {
    normalized[key] = cleanValue(row[key]);
  });

  normalized.Rank = Number.parseInt(row.Rank, 10);
  normalized.Round = Number.parseInt(row.Round, 10);
  normalized.Pincode = Number.parseInt(row.Pincode, 10);

  normalized.Lat = Number.parseFloat(row.Lat);
  normalized.Lon = Number.parseFloat(row.Lon);

  return normalized;
}

function loadData() {
  fetch("./data.csv", { cache: "no-store" })
    .then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.text();
    })
    .then(csvText => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: "greedy",
        dynamicTyping: false,

        complete(results) {
      if (results.errors && results.errors.length) {
        console.warn("CSV parsing warnings:", results.errors);
      }

      if (!results.data || results.data.length === 0) {
        showDataError("The dataset is empty.");
        return;
      }

      rawData = results.data
        .filter(row => row.Rank !== undefined && String(row.Rank).trim() !== "")
        .map(normalizeRow);

      if (!rawData.length) {
        showDataError("No valid records were found in data.csv.");
        return;
      }

        initializeExplorer();
        },

        error(error) {
          console.error("CSV parse failed:", error);
          showDataError("The dataset could not be parsed.");
        }
      });
    })
    .catch(error => {
      console.error("CSV load failed:", error);
      showDataError(
        "Unable to load data.csv. Please refresh and try again."
      );
    });
}

function initializeExplorer() {
  populateAllFilters();
  restoreStateFromURL();
  syncFilterUI();
  applyFilters();
}

function getUniqueValues(field) {
  return [...new Set(
    rawData
      .map(row => row[field])
      .filter(value => value !== undefined && value !== null && String(value).trim() !== "")
      .map(String)
  )].sort((a, b) => {
    const na = Number(a);
    const nb = Number(b);
    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
  });
}

function populateAllFilters() {
  Object.entries(FILTER_CONFIG).forEach(([id, config]) => {
    const menu = document.getElementById(`menu-${id}`);
    if (!menu) return;

    const values = getUniqueValues(config.field);

    const options = menu.querySelector(`#options-${id}`) || menu;

    options.innerHTML = values.map((value, index) => {
      const safeId = `${id}-${index}`;
      return `
        <label class="multiselect-item" for="${safeId}">
          <input type="checkbox"
                 id="${safeId}"
                 value="${escapeHtml(value)}"
                 data-filter-id="${id}">
          <span>${escapeHtml(value)}</span>
        </label>
      `;
    }).join("");

    if (!values.length) {
      options.innerHTML = `<div class="text-muted small p-2">No values available</div>`;
    }
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function toggleDropdown(id) {
  const menu = document.getElementById(`menu-${id}`);
  const button = document.querySelector(`[data-dropdown-toggle="${id}"]`);
  if (!menu || !button) return;

  const willShow = !menu.classList.contains("show");

  document.querySelectorAll(".multiselect-menu.show").forEach(openMenu => {
    openMenu.classList.remove("show");
  });
  document.querySelectorAll("[data-dropdown-toggle][aria-expanded='true']")
    .forEach(openButton => openButton.setAttribute("aria-expanded", "false"));

  if (willShow) {
    menu.classList.add("show");
    button.setAttribute("aria-expanded", "true");
  }
}

function updateFilterStateFromUI() {
  Object.keys(FILTER_CONFIG).forEach(id => {
    filterState[id] = [...document.querySelectorAll(
      `input[data-filter-id="${id}"]:checked`
    )].map(input => input.value);
  });

  const min = Number.parseInt(document.getElementById("minRank")?.value, 10);
  const max = Number.parseInt(document.getElementById("maxRank")?.value, 10);

  filterState.minRank = Number.isFinite(min) ? min : null;
  filterState.maxRank = Number.isFinite(max) ? max : null;
}

function matchesFilters(row) {
  if (
    filterState.finalOnly &&
    row.Round_assignment_status !== "Final assignment"
  ) {
    return false;
  }

  const fieldByFilter = {
    round: "Round",
    quota: "Allot_Quota",
    category: "Allot_Cat",
    course: "Course"
  };

  for (const [filterId, field] of Object.entries(fieldByFilter)) {
    const selected = filterState[filterId];
    if (selected.length && !selected.includes(String(row[field]))) {
      return false;
    }
  }

  if (filterState.minRank !== null && row.Rank < filterState.minRank) {
    return false;
  }

  if (filterState.maxRank !== null && row.Rank > filterState.maxRank) {
    return false;
  }

  return true;
}

function applyFilters() {
  updateFilterStateFromUI();

  filteredData = rawData.filter(matchesFilters);
  updateFilterLabels();
  updateResultCount();
  renderTable(filteredData);
  updateURL();
}

function renderTable(data) {
  const tableSelector = "#neetTable";

  if ($.fn.DataTable.isDataTable(tableSelector)) {
    $(tableSelector).DataTable().destroy();
    $(tableSelector).empty();
  }

  if (!data.length) {
    dataTable = $(tableSelector).DataTable({
      data: [],
      columns: getTableColumns(),
      pageLength: 25,
      responsive: true
    });
    return;
  }

  dataTable = $(tableSelector).DataTable({
    data,
    columns: getTableColumns(),
    pageLength: 25,
    pageLengthMenu: [[25, 50, 100, 250], [25, 50, 100, 250]],
    responsive: true,
    autoWidth: false,
    deferRender: true,
    order: [[0, "asc"]],
    language: {
      emptyTable: "No assignments match the selected filters.",
      zeroRecords: "No assignments match the selected filters."
    },
    columnDefs: [
      { targets: 0, type: "num", className: "rank-col" },
      { targets: 7, type: "num" }
    ]
  });
}

function getTableColumns() {
  return [
    { title: "Rank", data: "Rank", defaultContent: "" },
    { title: "Quota", data: "Allot_Quota", defaultContent: "" },
    { title: "Institute", data: "Institute", defaultContent: "" },
    { title: "Course", data: "Course", defaultContent: "" },
    { title: "Allot. Cat.", data: "Allot_Cat", defaultContent: "" },
    { title: "Cand. Cat.", data: "Cand_Cat", defaultContent: "" },
    { title: "Remarks", data: "Remarks", defaultContent: "" },
    { title: "Round", data: "Round", defaultContent: "" },
    { title: "Assignment Status", data: "Round_assignment_status", defaultContent: "" },
    { title: "Area", data: "Area", defaultContent: "" },
    { title: "State", data: "State", defaultContent: "" },
    { title: "Pincode", data: "Pincode", defaultContent: "" },
    { title: "Lat", data: "Lat", defaultContent: "" },
    { title: "Lon", data: "Lon", defaultContent: "" }
  ];
}

function toggleFinalAssignmentFilter() {
  const toggleSwitch = document.getElementById("toggleFinalAssignment");
  filterState.finalOnly = Boolean(toggleSwitch?.checked);

  const statusText = document.getElementById("finalStatusText");
  if (statusText) {
    statusText.textContent = filterState.finalOnly
      ? "(Final assignment only)"
      : "(Showing all rounds)";
  }

  applyFilters();
}

function updateFilterLabels() {
  Object.keys(FILTER_CONFIG).forEach(id => {
    const button = document.querySelector(`[data-dropdown-toggle="${id}"]`);
    if (!button) return;

    const selected = filterState[id];

    if (!selected.length) {
      button.textContent = `Select ${FILTER_CONFIG[id].label}`;
    } else if (selected.length === 1) {
      button.textContent = selected[0];
    } else {
      button.textContent = `${selected.length} selected`;
    }
  });
}

function updateResultCount() {
  const resultCount = document.getElementById("result-count");
  if (!resultCount) return;

  const filtered = filteredData.length.toLocaleString();
  const total = rawData.length.toLocaleString();

  resultCount.textContent =
    filtered === total
      ? `${total} assignments`
      : `${filtered} of ${total} assignments`;
}

function updateDataStatus() {
}

function setDataStatus(text) {
  const status = document.getElementById("data-status");
  if (status) status.textContent = text;
}

function showDataError(message) {
  const count = document.getElementById("result-count");
  if (count) count.textContent = message;

  const table = document.getElementById("neetTable");
  if (table) {
    table.innerHTML = `
      <tbody>
        <tr>
          <td class="text-danger p-4">${escapeHtml(message)}</td>
        </tr>
      </tbody>
    `;
  }
}

function resetAllFilters() {
  filterState.round = [];
  filterState.quota = [];
  filterState.category = [];
  filterState.course = [];
  filterState.minRank = null;
  filterState.maxRank = null;
  filterState.finalOnly = false;

  document.querySelectorAll('input[data-filter-id]').forEach(input => {
    input.checked = false;
  });

  const minRank = document.getElementById("minRank");
  const maxRank = document.getElementById("maxRank");
  if (minRank) minRank.value = "";
  if (maxRank) maxRank.value = "";

  const toggle = document.getElementById("toggleFinalAssignment");
  if (toggle) toggle.checked = false;

  syncFilterUI();
  applyFilters();
}

function syncFilterUI() {
  Object.keys(FILTER_CONFIG).forEach(id => {
    document.querySelectorAll(`input[data-filter-id="${id}"]`).forEach(input => {
      input.checked = filterState[id].includes(input.value);
    });
  });

  const minRank = document.getElementById("minRank");
  const maxRank = document.getElementById("maxRank");
  if (minRank) minRank.value = filterState.minRank ?? "";
  if (maxRank) maxRank.value = filterState.maxRank ?? "";

  const toggle = document.getElementById("toggleFinalAssignment");
  if (toggle) toggle.checked = filterState.finalOnly;

  const statusText = document.getElementById("finalStatusText");
  if (statusText) {
    statusText.textContent = filterState.finalOnly
      ? "(Final assignment only)"
      : "(Showing all rounds)";
  }

  updateFilterLabels();
}

function encodeArray(values) {
  return values.map(value => encodeURIComponent(value)).join(",");
}

function decodeArray(value) {
  if (!value) return [];
  return value.split(",").filter(Boolean).map(decodeURIComponent);
}

function updateURL() {
  const params = new URLSearchParams();

  if (filterState.round.length) params.set("round", encodeArray(filterState.round));
  if (filterState.quota.length) params.set("quota", encodeArray(filterState.quota));
  if (filterState.category.length) params.set("category", encodeArray(filterState.category));
  if (filterState.course.length) params.set("course", encodeArray(filterState.course));
  if (filterState.minRank !== null) params.set("minRank", filterState.minRank);
  if (filterState.maxRank !== null) params.set("maxRank", filterState.maxRank);
  if (filterState.finalOnly) params.set("finalOnly", "1");

  const query = params.toString();
  const url = `${window.location.pathname}${query ? `?${query}` : ""}`;

  window.history.replaceState({}, "", url);
}

function restoreStateFromURL() {
  const params = new URLSearchParams(window.location.search);

  filterState.round = decodeArray(params.get("round"));
  filterState.quota = decodeArray(params.get("quota"));
  filterState.category = decodeArray(params.get("category"));
  filterState.course = decodeArray(params.get("course"));

  const min = Number.parseInt(params.get("minRank"), 10);
  const max = Number.parseInt(params.get("maxRank"), 10);

  filterState.minRank = Number.isFinite(min) ? min : null;
  filterState.maxRank = Number.isFinite(max) ? max : null;
  filterState.finalOnly = params.get("finalOnly") === "1";
}

async function copyShareLink() {
  updateURL();

  try {
    await navigator.clipboard.writeText(window.location.href);
    showToast("Filtered view link copied!");
  } catch (error) {
    prompt("Copy this link:", window.location.href);
  }
}

function showToast(message) {
  const toast = document.getElementById("share-toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  window.setTimeout(() => toast.classList.remove("show"), 2200);
}

function closeOpenDropdowns(event) {
  if (event.target.closest(".multiselect-dropdown")) return;

  document.querySelectorAll(".multiselect-menu.show").forEach(menu => {
    menu.classList.remove("show");
  });
  document.querySelectorAll("[data-dropdown-toggle]").forEach(button => {
    button.setAttribute("aria-expanded", "false");
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderFilterContainer();

  document.addEventListener("click", event => {
    const toggle = event.target.closest("[data-dropdown-toggle]");
    if (toggle) {
      toggleDropdown(toggle.dataset.dropdownToggle);
      return;
    }

    const checkbox = event.target.closest("input[data-filter-id]");
    if (checkbox) {
      applyFilters();
      return;
    }

    const courseSearch = event.target.closest("#courseSearch");
    if (courseSearch) {
      return;
    }

    if (event.target.closest("#toggleFinalAssignment")) {
      toggleFinalAssignmentFilter();
      return;
    }

    if (event.target.closest("#resetFilters")) {
      resetAllFilters();
      return;
    }

    if (event.target.closest("#shareLink")) {
      copyShareLink();
      return;
    }

    closeOpenDropdowns(event);
  });

  document.addEventListener("input", event => {
    if (event.target.id === "minRank" || event.target.id === "maxRank") {
      applyFilters();
      return;
    }

    if (event.target.id === "courseSearch") {
      const query = event.target.value.trim().toLocaleLowerCase();
      document.querySelectorAll('#options-course .multiselect-item').forEach(item => {
        const text = item.textContent.toLocaleLowerCase();
        item.hidden = query !== "" && !text.includes(query);
      });
    }
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeOpenDropdowns({ target: document.body });
  });

  loadData();
});
