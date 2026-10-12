# CampusTrace 🛡️
### Decentralised & Privacy-Aware Campus Lost-and-Found Registry
**Course:** CSE4444 Blockchain Technology — Assignment 2  
**EVM Target:** Solidity `0.8.20` &bull; Hardhat &bull; Ganache &bull; Remix IDE &bull; Ethers.js v6  

---

## 1. Problem Statement & Objectives

Students routinely misplace personal belongings across campus (libraries, cafeterias, sports complexes, lecture halls). Traditional physical notice boards and centralized message groups suffer from:
1. **Lack of Auditability & Persistence:** Notices get deleted, lost in chat floods, or tampered with.
2. **Fraudulent & Unverified Claims:** Anyone claiming "that's mine" can easily deceive well-meaning finders without verifiable proof of ownership.
3. **Privacy Exposure:** Storing personal secrets, identifying marks, or serial numbers in public bulletin boards compromises user privacy.

### Objectives
- Build an immutable, decentralised lost-and-found registry on the Ethereum blockchain.
- Implement **Privacy-Aware Claim Verification**: register only the cryptographic hash (`keccak256`) of a confidential claim secret.
- Guarantee strict access control: only the original report creator can execute resolution, and only upon submitting the valid secret matching the registered hash.
- Provide a responsive, modern frontend dashboard connected to MetaMask via Ethers.js.
- Ensure end-to-end auditability and automated unit test verification.

---

## 2. What Makes CampusTrace Distinctive

### Privacy-Aware Claim Verification
Instead of publishing identifying marks in plaintext, CampusTrace employs an off-chain/on-chain hash commitment model:

```
[Report Creator] ---> Selects/Generates Secret Token ("Serial_98412_BlueLid")
       |
       v (Off-chain / Client)
keccak256(secret) = 0x8f3c...e92a
       |
       v (Transaction calldata)
Contract Stores: claimVerificationHash = 0x8f3c...e92a (Plaintext is NEVER stored on-chain)
```

When an item is ready to be resolved:
1. The claimant and reporter verify proof offline or out-of-band.
2. The report creator calls `resolveReport(id, secret)`.
3. The contract executes:
   ```solidity
   require(msg.sender == report.creator, "Only creator can resolve");
   require(keccak256(abi.encodePacked(secret)) == report.claimVerificationHash, "Invalid secret");
   report.status = ReportStatus.Resolved;
   ```

### Transparent Security Notice & Blockchain Calldata Limitations
- **Public Mempool & Calldata Visibility:** In public blockchains, any data passed into a transaction (`calldata`) is visible in public mempools before and after block inclusion. Therefore, the secret passed to `resolveReport` becomes public once broadcast.
- **Single-Use Confirmation Tokens:** Claim secrets in CampusTrace are designed as **one-time report closure confirmation tokens**. Users must **never** use personal banking PINs, reusable account passwords, or sensitive personal IDs as the claim secret.
- **Sufficient Secret Entropy:** To prevent dictionary and rainbow table guessing attacks against the public hash, secrets should incorporate high entropy or distinct prefixes (e.g., `CT-7K9M2XQ8`).

---

## 3. Architecture & Workflow

```
+-------------------------------------------------------------------------+
|                              CampusTrace DApp                           |
+-------------------------------------------------------------------------+
                                    |
            +-----------------------+-----------------------+
            |                                               |
            v                                               v
+-----------------------+                       +-----------------------+
|  Frontend (HTML/CSS)  |                       |  Automated Test Suite |
|  - Vanilla JavaScript |                       |  - Hardhat 2.29       |
|  - Ethers.js v6 (UMD) |                       |  - Mocha & Chai       |
|  - MetaMask Provider  |                       |  - 25 Passing Tests   |
+-----------------------+                       +-----------------------+
            |                                               |
            +-----------------------+-----------------------+
                                    | JSON-RPC
                                    v
+-------------------------------------------------------------------------+
|                  Ganache Local Blockchain / Remix IDE                   |
|                  Port 7545 / 8545 &bull; Chain ID 1337 / 5777           |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                        CampusTrace.sol (0.8.20)                         |
|  - struct Report (id, creator, title, location, type, status, hash)     |
|  - createReport(...) &bull; resolveReport(...)                          |
|  - getAllReports() &bull; getReport(...) &bull; computeVerificationHash |
+-------------------------------------------------------------------------+
```

---

## 4. Smart Contract Specification

