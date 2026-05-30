/* ==========================================================================
   VerifyDrive KYC App - Google Drive Client Library
   ========================================================================== */

/**
 * Mock Sandbox Google Drive File System Database.
 * Contains mock PDF documents and folders with pre-populated metadata.
 */
const SANDBOX_DRIVE = {
  // Folder database
  folders: {
    'root': {
      id: 'root',
      name: 'My Drive',
      children: ['folder-identity', 'folder-address', 'folder-income']
    },
    'folder-identity': {
      id: 'folder-identity',
      name: 'Identity Documents',
      parent: 'root',
      children: ['pdf-passport-john', 'pdf-id-jane']
    },
    'folder-address': {
      id: 'folder-address',
      name: 'Address Documents',
      parent: 'root',
      children: ['pdf-bill-john', 'pdf-lease-jane']
    },
    'folder-income': {
      id: 'folder-income',
      name: 'Income Documents',
      parent: 'root',
      children: ['pdf-tax-john', 'pdf-paystub-jane']
    }
  },
  
  // File database with full visual representations and OCR profiles
  files: {
    'pdf-passport-john': {
      id: 'pdf-passport-john',
      name: 'passport_john_doe.pdf',
      mimeType: 'application/pdf',
      size: 1424050, // ~1.4 MB
      modifiedTime: '2026-03-12T10:45:00Z',
      parent: 'folder-identity',
      webViewLink: 'https://drive.google.com/file/d/mock-passport-john-view',
      // OCR & Visual simulator metadata
      docType: 'identity',
      visualData: {
        issuer: 'UNITED STATES OF AMERICA',
        title: 'PASSPORT / PASSEPORT',
        docNumber: 'P55021882',
        fullName: 'JOHN DOE',
        dob: '1985-05-12',
        sex: 'M',
        expiry: '2032-08-22',
        nationality: 'USA',
        mrz1: 'P<USADOE<<JOHN<<<<<<<<<<<<<<<<<<<<<<<<<<<<',
        mrz2: 'P550218826USA8505128M3208220<<<<<<<<<<<<<<04'
      }
    },
    'pdf-id-jane': {
      id: 'pdf-id-jane',
      name: 'national_id_jane_smith.pdf',
      mimeType: 'application/pdf',
      size: 890420,
      modifiedTime: '2026-02-28T14:12:00Z',
      parent: 'folder-identity',
      webViewLink: 'https://drive.google.com/file/d/mock-id-jane-view',
      docType: 'identity',
      visualData: {
        issuer: 'REPUBLIC OF CANADA / REPUBLIQUE DU CANADA',
        title: 'NATIONAL IDENTITY CARD / CARTE D\'IDENTITE',
        docNumber: 'ID-9082345',
        fullName: 'JANE SMITH',
        dob: '1991-11-04',
        sex: 'F',
        expiry: '2029-04-15',
        nationality: 'CAN',
        mrz1: 'I<CANSMITH<<JANE<<<<<<<<<<<<<<<<<<<<<<<<<<<',
        mrz2: 'ID90823459CAN9111041F2904153<<<<<<<<<<<<<<02'
      }
    },
    'pdf-bill-john': {
      id: 'pdf-bill-john',
      name: 'utility_bill_john_doe.pdf',
      mimeType: 'application/pdf',
      size: 1104500,
      modifiedTime: '2026-04-10T08:30:00Z',
      parent: 'folder-address',
      webViewLink: 'https://drive.google.com/file/d/mock-bill-john-view',
      docType: 'address',
      visualData: {
        issuer: 'POWERGRID ENERGY CORP',
        title: 'ELECTRICITY INVOICE / STATEMENT',
        docNumber: 'INV-2026-9042',
        fullName: 'JOHN DOE',
        address: '123 PINE STREET, SEATTLE, WA 98101',
        issueDate: '2026-04-10',
        amountDue: '$142.50',
        accountNumber: 'ACT-908-1122'
      }
    },
    'pdf-lease-jane': {
      id: 'pdf-lease-jane',
      name: 'lease_agreement_jane_smith.pdf',
      mimeType: 'application/pdf',
      size: 3204900,
      modifiedTime: '2025-10-01T11:00:00Z',
      parent: 'folder-address',
      webViewLink: 'https://drive.google.com/file/d/mock-lease-jane-view',
      docType: 'address',
      visualData: {
        issuer: 'METRO APARTMENTS LEASING LLC',
        title: 'RESIDENTIAL LEASE AGREEMENT',
        docNumber: 'LEASE-742-EG',
        fullName: 'JANE SMITH',
        address: '742 EVERGREEN TERRACE, SPRINGFIELD, IL 62704',
        issueDate: '2025-10-01',
        amountDue: '$1,850.00 / month',
        accountNumber: 'LEASE-742-EG'
      }
    },
    'pdf-tax-john': {
      id: 'pdf-tax-john',
      name: 'w2_tax_statement_2025_john_doe.pdf',
      mimeType: 'application/pdf',
      size: 1850300,
      modifiedTime: '2026-01-20T17:05:00Z',
      parent: 'folder-income',
      webViewLink: 'https://drive.google.com/file/d/mock-tax-john-view',
      docType: 'income',
      visualData: {
        issuer: 'INTERNAL REVENUE SERVICE (W-2)',
        title: 'WAGE AND TAX STATEMENT 2025',
        docNumber: 'W2-2025-90188',
        fullName: 'JOHN DOE',
        address: '123 PINE STREET, SEATTLE, WA 98101',
        issueDate: '2026-01-15',
        employer: 'TECHCORP SOLUTIONS INC',
        wages: '$125,000.00'
      }
    },
    'pdf-paystub-jane': {
      id: 'pdf-paystub-jane',
      name: 'pay_slip_april_2026_jane_smith.pdf',
      mimeType: 'application/pdf',
      size: 670200,
      modifiedTime: '2026-04-30T16:00:00Z',
      parent: 'folder-income',
      webViewLink: 'https://drive.google.com/file/d/mock-paystub-jane-view',
      docType: 'income',
      visualData: {
        issuer: 'AEGIS CONSULTING LTD',
        title: 'MONTHLY PAYSLIP / SALARY REMITTANCE',
        docNumber: 'PAY-2604-0098',
        fullName: 'JANE SMITH',
        address: '742 EVERGREEN TERRACE, SPRINGFIELD, IL 62704',
        issueDate: '2026-04-30',
        employer: 'AEGIS CONSULTING LTD',
        wages: '$6,850.00 (Net Monthly)'
      }
    }
  }
};

