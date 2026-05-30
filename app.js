/* ==========================================================================
   VerifyDrive KYC App - Main Application Script
   ========================================================================== */

// Global scope mappings (avoiding ES modules for file:// CORS compliance)
const ui = {
  showToast,
  renderDriveItems,
  renderSandboxDocument,
  renderKycFormFields
};

// Application Instances
const drive = new DriveClient();
const processor = new KycProcessor();

// Application State
const state = {
  currentView: 'dashboard',
  activeCaseId: null,
  activeSlotId: null,
  explorer: {
    currentFolderId: 'root',
    folderPath: [{ id: 'root', name: 'My Drive' }], // Breadcrumbs array
    selectedItem: null, // PDF object currently highlighted
    searchQuery: ''
  }
};

// ==========================================================================
// INITIALIZATION AND STORAGE SYNCS
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  loadConfiguration();
  registerNavHandlers();
  registerDashboardHandlers();
  registerWorkbenchHandlers();
  registerSettingsHandlers();
  registerExplorerModalHandlers();
  registerReportHandlers();
  
  // Initial draw
  renderDashboardQueue();
  updateStatsMetrics();
  
  ui.showToast('VerifyDrive initialized successfully in Sandbox mode!', 'info');
});

/**
 * Loads API credentials and Sandbox state from LocalStorage.
 */
function loadConfiguration() {
  const sandbox = localStorage.getItem('vd_sandbox') !== 'false'; // Default to true
  const clientId = localStorage.getItem('vd_client_id') || '';
  const apiKey = localStorage.getItem('vd_api_key') || '';
  const token = localStorage.getItem('vd_access_token') || '';

  // Apply inputs to DOM
  document.getElementById('settings-sandbox-toggle').checked = sandbox;
  document.getElementById('settings-client-id').value = clientId;
  document.getElementById('settings-api-key').value = apiKey;
  document.getElementById('settings-access-token').value = token;

  // Toggle visible credential cards
  document.getElementById('live-api-settings').style.display = sandbox ? 'none' : 'flex';
  
  // Set configurations in client
  drive.configure({
    sandboxMode: sandbox,
    clientId: clientId,
    apiKey: apiKey,
    accessToken: token
  });

  updateConnectionStatusUI();
}

/**
 * Synchronizes UI status flags in the sidebar.
 */
function updateConnectionStatusUI() {
  const pill = document.getElementById('connection-status-pill');
  const label = document.getElementById('connection-status-label');
  const sub = document.getElementById('connection-status-sub');
  const authBtn = document.getElementById('auth-drive-btn');

  pill.className = 'connection-pill';
  
  if (drive.sandboxMode) {
    pill.classList.add('sandbox');
    label.textContent = 'Sandbox Active';
    sub.textContent = 'Mock Google Drive';
    authBtn.style.display = 'none';
  } else {
    authBtn.style.display = 'inline-flex';
    if (drive.accessToken) {
      pill.classList.add('connected');
      label.textContent = 'Drive Connected';
      sub.textContent = 'Live Session Active';
      authBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18.36 6.64a9 9 0 1 1-12.73 0"/>
          <line x1="12" y1="2" x2="12" y2="12"/>
        </svg>
        Disconnect
      `;
    } else {
      label.textContent = 'Drive Disconnected';
      sub.textContent = 'Configure Credentials';
      authBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        Connect Drive
      `;
    }
  }
}

// ==========================================================================
// ROUTER & NAVIGATION HANDLERS
// ==========================================================================

function registerNavHandlers() {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const target = item.dataset.target;
      navigateToView(target);
    });
  });

  // Connect Google Drive Button
  document.getElementById('auth-drive-btn').addEventListener('click', () => {
    if (drive.accessToken) {
      drive.disconnect();
      updateConnectionStatusUI();
      ui.showToast('Google Drive session disconnected.', 'warning');
    } else {
      try {
        if (!drive.clientId) {
          navigateToView('settings');
          ui.showToast('Please specify a Client ID in the settings first.', 'warning');
          return;
        }
        
        drive.initGoogleAuth(
          (token) => {
            localStorage.setItem('vd_access_token', token);
            document.getElementById('settings-access-token').value = token;
            updateConnectionStatusUI();
            ui.showToast('Google Account verified! Access to Drive granted.', 'success');
          },
          (err) => {
            ui.showToast(`Authentication Error: ${err}`, 'error');
          }
        );
        drive.requestAccessToken();
      } catch (err) {
        ui.showToast(err.message, 'error');
      }
    }
  });

  // Workbench Quick Launch Action
  document.getElementById('workbench-header-btn').addEventListener('click', () => {
    const queue = processor.getCases();
    // Default to the first pending case if we launch directly
    if (queue.length > 0) {
      activateKycCase(queue[0].id);
    } else {
      navigateToView('workbench');
    }
  });
}

