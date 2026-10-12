/**
 * CampusTrace Frontend Application Logic
 * Powered by Vanilla JavaScript and Ethers.js v6
 */

(function () {
  "use strict";

  // --- State Variables ---
  let provider = null;
  let signer = null;
  let contract = null;
  let userAddress = null;
  let currentChainId = null;
  let allReportsCache = [];

  // --- DOM Elements ---
  const connectWalletBtn = document.getElementById("connectWalletBtn");
  const connectWalletText = document.getElementById("connectWalletText");
  const walletDropdown = document.getElementById("walletDropdown");
  const userAddressShort = document.getElementById("userAddressShort");
  const copyAddressBtn = document.getElementById("copyAddressBtn");
  const networkBadge = document.getElementById("networkBadge");
  const networkNameDisplay = document.getElementById("networkName");

  const activeContractDisplay = document.getElementById("activeContractDisplay");
  const editConfigBtn = document.getElementById("editConfigBtn");
  const configDrawer = document.getElementById("configDrawer");
  const cfgContractAddress = document.getElementById("cfgContractAddress");
  const saveContractConfigBtn = document.getElementById("saveContractConfigBtn");
  const resetContractConfigBtn = document.getElementById("resetContractConfigBtn");

  const createReportForm = document.getElementById("createReportForm");
  const itemTitleInput = document.getElementById("itemTitle");
  const itemLocationInput = document.getElementById("itemLocation");
  const itemDescriptionInput = document.getElementById("itemDescription");
  const claimSecretInput = document.getElementById("claimSecret");
  const hashPreviewDisplay = document.getElementById("hashPreviewDisplay");
  const generateSecretBtn = document.getElementById("generateSecretBtn");
  const copySecretBtn = document.getElementById("copySecretBtn");
  const submitReportBtn = document.getElementById("submitReportBtn");
  const submitSpinner = document.getElementById("submitSpinner");
  const submitBtnText = document.getElementById("submitBtnText");

  const titleCharCount = document.getElementById("titleCharCount");
  const locCharCount = document.getElementById("locCharCount");
  const descCharCount = document.getElementById("descCharCount");

  const searchInput = document.getElementById("searchInput");
  const typeFilter = document.getElementById("typeFilter");
  const statusFilter = document.getElementById("statusFilter");
  const refreshBtn = document.getElementById("refreshBtn");
  const refreshIcon = document.getElementById("refreshIcon");
  const reportsList = document.getElementById("reportsList");
  const reportsCountText = document.getElementById("reportsCountText");

  const resolutionModal = document.getElementById("resolutionModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalItemSummary = document.getElementById("modalItemSummary");
  const resolveReportForm = document.getElementById("resolveReportForm");
  const resolveReportIdInput = document.getElementById("resolveReportId");
  const resolveSecretInput = document.getElementById("resolveSecretInput");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const cancelModalBtn = document.getElementById("cancelModalBtn");
  const confirmResolveBtn = document.getElementById("confirmResolveBtn");
  const resolveSpinner = document.getElementById("resolveSpinner");
  const resolveBtnText = document.getElementById("resolveBtnText");

  const toastContainer = document.getElementById("toastContainer");

  // --- Configuration Management ---
  function getTargetContractAddress() {
    const saved = localStorage.getItem("campustrace_contract_address");
    if (saved && ethers.isAddress(saved.trim())) {
      return saved.trim();
    }
    if (window.CONTRACT_CONFIG && window.CONTRACT_CONFIG.address && ethers.isAddress(window.CONTRACT_CONFIG.address.trim())) {
      return window.CONTRACT_CONFIG.address.trim();
    }
    return "";
  }

  function updateContractTargetUI() {
    const addr = getTargetContractAddress();
    if (addr) {
      activeContractDisplay.textContent = `${addr.slice(0, 10)}...${addr.slice(-8)}`;
      activeContractDisplay.title = addr;
      activeContractDisplay.classList.remove("text-muted");
      cfgContractAddress.value = addr;
    } else {
      activeContractDisplay.textContent = "No address configured (Click to set)";
      activeContractDisplay.classList.add("text-muted");
      cfgContractAddress.value = "";
    }
  }

  // --- UI Notifications (Toasts) ---
  function showToast(message, type = "info", duration = 4500) {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    let iconSvg = "";
    if (type === "success") {
      iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
    } else if (type === "error") {
      iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
    } else {
      iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
    }

    toast.innerHTML = `
      ${iconSvg}
      <div style="flex:1;">${message}</div>
    `;

    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(50px)";
      toast.style.transition = "all 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  // --- Network Mapping Helper ---
  function getNetworkLabel(chainId) {
    const id = Number(chainId);
    switch (id) {
      case 1337:
        return "Ganache (1337)";
      case 5777:
        return "Ganache GUI (5777)";
      case 31337:
        return "Hardhat (31337)";
      case 11155111:
        return "Sepolia Testnet";
      case 1:
        return "Ethereum Mainnet";
      default:
        return `Chain ID: ${id}`;
    }
  }

  // --- Wallet Connection & Web3 Init ---
  async function initWeb3() {
    if (!window.ethereum) {
      activeContractDisplay.textContent = "MetaMask not detected in browser";
      showToast("MetaMask not found. Please install MetaMask to interact with the contract.", "error", 6000);
      return false;
    }

    try {
      provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      currentChainId = network.chainId;

      networkBadge.classList.remove("hidden");
      networkNameDisplay.textContent = getNetworkLabel(currentChainId);

      const accounts = await provider.listAccounts();
      if (accounts.length > 0) {
        signer = await provider.getSigner();
        userAddress = await signer.getAddress();
        updateWalletUI(userAddress);
        initContractInstance();
      }

      setupEthereumEvents();
      return true;
    } catch (err) {
      console.error("Error initializing Web3:", err);
      showToast(`Web3 initialization failed: ${err.message}`, "error");
      return false;
    }
  }

  async function connectWallet() {
    if (!window.ethereum) {
      showToast("MetaMask is required to use this application.", "error");
      window.open("https://metamask.io/download/", "_blank");
      return;
    }

    try {
      connectWalletBtn.disabled = true;
      connectWalletText.textContent = "Connecting...";

      provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });

      if (accounts && accounts.length > 0) {
        signer = await provider.getSigner();
        userAddress = await signer.getAddress();
        const network = await provider.getNetwork();
        currentChainId = network.chainId;

        networkBadge.classList.remove("hidden");
        networkNameDisplay.textContent = getNetworkLabel(currentChainId);

        updateWalletUI(userAddress);
        initContractInstance();
        await loadReports();
        showToast("Connected to wallet successfully!", "success");
      }
    } catch (err) {
      console.error("Wallet connection error:", err);
      if (err.code === 4001) {
        showToast("Connection rejected in MetaMask.", "error");
      } else {
        showToast(err.message || "Failed to connect wallet.", "error");
      }
    } finally {
      connectWalletBtn.disabled = false;
      connectWalletText.textContent = "Connect MetaMask";
    }
  }

  function updateWalletUI(addr) {
    if (addr) {
      connectWalletBtn.classList.add("hidden");
      walletDropdown.classList.remove("hidden");
      userAddressShort.textContent = `${addr.slice(0, 6)}...${addr.slice(-4)}`;
      userAddressShort.title = addr;
    } else {
      connectWalletBtn.classList.remove("hidden");
      walletDropdown.classList.add("hidden");
    }
  }

  function setupEthereumEvents() {
    window.ethereum.on("accountsChanged", async (accounts) => {
      if (accounts.length === 0) {
        userAddress = null;
        signer = null;
        updateWalletUI(null);
        showToast("Wallet disconnected.", "info");
      } else {
        signer = await provider.getSigner();
        userAddress = await signer.getAddress();
        updateWalletUI(userAddress);
        initContractInstance();
        showToast(`Account changed to ${userAddress.slice(0, 6)}...`, "info");
        await loadReports();
      }
    });

    window.ethereum.on("chainChanged", (chainIdHex) => {
      window.location.reload();
    });
  }

  function initContractInstance() {
    const targetAddress = getTargetContractAddress();
    if (!targetAddress) {
      contract = null;
      return false;
    }

    if (!window.CONTRACT_CONFIG || !window.CONTRACT_CONFIG.abi) {
      showToast("Contract ABI not found in contractConfig.js", "error");
      return false;
    }

    try {
      const runner = signer || provider;
      contract = new ethers.Contract(targetAddress, window.CONTRACT_CONFIG.abi, runner);
      return true;
    } catch (err) {
      console.error("Failed to construct contract instance:", err);
      showToast(`Contract initialization error: ${err.message}`, "error");
      return false;
    }
  }

  // --- Real-time Secret Hashing ---
  function computeSecretHash(secret) {
    if (!secret || secret.trim() === "") return "";
    try {
      // Computes keccak256(abi.encodePacked(secret)) in Ethers v6
      return ethers.solidityPackedKeccak256(["string"], [secret]);
    } catch (e) {
      console.error("Hashing error:", e);
      return "";
    }
  }

  function updateHashPreview() {
    const secret = claimSecretInput.value;
    if (!secret || secret.trim() === "") {
      hashPreviewDisplay.textContent = "0x... (Type secret to preview)";
      hashPreviewDisplay.classList.add("text-muted");
    } else {
      const hash = computeSecretHash(secret);
      hashPreviewDisplay.textContent = hash;
      hashPreviewDisplay.classList.remove("text-muted");
    }
  }

  // --- Character Counters ---
  function updateCharCounters() {
    titleCharCount.textContent = `${itemTitleInput.value.length}/100`;
    locCharCount.textContent = `${itemLocationInput.value.length}/100`;
    descCharCount.textContent = `${itemDescriptionInput.value.length}/500`;
  }

  // --- Random Secret Generator ---
  function generateRandomSecret() {
    const prefix = "CT-";
    const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let token = "";
    const randVals = new Uint8Array(8);
    window.crypto.getRandomValues(randVals);
    for (let i = 0; i < 8; i++) {
      token += charset[randVals[i] % charset.length];
    }
    const fullSecret = `${prefix}${token}`;
    claimSecretInput.value = fullSecret;
    updateHashPreview();
    showToast(`Generated secret: ${fullSecret}`, "info");
  }

  // --- Create Report Handler ---
  async function handleCreateReport(e) {
    e.preventDefault();

    if (!signer) {
      showToast("Please connect your MetaMask wallet before publishing.", "error");
      await connectWallet();
      return;
    }

    const targetAddress = getTargetContractAddress();
    if (!targetAddress) {
      showToast("Please configure a deployed contract address first.", "error");
      configDrawer.classList.remove("hidden");
      return;
    }

    if (!contract) {
      initContractInstance();
    }

    const reportTypeVal = Number(document.querySelector('input[name="reportType"]:checked').value);
    const title = itemTitleInput.value.trim();
    const location = itemLocationInput.value.trim();
    const description = itemDescriptionInput.value.trim();
    const secret = claimSecretInput.value;

    if (!title) {
      showToast("Item title cannot be empty.", "error");
      return;
    }
    if (!location) {
      showToast("Campus location cannot be empty.", "error");
      return;
    }
    if (!description) {
      showToast("Description cannot be empty.", "error");
      return;
    }
    if (!secret) {
      showToast("Privacy claim secret is required.", "error");
      return;
    }

    const claimHash = computeSecretHash(secret);
    if (!claimHash) {
      showToast("Failed to compute claim verification hash.", "error");
      return;
    }

    try {
      submitReportBtn.disabled = true;
      submitSpinner.classList.remove("hidden");
      submitBtnText.textContent = "Awaiting Wallet Signature...";

      showToast("Please confirm the transaction in MetaMask...", "info", 5000);

      const contractWithSigner = contract.connect(signer);
      const tx = await contractWithSigner.createReport(
        title,
        description,
        location,
        reportTypeVal,
        claimHash
      );

      submitBtnText.textContent = "Broadcasting to Blockchain...";
      showToast(`Transaction submitted (${tx.hash.slice(0, 10)}...). Waiting for confirmation...`, "info", 8000);

      const receipt = await tx.wait();

      showToast(`Report published successfully! Block #${receipt.blockNumber}`, "success", 6000);

      // Reset form fields
      createReportForm.reset();
      updateCharCounters();
      updateHashPreview();

      // Refresh list
      await loadReports();
    } catch (err) {
      console.error("Create report error:", err);
      decodeContractError(err);
    } finally {
      submitReportBtn.disabled = false;
      submitSpinner.classList.add("hidden");
      submitBtnText.textContent = "Publish Report to Blockchain";
    }
  }

  // --- Load Reports from Contract ---
  async function loadReports() {
    const targetAddress = getTargetContractAddress();
    if (!targetAddress) {
      reportsList.innerHTML = `
        <div class="empty-state">
          <p>⚠️ No deployed contract address configured.</p>
          <p style="margin-top:0.5rem; font-size:0.8rem;">Click <strong>Configure Target</strong> at the top to set your contract address from Remix or Ganache.</p>
        </div>
      `;
      reportsCountText.textContent = "0 reports";
      return;
    }

    if (!contract) {
      initContractInstance();
    }

    refreshIcon.classList.add("spin-fast");
    reportsCountText.textContent = "Fetching reports from blockchain...";

    try {
      const runner = contract ? contract : new ethers.Contract(targetAddress, window.CONTRACT_CONFIG.abi, provider || new ethers.JsonRpcProvider("http://127.0.0.1:7545"));
      
      const rawReports = await runner.getAllReports();

      allReportsCache = rawReports.map((r) => ({
        id: Number(r.id),
        creator: r.creator,
        title: r.title,
        description: r.description,
        location: r.location,
        reportType: Number(r.reportType), // 0: Lost, 1: Found
        timestamp: Number(r.timestamp),
        status: Number(r.status), // 0: Active, 1: Resolved
        claimVerificationHash: r.claimVerificationHash,
      }));

      renderReportsFeed();
    } catch (err) {
      console.error("Load reports error:", err);
      reportsList.innerHTML = `
        <div class="empty-state">
          <p>⚠️ Could not connect to contract at <span class="font-mono">${targetAddress.slice(0, 12)}...</span></p>
          <p style="margin-top:0.4rem; font-size:0.8rem; color:#f87171;">${err.message}</p>
          <p style="margin-top:0.6rem; font-size:0.8rem;">Ensure Ganache or your test network is running and MetaMask is connected to the right RPC.</p>
        </div>
      `;
      reportsCountText.textContent = "Connection error";
    } finally {
      refreshIcon.classList.remove("spin-fast");
    }
  }

  // --- Render Reports Feed ---
  function renderReportsFeed() {
    const q = searchInput.value.toLowerCase().trim();
    const typeVal = typeFilter.value;
    const statusVal = statusFilter.value;

    const filtered = allReportsCache.filter((r) => {
      // Type filter
      if (typeVal !== "all" && r.reportType !== Number(typeVal)) return false;
      // Status filter
      if (statusVal !== "all" && r.status !== Number(statusVal)) return false;
      // Search query
      if (q) {
        const inTitle = r.title.toLowerCase().includes(q);
        const inDesc = r.description.toLowerCase().includes(q);
        const inLoc = r.location.toLowerCase().includes(q);
        const inCreator = r.creator.toLowerCase().includes(q);
        if (!inTitle && !inDesc && !inLoc && !inCreator) return false;
      }
      return true;
    });

    reportsCountText.textContent = `Showing ${filtered.length} of ${allReportsCache.length} reports`;

    if (filtered.length === 0) {
      reportsList.innerHTML = `
        <div class="empty-state">
          <p>No reports found matching current criteria.</p>
          ${allReportsCache.length === 0 ? '<p style="margin-top:0.4rem; font-size:0.8rem;">Use the form to submit the first campus report!</p>' : ''}
        </div>
      `;
      return;
    }

    // Sort descending by ID (newest first)
    const sorted = [...filtered].sort((a, b) => b.id - a.id);

    reportsList.innerHTML = sorted.map((report) => createReportCardHTML(report)).join("");

    // Attach resolution listeners to cards
    document.querySelectorAll(".btn-open-resolve").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.getAttribute("data-id"));
        openResolutionModal(id);
      });
    });
  }

  function createReportCardHTML(report) {
    const isLost = report.reportType === 0;
    const isResolved = report.status === 1;
    const typeLabel = isLost ? "Lost" : "Found";
    const typePillClass = isLost ? "pill-lost" : "pill-found";
    const cardBorderClass = isResolved ? "resolved-card" : isLost ? "active-lost" : "active-found";
    const statusLabel = isResolved ? "Resolved" : "Active";
    const statusPillClass = isResolved ? "pill-resolved" : "pill-active";

    const formattedDate = new Date(report.timestamp * 1000).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const isCurrentUserCreator =
      userAddress && report.creator.toLowerCase() === userAddress.toLowerCase();

    const shortCreator = `${report.creator.slice(0, 6)}...${report.creator.slice(-4)}`;
    const shortHash = `${report.claimVerificationHash.slice(0, 10)}...${report.claimVerificationHash.slice(-8)}`;

    let actionButtonHTML = "";
    if (!isResolved) {
      if (isCurrentUserCreator) {
        actionButtonHTML = `
          <button class="btn btn-sm btn-success btn-open-resolve" data-id="${report.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon-inline">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
            Verify & Resolve Report
          </button>
        `;
      } else {
        actionButtonHTML = `
          <span class="text-muted" style="font-size:0.75rem;">
            🔒 Resolution requires creator wallet & verification secret
          </span>
        `;
      }
    } else {
      actionButtonHTML = `
        <span class="badge" style="background:rgba(168,85,247,0.15); color:#c084fc; border:1px solid rgba(168,85,247,0.3);">
          ✓ Resolved on Blockchain
        </span>
      `;
    }

    return `
      <article class="report-card ${cardBorderClass}">
        <div class="report-header">
          <div class="badges-row">
            <span class="pill ${typePillClass}">${typeLabel}</span>
            <span class="pill ${statusPillClass}">${statusLabel}</span>
            ${isCurrentUserCreator ? '<span class="pill pill-creator">You are Creator</span>' : ''}
          </div>
          <span class="report-id">#${report.id}</span>
        </div>

        <h3 class="report-title">${escapeHTML(report.title)}</h3>
        <p class="report-desc">${escapeHTML(report.description)}</p>

        <div class="report-meta-grid">
          <div class="meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <span>${escapeHTML(report.location)}</span>
          </div>

          <div class="meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <span>${formattedDate}</span>
          </div>

          <div class="meta-creator">
            <span>Creator: <strong class="font-mono">${shortCreator}</strong></span>
          </div>
        </div>

        <div class="hash-container">
          <span>Claim Hash: <span class="font-mono text-muted">${shortHash}</span></span>
          <button class="icon-btn" onclick="navigator.clipboard.writeText('${report.claimVerificationHash}'); window.showToastCopied();" title="Copy Claim Hash">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
            </svg>
          </button>
        </div>

        <div class="report-card-actions">
          ${actionButtonHTML}
        </div>
      </article>
    `;
  }

  window.showToastCopied = function () {
    showToast("Hash copied to clipboard!", "info", 2000);
  };

  // --- Resolution Modal Flow ---
  function openResolutionModal(reportId) {
    const report = allReportsCache.find((r) => r.id === reportId);
    if (!report) return;

    resolveReportIdInput.value = reportId;
    resolveSecretInput.value = "";
    modalTitle.textContent = `Resolve Report #${report.id}: ${report.title}`;

    modalItemSummary.innerHTML = `
      <div><strong>Item:</strong> ${escapeHTML(report.title)}</div>
      <div style="margin-top:0.25rem;"><strong>Location:</strong> ${escapeHTML(report.location)}</div>
      <div style="margin-top:0.25rem; font-size:0.75rem;" class="text-muted">
        <strong>Registered Claim Hash:</strong> <span class="font-mono text-break">${report.claimVerificationHash}</span>
      </div>
    `;

    resolutionModal.classList.remove("hidden");
    resolveSecretInput.focus();
  }

  function closeResolutionModal() {
    resolutionModal.classList.add("hidden");
    resolveReportForm.reset();
  }

  async function handleResolveReport(e) {
    e.preventDefault();

    if (!signer) {
      showToast("Please connect your wallet first.", "error");
      return;
    }

    const reportId = Number(resolveReportIdInput.value);
    const secret = resolveSecretInput.value.trim();

    if (!secret) {
      showToast("Verification secret cannot be empty.", "error");
      return;
    }

    try {
      confirmResolveBtn.disabled = true;
      resolveSpinner.classList.remove("hidden");
      resolveBtnText.textContent = "Awaiting Signature...";

      showToast("Please confirm resolution transaction in MetaMask...", "info", 5000);

      const contractWithSigner = contract.connect(signer);
      const tx = await contractWithSigner.resolveReport(reportId, secret);

      resolveBtnText.textContent = "Resolving On-Chain...";
      showToast(`Transaction broadcast (${tx.hash.slice(0, 10)}...). Waiting for confirmation...`, "info", 8000);

      const receipt = await tx.wait();

      showToast(`Report #${reportId} successfully resolved on-chain! Block #${receipt.blockNumber}`, "success", 6000);
      closeResolutionModal();
      await loadReports();
    } catch (err) {
      console.error("Resolve error:", err);
      decodeContractError(err);
    } finally {
      confirmResolveBtn.disabled = false;
      resolveSpinner.classList.add("hidden");
      resolveBtnText.textContent = "Confirm & Resolve On-Chain";
    }
  }

  // --- Error Decoder ---
  function decodeContractError(err) {
    if (err.code === 4001 || (err.info && err.info.error && err.info.error.code === 4001)) {
      showToast("Transaction rejected by user in MetaMask.", "error");
      return;
    }

    // Check for standard revert string messages
    let message = err.message || "";
    if (err.reason) {
      message = err.reason;
    } else if (err.data && typeof err.data === "string") {
      message = err.data;
    } else if (err.info && err.info.error && err.info.error.message) {
      message = err.info.error.message;
    }

    if (message.includes("CampusTrace: Only creator can resolve report")) {
      showToast("Reverted: Only the original report creator can resolve this report.", "error", 6000);
    } else if (message.includes("CampusTrace: Invalid verification secret")) {
      showToast("Verification Failed: The secret you provided does not match the registered hash.", "error", 6000);
    } else if (message.includes("CampusTrace: Report already resolved")) {
      showToast("Reverted: This report has already been marked resolved.", "error", 6000);
    } else if (message.includes("CampusTrace: Report does not exist")) {
      showToast("Reverted: Invalid or nonexistent report ID.", "error", 6000);
    } else if (message.includes("CampusTrace: Title cannot be empty")) {
      showToast("Validation Error: Title cannot be empty.", "error");
    } else {
      showToast(`Transaction failed: ${message.slice(0, 120)}`, "error", 7000);
    }
  }

  // --- Helper: HTML Sanitization ---
  function escapeHTML(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // --- Event Listeners Setup ---
  function setupEventListeners() {
    connectWalletBtn.addEventListener("click", connectWallet);

    copyAddressBtn.addEventListener("click", () => {
      if (userAddress) {
        navigator.clipboard.writeText(userAddress);
        showToast("Address copied to clipboard!", "info", 2000);
      }
    });

    editConfigBtn.addEventListener("click", () => {
      configDrawer.classList.toggle("hidden");
    });

    saveContractConfigBtn.addEventListener("click", async () => {
      const input = cfgContractAddress.value.trim();
      if (!input || !ethers.isAddress(input)) {
        showToast("Please enter a valid Ethereum address (0x...).", "error");
        return;
      }
      localStorage.setItem("campustrace_contract_address", input);
      updateContractTargetUI();
      configDrawer.classList.add("hidden");
      showToast(`Contract target updated to ${input.slice(0, 10)}...`, "success");
      initContractInstance();
      await loadReports();
    });

    resetContractConfigBtn.addEventListener("click", async () => {
      localStorage.removeItem("campustrace_contract_address");
      updateContractTargetUI();
      configDrawer.classList.add("hidden");
      showToast("Contract target reset to default configuration.", "info");
      initContractInstance();
      await loadReports();
    });

    itemTitleInput.addEventListener("input", updateCharCounters);
    itemLocationInput.addEventListener("input", updateCharCounters);
    itemDescriptionInput.addEventListener("input", updateCharCounters);

    claimSecretInput.addEventListener("input", updateHashPreview);

    generateSecretBtn.addEventListener("click", generateRandomSecret);

    copySecretBtn.addEventListener("click", () => {
      const secret = claimSecretInput.value;
      if (secret) {
        navigator.clipboard.writeText(secret);
        showToast("Secret copied to clipboard!", "info", 2000);
      }
    });

    createReportForm.addEventListener("submit", handleCreateReport);

    searchInput.addEventListener("input", renderReportsFeed);
    typeFilter.addEventListener("change", renderReportsFeed);
    statusFilter.addEventListener("change", renderReportsFeed);

    refreshBtn.addEventListener("click", loadReports);

    closeModalBtn.addEventListener("click", closeResolutionModal);
    cancelModalBtn.addEventListener("click", closeResolutionModal);
    resolutionModal.addEventListener("click", (e) => {
      if (e.target === resolutionModal) closeResolutionModal();
    });

    resolveReportForm.addEventListener("submit", handleResolveReport);
  }

  // --- Initialization on Load ---
  window.addEventListener("DOMContentLoaded", async () => {
    updateContractTargetUI();
    setupEventListeners();
    updateCharCounters();
    updateHashPreview();

    await initWeb3();
    await loadReports();
  });
})();
