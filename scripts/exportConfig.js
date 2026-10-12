const fs = require("fs");
const path = require("path");

const artifactPath = path.join(__dirname, "../artifacts/contracts/CampusTrace.sol/CampusTrace.json");
const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

const frontendDir = path.join(__dirname, "../frontend");
if (!fs.existsSync(frontendDir)) {
  fs.mkdirSync(frontendDir, { recursive: true });
}

const configContent = `// CampusTrace Smart Contract Configuration
// Automatically generated ABI from Hardhat compilation
// Update CONTRACT_ADDRESS after deploying to Ganache or test network via Remix or Hardhat.

const CONTRACT_CONFIG = {
  // Update this with the deployed address on Ganache / Remix
  address: "",
  // Ganache CLI usually defaults to 1337; Ganache GUI defaults to 5777; Hardhat is 31337
  expectedChainId: 1337,
  networkName: "Ganache Localhost (Chain ID: 1337 / 5777)",
  abi: ${JSON.stringify(artifact.abi, null, 2)}
};

if (typeof window !== "undefined") {
  window.CONTRACT_CONFIG = CONTRACT_CONFIG;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = CONTRACT_CONFIG;
}
`;

fs.writeFileSync(path.join(frontendDir, "contractConfig.js"), configContent, "utf8");
console.log("Successfully exported contractConfig.js to frontend directory!");
