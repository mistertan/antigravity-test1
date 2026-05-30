/* ==========================================================================
   VerifyDrive KYC App - KYC Process & OCR Engine
   ========================================================================== */

/**
 * Predefined KYC Cases with differing document verification requirements.
 */
const KYC_CASES = {
  'case-1042': {
    id: 'case-1042',
    name: 'John Doe',
    type: 'Standard Verification',
    riskLevel: 'Low Risk',
    status: 'pending', // pending, verified, failed
    slots: {
      'slot-identity': {
        id: 'slot-identity',
        type: 'identity',
        name: 'Government Photo ID',
        desc: 'Valid Passport, Driver\'s License, or National ID Card.',
        required: true,
        file: null, // Linked file details
        extractedData: null,
        status: 'unassigned' // unassigned, linked, verified
      },
      'slot-address': {
        id: 'slot-address',
        type: 'address',
        name: 'Proof of Address',
        desc: 'Utility bill (electricity, water, gas) or lease agreement issued in the last 90 days.',
        required: true,
        file: null,
        extractedData: null,
        status: 'unassigned'
      }
    }
  },
  'case-1043': {
    id: 'case-1043',
    name: 'Jane Smith',
    type: 'Enhanced Verification (High-Net-Worth)',
    riskLevel: 'Medium Risk',
    status: 'pending',
    slots: {
      'slot-identity': {
        id: 'slot-identity',
        type: 'identity',
        name: 'Government Photo ID',
        desc: 'Valid Passport, Driver\'s License, or National ID Card.',
        required: true,
        file: null,
        extractedData: null,
        status: 'unassigned'
      },
      'slot-address': {
        id: 'slot-address',
        type: 'address',
        name: 'Proof of Address',
        desc: 'Utility bill or lease agreement issued in the last 90 days.',
        required: true,
        file: null,
        extractedData: null,
        status: 'unassigned'
      },
      'slot-income': {
        id: 'slot-income',
        type: 'income',
        name: 'Proof of Income / Wealth',
        desc: 'Recent W-2 form, paystub, or salary statement.',
        required: true,
        file: null,
        extractedData: null,
        status: 'unassigned'
      }
    }
  }
};

class KycProcessor {
  constructor() {
    // Clone initial cases database to maintain session state locally
    this.cases = JSON.parse(JSON.stringify(KYC_CASES));
  }

  /**
   * Fetch all KYC cases.
   */
  getCases() {
    return Object.values(this.cases);
  }

  /**
   * Fetch a single KYC case by ID.
   */
  getCase(caseId) {
    return this.cases[caseId] || null;
  }

  /**
   * Link a file from Google Drive to a specific KYC document slot.
   */
  linkFileToSlot(caseId, slotId, file) {
    const kycCase = this.getCase(caseId);
    if (!kycCase) throw new Error('Case not found');
    
    const slot = kycCase.slots[slotId];
    if (!slot) throw new Error('Document slot not found');

    slot.file = {
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      size: file.size,
      modifiedTime: file.modifiedTime,
      webViewLink: file.webViewLink || '#',
      visualData: file.visualData // Keep ref to custom visual rendering metrics
    };
    
    slot.status = 'linked';
    slot.extractedData = null; // Reset previous extractions
    return slot;
  }

  /**
   * Unlink file from a KYC slot.
   */
  unlinkSlot(caseId, slotId) {
    const kycCase = this.getCase(caseId);
    if (!kycCase) throw new Error('Case not found');

    const slot = kycCase.slots[slotId];
    if (!slot) throw new Error('Document slot not found');

    slot.file = null;
    slot.extractedData = null;
    slot.status = 'unassigned';
    
    this.updateCaseStatus(caseId);
    return slot;
  }

