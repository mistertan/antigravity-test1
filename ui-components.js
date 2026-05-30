/* ==========================================================================
   VerifyDrive KYC App - UI Rendering Utilities
   ========================================================================== */

/**
 * Trigger dynamic toast messages on the interface.
 * @param {string} msg Message body.
 * @param {string} type Theme state: 'success', 'warning', 'error', 'info'.
 */
function showToast(msg, type = 'info') {
  const container = document.getElementById('global-toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  // Icon dictionary based on SVG
  const icons = {
    success: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="toast-icon"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    warning: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="toast-icon"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    error: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="toast-icon"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    info: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="toast-icon"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`
  };

  toast.innerHTML = `
    ${icons[type] || icons.info}
    <div class="toast-content">${msg}</div>
    <div class="toast-close">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </div>
  `;

  // Close trigger
  toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    setTimeout(() => toast.remove(), 300);
  });

  container.appendChild(toast);

  // Auto-remove
  setTimeout(() => {
    if (toast.parentNode) {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(22px)';
      setTimeout(() => toast.remove(), 300);
    }
  }, 4000);
}

/**
 * Render items inside the Drive File Explorer.
 */
function renderDriveItems(container, items, onSelect, onFolderOpen, selectedId) {
  container.innerHTML = '';
  
  if (items.length === 0) {
    container.innerHTML = `
      <div class="explorer-empty-state" style="grid-column: 1 / -1;">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:12px; opacity:0.6;">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="9" y1="15" x2="15" y2="15"/>
        </svg>
        <span>No matching PDF files or folders found</span>
      </div>
    `;
    return;
  }

  items.forEach(item => {
    const el = document.createElement('div');
    el.className = `explorer-item ${selectedId === item.id ? 'selected' : ''}`;
    el.dataset.id = item.id;
    
    const sizeStr = item.size ? `${(item.size / 1024 / 1024).toFixed(2)} MB` : '';
    
    // Icon selection
    const folderIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
      </svg>
    `;
    
    const pdfIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    `;

    el.innerHTML = `
      <div class="explorer-item-icon ${item.isFolder ? 'folder' : 'pdf'}">
        ${item.isFolder ? folderIcon : pdfIcon}
      </div>
      <div class="explorer-item-name" title="${item.name}">${item.name}</div>
      <div class="explorer-item-meta">${item.isFolder ? 'Folder' : sizeStr}</div>
    `;

    // Click handler
    el.addEventListener('click', (e) => {
      // Toggle select for PDFs
      if (!item.isFolder) {
        onSelect(item);
      }
    });

    // Double click handler for folders
    el.addEventListener('dblclick', () => {
      if (item.isFolder) {
        onFolderOpen(item.id, item.name);
      }
    });

    container.appendChild(el);
  });
}

/**
 * Render PDF documents visually in the sandbox frame.
 */
function renderSandboxDocument(container, doc) {
  if (!doc || !doc.visualData) {
    container.innerHTML = `
      <div class="sandbox-doc-header">
        <div class="sandbox-doc-logo">VERIFYDRIVE SECURE</div>
        <div class="sandbox-doc-stamp">EMPTY SLOT</div>
      </div>
      <div class="sandbox-doc-title">Select Document</div>
      <div id="sb-doc-body-fields">
        <div class="sandbox-doc-field">
          <div class="sandbox-doc-field-label">Document Status</div>
          <div class="sandbox-doc-field-value" style="color: #64748b; font-style: italic;">Please link a PDF file using the explorer widget.</div>
        </div>
      </div>
      <div class="sandbox-doc-footer">
        <span>SECURITY DOCUMENT LEVEL: sandbox-tier</span>
        <span>REV#9999</span>
      </div>
    `;
    return;
  }

  const v = doc.visualData;
  let bodyHTML = '';

  if (doc.docType === 'identity') {
    bodyHTML = `
      <div class="sandbox-doc-photo-stub">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        <span>PHOTO</span>
      </div>
      
      <div class="sandbox-doc-field" style="max-width: 65%;">
        <div class="sandbox-doc-field-label">Document No. / No du Document</div>
        <div class="sandbox-doc-field-value">${v.docNumber}</div>
      </div>

      <div class="sandbox-doc-field" style="max-width: 65%;">
        <div class="sandbox-doc-field-label">Full Name / Nom Complet</div>
        <div class="sandbox-doc-field-value" style="font-weight: 800;">${v.fullName}</div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; max-width: 65%; margin-top: 10px;">
        <div class="sandbox-doc-field">
          <div class="sandbox-doc-field-label">Date of Birth</div>
          <div class="sandbox-doc-field-value">${v.dob}</div>
        </div>
        <div class="sandbox-doc-field">
          <div class="sandbox-doc-field-label">Sex / Sexe</div>
          <div class="sandbox-doc-field-value">${v.sex}</div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; max-width: 65%; margin-top: 10px;">
        <div class="sandbox-doc-field">
          <div class="sandbox-doc-field-label">Nationality</div>
          <div class="sandbox-doc-field-value">${v.nationality}</div>
        </div>
        <div class="sandbox-doc-field">
          <div class="sandbox-doc-field-label">Date of Expiration</div>
          <div class="sandbox-doc-field-value" style="color: ${new Date(v.expiry) < new Date() ? '#ef4444' : '#1e293b'}">${v.expiry}</div>
        </div>
      </div>

      <div class="sandbox-doc-mrz">
        ${v.mrz1}<br>${v.mrz2}
      </div>
    `;
  } else if (doc.docType === 'address') {
    bodyHTML = `
      <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
        <div class="sandbox-doc-field">
          <div class="sandbox-doc-field-label">Account Name</div>
          <div class="sandbox-doc-field-value" style="font-weight: 700;">${v.fullName}</div>
        </div>
        <div class="sandbox-doc-field" style="text-align: right;">
          <div class="sandbox-doc-field-label">Billing Date</div>
          <div class="sandbox-doc-field-value">${v.issueDate}</div>
        </div>
      </div>

      <div class="sandbox-doc-field">
        <div class="sandbox-doc-field-label">Service Address</div>
        <div class="sandbox-doc-field-value" style="line-height:1.4; padding-bottom: 10px;">
          ${v.address.replace(', ', '<br>')}
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; border-top: 1px solid #f1f5f9; padding-top: 15px;">
        <div class="sandbox-doc-field">
          <div class="sandbox-doc-field-label">Account ID / Reference</div>
          <div class="sandbox-doc-field-value">${v.accountNumber}</div>
        </div>
        <div class="sandbox-doc-field">
          <div class="sandbox-doc-field-label">Outstanding Amount Due</div>
          <div class="sandbox-doc-field-value" style="font-weight: 800; color: #0f172a;">${v.amountDue}</div>
        </div>
      </div>

      <div style="margin-top: auto; font-size: 11px; text-align: center; color: #94a3b8; font-style: italic; border: 1px dashed #cbd5e1; padding: 8px; border-radius: 4px;">
        Barcode scanned: *${v.accountNumber}* - Statement processed securely
      </div>
    `;
  } else if (doc.docType === 'income') {
    bodyHTML = `
      <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
        <div class="sandbox-doc-field">
          <div class="sandbox-doc-field-label">Employee / Taxpayer</div>
          <div class="sandbox-doc-field-value" style="font-weight: 700;">${v.fullName}</div>
        </div>
        <div class="sandbox-doc-field" style="text-align: right;">
          <div class="sandbox-doc-field-label">Issuer Date</div>
          <div class="sandbox-doc-field-value">${v.issueDate}</div>
        </div>
      </div>

      <div class="sandbox-doc-field">
        <div class="sandbox-doc-field-label">Employer Name / Legal Entity</div>
        <div class="sandbox-doc-field-value">${v.employer}</div>
      </div>

      <div class="sandbox-doc-field" style="margin-top: 10px;">
        <div class="sandbox-doc-field-label">Postal Address</div>
        <div class="sandbox-doc-field-value">${v.address || 'N/A'}</div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 25px; border-top: 1px solid #f1f5f9; padding-top: 15px;">
        <div class="sandbox-doc-field">
          <div class="sandbox-doc-field-label">Filing Form Ref</div>
          <div class="sandbox-doc-field-value">${v.docNumber}</div>
        </div>
        <div class="sandbox-doc-field">
          <div class="sandbox-doc-field-label">Wages, Salaries, Tips</div>
          <div class="sandbox-doc-field-value" style="font-weight: 800; font-size: 18px; color: #10b981;">${v.wages}</div>
        </div>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="sandbox-doc-header">
      <div class="sandbox-doc-logo">${v.issuer}</div>
      <div class="sandbox-doc-stamp" style="border-color: #10b981; color: #10b981;">SANDBOX SECURED</div>
    </div>
    <div class="sandbox-doc-title">${v.title}</div>
    ${bodyHTML}
    <div class="sandbox-doc-footer" style="margin-top: auto;">
      <span>DRIVE INTEGRATED SOURCE</span>
      <span>${v.docNumber}</span>
    </div>
  `;
}

/**
 * Render the checklist verification form controls.
 */
function renderKycFormFields(container, type, data, onChange) {
  container.innerHTML = '';
  
  if (!data) return;

  const fields = {
    identity: [
      { id: 'fullName', label: 'Full Customer Name', type: 'text' },
      { id: 'docNumber', label: 'Document Number', type: 'text' },
      { id: 'dob', label: 'Date of Birth (YYYY-MM-DD)', type: 'date' },
      { id: 'expiry', label: 'Expiration Date (YYYY-MM-DD)', type: 'date' },
      { id: 'nationality', label: 'Nationality ISO Code', type: 'text' },
      { id: 'issuer', label: 'Issuing Country Authority', type: 'text', full: true }
    ],
    address: [
      { id: 'fullName', label: 'Billing Customer Name', type: 'text' },
      { id: 'issueDate', label: 'Billing Statement Date', type: 'date' },
      { id: 'issuer', label: 'Billing Provider / Utility Name', type: 'text', full: true },
      { id: 'address', label: 'Full Street Address', type: 'text', full: true }
    ],
    income: [
      { id: 'fullName', label: 'Employee Name', type: 'text' },
      { id: 'issueDate', label: 'Tax Year / Pay Date', type: 'text' },
      { id: 'employer', label: 'Employer / Legal Entity', type: 'text', full: true },
      { id: 'wages', label: 'Gross Annual Wages / Salary', type: 'text' }
    ]
  };

  const formFields = fields[type] || [];

  formFields.forEach(field => {
    const group = document.createElement('div');
    group.className = `form-field ${field.full ? 'full-width' : ''}`;
    
    group.innerHTML = `
      <label class="form-label" for="form-val-${field.id}">${field.label}</label>
      <input type="${field.type}" class="form-input" id="form-val-${field.id}" value="${data[field.id] || ''}">
    `;
    
    // Wire change triggers
    group.querySelector('input').addEventListener('input', (e) => {
      onChange(field.id, e.target.value);
    });

    container.appendChild(group);
  });
}