function navigateToView(viewId) {
  state.currentView = viewId;

  // Active state navigation menu
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.target === viewId);
  });

  // Switch pages
  document.querySelectorAll('.page-view').forEach(el => {
    el.classList.toggle('active', el.id === `view-${viewId}`);
  });

  // Header Title strings
  const headerTitle = document.getElementById('page-title');
  const headerSubtitle = document.getElementById('page-subtitle');
  
  if (viewId === 'dashboard') {
    headerTitle.textContent = 'Dashboard';
    headerSubtitle.textContent = 'Overview of verification requests and system metrics';
    renderDashboardQueue();
    updateStatsMetrics();
  } else if (viewId === 'workbench') {
    headerTitle.textContent = 'KYC Workbench';
    headerSubtitle.textContent = 'Manage and audit client document compliance profiles';
    renderWorkbenchCaseDetails();
  } else if (viewId === 'reports') {
    headerTitle.textContent = 'Compliance Reports';
    headerSubtitle.textContent = 'Export sign-off files for verified customers';
    renderReportsOutput();
  } else if (viewId === 'settings') {
    headerTitle.textContent = 'Settings & APIs';
    headerSubtitle.textContent = 'Configure sandbox scopes, local files, and secure Google keys';
  }
}

// ==========================================================================
// DASHBOARD VIEW LOGIC
// ==========================================================================

function updateStatsMetrics() {
  const cases = processor.getCases();
  let totalDocs = 0;
  let pendingSlots = 0;

  cases.forEach(c => {
    Object.values(c.slots).forEach(s => {
      if (s.status === 'verified') totalDocs++;
      else if (s.required) pendingSlots++;
    });
  });

  document.getElementById('stats-total-cases').textContent = cases.length;
  document.getElementById('stats-verified-docs').textContent = totalDocs;
  document.getElementById('stats-pending-slots').textContent = pendingSlots;
}

function renderDashboardQueue() {
  const container = document.getElementById('dashboard-case-queue');
  container.innerHTML = '';

  const cases = processor.getCases();
  if (cases.length === 0) {
    container.innerHTML = '<div style="color:var(--text-muted); font-style:italic;">No active KYC requests.</div>';
    return;
  }

  cases.forEach(item => {
    const el = document.createElement('div');
    el.className = 'case-card';
    el.dataset.id = item.id;

    // Get count of verified docs vs required
    const slots = Object.values(item.slots);
    const verifiedCount = slots.filter(s => s.status === 'verified').length;
    const requiredCount = slots.filter(s => s.required).length;

    // Map status classes
    let statusClass = 'badge-pending';
    let statusText = 'Pending Audit';
    if (item.status === 'verified') {
      statusClass = 'badge-verified';
      statusText = 'Verified';
    } else if (item.status === 'failed') {
      statusClass = 'badge-failed';
      statusText = 'Rejected';
    }

    el.innerHTML = `
      <div class="case-main">
        <div class="case-header">
          <span class="case-id">CASE #${item.id.replace('case-', '')}</span>
          <span class="case-name">${item.name}</span>
        </div>
        <div class="case-details">
          <span>Profile Type: <strong>${item.type}</strong></span>
          <span>•</span>
          <span>Documents Verified: <strong>${verifiedCount}/${requiredCount}</strong></span>
        </div>
      </div>
      <div style="display:flex; align-items:center; gap:20px;">
        <span class="case-badge ${statusClass}">${statusText}</span>
        <span class="case-badge" style="background: rgba(255,255,255,0.03); color: var(--text-secondary); border: 1px solid var(--border-color);">${item.riskLevel}</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color: var(--text-muted)"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
    `;

    el.addEventListener('click', () => {
      activateKycCase(item.id);
    });

    container.appendChild(el);
  });
}

