const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("----------------------------------------------------");
  console.log("Deploying CampusTrace Smart Contract...");
  console.log("Network:", hre.network.name);

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer Address (Admin):", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Deployer Balance:", hre.ethers.formatEther(balance), "ETH");

  const CampusTrace = await hre.ethers.getContractFactory("CampusTrace");
  const campusTrace = await CampusTrace.deploy();
  await campusTrace.waitForDeployment();

  const deployedAddress = await campusTrace.getAddress();
  console.log("----------------------------------------------------");
  console.log(">>> CampusTrace deployed successfully!");
  console.log(">>> Contract Address:", deployedAddress);
  console.log("----------------------------------------------------");

  // Automatically update frontend/contractConfig.js with deployed address and chain ID
  const network = await hre.ethers.provider.getNetwork();
  const configPath = path.join(__dirname, "../frontend/contractConfig.js");

  if (fs.existsSync(configPath)) {
    let content = fs.readFileSync(configPath, "utf8");
    content = content.replace(/address:\s*"[^"]*"/, `address: "${deployedAddress}"`);
    content = content.replace(/expectedChainId:\s*\d+/, `expectedChainId: ${network.chainId}`);
    fs.writeFileSync(configPath, content, "utf8");
    console.log(`Updated frontend/contractConfig.js with address: ${deployedAddress} and chainId: ${network.chainId}`);
  }
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
