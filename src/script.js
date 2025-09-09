const VALID_USERS = {
  'Admin': '10145',
  'Sonu': 'Sonu@366',
  'Abhinandan': 'Abhi@123',
  'user3': 'user3',
  'user4': 'user4',
  'user5': 'user5'
};
const SUBMIT_ALLOWED_USERS = ['Admin', 'Sonu', 'Abhinandan'];
let isLoggedIn = false;
let currentUser = '';
let rowsPerPage = 100;
let currentPage = 1;
let totalRows = 0;
let totalPages = 1;
let currentSortOrder = 'desc';
let currentSortColumn = 'unique';
let expandedCells = new Map();
let searchQuery = '';
let isInitialLoad = true;
const ADMIN_PASSWORDS = ['Admin', 'ekkaa@123', 'noida@123'];
let passwordCallback = null;
let currentUniqueId = '';
let allData = [];
let filteredData = [];
let isFilteredViewActive = false;
let fetchInterval;

function login() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const popup = document.getElementById('submissionPopup');
  const popupTitle = document.getElementById('popupTitle');
  const popupMessage = document.getElementById('popupMessage');

  if (!username || !password) {
    popup.className = 'popup error';
    popupTitle.innerText = 'Admin';
    popupMessage.innerText = 'Please enter both username and password';
    popup.style.display = 'block';
    return;
  }

  if (VALID_USERS[username] && VALID_USERS[username] === password) {
    isLoggedIn = true;
    currentUser = username;
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('contentWrapper').style.display = 'flex';
    fetchData(true);
    if (!SUBMIT_ALLOWED_USERS.includes(currentUser)) {
      document.getElementById('toggleFormBtn').style.display = 'none';
    }
  } else {
    popup.className = 'popup error';
    popupTitle.innerText = 'Admin';
    popupMessage.innerText = 'Invalid credentials';
    popup.style.display = 'block';
  }
}

function logout() {
  isLoggedIn = false;
  currentUser = '';
  document.getElementById('contentWrapper').style.display = 'none';
  document.getElementById('loginContainer').style.display = 'flex';
  document.getElementById('username').value = '';
  document.getElementById('password').value = '';
}

// ... (Keep all your existing functions like formatDate, parseDateTime, generateWhatsAppLink, etc.)