function registerDashboardHandlers() {
  // Navigation lists handled inline
}

// ==========================================================================
// WORKBENCH VIEW LOGIC
// ==========================================================================

function registerWorkbenchHandlers() {
  document.getElementById('wb-back-dashboard-btn').addEventListener('click', () => {
    navigateToView('dashboard');
  });

  // Workbench cancel editor view
  document.getElementById('editor-cancel-btn').addEventListener('click', () => {
    state.activeSlotId = null;
    renderWorkbenchCaseDetails();
  });

  // Modal explorer launcher
  document.getElementById('trigger-drive-explorer-btn').addEventListener('click', () => {
    openExplorerModal();
  });

  // Unlink document file association
  document.getElementById('unlink-document-btn').addEventListener('click', () => {
    if (state.activeCaseId && state.activeSlotId) {
      processor.unlinkSlot(state.activeCaseId, state.activeSlotId);
      ui.showToast('Document unlinked from slot.', 'warning');
      renderWorkbenchCaseDetails();
    }
  });

  // Run simulated AI OCR Extraction process
  document.getElementById('run-mock-ocr-btn').addEventListener('click', async () => {
    if (!state.activeCaseId || !state.activeSlotId) return;

    const btn = document.getElementById('run-mock-ocr-btn');
    const progressContainer = document.getElementById('ocr-progress-container');
    const progressBar = document.getElementById('ocr-progress-bar');

    btn.disabled = true;
    progressContainer.style.display = 'block';
    progressBar.style.width = '0%';

    try {
      await processor.extractDocumentData(
        state.activeCaseId, 
        state.activeSlotId, 
        (progress) => {
          progressBar.style.width = `${progress}%`;
        }
      );

      ui.showToast('Document visual layout parsed! Fields populated.', 'success');
      
      // Update form representation
      renderWorkbenchCaseDetails();
    } catch (err) {
      ui.showToast(`OCR Engine Error: ${err.message}`, 'error');
    } finally {
      btn.disabled = false;
      progressContainer.style.display = 'none';
    }
  });

  // Save approved details Form handler
  document.getElementById('editor-approve-btn').addEventListener('click', () => {
    if (!state.activeCaseId || !state.activeSlotId) return;

    const kycCase = processor.getCase(state.activeCaseId);
    const slot = kycCase.slots[state.activeSlotId];
    
    // Read input fields
    const updatedValues = {};
    if (slot.extractedData) {
      Object.keys(slot.extractedData).forEach(key => {
        const inputEl = document.getElementById(`form-val-${key}`);
        if (inputEl) {
          updatedValues[key] = inputEl.value;
        }
      });
    }

    processor.approveSlot(state.activeCaseId, state.activeSlotId, updatedValues);
    ui.showToast(`${slot.name} verified and saved!`, 'success');
    
    // Move to next unverified slot automatically if available
    const nextSlot = Object.values(kycCase.slots).find(s => s.status !== 'verified' && s.id !== state.activeSlotId);
    if (nextSlot) {
      state.activeSlotId = nextSlot.id;
    } else {
      state.activeSlotId = null;
      // If entire case is verified, direct them to Reports view
      if (kycCase.status === 'verified') {
        ui.showToast('All KYC documents verified! Report generated.', 'success');
        navigateToView('reports');
        return;
      }
    }
    
    renderWorkbenchCaseDetails();
  });
}

function activateKycCase(caseId) {
  state.activeCaseId = caseId;
  state.activeSlotId = null; // Clear active slot focus
  navigateToView('workbench');
}

/**
 * Draw details and workbench fields for the active customer case.
 */
