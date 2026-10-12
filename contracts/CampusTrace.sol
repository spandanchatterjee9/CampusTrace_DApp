// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/**
 * @title CampusTrace
 * @dev A privacy-aware, decentralized campus lost-and-found registry.
 * 
 * Problem Solved:
 * Students lose personal belongings on campus, and centralized physical bulletin boards
 * lack transparency, auditability, and tamper resistance.
 * 
 * Original Feature - Privacy-Aware Claim Verification:
 * When reporting an item, the creator registers a cryptographic hash of a claim secret
 * (e.g. keccak256 of unique identifiable marks or an offline negotiated passcode).
 * Plaintext secrets are never stored on-chain. To mark an item resolved, the authorized
 * creator provides the secret, which is verified against the recorded hash.
 * 
 * Security & Blockchain Calldata Notice:
 * In a public blockchain, submitting a secret in transaction calldata exposes it to
 * public mempools and chain explorers once the transaction is broadcast. Hence,
 * claim secrets should only be used as single-use confirmation tokens for report closure
 * and must never be reused passwords or sensitive personal credentials.
 */
contract CampusTrace {
    // --- Data Types ---

    /// @notice Report classification: Lost item or Found item
    enum ReportType {
        Lost,
        Found
    }

    /// @notice Lifecycle status of a report
    enum ReportStatus {
        Active,
        Resolved
    }

    /// @notice Represents a campus item report
    struct Report {
        uint256 id;
        address creator;
        string title;
        string description;
        string location;
        ReportType reportType;
        uint256 timestamp;
        ReportStatus status;
        bytes32 claimVerificationHash;
    }

    // --- State Variables ---

    /// @notice The contract deployer recorded as administrator
    address public immutable admin;

    /// @notice Counter for total reports submitted
    uint256 public reportCount;

    /// @dev Internal mapping of report ID to Report struct
    mapping(uint256 => Report) private _reports;

    // Field length boundaries to prevent gas griefing and bloat
    uint256 public constant MAX_TITLE_LENGTH = 100;
    uint256 public constant MAX_DESCRIPTION_LENGTH = 500;
    uint256 public constant MAX_LOCATION_LENGTH = 100;

    // --- Events ---

    /// @notice Emitted when a new lost or found report is published
    event ReportCreated(
        uint256 indexed id,
        address indexed creator,
        ReportType reportType,
        string title,
        string location,
        uint256 timestamp
    );

    /// @notice Emitted when a report is verified and marked as resolved
    event ReportResolved(
        uint256 indexed id,
        address indexed resolver,
        uint256 timestamp
    );

    // --- Constructor ---

    /// @dev Initializes the contract and records the deployer as administrator
    constructor() {
        admin = msg.sender;
    }

    // --- Core Functions ---

    /**
     * @notice Creates a new lost or found report on campus
     * @param title Brief summary of the item (1 to 100 characters)
     * @param description Detailed description of the item (1 to 500 characters)
     * @param location Campus location where the item was lost or found (1 to 100 characters)
     * @param reportType Type of report (0 = Lost, 1 = Found)
     * @param claimVerificationHash keccak256 hash of the confidential claim secret
     * @return newReportId The assigned unique ID for this report
     */
    function createReport(
        string calldata title,
        string calldata description,
        string calldata location,
        ReportType reportType,
        bytes32 claimVerificationHash
    ) external returns (uint256 newReportId) {
        bytes memory titleBytes = bytes(title);
        bytes memory descBytes = bytes(description);
        bytes memory locBytes = bytes(location);

        require(titleBytes.length > 0, "CampusTrace: Title cannot be empty");
        require(titleBytes.length <= MAX_TITLE_LENGTH, "CampusTrace: Title exceeds maximum length");

        require(descBytes.length > 0, "CampusTrace: Description cannot be empty");
        require(descBytes.length <= MAX_DESCRIPTION_LENGTH, "CampusTrace: Description exceeds maximum length");

        require(locBytes.length > 0, "CampusTrace: Location cannot be empty");
        require(locBytes.length <= MAX_LOCATION_LENGTH, "CampusTrace: Location exceeds maximum length");

        require(claimVerificationHash != bytes32(0), "CampusTrace: Claim hash cannot be empty");

        reportCount++;
        newReportId = reportCount;

        _reports[newReportId] = Report({
            id: newReportId,
            creator: msg.sender,
            title: title,
            description: description,
            location: location,
            reportType: reportType,
            timestamp: block.timestamp,
            status: ReportStatus.Active,
            claimVerificationHash: claimVerificationHash
        });

        emit ReportCreated(
            newReportId,
            msg.sender,
            reportType,
            title,
            location,
            block.timestamp
        );
    }

    /**
     * @notice Resolves an existing active report using the confidential verification secret
     * @dev Follows Checks-Effects-Interactions (CEI). Caller must be the original report creator.
     * @param id Unique report ID
     * @param verificationSecret Plaintext secret matching the registered claimVerificationHash
     */
    function resolveReport(uint256 id, string calldata verificationSecret) external {
        require(id > 0 && id <= reportCount, "CampusTrace: Report does not exist");

        Report storage report = _reports[id];

        require(report.status == ReportStatus.Active, "CampusTrace: Report already resolved");
        require(msg.sender == report.creator, "CampusTrace: Only creator can resolve report");
        require(bytes(verificationSecret).length > 0, "CampusTrace: Secret cannot be empty");

        // Verify that hash of the provided secret matches registered claim verification hash
        bytes32 computedHash = keccak256(abi.encodePacked(verificationSecret));
        require(computedHash == report.claimVerificationHash, "CampusTrace: Invalid verification secret");

        // Update state
        report.status = ReportStatus.Resolved;

        emit ReportResolved(id, msg.sender, block.timestamp);
    }

    /**
     * @notice Retrieves the full data of an individual report
     * @param id Unique report ID
     * @return The Report struct
     */
    function getReport(uint256 id) external view returns (Report memory) {
        require(id > 0 && id <= reportCount, "CampusTrace: Report does not exist");
        return _reports[id];
    }

    /**
     * @notice Retrieves all reports currently stored in the contract
     * @dev Designed for small-to-medium college campus deployments and frontend dashboards
     * @return allReports Array containing all Report structs
     */
    function getAllReports() external view returns (Report[] memory allReports) {
        uint256 count = reportCount;
        allReports = new Report[](count);
        for (uint256 i = 1; i <= count; i++) {
            allReports[i - 1] = _reports[i];
        }
    }

    /**
     * @notice Pure helper utility to generate the claim verification hash off-chain or in Remix
     * @param secret Plaintext secret string
     * @return The keccak256 hash of the secret
     */
    function computeVerificationHash(string calldata secret) external pure returns (bytes32) {
        require(bytes(secret).length > 0, "CampusTrace: Secret cannot be empty");
        return keccak256(abi.encodePacked(secret));
    }
}