class DriveClient {
  constructor() {
    this.sandboxMode = true;
    this.accessToken = null;
    this.clientId = null;
    this.apiKey = null;
    this.tokenClient = null;
    this.targetFolder = 'root';
  }

  /**
   * Update client configurations.
   */
  configure(config) {
    if (config.sandboxMode !== undefined) this.sandboxMode = config.sandboxMode;
    if (config.accessToken !== undefined) this.accessToken = config.accessToken;
    if (config.clientId !== undefined) this.clientId = config.clientId;
    if (config.apiKey !== undefined) this.apiKey = config.apiKey;
    if (config.targetFolder !== undefined) this.targetFolder = config.targetFolder;
  }

  /**
   * Initializes the Google Identity Services OAuth 2.0 Token Client.
   */
  async initGoogleAuth(onTokenReceived, onError) {
    if (this.sandboxMode) return;

    if (!window.google || !window.google.accounts) {
      if (onError) onError('Google Identity Services SDK not loaded.');
      return;
    }

    try {
      this.tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: this.clientId,
        scope: 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.metadata.readonly',
        callback: (response) => {
          if (response.error) {
            if (onError) onError(response.error);
            return;
          }
          this.accessToken = response.access_token;
          if (onTokenReceived) onTokenReceived(this.accessToken);
        },
      });
    } catch (err) {
      if (onError) onError(`Auth init failed: ${err.message}`);
    }
  }

  /**
   * Request Google account sign-in popup.
   */
  requestAccessToken() {
    if (this.sandboxMode) {
      console.warn('Authentication requested, but Sandbox Mode is active.');
      return;
    }
    
    if (this.tokenClient) {
      this.tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      throw new Error('OAuth Token Client is not initialized. Check your credentials in settings.');
    }
  }

  /**
   * Disconnect authentication state.
   */
  disconnect() {
    if (this.accessToken && window.google) {
      window.google.accounts.oauth2.revokeToken(this.accessToken, () => {
        this.accessToken = null;
      });
    } else {
      this.accessToken = null;
    }
  }

  /**
   * Retrieves files and directories from active mode.
   * @param {string} folderId Parent directory ID.
   * @param {string} searchQuery Optional filter queries.
   */
  async listFiles(folderId = 'root', searchQuery = '') {
    if (this.sandboxMode) {
      return this.listSandboxFiles(folderId, searchQuery);
    }
    return this.listLiveFiles(folderId, searchQuery);
  }

  /**
   * Fetches specific details of a single file.
   */
  async getFile(fileId) {
    if (this.sandboxMode) {
      return SANDBOX_DRIVE.files[fileId] || null;
    }
    return this.getLiveFile(fileId);
  }

  /* ==========================================================================
     SANDBOX MODE SIMULATIONS
     ========================================================================== */

  listSandboxFiles(folderId, searchQuery) {
    // Artificial latency for premium feel (simulate API latency)
    return new Promise((resolve) => {
      setTimeout(() => {
        const folder = SANDBOX_DRIVE.folders[folderId];
        
        // If directory doesn't exist, fall back to root
        const currentFolder = folder ? folder : SANDBOX_DRIVE.folders['root'];
        
        let resultItems = [];

        // If search query is active, ignore hierarchy and search globally across all PDFs
        if (searchQuery.trim() !== '') {
          const query = searchQuery.toLowerCase();
          Object.values(SANDBOX_DRIVE.files).forEach(file => {
            if (file.name.toLowerCase().includes(query)) {
              resultItems.push({
                id: file.id,
                name: file.name,
                mimeType: file.mimeType,
                size: file.size,
                modifiedTime: file.modifiedTime,
                isFolder: false
              });
            }
          });
          resolve(resultItems);
          return;
        }

        // List standard children of current folder
        currentFolder.children.forEach(childId => {
          if (SANDBOX_DRIVE.folders[childId]) {
            const folderObj = SANDBOX_DRIVE.folders[childId];
            resultItems.push({
              id: folderObj.id,
              name: folderObj.name,
              isFolder: true,
              mimeType: 'application/vnd.google-apps.folder'
            });
          } else if (SANDBOX_DRIVE.files[childId]) {
            const fileObj = SANDBOX_DRIVE.files[childId];
            resultItems.push({
              id: fileObj.id,
              name: fileObj.name,
              mimeType: fileObj.mimeType,
              size: fileObj.size,
              modifiedTime: fileObj.modifiedTime,
              isFolder: false
            });
          }
        });

        resolve(resultItems);
      }, 350);
    });
  }

  /* ==========================================================================
     GOOGLE DRIVE API v3 LIVE SERVICE
     ========================================================================== */

  async listLiveFiles(folderId, searchQuery) {
    const token = this.accessToken;
    if (!token) {
      throw new Error('Authentication required: Google OAuth Access Token not found.');
    }

    let q = "trashed = false";
    
    if (searchQuery.trim() !== '') {
      // Global search for PDFs matching the text
      q += ` and mimeType = 'application/pdf' and name contains '${searchQuery.replace(/'/g, "\\'")}'`;
    } else {
      // Browse specific directory
      const parentId = folderId === 'root' ? 'root' : folderId;
      q += ` and '${parentId}' in parents and (mimeType = 'application/pdf' or mimeType = 'application/vnd.google-apps.folder')`;
    }

    const fields = 'files(id, name, mimeType, size, modifiedTime, webViewLink)';
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=${encodeURIComponent(fields)}${this.apiKey ? `&key=${this.apiKey}` : ''}`;

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Drive API responded with HTTP ${response.status}`);
      }

      const data = await response.json();
      
      // Convert GDrive file objects to our unified app format
      return (data.files || []).map(file => ({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        size: file.size ? parseInt(file.size) : 0,
        modifiedTime: file.modifiedTime,
        isFolder: file.mimeType === 'application/vnd.google-apps.folder',
        webViewLink: file.webViewLink
      }));

    } catch (err) {
      console.error('Failed listing live GDrive files:', err);
      throw err;
    }
  }

  async getLiveFile(fileId) {
    const token = this.accessToken;
    if (!token) {
      throw new Error('Authentication required: Access Token not found.');
    }

    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,size,modifiedTime,webViewLink${this.apiKey ? `&key=${this.apiKey}` : ''}`;

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch file metadata: HTTP ${response.status}`);
      }

      const file = await response.json();
      
      // For live PDFs, build a dynamic visual profile based on its metadata
      // (This will simulate parsing real Google Drive files dynamically)
      return {
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        size: file.size ? parseInt(file.size) : 0,
        modifiedTime: file.modifiedTime,
        webViewLink: file.webViewLink,
        docType: this.deduceDocumentType(file.name),
        // Live files mock OCR dynamically on-the-fly based on properties
        visualData: this.generateDynamicOcr(file)
      };
    } catch (err) {
      console.error('Error fetching live file:', err);
      throw err;
    }
  }

  /**
   * Deduce the likely KYC category based on filename.
   */
  deduceDocumentType(filename) {
    const fn = filename.toLowerCase();
    if (fn.includes('passport') || fn.includes('id') || fn.includes('license') || fn.includes('identity')) {
      return 'identity';
    } else if (fn.includes('bill') || fn.includes('invoice') || fn.includes('utility') || fn.includes('lease') || fn.includes('address')) {
      return 'address';
    } else if (fn.includes('tax') || fn.includes('paystub') || fn.includes('income') || fn.includes('w2') || fn.includes('salary')) {
      return 'income';
    }
    return 'identity'; // Default fallback
  }

  /**
   * Generates custom, realistic extraction data for live Drive files
   * so the AI reviewer can proceed seamlessly even with live PDFs.
   */
  generateDynamicOcr(file) {
    const nameSegments = file.name.replace(/\.[^/.]+$/, "").split(/[_\-\s]+/);
    let potentialName = 'JOHN DOE';
    if (nameSegments.length > 1) {
      // Simple capitalisation helper
      potentialName = nameSegments
        .filter(s => !['pdf', 'passport', 'id', 'utility', 'bill', 'statement', 'w2', 'tax'].includes(s.toLowerCase()))
        .map(s => s.toUpperCase())
        .join(' ');
      
      if (!potentialName) potentialName = 'JOHN DOE';
    }

    const type = this.deduceDocumentType(file.name);
    
    if (type === 'identity') {
      return {
        issuer: 'GOVERNMENT ISSUED DOCUMENT (LIVE)',
        title: 'PASSPORT OR IDENTIFICATION CARD',
        docNumber: `ID-${Math.floor(10000000 + Math.random() * 90000000)}`,
        fullName: potentialName,
        dob: '1988-06-15',
        sex: 'M',
        expiry: '2031-12-31',
        nationality: 'USA',
        mrz1: `P<USALIVE<<${potentialName.replace(/\s+/g, '<')}<<<<<<<<<<<<<<<<<<`,
        mrz2: `TX${Math.floor(100000 + Math.random() * 900000)}0USA8806151M3112318<<<<<<<<<<<<<<`
      };
    } else if (type === 'address') {
      return {
        issuer: 'LOCAL SERVICES UTILITY CORP (LIVE)',
        title: 'UTILITY INVOICE STATEMENT',
        docNumber: `BILL-${Math.floor(10000 + Math.random() * 90000)}`,
        fullName: potentialName,
        address: '123 MAIN STREET, METROPOLIS, NY 10001',
        issueDate: new Date(new Date().setDate(new Date().getDate() - 20)).toISOString().split('T')[0], // 20 days ago
        amountDue: `$${(Math.random() * 200 + 50).toFixed(2)}`,
        accountNumber: `ACT-${Math.floor(1000000 + Math.random() * 9000000)}`
      };
    } else {
      return {
        issuer: 'EMPLOYER STATEMENT / WAGE PORTAL (LIVE)',
        title: 'EARNINGS & INCOME STATEMENT',
        docNumber: `TAX-${Math.floor(10000 + Math.random() * 90000)}`,
        fullName: potentialName,
        address: '123 MAIN STREET, METROPOLIS, NY 10001',
        issueDate: '2026-01-31',
        employer: 'GLOBAL ENTERPRISES INC',
      };
    }
  }

  /**
   * Parse target folder URL, returning the pure FOLDER_ID if matched, or the raw input.
   */
  extractFolderIdFromUrl(input) {
    if (!input) return 'root';
    const str = input.trim();
    if (str.includes('drive.google.com')) {
      const foldersMatch = str.match(/\/folders\/([a-zA-Z0-9-_]{15,})/);
      if (foldersMatch && foldersMatch[1]) {
        return foldersMatch[1];
      }
      const openMatch = str.match(/[?&]id=([a-zA-Z0-9-_]{15,})/);
      if (openMatch && openMatch[1]) {
        return openMatch[1];
      }
    }
    return str;
  }

  /**
   * Resolve a folder ID by folder Name. Supporting both Sandbox folders and Live GDrive folders.
   */
  async getFolderIdByName(folderName) {
    const resolvedNameOrId = this.extractFolderIdFromUrl(folderName);

    if (this.sandboxMode) {
      if (!resolvedNameOrId || resolvedNameOrId.toLowerCase() === 'root') {
        return 'root';
      }
      // Check if we have a folder with this name or ID
      const folder = Object.values(SANDBOX_DRIVE.folders).find(
        f => f.name.toLowerCase() === resolvedNameOrId.toLowerCase() || f.id.toLowerCase() === resolvedNameOrId.toLowerCase()
      );
      return folder ? folder.id : 'root';
    }

    if (!resolvedNameOrId || resolvedNameOrId.toLowerCase() === 'root') {
      return 'root';
    }

    const token = this.accessToken;
    if (!token) throw new Error('Authentication required: Google OAuth session is not connected.');

    // If it is a direct alphanumeric folder ID (usually 25-33 chars for Google Drive folders)
    if (resolvedNameOrId.match(/^[a-zA-Z0-9-_]{15,}$/)) {
      return resolvedNameOrId;
    }

    const q = `name = '${resolvedNameOrId.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id)${this.apiKey ? `&key=${this.apiKey}` : ''}`;

    try {
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });
      if (!response.ok) return 'root';
      const data = await response.json();
      if (data.files && data.files.length > 0) {
        return data.files[0].id;
      }
    } catch (e) {
      console.warn('Error resolving folder ID by name, using root:', e);
    }
    return 'root'; // Fallback
  }

  /**
   * Fetch all PDF files inside a specific folder ID or Name.
   */
  async listAllFilesInFolder(folderNameOrId) {
    const resolvedFolderId = await this.getFolderIdByName(folderNameOrId);
    
    if (this.sandboxMode) {
      const folder = SANDBOX_DRIVE.folders[resolvedFolderId] || SANDBOX_DRIVE.folders['root'];
      let resultItems = [];
      
      const collectFiles = (fId) => {
        const currentFolder = SANDBOX_DRIVE.folders[fId];
        if (!currentFolder) return;
        
        currentFolder.children.forEach(childId => {
          if (SANDBOX_DRIVE.folders[childId]) {
            const subFolder = SANDBOX_DRIVE.folders[childId];
            subFolder.children.forEach(subChildId => {
              if (SANDBOX_DRIVE.files[subChildId]) {
                const file = SANDBOX_DRIVE.files[subChildId];
                if (!resultItems.some(item => item.id === file.id)) {
                  resultItems.push(file);
                }
              }
            });
          } else if (SANDBOX_DRIVE.files[childId]) {
            const file = SANDBOX_DRIVE.files[childId];
            if (!resultItems.some(item => item.id === file.id)) {
              resultItems.push(file);
            }
          }
        });
      };
      
      collectFiles(resolvedFolderId);
      return resultItems;
    }

    // Live mode API query
    const token = this.accessToken;
    if (!token) throw new Error('Authentication required: Access Token not found.');

    const q = `'${resolvedFolderId}' in parents and mimeType = 'application/pdf' and trashed = false`;
    const fields = 'files(id, name, mimeType, size, modifiedTime, webViewLink)';
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=${encodeURIComponent(fields)}${this.apiKey ? `&key=${this.apiKey}` : ''}`;

    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
    });
    if (!response.ok) {
      throw new Error(`Drive API responded with HTTP ${response.status}`);
    }
    const data = await response.json();
    
    // Retrieve full OCR profiles on all matched files
    const fileObjects = [];
    for (const f of (data.files || [])) {
      const fullFile = await this.getFile(f.id);
      fileObjects.push(fullFile);
    }
    return fileObjects;
  }
}
