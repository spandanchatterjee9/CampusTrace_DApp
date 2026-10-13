const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CampusTrace Smart Contract", function () {
  let campusTrace;
  let admin;
  let studentAlice;
  let studentBob;
  let studentCharlie;

  const validSecret = "BlueHydroFlask_Serial_98412";
  let validSecretHash;

  beforeEach(async function () {
    [admin, studentAlice, studentBob, studentCharlie] = await ethers.getSigners();

    const CampusTraceFactory = await ethers.getContractFactory("CampusTrace");
    campusTrace = await CampusTraceFactory.deploy();
    await campusTrace.waitForDeployment();

    validSecretHash = ethers.solidityPackedKeccak256(["string"], [validSecret]);
  });

  describe("1. Deployment and Administration", function () {
    it("should deploy successfully and record the deployer as administrator", async function () {
      expect(await campusTrace.admin()).to.equal(admin.address);
    });

    it("should start with an initial report count of 0", async function () {
      expect(await campusTrace.reportCount()).to.equal(0n);
    });

    it("should return an empty array from getAllReports when no reports exist", async function () {
      const reports = await campusTrace.getAllReports();
      expect(reports.length).to.equal(0);
    });
  });

  describe("2 & 3. Report Creation & Event Emission", function () {
    it("should allow a student to publish a report and emit ReportCreated event", async function () {
      const tx = await campusTrace.connect(studentAlice).createReport(
        "Water Bottle Lost",
        "Navy blue 1L Hydro Flask with science stickers",
        "Main Campus Library 2nd Floor",
        0, // ReportType.Lost
        validSecretHash
      );

      const receipt = await tx.wait();
      const currentBlock = await ethers.provider.getBlock(receipt.blockNumber);

      await expect(tx)
        .to.emit(campusTrace, "ReportCreated")
        .withArgs(
          1n,
          studentAlice.address,
          0, // ReportType.Lost
          "Water Bottle Lost",
          "Main Campus Library 2nd Floor",
          currentBlock.timestamp
        );

      expect(await campusTrace.reportCount()).to.equal(1n);
    });

    it("should increment report IDs sequentially for subsequent reports", async function () {
      await campusTrace.connect(studentAlice).createReport(
        "Lost Keys",
        "Set of 3 keys with red lanyard",
        "Sports Complex",
        0,
        validSecretHash
      );

      await campusTrace.connect(studentBob).createReport(
        "Found Calculator",
        "TI-84 Plus silver edition",
        "Science Block Room 102",
        1, // ReportType.Found
        validSecretHash
      );

      expect(await campusTrace.reportCount()).to.equal(2n);
    });
  });

  describe("4. Report Retrieval", function () {
    beforeEach(async function () {
      await campusTrace.connect(studentAlice).createReport(
        "Scientific Calculator",
        "Casio fx-991EX classwiz calculator left on desk",
        "Room 304 Engineering Building",
        0, // Lost
        validSecretHash
      );
    });

    it("should retrieve individual report details accurately", async function () {
      const report = await campusTrace.getReport(1);

      expect(report.id).to.equal(1n);
      expect(report.creator).to.equal(studentAlice.address);
      expect(report.title).to.equal("Scientific Calculator");
      expect(report.description).to.equal("Casio fx-991EX classwiz calculator left on desk");
      expect(report.location).to.equal("Room 304 Engineering Building");
      expect(report.reportType).to.equal(0); // Lost
      expect(report.status).to.equal(0); // Active
      expect(report.claimVerificationHash).to.equal(validSecretHash);
      expect(report.timestamp).to.be.greaterThan(0n);
    });

    it("should retrieve all reports correctly via getAllReports()", async function () {
      await campusTrace.connect(studentBob).createReport(
        "Umbrella Found",
        "Black foldable umbrella",
        "Cafeteria Entrance",
        1, // Found
        validSecretHash
      );

      const all = await campusTrace.getAllReports();
      expect(all.length).to.equal(2);
      expect(all[0].title).to.equal("Scientific Calculator");
      expect(all[1].title).to.equal("Umbrella Found");
    });
  });

  describe("5. Validation and Input Rejections", function () {
    it("should reject creation if title is empty", async function () {
      await expect(
        campusTrace.connect(studentAlice).createReport(
          "",
          "Some description",
          "Library",
          0,
          validSecretHash
        )
      ).to.be.revertedWith("CampusTrace: Title cannot be empty");
    });

    it("should reject creation if title exceeds MAX_TITLE_LENGTH (100 characters)", async function () {
      const longTitle = "A".repeat(101);
      await expect(
        campusTrace.connect(studentAlice).createReport(
          longTitle,
          "Some description",
          "Library",
          0,
          validSecretHash
        )
      ).to.be.revertedWith("CampusTrace: Title exceeds maximum length");
    });

    it("should reject creation if description is empty", async function () {
      await expect(
        campusTrace.connect(studentAlice).createReport(
          "Valid Title",
          "",
          "Library",
          0,
          validSecretHash
        )
      ).to.be.revertedWith("CampusTrace: Description cannot be empty");
    });

    it("should reject creation if description exceeds MAX_DESCRIPTION_LENGTH (500 characters)", async function () {
      const longDesc = "D".repeat(501);
      await expect(
        campusTrace.connect(studentAlice).createReport(
          "Valid Title",
          longDesc,
          "Library",
          0,
          validSecretHash
        )
      ).to.be.revertedWith("CampusTrace: Description exceeds maximum length");
    });

    it("should reject creation if location is empty", async function () {
      await expect(
        campusTrace.connect(studentAlice).createReport(
          "Valid Title",
          "Valid Description",
          "",
          0,
          validSecretHash
        )
      ).to.be.revertedWith("CampusTrace: Location cannot be empty");
    });

    it("should reject creation if location exceeds MAX_LOCATION_LENGTH (100 characters)", async function () {
      const longLoc = "L".repeat(101);
      await expect(
        campusTrace.connect(studentAlice).createReport(
          "Valid Title",
          "Valid Description",
          longLoc,
          0,
          validSecretHash
        )
      ).to.be.revertedWith("CampusTrace: Location exceeds maximum length");
    });

    it("should reject creation if claimVerificationHash is zero", async function () {
      await expect(
        campusTrace.connect(studentAlice).createReport(
          "Valid Title",
          "Valid Description",
          "Library",
          0,
          ethers.ZeroHash
        )
      ).to.be.revertedWith("CampusTrace: Claim hash cannot be empty");
    });
  });

  describe("6. Rejection of Nonexistent Report IDs", function () {
    it("should revert getReport with ID 0", async function () {
      await expect(campusTrace.getReport(0)).to.be.revertedWith(
        "CampusTrace: Report does not exist"
      );
    });

    it("should revert getReport for nonexistent report ID (such as ID 42)", async function () {
      await expect(campusTrace.getReport(42)).to.be.revertedWith(
        "CampusTrace: Report does not exist"
      );
    });

    it("should revert resolveReport for nonexistent report ID", async function () {
      await expect(
        campusTrace.connect(studentAlice).resolveReport(99, validSecret)
      ).to.be.revertedWith("CampusTrace: Report does not exist");
    });
  });

  describe("7, 8, 9, 10 & 11. Report Resolution, Verification & Access Control", function () {
    beforeEach(async function () {
      await campusTrace.connect(studentAlice).createReport(
        "Lost Smartwatch",
        "Grey fitness tracker smartwatch lost near basketball court",
        "Gymnasium Court A",
        0, // Lost
        validSecretHash
      );
    });

    it("should successfully resolve the report when creator supplies correct verification secret and emit event", async function () {
      const tx = await campusTrace.connect(studentAlice).resolveReport(1, validSecret);
      const receipt = await tx.wait();
      const currentBlock = await ethers.provider.getBlock(receipt.blockNumber);

      await expect(tx)
        .to.emit(campusTrace, "ReportResolved")
        .withArgs(1n, studentAlice.address, currentBlock.timestamp);

      const report = await campusTrace.getReport(1);
      expect(report.status).to.equal(1); // Resolved
    });

    it("should reject resolution by unauthorised non-creator even with the secret", async function () {
      await expect(
        campusTrace.connect(studentBob).resolveReport(1, validSecret)
      ).to.be.revertedWith("CampusTrace: Only creator can resolve report");
    });

    it("should reject resolution if creator supplies an incorrect verification secret", async function () {
      const wrongSecret = "CompletelyWrongSecret123";
      await expect(
        campusTrace.connect(studentAlice).resolveReport(1, wrongSecret)
      ).to.be.revertedWith("CampusTrace: Invalid verification secret");
    });

    it("should reject resolution if verification secret is empty string", async function () {
      await expect(
        campusTrace.connect(studentAlice).resolveReport(1, "")
      ).to.be.revertedWith("CampusTrace: Secret cannot be empty");
    });

    it("should reject attempting to resolve an already resolved report", async function () {
      // First resolution succeeds
      await campusTrace.connect(studentAlice).resolveReport(1, validSecret);

      // Second resolution must revert
      await expect(
        campusTrace.connect(studentAlice).resolveReport(1, validSecret)
      ).to.be.revertedWith("CampusTrace: Report already resolved");
    });
  });

  describe("12. Helper Utility & Edge Case Boundaries", function () {
    it("should match off-chain keccak256 with computeVerificationHash helper", async function () {
      const testSecret = "UniquePasscode_#8812";
      const onChainHash = await campusTrace.computeVerificationHash(testSecret);
      const offChainHash = ethers.solidityPackedKeccak256(["string"], [testSecret]);

      expect(onChainHash).to.equal(offChainHash);
    });

    it("should revert computeVerificationHash if secret is empty", async function () {
      await expect(campusTrace.computeVerificationHash("")).to.be.revertedWith(
        "CampusTrace: Secret cannot be empty"
      );
    });

    it("should accurately reflect report status updates in getAllReports()", async function () {
      await campusTrace.connect(studentAlice).createReport(
        "Earbuds",
        "White wireless earbuds in matte case",
        "Student Union Hall",
        0,
        validSecretHash
      );

      let all = await campusTrace.getAllReports();
      expect(all[0].status).to.equal(0); // Active

      await campusTrace.connect(studentAlice).resolveReport(1, validSecret);

      all = await campusTrace.getAllReports();
      expect(all[0].status).to.equal(1); // Resolved
    });
  });
});