function fetchData(showLoader = false) {
  if (!isLoggedIn) return;

  if (isFilteredViewActive && !showLoader) {
    console.log('fetchData skipped: Filtered view is active');
    return;
  }

  console.log('fetchData called with showLoader:', showLoader);

  if (showLoader) {
    isFilteredViewActive = false;
    clearInterval(fetchInterval);
    fetchInterval = setInterval(() => {
      if (!isFilteredViewActive) {
        fetchData(false);
      }
    }, 10000);
  }

  const loader = document.getElementById('loader');
  if (showLoader) loader.style.display = 'block';

  const rowsToFetch = currentPage === 'all' ? totalRows : rowsPerPage;
  const pageToFetch = currentPage === 'all' ? 1 : currentPage;

  fetch(`/api/getSheetData?page=${pageToFetch}&rows=${rowsToFetch}`)
    .then(response => response.json())
    .then(parsedResponse => {
      console.log('fetchData success:', parsedResponse);
      const { headers, data, totalRows: total } = parsedResponse;
      totalRows = total || 0;
      totalPages = Math.ceil(totalRows / rowsPerPage);
      const tbody = document.getElementById('dataTableBody');
      tbody.innerHTML = '';

      if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="23">No data available</td></tr>';
      } else {
        data.forEach((row, rowIndex) => {
          const tr = document.createElement('tr');
          const uniqueId = row[1] || '';
          const creationDate = row[2] ? new Date(row[2]) : new Date();
          tr.dataset.uniqueId = uniqueId;
          tr.dataset.timestamp = creationDate.getTime();

          const cells = [
            parseDateTime(row[0]) || '',
            uniqueId,
            parseDate(row[2]) || '',
            row[3] || '',
            row[4] || '',
            row[5] || '',
            row[6] || '',
            row[7] || '',
            row[8] || '',
            row[9] || '',
            row[10] || '',
            row[11] || '',
            row[12] || '',
            row[13] || '',
            row[14] || '',
            row[15] || '',
            row[16] || '',
            row[17] ? row[17].split(', ').map(url => {
              const fileName = url.split('/').pop().replace(/view\?usp=drivesdk/, '').split('?')[0] || 'File';
              return `<a href="${url}" target="_blank">${fileName}</a>`;
            }).join(', ') : '',
            generateWhatsAppLink(row[9], uniqueId, row[4], row[2], row[5], row[6], row[7], row[8], row[10], row[13]),
            parseDateTime(row[18]) || '',
            row[19] || '',
            row[20] || '',
            '',
            ''
          ];

          cells.forEach((content, cellIndex) => {
            const td = document.createElement('td');
            const cellKey = `${(pageToFetch - 1) * rowsPerPage + rowIndex}:${cellIndex}`;
            const isExpanded = expandedCells.has(cellKey);

            if (cellIndex === 18) {
              td.innerHTML = content;
            } else if (cellIndex === 22) {
              td.innerHTML = '';
            } else if (cellIndex === 23) {
              if (currentUser === 'Admin') {
                td.innerHTML = `
                  <div class="action-row">
                    <button class="action-btn view" onclick="viewEntry('${uniqueId}')"><i class="material-icons">visibility</i></button>
                    <button class="action-btn edit" onclick="showPasswordPopup('edit', '${uniqueId}')"><i class="material-icons">edit</i></button>
                    <button class="action-btn delete" onclick="showPasswordPopup('delete', '${uniqueId}')"><i class="material-icons">delete</i></button>
                  </div>
                `;
              } else if (SUBMIT_ALLOWED_USERS.includes(currentUser)) {
                td.innerHTML = `
                  <div class="action-row">
                    <button class="action-btn view" onclick="viewEntry('${uniqueId}')"><i class="material-icons">visibility</i></button>
                    <button class="action-btn edit" onclick="showPasswordPopup('edit', '${uniqueId}')"><i class="material-icons">edit</i></button>
                  </div>
                `;
              } else {
                td.innerHTML = `
                  <div class="action-row">
                    <button class="action-btn view" onclick="viewEntry('${uniqueId}')"><i class="material-icons">visibility</i></button>
                  </div>
                `;
              }
            } else if (content.length > 50 && cellIndex !== 22) {
              td.innerHTML = content;
            } else {
              td.innerHTML = content;
            }
            tr.appendChild(td);
          });

          tbody.appendChild(tr);
        });
      }

      applySortAndFilter();
      updatePagination();
      updateHeaderUser();
      adjustStickyColumns();
      if (showLoader) loader.style.display = 'none';
    })
    .catch(error => {
      console.error('Error fetching data:', error);
      const tbody = document.getElementById('dataTableBody');
      tbody.innerHTML = `<tr><td colspan="23">Error loading data: ${error.message}</td></tr>`;
      if (showLoader) loader.style.display = 'none';
    });
}

function submitOrUpdateEntry(formData, uniqueId) {
  const loader = document.getElementById('loader');
  console.log('submitOrUpdateEntry: uniqueId received:', uniqueId);

  if (uniqueId && formData.existingAttachments) {
    formData.existingAttachments = formData.existingAttachments.trim();
  }

  const isEditMode = !!uniqueId;
  const endpoint = isEditMode ? `/api/updateEntry/${uniqueId}` : '/api/submitForm';

  fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  })
    .then(response => response.json())
    .then(response => {
      loader.style.display = 'none';
      showPopup('Success!', isEditMode ? 'Entry Updated Successfully!' : 'Entry Added Successfully!');
      document.getElementById('myForm').reset();
      document.getElementById('myForm').dataset.uniqueId = '';
      document.getElementById('nextFormSection').style.display = 'none';
      document.getElementById('submitFormBtn').style.display = 'block';
      const attachmentPreview = document.getElementById('attachmentPreview');
      if (attachmentPreview) {
        attachmentPreview.innerHTML = '<p>No attachments</p>';
      }
      document.getElementById('existingAttachments').value = '';
      document.getElementById('uploadFile').value = '';
      toggleForm();
      fetchData(true);
    })
    .catch(error => {
      loader.style.display = 'none';
      showPopup('Admin', `Error ${isEditMode ? 'updating' : 'submitting'} entry: ${error.message}`);
    });
}

// ... (Keep other functions like toggleForm, submitFormHandler, etc. as they are)