**Location:** [`contracts/CampusTrace.sol`](contracts/CampusTrace.sol)  
**Compiler Version:** Solidity `0.8.20`  

### State Variables & Types
- `address public immutable admin;` &mdash; Contract deployer.
- `uint256 public reportCount;` &mdash; Sequential counter for report IDs.
- `enum ReportType { Lost, Found }` &mdash; Item classification.
- `enum ReportStatus { Active, Resolved }` &mdash; Lifecycle status.
- `struct Report` &mdash; Stores `id`, `creator`, `title`, `description`, `location`, `reportType`, `timestamp`, `status`, and `claimVerificationHash`.
- Length boundaries: `MAX_TITLE_LENGTH = 100`, `MAX_DESCRIPTION_LENGTH = 500`, `MAX_LOCATION_LENGTH = 100`.

### Functions & Access Control Rules

| Function | Access Control | Description |
| :--- | :--- | :--- |
| `createReport(...)` | Public / Any User | Validates non-empty title, desc, location, non-zero hash; stores report, emits `ReportCreated`. |
| `resolveReport(id, secret)` | **Only Report Creator** | Validates existence, active status, caller authorization, and verifies `keccak256(secret) == hash`. Updates status to `Resolved` and emits `ReportResolved`. |
| `getReport(id)` | Public View | Returns single `Report` struct for an existing ID. Reverts if ID is invalid or nonexistent. |
| `getAllReports()` | Public View | Enumerates all reports in memory for dashboard feeds. |
| `computeVerificationHash(secret)` | Pure Utility | Calculates `keccak256(abi.encodePacked(secret))` on-chain or for Remix testing. |

---

## 5. Prerequisites & Installation

