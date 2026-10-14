# CampusTrace Evidence & Screenshot Documentation

**Student Name:** Spandan Chatterjee  
**Registration Number:** 230905488  
**Department / Institution:** Department of Computer Science and Engineering, Manipal Institute of Technology (MIT), Manipal  
**Course:** CSE4444 — Blockchain Technology (Assignment 2)  
**Submission Date:** October 14, 2026  
**Deployed Contract Address:** `0x96216af98C26B76c178444eDA34016D2B1d1490F`  
**Network Environment:** Local Ganache Blockchain (`http://127.0.0.1:7545`, Chain ID `1337`)  

---

## Academic Integrity Notice
In strict accordance with course guidelines, all screenshot evidence captured in this directory represents authentic, unaltered interactions from Remix IDE, Ganache local blockchain, MetaMask transaction approvals, the live CampusTrace web UI (`http://localhost:3000`), and the Hardhat automated test runner.

---

## Screenshot Inventory & Stepwise Workflow

| File Name | Step & Milestone | Description & Proof |
| :--- | :--- | :--- |
| [`01_smart_contract_compilation.png`](file:///c:/Users/spand/college/CampusTrace_DApp/screenshots/01_smart_contract_compilation.png) | **Step 1: Contract Compilation** | Remix IDE showing `CampusTrace.sol` successfully compiled under Solidity `0.8.20` (Paris EVM, 200 optimizer runs) with zero warnings or errors. Green checkmark indicator confirmed. |
| [`02_smart_contract_deployment.png`](file:///c:/Users/spand/college/CampusTrace_DApp/screenshots/02_smart_contract_deployment.png) | **Step 2: Ganache Deployment** | Remix IDE deployment via Injected Provider (MetaMask) connected to Ganache (Chain ID `1337`). Deployed contract address `0x96216af98C26B76c178444eDA34016D2B1d1490F` recorded in Block #1. |
| [`03_metamask_wallet_connection.png`](file:///c:/Users/spand/college/CampusTrace_DApp/screenshots/03_metamask_wallet_connection.png) | **Step 3: Frontend Wallet Connection** | CampusTrace web application at `http://localhost:3000` connected to Ganache. Wallet pill `0x212A...57F2` active with MetaMask popup requesting interaction approval with `0x96216...1490F`. |
| [`04_successful_transaction.png`](file:///c:/Users/spand/college/CampusTrace_DApp/screenshots/04_successful_transaction.png) | **Step 4: Successful Transaction** | Execution of `createReport` in Remix IDE. Terminal displays confirmation `[block:3 txIndex:0] CampusTrace.createReport status: true` with event emitted. |
| [`05_failed_transaction.png`](file:///c:/Users/spand/college/CampusTrace_DApp/screenshots/05_failed_transaction.png) | **Step 5: Revert Validation Rejection** | Defensive boundary validation test. Remix terminal displays on-chain revert: `execution reverted: "CampusTrace: Secret cannot be empty"`. |
| [`06_blockchain_data_in_frontend.png`](file:///c:/Users/spand/college/CampusTrace_DApp/screenshots/06_blockchain_data_in_frontend.png) | **Step 6: Frontend Data Retrieval** | UI rendering Report #1 (*Navy Blue Hydro Flask*, `Active`, `Lost`) with creator address, timestamp, claim hash commitment, and resolution action button. |
| [`07_report_retrieval.png`](file:///c:/Users/spand/college/CampusTrace_DApp/screenshots/07_report_retrieval.png) | **Step 7: Dynamic Feed Synchronization** | CampusTrace live dashboard showing *"Showing 3 of 3 reports"* retrieved from the contract, featuring Report #3 (*Scientific Calculator Casio FX-991ES*). |
| [`08_automated_test_results.png`](file:///c:/Users/spand/college/CampusTrace_DApp/screenshots/08_automated_test_results.png) | **Step 8: Automated Test Verification** | Terminal output running Hardhat test suite (`npx hardhat test`), confirming all 12 suites pass (`25 passing (3s)`). |

---

## Generated Submission Reports
The final submission reports are located in [`docs/report/`](file:///c:/Users/spand/college/CampusTrace_DApp/docs/report/):
1. **[`Spandan_Chatterjee_230905488_BT_Assignment2.docx`](file:///c:/Users/spand/college/CampusTrace_DApp/docs/report/Spandan_Chatterjee_230905488_BT_Assignment2.docx)**
2. **[`Spandan_Chatterjee_230905488_BT_Assignment2.pdf`](file:///c:/Users/spand/college/CampusTrace_DApp/docs/report/Spandan_Chatterjee_230905488_BT_Assignment2.pdf)**
3. **[`CampusTrace_Assignment_Report.docx`](file:///c:/Users/spand/college/CampusTrace_DApp/docs/report/CampusTrace_Assignment_Report.docx)**
4. **[`CampusTrace_Assignment_Report.pdf`](file:///c:/Users/spand/college/CampusTrace_DApp/docs/report/CampusTrace_Assignment_Report.pdf)**