function fetchSuggestions(fieldId, query) {
  const suggestionsDiv = document.getElementById(`${fieldId}Suggestions`);
  suggestionsDiv.innerHTML = '';
  suggestionsDiv.style.display = 'none';
  suggestionsDiv.classList.remove('show');

  if (!query || query.length < 1) {
    suggestionsDiv.innerHTML = '<div class="suggestion-item">Type to see suggestions</div>';
    suggestionsDiv.style.display = 'block';
    suggestionsDiv.classList.add('show');
    setTimeout(() => {
      suggestionsDiv.classList.remove('show');
      setTimeout(() => {
        suggestionsDiv.style.display = 'none';
      }, 300);
    }, 1500);
    return;
  }

  fetch(`/api/suggestions?field=${fieldId}&query=${encodeURIComponent(query)}`)
    .then(response => response.json())
    .then(suggestions => {
      const currentInput = document.getElementById(fieldId).value.trim();
      if (currentInput !== query) return;

      suggestionsDiv.innerHTML = '';
      if (suggestions && suggestions.length > 0) {
        suggestions.slice(0, 10).forEach(suggestion => {
          if (typeof suggestion !== 'string' || suggestion === null || suggestion === undefined) {
            return;
          }
          const div = document.createElement('div');
          div.className = 'suggestion-item';
          const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
          div.innerHTML = suggestion.replace(regex, '<strong>$1</strong>');
          div.onclick = () => {
            document.getElementById(fieldId).value = suggestion;
            suggestionsDiv.classList.remove('show');
            setTimeout(() => {
              suggestionsDiv.style.display = 'none';
            }, 300);
            document.getElementById(fieldId).focus();
            if (fieldId === 'partyName') {
              fetchMobileNoForParty(suggestion);
            }
          };
          suggestionsDiv.appendChild(div);
        });
      } else {
        suggestionsDiv.innerHTML = '<div class="suggestion-item">No matching suggestions</div>';
        setTimeout(() => {
          suggestionsDiv.classList.remove('show');
          setTimeout(() => {
            suggestionsDiv.style.display = 'none';
          }, 300);
        }, 1500);
      }
    })
    .catch(error => {
      console.error(`Error fetching suggestions for ${fieldId}:`, error);
      suggestionsDiv.innerHTML = '<div class="suggestion-item">Unable to load suggestions. Please try again.</div>';
      setTimeout(() => {
        suggestionsDiv.classList.remove('show');
        setTimeout(() => {
          suggestionsDiv.style.display = 'none';
        }, 300);
      }, 1500);
    });
}

function fetchMobileNoForParty(partyName) {
  const mobileNoInput = document.getElementById('mobileNo');
  const mobileNoSuggestionsDiv = document.getElementById('mobileNoSuggestions');

  mobileNoSuggestionsDiv.innerHTML = '<div class="suggestion-item">Fetching mobile number...</div>';
  mobileNoSuggestionsDiv.style.display = 'block';
  mobileNoSuggestionsDiv.classList.add('show');

  fetch(`/api/mobileNo?partyName=${encodeURIComponent(partyName)}`)
    .then(response => response.json())
    .then(data => {
      mobileNoSuggestionsDiv.classList.remove('show');
      setTimeout(() => {
        mobileNoSuggestionsDiv.style.display = 'none';
      }, 300);

      if (data.mobileNo && data.mobileNo.trim()) {
        mobileNoInput.value = data.mobileNo;
        showPopup('Success', `Mobile number ${data.mobileNo} fetched for party: ${partyName}`);
      } else {
        mobileNoInput.value = '';
        showPopup('Info', `No mobile number found for party: ${partyName}. Please enter a new mobile number.`);
      }
    })
    .catch(error => {
      console.error(`Error fetching mobile number for ${partyName}:`, error);
      mobileNoSuggestionsDiv.innerHTML = '<div class="suggestion-item">Unable to fetch mobile number. Please try again.</div>';
      mobileNoSuggestionsDiv.classList.remove('show');
      setTimeout(() => {
        mobileNoSuggestionsDiv.style.display = 'none';
      }, 300);
      mobileNoInput.value = '';
      showPopup('Admin', `Error fetching mobile number for ${partyName}: ${error.message}`);
    });
}

// ... (Keep the rest of your functions as they are)

window.onload = function() {
  document.getElementById('sortUniqueDescBtn').classList.add('active');
  startFetchInterval();
  updateDateTime();
  setInterval(updateDateTime, 1000);
  window.addEventListener('resize', () => requestAnimationFrame(adjustStickyColumns));
  const dataContainer = document.querySelector('.data-container');
  if (dataContainer) {
    dataContainer.addEventListener('scroll', () => requestAnimationFrame(handleScroll));
  }
  window.addEventListener('scroll', () => requestAnimationFrame(adjustStickyColumns));
  adjustStickyColumns();
  setupAutosuggestion();
};