  /**
   * Simulates automated document content extraction (OCR/AI).
   */
  extractDocumentData(caseId, slotId, progressCallback) {
    return new Promise((resolve, reject) => {
      const kycCase = this.getCase(caseId);
      if (!kycCase) return reject(new Error('Case not found'));

      const slot = kycCase.slots[slotId];
      if (!slot || !slot.file) return reject(new Error('No file linked to this slot'));

      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        if (progressCallback) progressCallback(progress);
        
        if (progress >= 100) {
          clearInterval(interval);
          
          // Pull visual metadata from file definition
          const rawOcr = slot.file.visualData;
          
          // Format slot-specific properties based on doc type
          if (slot.type === 'identity') {
            slot.extractedData = {
              fullName: rawOcr.fullName || '',
              docNumber: rawOcr.docNumber || '',
              dob: rawOcr.dob || '',
              expiry: rawOcr.expiry || '',
              nationality: rawOcr.nationality || '',
              issuer: rawOcr.issuer || ''
            };
          } else if (slot.type === 'address') {
            slot.extractedData = {
              fullName: rawOcr.fullName || '',
              address: rawOcr.address || '',
              issueDate: rawOcr.issueDate || '',
              issuer: rawOcr.issuer || ''
            };
          } else if (slot.type === 'income') {
            slot.extractedData = {
              fullName: rawOcr.fullName || '',
              employer: rawOcr.employer || '',
              wages: rawOcr.wages || '',
              issueDate: rawOcr.issueDate || '',
              issuer: rawOcr.issuer || ''
            };
          }

          resolve(slot.extractedData);
        }
      }, 150); // 1.5 seconds total loading bar
    });
  }

  /**
   * Approve a slot's manually reviewed/edited parameters.
   */
  approveSlot(caseId, slotId, verifiedData) {
    const kycCase = this.getCase(caseId);
    if (!kycCase) throw new Error('Case not found');

    const slot = kycCase.slots[slotId];
    if (!slot) throw new Error('Document slot not found');

    // Save manually verified fields
    slot.extractedData = { ...slot.extractedData, ...verifiedData };
    slot.status = 'verified';

    this.updateCaseStatus(caseId);
    return slot;
  }

  /**
   * Determine overall case status (verified vs pending).
   */
  updateCaseStatus(caseId) {
    const kycCase = this.getCase(caseId);
    if (!kycCase) return;

    let allVerified = true;
    let hasFailed = false;

    Object.values(kycCase.slots).forEach(slot => {
      if (slot.required && slot.status !== 'verified') {
        allVerified = false;
      }
      if (slot.status === 'failed') {
        hasFailed = true;
      }
    });

    if (hasFailed) {
      kycCase.status = 'failed';
    } else if (allVerified) {
      kycCase.status = 'verified';
    } else {
      kycCase.status = 'pending';
    }
  }

  /**
   * Compiles compliance details and outputs a full markdown report.
   */
  generateComplianceReport(caseId) {
    const kycCase = this.getCase(caseId);
    if (!kycCase) return 'Case not found.';

    const dateStr = new Date().toLocaleString();
    const dots = Object.values(kycCase.slots);
    
    // Perform cross-document audit validations
    const audits = this.runCrossDocumentAudits(kycCase);

    let docListMD = '';
    dots.forEach(slot => {
      if (slot.file && slot.status === 'verified') {
        docListMD += `* **${slot.name}**: \`${slot.file.name}\`
  * Google Drive ID: \`${slot.file.id}\`
  * Link: [View File in Drive](${slot.file.webViewLink})
  * Extracted Signee: **${slot.extractedData.fullName}**
  * Status: ✅ VERIFIED
`;
      } else {
        docListMD += `* **${slot.name}**: ❌ MISSING / UNVERIFIED
`;
      }
    });

    const isApprovable = audits.every(a => a.passed) && dots.every(s => s.status === 'verified');
    const finalDecision = isApprovable 
      ? '🟢 APPROVED (All validations passed)' 
      : '🔴 HOLD / MANUAL REVIEW REQUIRED (Discrepancies identified)';

    return `# KYC Compliance Audit Report
**Case ID**: ${kycCase.id}
**Customer Name**: ${kycCase.name}
**Audit Timestamp**: ${dateStr}
**Risk Classification**: ${kycCase.riskLevel}

---

## 1. Document Inventory & Verification States
${docListMD}

## 2. Automated Validation Audits
${audits.map(a => `* **${a.name}**: ${a.passed ? '✅ PASSED' : '❌ FAILED'}
  * *Details*: ${a.message}`).join('\n')}

---

## 3. Compliance Recommendation & Sign-Off
**Review Decision**: ${finalDecision}

### Auditor Certification:
I hereby certify that the linked Google Drive metadata records have been parsed, cross-referenced, and reviewed.

*Audit generated automatically via **VerifyDrive Secure Auditor**.*
`;
  }

  /**
   * Check names and dates across files.
   */
  runCrossDocumentAudits(kycCase) {
    const audits = [];
    const slots = Object.values(kycCase.slots);
    const verifiedSlots = slots.filter(s => s.status === 'verified' && s.extractedData);

    // Audit 1: Name Alignment Check
    if (verifiedSlots.length > 1) {
      const names = verifiedSlots.map(s => s.extractedData.fullName.trim().toUpperCase());
      const first = names[0];
      const allMatch = names.every(n => n === first || n.includes(first) || first.includes(n));
      
      audits.push({
        name: 'Name Consistency Check',
        passed: allMatch,
        message: allMatch 
          ? `Customer name matches consistently across documents (${names.join(' = ')}).`
          : `Discrepancy detected in name records! Documents contain differing names: ${names.join(', ')}.`
      });
    } else {
      audits.push({
        name: 'Name Consistency Check',
        passed: false,
        message: 'Insufficient verified documents to perform cross-document comparison.'
      });
    }

    // Audit 2: Identity Expiration Check
    const idSlot = kycCase.slots['slot-identity'];
    if (idSlot && idSlot.status === 'verified' && idSlot.extractedData.expiry) {
      const expDate = new Date(idSlot.extractedData.expiry);
      const isExpired = expDate < new Date();
      audits.push({
        name: 'ID Expiration Check',
        passed: !isExpired,
        message: !isExpired 
          ? `Government Photo ID is active. Expiration Date: ${idSlot.extractedData.expiry}.`
          : `Government Photo ID is expired! Expiration Date: ${idSlot.extractedData.expiry}.`
      });
    }

    // Audit 3: Address Recency Check (90 days limit)
    const addrSlot = kycCase.slots['slot-address'];
    if (addrSlot && addrSlot.status === 'verified' && addrSlot.extractedData.issueDate) {
      const issueDate = new Date(addrSlot.extractedData.issueDate);
      const diffTime = Math.abs(new Date() - issueDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const passed = diffDays <= 90;

      audits.push({
        name: 'Address Statement Recency Check',
        passed: passed,
        message: passed 
          ? `Address proof document is recent (issued ${diffDays} days ago on ${addrSlot.extractedData.issueDate}).`
          : `Address proof document is older than 90 days (issued ${diffDays} days ago on ${addrSlot.extractedData.issueDate}).`
      });
    }

    return audits;
  }

  /**
   * AI-powered semantic matching and auto-assignment.
   * Scans files in a folder, resolves semantic keywords in the prompt, and maps files to active case slots.
   */
  async autoRetrieveAndAssign(caseId, targetFolderName, prompt, filesInFolder, logCallback) {
    const kycCase = this.getCase(caseId);
    if (!kycCase) throw new Error('Case not found');

    const log = (text, type = 'info') => {
      if (logCallback) logCallback(text, type);
    };

    // Step 1: Connect and Scan Folder
    log(`[1/4] Establishing secure agent connection to folder: "${targetFolderName}"...`, 'system');
    await new Promise(r => setTimeout(r, 800));
    
    log(`[2/4] Directory connected. Fetching PDF metadata...`, 'info');
    await new Promise(r => setTimeout(r, 600));

    if (!filesInFolder || filesInFolder.length === 0) {
      log(`[!] Scan complete. No matching PDF documents found in target folder "${targetFolderName}".`, 'error');
      return [];
    }

    log(`[2/4] Scan complete. Found ${filesInFolder.length} candidate documents:`, 'info');
    filesInFolder.forEach(f => {
      log(`  • ${f.name} (${(f.size / 1024 / 1024).toFixed(2)} MB)`, 'system');
    });
    await new Promise(r => setTimeout(r, 800));

    // Step 2: Semantic Analysis
    log(`[3/4] Running Semantic Parsing Algorithm...`, 'info');
    log(`  - Target customer: "${kycCase.name}"`, 'system');
    log(`  - User search prompt: "${prompt}"`, 'system');
    await new Promise(r => setTimeout(r, 1000));

    const promptLower = prompt.toLowerCase();
    const customerKeywords = kycCase.name.toLowerCase().split(/\s+/);
    
    const matchesFound = [];

    // Evaluate each required document slot
    const slots = Object.values(kycCase.slots);
    
    for (const slot of slots) {
      log(`🔎 Analyzing candidates for slot: "${slot.name}"...`, 'info');
      await new Promise(r => setTimeout(r, 650));

      // Define keyword indicators for the slot type
      let typeKeywords = [];
      if (slot.type === 'identity') {
        typeKeywords = ['passport', 'id', 'license', 'driver', 'identity', 'national'];
      } else if (slot.type === 'address') {
        typeKeywords = ['bill', 'utility', 'lease', 'agreement', 'address', 'electricity', 'power', 'water', 'gas', 'statement'];
      } else if (slot.type === 'income') {
        typeKeywords = ['w2', 'tax', 'paystub', 'payslip', 'salary', 'income', 'wage', 'employer'];
      }

      let bestFile = null;
      let highestScore = 0;
      let matchReason = '';

      for (const file of filesInFolder) {
        let score = 0;
        let reasons = [];

        // Check 1: Customer Name alignment
        const fileNameLower = file.name.toLowerCase();
        const ocrNameLower = (file.visualData?.fullName || '').toLowerCase();
        
        let nameMatchCount = 0;
        customerKeywords.forEach(kw => {
          if (fileNameLower.includes(kw) || ocrNameLower.includes(kw)) {
            nameMatchCount++;
          }
        });

        if (nameMatchCount > 0) {
          score += 45 + (nameMatchCount * 10);
          reasons.push(`matches customer name keywords`);
        }

        // Check 2: Prompt Name alignment
        const nameInPrompt = customerKeywords.some(kw => promptLower.includes(kw));
        if (nameInPrompt) {
          score += 10;
        }

        // Check 3: Document Type match (file property vs slot type)
        if (file.docType === slot.type) {
          score += 25;
          reasons.push(`file classification matches slot type`);
        }

        // Check 4: Prompt Keyword match
        let keywordHits = 0;
        typeKeywords.forEach(kw => {
          if (promptLower.includes(kw) && (fileNameLower.includes(kw) || file.docType === slot.type)) {
            keywordHits++;
          }
        });

        if (keywordHits > 0) {
          score += 15 + (keywordHits * 5);
          reasons.push(`matches prompt keywords [${typeKeywords.filter(kw => promptLower.includes(kw)).join(', ')}]`);
        }

        if (score > highestScore && score >= 50) {
          highestScore = Math.min(score, 99); // Max 99%
          bestFile = file;
          matchReason = reasons.join(' & ');
        }
      }

      if (bestFile) {
        log(`  ✅ Match found! "${bestFile.name}" aligned with ${highestScore}% confidence.`, 'success');
        log(`  💡 Reason: ${matchReason}.`, 'system');
        
        // Link file
        this.linkFileToSlot(caseId, slot.id, bestFile);
        matchesFound.push({ slotId: slot.id, file: bestFile });
      } else {
        log(`  ❌ No high-confidence matches found for "${slot.name}".`, 'warning');
      }
      await new Promise(r => setTimeout(r, 400));
    }

    log(`[4/4] Semantic Retriever Execution Completed successfully!`, 'success');
    log(`🎉 Done: Auto-linked ${matchesFound.length} documents to active case slots.`, 'success');
    
    return matchesFound;
  }

  /**
   * Adds a new KYC case to the local database.
   */
  addNewCase(name, profileType, riskLevel) {
    const nextCaseId = `case-${Date.now()}`;
    
    // Set up standard slots
    const slots = {
      'slot-identity': {
        id: 'slot-identity',
        type: 'identity',
        name: 'Government Photo ID',
        desc: 'Valid Passport, Driver\'s License, or National ID Card.',
        required: true,
        file: null,
        extractedData: null,
        status: 'unassigned'
      },
      'slot-address': {
        id: 'slot-address',
        type: 'address',
        name: 'Proof of Address',
        desc: 'Utility bill or lease agreement issued in the last 90 days.',
        required: true,
        file: null,
        extractedData: null,
        status: 'unassigned'
      }
    };
    
    // Add income slot if enhanced verification
    if (profileType === 'enhanced') {
      slots['slot-income'] = {
        id: 'slot-income',
        type: 'income',
        name: 'Proof of Income / Wealth',
        desc: 'Recent W-2 form, paystub, or salary statement.',
        required: true,
        file: null,
        extractedData: null,
        status: 'unassigned'
      };
    }
    
    const newCase = {
      id: nextCaseId,
      name: name,
      type: profileType === 'enhanced' ? 'Enhanced Verification (High-Net-Worth)' : 'Standard Verification',
      riskLevel: riskLevel,
      status: 'pending',
      slots: slots
    };
    
    this.cases[nextCaseId] = newCase;
    return newCase;
  }
}
