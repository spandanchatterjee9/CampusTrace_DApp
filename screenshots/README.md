# Evidence & Screenshot Documentation Guide

This directory holds authentic screenshot evidence for the **CampusTrace** CSE4444 Assignment 2 submission.

> **Integrity Notice:** In accordance with course guidelines, screenshot evidence must never be fabricated. The screenshots captured below represent genuine interactions from Remix IDE, Ganache local blockchain, MetaMask transaction approvals, and the live CampusTrace web UI.

---

## Required Submission Screenshots Checklist

Save the screenshots using the filenames below:

1. `01_remix_compilation.png`
   - **Description:** Remix IDE showing `CampusTrace.sol` successfully compiled under Solidity `0.8.20` with zero warnings.
2. `02_remix_ganache_deployment.png`
   - **Description:** Remix IDE "Deploy & Run Transactions" tab with Environment set to **Injected Provider - MetaMask** connected to Ganache, showing successful contract creation and recorded deployed address.
3. `03_ganache_blockchain_status.png`
   - **Description:** Ganache GUI / CLI showing blocks mined, gas consumed, and test account balances.
4. `04_metamask_connected.png`
   - **Description:** CampusTrace web dashboard showing MetaMask connected, wallet address pill, and network badge (`Ganache (1337 / 5777)`).
5. `05_create_report_transaction.png`
   - **Description:** Form filled with a new report (e.g., lost item) showing generated/typed secret and computed `keccak256` hash preview, alongside the MetaMask signature popup.
6. `06_feed_showing_reports.png`
   - **Description:** CampusTrace feed displaying published report cards with distinct Lost/Found badges, location, timestamp, and claim hash.
7. `07_resolve_report_modal.png`
   - **Description:** Verification modal open for an active report where the original creator inputs the secret passphrase to resolve.
8. `08_successful_resolution_event.png`
   - **Description:** Report card updated with the purple `Resolved on Blockchain` badge after confirmation.
9. `09_rejection_wrong_secret.png`
   - **Description:** Failed transaction demonstration: UI alert/toast or Remix transaction revert showing `CampusTrace: Invalid verification secret`.
10. `10_hardhat_automated_test_suite.png`
    - **Description:** Terminal output showing all 25 automated Hardhat tests passing (`25 passing`).