function renderWorkbenchCaseDetails() {
  const caseId = state.activeCaseId;
  if (!caseId) {
    // Show empty workbench mode
    document.getElementById('wb-case-name').textContent = 'No Selected Case';
    document.getElementById('wb-case-risk').textContent = '';
    document.getElementById('wb-slots-list').innerHTML = '';
    document.getElementById('workbench-empty-panel').style.display = 'flex';
    document.getElementById('workbench-editor-panel').style.display = 'none';
    return;
  }

  const kycCase = processor.getCase(caseId);
  document.getElementById('wb-case-name').textContent = kycCase.name;
  document.getElementById('wb-case-risk').textContent = `${kycCase.type} • ${kycCase.riskLevel}`;

  // Populate slots sidebar list
  const slotsList = document.getElementById('wb-slots-list');
  slotsList.innerHTML = '';

  Object.values(kycCase.slots).forEach(slot => {
    const el = document.createElement('div');
    el.className = `slot-item ${slot.status} ${state.activeSlotId === slot.id ? 'active' : ''}`;
    el.dataset.id = slot.id;

    let subText = `<span class="slot-placeholder">No document linked</span>`;
    if (slot.file) {
      subText = `<span class="slot-file-name" title="${slot.file.name}">${slot.file.name}</span>`;
    }

    el.innerHTML = `
      <div class="slot-label">
        ${slot.name}
        <div class="slot-status-dot"></div>
      </div>
      ${subText}
    `;

    el.addEventListener('click', () => {
      state.activeSlotId = slot.id;
      renderWorkbenchCaseDetails();
    });

    slotsList.appendChild(el);
  });

  // Control workbench editors panels
  const emptyPanel = document.getElementById('workbench-empty-panel');
  const editorPanel = document.getElementById('workbench-editor-panel');

  if (!state.activeSlotId) {
    emptyPanel.style.display = 'flex';
    editorPanel.style.display = 'none';
  } else {
    emptyPanel.style.display = 'none';
    editorPanel.style.display = 'flex';

    // Populate Editor fields
    const slot = kycCase.slots[state.activeSlotId];
    document.getElementById('editor-slot-title').textContent = slot.name;
    document.getElementById('editor-slot-desc').textContent = slot.desc;

    // Render Badge Status
    const badgeContainer = document.getElementById('editor-slot-status-badge');
    badgeContainer.innerHTML = '';
    
    let statusClass = 'badge-pending';
    let statusText = 'Pending Assignment';
    if (slot.status === 'verified') {
      statusClass = 'badge-verified';
      statusText = 'Verified';
    } else if (slot.status === 'linked') {
      statusClass = 'badge-pending';
      statusText = 'Linked - Parsing Needed';
    }
    badgeContainer.innerHTML = `<span class="case-badge ${statusClass}">${statusText}</span>`;

    // Visual Sandbox Document Viewer render
    const viewerFrame = document.getElementById('sandbox-pdf-viewer');
    ui.renderSandboxDocument(viewerFrame, slot.file);

    // Form inputs and triggers
    const triggerBtn = document.getElementById('trigger-drive-explorer-btn');
    const aiCard = document.getElementById('ai-extract-card');
    const fieldsGroup = document.getElementById('kyc-doc-fields-group');
    const formGrid = document.getElementById('kyc-fields-form-grid');
    const unlinkBtn = document.getElementById('unlink-document-btn');
    const approveBtn = document.getElementById('editor-approve-btn');
    
    // Google Drive Link
    const driveLink = document.getElementById('editor-google-drive-link');
    const fileStatus = document.getElementById('editor-file-status');

    if (slot.file) {
      triggerBtn.style.display = 'none';
      unlinkBtn.style.display = 'inline-flex';
      
      driveLink.style.display = 'inline';
      driveLink.href = slot.file.webViewLink;
      fileStatus.textContent = `${slot.file.name} (${(slot.file.size / 1024 / 1024).toFixed(2)} MB)`;

      // Logic states for OCR form rendering
      if (slot.extractedData) {
        aiCard.style.display = 'none';
        fieldsGroup.style.display = 'block';
        approveBtn.style.display = 'inline-flex';
        
        // Render inputs grid
        ui.renderKycFormFields(formGrid, slot.type, slot.extractedData, (key, value) => {
          slot.extractedData[key] = value;
        });
      } else {
        aiCard.style.display = 'flex';
        fieldsGroup.style.display = 'none';
        approveBtn.style.display = 'none';
        formGrid.innerHTML = '';
      }
    } else {
      triggerBtn.style.display = 'inline-flex';
      unlinkBtn.style.display = 'none';
      aiCard.style.display = 'none';
      fieldsGroup.style.display = 'none';
      approveBtn.style.display = 'none';
      formGrid.innerHTML = '';
      driveLink.style.display = 'none';
      fileStatus.textContent = 'No PDF Assigned';
    }
  }
}