### Requirements
- **Node.js:** v18+ (tested on Node v24.19.0)
- **npm:** v9+ (tested on npm 11.17.0)
- **Ganache:** Ganache GUI (Port 7545) or `ganache-cli` (Port 8545)
- **MetaMask:** Browser extension installed in Chrome, Brave, or Firefox
- **Remix IDE:** Web browser access at [remix.ethereum.org](https://remix.ethereum.org)

### Installation
Clone the repository and install dependencies:
```bash
git clone <your-repo-url>
cd CampusTrace_DApp
npm install
```

---

## 6. Automated Unit Tests

Automated testing is configured using Hardhat and Chai.

### Run Tests
```bash
npm test
```
*(or `npx hardhat test`)*

### Observed Test Results
```
> campustrace-dapp@1.0.0 test
> hardhat test

  CampusTrace Smart Contract
    1. Deployment and Administration
      √ should deploy successfully and record the deployer as administrator
      √ should start with an initial report count of 0
      √ should return an empty array from getAllReports when no reports exist
    2 & 3. Report Creation & Event Emission
      √ should allow a student to publish a report and emit ReportCreated event
      √ should increment report IDs sequentially for subsequent reports
    4. Report Retrieval
      √ should retrieve individual report details accurately
      √ should retrieve all reports correctly via getAllReports()
    5. Validation and Input Rejections
      √ should reject creation if title is empty
      √ should reject creation if title exceeds MAX_TITLE_LENGTH (100 characters)
      √ should reject creation if description is empty
      √ should reject creation if description exceeds MAX_DESCRIPTION_LENGTH (500 characters)
      √ should reject creation if location is empty
      √ should reject creation if location exceeds MAX_LOCATION_LENGTH (100 characters)
      √ should reject creation if claimVerificationHash is zero
    6. Rejection of Nonexistent Report IDs
      √ should revert getReport with ID 0
      √ should revert getReport for nonexistent report ID
      √ should revert resolveReport for nonexistent report ID
    7, 8, 9, 10 & 11. Report Resolution, Verification & Access Control
      √ should successfully resolve the report when creator supplies correct verification secret and emit event
      √ should reject resolution by unauthorised non-creator even with the secret
      √ should reject resolution if creator supplies an incorrect verification secret
      √ should reject resolution if verification secret is empty string
      √ should reject attempting to resolve an already resolved report
    12. Helper Utility & Edge Case Boundaries
      √ should match off-chain keccak256 with computeVerificationHash helper
      √ should revert computeVerificationHash if secret is empty
      √ should accurately reflect report status updates in getAllReports()

  25 passing (2s)
```

**Total Tests:** 25 Passed &bull; 0 Failed.

---

## 7. Remix IDE & Ganache Step-by-Step Guide

### Step 1: Start Ganache
1. Launch **Ganache GUI** or run `npx ganache --port 7545 --chainId 1337`.
2. Ensure your RPC server is active:
   - **RPC Server:** `http://127.0.0.1:7545` (or `8545`)
   - **Network ID / Chain ID:** `1337` (or `5777`)
3. Copy the private key of Account 0 and Account 1 for testing.

### Step 2: Configure MetaMask
1. Open MetaMask &rarr; Networks &rarr; **Add Network Manually**.
   - **Network Name:** `Ganache Localhost`
   - **New RPC URL:** `http://127.0.0.1:7545`
   - **Chain ID:** `1337` (or `5777` if Ganache GUI reports 5777)
   - **Currency Symbol:** `ETH`
2. Click **Save**.
3. Import a test account using Ganache Account 0's private key (contains 100 test ETH).
4. Import a second test account using Ganache Account 1's private key (to demonstrate unauthorized access rejection).

### Step 3: Open and Compile in Remix
1. Open [remix.ethereum.org](https://remix.ethereum.org).
2. Create a new file under `contracts/` named `CampusTrace.sol`.
3. Paste the complete source code from [`contracts/CampusTrace.sol`](contracts/CampusTrace.sol).
4. Go to the **Solidity Compiler** tab (left sidebar):
   - **Compiler:** `0.8.20+commit.a1b79de6`
   - Click **Compile CampusTrace.sol**.

### Step 4: Deploy to Ganache via Remix
1. Switch to the **Deploy & Run Transactions** tab in Remix.
2. Under **Environment**, select **Injected Provider - MetaMask**.
3. MetaMask will prompt to connect. Confirm the connection to your Ganache network.
4. Select `CampusTrace` from the Contract dropdown.
5. Click **Deploy**.
6. MetaMask will open asking for transaction confirmation. Click **Confirm**.
7. Once mined, expand **Deployed Contracts** in Remix and copy the deployed contract address (e.g. `0x...`).

### Step 5: Configure the Frontend
Open `frontend/contractConfig.js` and paste your deployed address:
```javascript
const CONTRACT_CONFIG = {
  address: "0xYourDeployedAddressFromRemixHere",
  expectedChainId: 1337,
  ...
};
```
*(Alternatively, you can paste the deployed address directly into the web UI via the **Configure Target** drawer in the app).*

### Step 6: Launch and Use the Frontend
Serve the `frontend/` directory with any static server:
```bash
# Option A: Using npx serve
npx serve frontend -p 3000

# Option B: Using Python built-in server
python -m http.server 3000 --directory frontend
```
Visit `http://localhost:3000` in your browser.

---

## 8. Frontend Demonstration Flow

1. **Connect Wallet:** Click **Connect MetaMask** and approve the connection.
2. **Submit a Report:**
   - Select **Lost Item** or **Found Item**.
   - Enter Title (e.g., `Navy Blue Hydro Flask`).
   - Enter Location (e.g., `Library 2nd Floor Quiet Study`).
   - Enter Description (e.g., `1L flask with laptop stickers`).
   - Enter or generate a Secret Passphrase (e.g., `CT-7K9M2XQ8`).
   - Observe the live **Calculated keccak256 Hash** preview.
   - Click **Publish Report to Blockchain** and approve in MetaMask.
3. **Verify the Feed:**
   - The report appears immediately in the feed with its ID, status, and claim verification hash.
4. **Resolve the Report:**
   - Click **Verify & Resolve Report** on your active report card.
   - Enter the confidential secret passphrase.
   - Click **Confirm & Resolve On-Chain** and approve in MetaMask.
   - Notice the status updates to **Resolved on Blockchain**.
5. **Verify Security Controls:**
   - Switch accounts in MetaMask to Account 2. Notice you cannot resolve Account 1's report.
   - Intentionally enter a wrong passphrase; observe the contract revert: `CampusTrace: Invalid verification secret`.

---

## 9. Security & Cleanliness Checklist

- [x] No private keys, mnemonic phrases, or real credentials committed.
- [x] Checks-Effects-Interactions (CEI) followed in Solidity.
- [x] Bounded input string lengths to prevent gas exhaustion.
- [x] 25 automated unit tests passing.
- [x] Clean `.gitignore` ignoring build caches and node dependencies.
- [x] No framework overhead: pure HTML, CSS, and Vanilla JavaScript with Ethers.js.
