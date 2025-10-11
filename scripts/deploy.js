const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("Starting deployment to Sepolia testnet...");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

  // Platform wallet address from config
  const platformWallet = "0xf2664dBc523ac59892bCFdFF99E184f5372cc5Bc";
  const insurancePool = "0xf2664dBc523ac59892bCFdFF99E184f5372cc5Bc";

  console.log("\n1. Deploying DeSynthEscrow...");
  const DeSynthEscrow = await hre.ethers.getContractFactory("DeSynthEscrow");
  const escrow = await DeSynthEscrow.deploy(platformWallet, insurancePool);
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  console.log("✅ DeSynthEscrow deployed to:", escrowAddress);

  console.log("\n2. Deploying DeSynthSlotTokens...");
  const DeSynthSlotTokens = await hre.ethers.getContractFactory("DeSynthSlotTokens");
  const slotTokens = await DeSynthSlotTokens.deploy();
  await slotTokens.waitForDeployment();
  const slotTokensAddress = await slotTokens.getAddress();
  console.log("✅ DeSynthSlotTokens deployed to:", slotTokensAddress);

  // Save deployment info
  const deploymentInfo = {
    network: "sepolia",
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      DeSynthEscrow: escrowAddress,
      DeSynthSlotTokens: slotTokensAddress,
    },
    platformWallet: platformWallet,
    insurancePool: insurancePool,
  };

  fs.writeFileSync(
    "deployment-info.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\n✅ Deployment info saved to deployment-info.json");

  console.log("\n📋 DEPLOYMENT SUMMARY");
  console.log("=====================");
  console.log("DeSynthEscrow:", escrowAddress);
  console.log("DeSynthSlotTokens:", slotTokensAddress);
  console.log("\n⚠️  NEXT STEPS:");
  console.log("1. Update src/lib/blockchain/config.ts with these addresses");
  console.log("2. Update supabase/functions/_shared/blockchain.ts with these addresses");
  console.log("3. Verify contracts on Etherscan (optional)");
  console.log("4. Authorize auditors using scripts/add-auditor.js");
  
  console.log("\n🔍 To verify on Etherscan, run:");
  console.log(`npx hardhat verify --network sepolia ${escrowAddress} "${platformWallet}" "${insurancePool}"`);
  console.log(`npx hardhat verify --network sepolia ${slotTokensAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