// ==========================================================================
// SETTINGS CONFIG HANDLERS
// ==========================================================================

function registerSettingsHandlers() {
  // Sandbox Toggle layout controller
  document.getElementById('settings-sandbox-toggle').addEventListener('change', (e) => {
    const sandbox = e.target.checked;
    document.getElementById('live-api-settings').style.display = sandbox ? 'none' : 'flex';
  });

  // Save Settings
  document.getElementById('save-settings-btn').addEventListener('click', () => {
    const sandbox = document.getElementById('settings-sandbox-toggle').checked;
    const clientId = document.getElementById('settings-client-id').value.trim();
    const apiKey = document.getElementById('settings-api-key').value.trim();
    const token = document.getElementById('settings-access-token').value.trim();

    // Persist local settings
    localStorage.setItem('vd_sandbox', sandbox);
    localStorage.setItem('vd_client_id', clientId);
    localStorage.setItem('vd_api_key', apiKey);
    localStorage.setItem('vd_access_token', token);

    // Apply instances
    drive.configure({
      sandboxMode: sandbox,
      clientId: clientId,
      apiKey: apiKey,
      accessToken: token
    });

    updateConnectionStatusUI();
    ui.showToast('Configuration settings updated successfully!', 'success');
    
    // Redirect back to dashboard to refresh queue view
    navigateToView('dashboard');
  });
}

// ==========================================================================
// DRIVE FILE EXPLORER MODAL HANDLERS
// ==========================================================================

function registerExplorerModalHandlers() {
  document.getElementById('explorer-close-btn').addEventListener('click', closeExplorerModal);
  document.getElementById('explorer-cancel-btn').addEventListener('click', closeExplorerModal);
  
  // Selection select click listener
  document.getElementById('explorer-confirm-btn').addEventListener('click', () => {
    if (state.explorer.selectedItem && state.activeCaseId && state.activeSlotId) {
      processor.linkFileToSlot(state.activeCaseId, state.activeSlotId, state.explorer.selectedItem);
      ui.showToast(`Selected PDF linked successfully! Ready for verification.`, 'success');
      closeExplorerModal();
      renderWorkbenchCaseDetails();
    }
  });

  // Search filter query inputs
  const searchField = document.getElementById('explorer-search-field');
  searchField.addEventListener('input', (e) => {
    state.explorer.searchQuery = e.target.value;
    loadExplorerDriveFiles();
  });
}

/**
 * Triggers loading Explorer popup view.
 */
function openExplorerModal() {
  const modal = document.getElementById('drive-explorer-modal');
  modal.classList.add('active');
  
  // Reset paths to Drive Root
  state.explorer.currentFolderId = 'root';
  state.explorer.folderPath = [{ id: 'root', name: 'My Drive' }];
  state.explorer.selectedItem = null;
  state.explorer.searchQuery = '';
  document.getElementById('explorer-search-field').value = '';
  
  document.getElementById('explorer-confirm-btn').disabled = true;
  document.getElementById('explorer-selection-summary').innerHTML = 'No PDF document selected';

  loadExplorerDriveFiles();
}

function closeExplorerModal() {
  document.getElementById('drive-explorer-modal').classList.remove('active');
}

/**
 * Traverses active directories and lists PDF documents.
 */
async function loadExplorerDriveFiles() {
  const grid = document.getElementById('explorer-files-grid');
  grid.innerHTML = '<div style="grid-column: 1 / -1; text-align:center; padding: 40px; color:var(--text-muted)">Querying Google Drive files...</div>';

  drawBreadcrumbs();

  try {
    const items = await drive.listFiles(state.explorer.currentFolderId, state.explorer.searchQuery);
    
    ui.renderDriveItems(
      grid, 
      items, 
      // File Highlight Callback
      (item) => {
        state.explorer.selectedItem = item;
        
        // Highlight selection UI grids
        document.querySelectorAll('.explorer-item').forEach(el => {
          el.classList.toggle('selected', el.dataset.id === item.id);
        });

        // Update footer panel text
        document.getElementById('explorer-confirm-btn').disabled = false;
        document.getElementById('explorer-selection-summary').innerHTML = `
          Selected: <span class="explorer-selected-name">${item.name}</span>
        `;
      },
      // Folder Navigation Double-Click Callback
      (folderId, folderName) => {
        state.explorer.currentFolderId = folderId;
        state.explorer.folderPath.push({ id: folderId, name: folderName });
        state.explorer.selectedItem = null;
        document.getElementById('explorer-confirm-btn').disabled = true;
        document.getElementById('explorer-selection-summary').innerHTML = 'No PDF document selected';
        
        loadExplorerDriveFiles();
      },
      state.explorer.selectedItem?.id
    );
  } catch (err) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align:center; padding: 20px; color:var(--color-error)">
        <p style="font-weight:600; margin-bottom: 6px;">Drive Connection Error</p>
        <p style="font-size:13px; opacity:0.8;">${err.message}</p>
        <button class="btn btn-secondary" id="explorer-configure-redirect-btn" style="margin-top:14px; font-size:12px;">Go to settings</button>
      </div>
    `;
    
    const settingsBtn = document.getElementById('explorer-configure-redirect-btn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        closeExplorerModal();
        navigateToView('settings');
      });
    }
  }
}

/**
 * Breadcrumb UI Renderer.
 */
function drawBreadcrumbs() {
  const crumbs = document.getElementById('explorer-crumbs');
  crumbs.innerHTML = '';

  state.explorer.folderPath.forEach((crumb, index) => {
    const el = document.createElement('span');
    el.className = 'breadcrumb-item';
    el.textContent = crumb.name;
    
    // Add navigation action
    el.addEventListener('click', () => {
      // Truncate paths array to clicked index
      state.explorer.folderPath = state.explorer.folderPath.slice(0, index + 1);
      state.explorer.currentFolderId = crumb.id;
      state.explorer.selectedItem = null;
      document.getElementById('explorer-confirm-btn').disabled = true;
      document.getElementById('explorer-selection-summary').innerHTML = 'No PDF document selected';
      
      loadExplorerDriveFiles();
    });

    crumbs.appendChild(el);

    if (index < state.explorer.folderPath.length - 1) {
      const sep = document.createElement('span');
      sep.className = 'breadcrumb-separator';
      sep.textContent = ' / ';
      crumbs.appendChild(sep);
    }
  });
}

// ==========================================================================
// REPORTS GENERATION VIEW LOGIC
// ==========================================================================

function registerReportHandlers() {
  // Copy to Clipboard Action
  document.getElementById('report-copy-btn').addEventListener('click', () => {
    const text = document.getElementById('report-output-box').textContent;
    navigator.clipboard.writeText(text)
      .then(() => ui.showToast('KYC compliance report copied to clipboard!', 'success'))
      .catch(err => ui.showToast(`Clipboard Copy failed: ${err.message}`, 'error'));
  });

  // Download raw TXT file
  document.getElementById('report-download-btn').addEventListener('click', () => {
    if (!state.activeCaseId) return;
    const text = document.getElementById('report-output-box').textContent;
    const kycCase = processor.getCase(state.activeCaseId);
    
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `kyc_report_${kycCase.name.toLowerCase().replace(/\s+/g, '_')}_${state.activeCaseId}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    ui.showToast('Compliance report downloaded as .md file.', 'success');
  });
}

/**
 * Display generated markdown output in the viewer box.
 */
function renderReportsOutput() {
  const caseId = state.activeCaseId;
  const reportBox = document.getElementById('report-output-box');
  const labelText = document.getElementById('reports-case-label');
  const controls = document.getElementById('report-controls');

  if (!caseId) {
    labelText.textContent = 'Please choose a KYC request case from the dashboard first.';
    reportBox.textContent = 'No active verification session. Navigate to the dashboard, click a client request, and verify all required documents in the KYC Workbench.';
    controls.style.display = 'none';
    return;
  }

  const kycCase = processor.getCase(caseId);
  labelText.textContent = `Active Review: Case #${caseId.replace('case-', '')} - ${kycCase.name}`;

  const mdReport = processor.generateComplianceReport(caseId);
  reportBox.textContent = mdReport;
  controls.style.display = 'flex';
}
