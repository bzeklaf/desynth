# DeSynth Smart Contract Deployment Guide

## Overview
This guide covers deploying the DeSynth smart contracts to Ethereum Sepolia testnet with comprehensive fee collection system.

## Smart Contracts

### 1. DeSynthEscrow
Manages escrow payments with platform fee collection and automatic distribution.

**Key Features:**
- Escrow creation with detailed fee breakdown
- Automatic fee splitting on release to multiple wallets
- Insurance pool integration
- Dispute resolution mechanism
- Auditor authorization system

### 2. DeSynthSlotTokens (ERC-1155)
NFT tokens representing biomanufacturing slot bookings with full ownership tracking.

---

## Prerequisites

### 1. Install Dependencies
```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox ethers dotenv
```

### 2. Get Sepolia ETH
- Use [Sepolia Faucet](https://sepoliafaucet.com/)
- Need ~0.1 ETH for deployment and testing

### 3. Get Alchemy API Key
- Sign up at [Alchemy](https://www.alchemy.com/)
- Create a Sepolia app
- Copy API key

### 4. Prepare Wallet
- Export your MetaMask private key
- **NEVER commit private keys to git**
- Use a dedicated deployment wallet

---

## Configuration

### 1. Create `.env` file (project root)
```bash
# Alchemy RPC
ALCHEMY_SEPOLIA_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY

# Deployer wallet (NEVER commit this!)
DEPLOYER_PRIVATE_KEY=your_private_key_here

# Fee Collection Wallets
# For testing: all set to same address
# For production: use separate wallets for each fee type

PLATFORM_WALLET_ADDRESS=0xf2664dBc523ac59892bCFdFF99E184f5372cc5Bc
INSURANCE_POOL_ADDRESS=0xf2664dBc523ac59892bCFdFF99E184f5372cc5Bc
AUDITOR_NETWORK_ADDRESS=0xf2664dBc523ac59892bCFdFF99E184f5372cc5Bc
TOKENIZATION_FEE_ADDRESS=0xf2664dBc523ac59892bCFdFF99E184f5372cc5Bc
STABLECOIN_FEE_ADDRESS=0xf2664dBc523ac59892bCFdFF99E184f5372cc5Bc
PRIORITY_MATCHING_ADDRESS=0xf2664dBc523ac59892bCFdFF99E184f5372cc5Bc

# Etherscan (optional, for verification)
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### 2. Create `hardhat.config.js`
```javascript
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    sepolia: {
      url: process.env.ALCHEMY_SEPOLIA_URL,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY],
      chainId: 11155111
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  }
};
```

---

## Deployment Script

### Create `scripts/deploy.js`
```javascript
const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Get addresses from environment
  const insurancePoolAddress = process.env.INSURANCE_POOL_ADDRESS;
  const platformWalletAddress = process.env.PLATFORM_WALLET_ADDRESS;
  const auditorNetworkAddress = process.env.AUDITOR_NETWORK_ADDRESS;
  const tokenizationFeeAddress = process.env.TOKENIZATION_FEE_ADDRESS;
  const stablecoinFeeAddress = process.env.STABLECOIN_FEE_ADDRESS;
  const priorityMatchingAddress = process.env.PRIORITY_MATCHING_ADDRESS;

  if (!insurancePoolAddress || !platformWalletAddress) {
    throw new Error("Missing required wallet addresses in .env");
  }

  console.log("\n📋 Fee Collection Wallets:");
  console.log("Platform Wallet:", platformWalletAddress);
  console.log("Insurance Pool:", insurancePoolAddress);
  console.log("Auditor Network:", auditorNetworkAddress);
  console.log("Tokenization Fee:", tokenizationFeeAddress);
  console.log("Stablecoin Fee:", stablecoinFeeAddress);
  console.log("Priority Matching:", priorityMatchingAddress);

  // Deploy DeSynthEscrow
  console.log("\n📦 Deploying DeSynthEscrow...");
  const DeSynthEscrow = await hre.ethers.getContractFactory("DeSynthEscrow");
  const escrow = await DeSynthEscrow.deploy(insurancePoolAddress, platformWalletAddress);
  await escrow.deployed();
  console.log("✅ DeSynthEscrow deployed to:", escrow.address);

  // Deploy DeSynthSlotTokens
  console.log("\n📦 Deploying DeSynthSlotTokens...");
  const DeSynthSlotTokens = await hre.ethers.getContractFactory("DeSynthSlotTokens");
  const slotTokens = await DeSynthSlotTokens.deploy();
  await slotTokens.deployed();
  console.log("✅ DeSynthSlotTokens deployed to:", slotTokens.address);

  // Save deployment info
  const deploymentInfo = {
    network: "sepolia",
    timestamp: new Date().toISOString(),
    contracts: {
      DeSynthEscrow: {
        address: escrow.address,
        insurancePool: insurancePoolAddress,
        platformWallet: platformWalletAddress
      },
      DeSynthSlotTokens: {
        address: slotTokens.address
      }
    },
    feeWallets: {
      platformWallet: platformWalletAddress,
      insurancePool: insurancePoolAddress,
      auditorNetwork: auditorNetworkAddress,
      tokenization: tokenizationFeeAddress,
      stablecoin: stablecoinFeeAddress,
      priorityMatching: priorityMatchingAddress
    },
    deployer: deployer.address
  };

  fs.writeFileSync(
    "deployment-info.json",
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n✅ Deployment complete!");
  console.log("📄 Deployment info saved to deployment-info.json");
  
  console.log("\n⚠️  IMPORTANT: Update these addresses in:");
  console.log("  - src/lib/blockchain/config.ts");
  console.log("  - supabase/functions/_shared/blockchain.ts");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

---

## Deploy Steps

### 1. Compile Contracts
```bash
npx hardhat compile
```

### 2. Deploy to Sepolia
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### 3. Verify on Etherscan (Optional)
```bash
npx hardhat verify --network sepolia ESCROW_ADDRESS "INSURANCE_POOL_ADDRESS" "PLATFORM_WALLET_ADDRESS"
npx hardhat verify --network sepolia SLOT_TOKENS_ADDRESS
```

### 4. Save Deployment Addresses
The script creates `deployment-info.json` with all contract and wallet addresses.

---

## Post-Deployment Configuration

### 1. Update Frontend Config

Edit `src/lib/blockchain/config.ts`:

```typescript
// Contract addresses for Sepolia testnet
export const CONTRACT_ADDRESSES = {
  ESCROW: '0xYOUR_ESCROW_ADDRESS',
  SLOT_TOKENS: '0xYOUR_SLOT_TOKENS_ADDRESS',
  INSURANCE_POOL: '0xYOUR_INSURANCE_POOL_ADDRESS',
  ETH: '0x0000000000000000000000000000000000000000',
};

// Fee collection wallets - replace with your actual addresses
export const FEE_WALLETS = {
  PLATFORM_WALLET: '0xYOUR_PLATFORM_WALLET_ADDRESS',
  INSURANCE_POOL: '0xYOUR_INSURANCE_POOL_ADDRESS',
  AUDITOR_NETWORK: '0xYOUR_AUDITOR_NETWORK_ADDRESS',
  TOKENIZATION: '0xYOUR_TOKENIZATION_FEE_ADDRESS',
  STABLECOIN: '0xYOUR_STABLECOIN_FEE_ADDRESS',
  PRIORITY_MATCHING: '0xYOUR_PRIORITY_MATCHING_ADDRESS',
};
```

### 2. Update Backend Config

Edit `supabase/functions/_shared/blockchain.ts`:

```typescript
export const CONTRACT_ADDRESSES = {
  sepolia: {
    escrow: '0xYOUR_ESCROW_ADDRESS',
    slotTokens: '0xYOUR_SLOT_TOKENS_ADDRESS',
    insurancePool: '0xYOUR_INSURANCE_POOL_ADDRESS'
  }
};

export const FEE_WALLETS = {
  platformWallet: '0xYOUR_PLATFORM_WALLET_ADDRESS',
  insurancePool: '0xYOUR_INSURANCE_POOL_ADDRESS',
  auditorNetwork: '0xYOUR_AUDITOR_NETWORK_ADDRESS',
  tokenization: '0xYOUR_TOKENIZATION_FEE_ADDRESS',
  stablecoin: '0xYOUR_STABLECOIN_FEE_ADDRESS',
  priorityMatching: '0xYOUR_PRIORITY_MATCHING_ADDRESS',
};
```

### 3. Authorize Auditors

Create `scripts/add-auditor.js`:

```javascript
const hre = require("hardhat");

async function main() {
  const escrowAddress = "0xYOUR_ESCROW_ADDRESS";
  const auditorAddress = "0xAUDITOR_WALLET_ADDRESS";

  const escrow = await hre.ethers.getContractAt("DeSynthEscrow", escrowAddress);
  
  console.log("Authorizing auditor:", auditorAddress);
  const tx = await escrow.addAuditor(auditorAddress);
  await tx.wait();
  
  console.log("✅ Auditor authorized successfully");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

Run:
```bash
npx hardhat run scripts/add-auditor.js --network sepolia
```

---

## Fee Collection System

### Fee Wallet Structure

DeSynth uses a multi-wallet fee collection system to properly allocate platform revenues:

| Wallet Type | Purpose | Fee Types Collected |
|------------|---------|---------------------|
| **Platform Wallet** | Main platform operations | Booking commission (2-5%), Escrow service (0.1-0.2%) |
| **Insurance Pool** | Risk coverage fund | Insurance premiums (2% of booking) |
| **Auditor Network** | Quality assurance payments | Auditor network fees (0.2-0.5%) |
| **Tokenization** | NFT minting costs | Tokenization fees (0.05%) |
| **Stablecoin** | Currency conversion | Stablecoin settlement fees (0.1-0.2%) |
| **Priority Matching** | Premium placement services | Priority matching fees (0.5-1%) |

### Fee Collection Flow

**Step 1: Booking Creation**
- User books a slot for base amount (e.g., 0.05 ETH)
- Platform calculates all applicable fees:
  - Platform fee: 0.0025 ETH (5% booking commission)
  - Insurance: 0.001 ETH (2% premium)
  - Auditor: 0.0002 ETH (0.4%)
  - Tokenization: 0.000025 ETH (0.05%)
  - Priority: 0.0005 ETH (1%)
- Total escrow: 0.0542 ETH

**Step 2: Escrow Funding**
- Buyer deposits total amount into smart contract
- Funds are locked in escrow
- NFT slot token minted to buyer

**Step 3: Service Delivery & Audit**
- Facility delivers biomanufacturing service
- Auditor verifies quality and compliance
- Audit results recorded on-chain

**Step 4: Escrow Release**
Smart contract automatically distributes funds:
- Facility receives: 0.05 ETH (base amount)
- Platform wallet: 0.0025 ETH
- Insurance pool: 0.001 ETH
- Auditor network: 0.0002 ETH
- Tokenization wallet: 0.000025 ETH
- Priority matching: 0.0005 ETH

### Monitoring Fee Collection

Check individual wallet balances:
```javascript
const ethers = require('ethers');
const provider = new ethers.providers.AlchemyProvider('sepolia', 'YOUR_API_KEY');

async function checkBalances() {
  const wallets = {
    platform: '0xPLATFORM_ADDRESS',
    insurance: '0xINSURANCE_ADDRESS',
    auditor: '0xAUDITOR_ADDRESS',
    tokenization: '0xTOKENIZATION_ADDRESS',
    stablecoin: '0xSTABLECOIN_ADDRESS',
    priority: '0xPRIORITY_ADDRESS'
  };

  for (const [name, address] of Object.entries(wallets)) {
    const balance = await provider.getBalance(address);
    console.log(`${name}: ${ethers.utils.formatEther(balance)} ETH`);
  }
}

checkBalances();
```

---

## Testing Deployment

### Test Complete Booking Flow

1. **Connect Wallet**
   - Use MetaMask with Sepolia testnet
   - Ensure you have test ETH

2. **Browse & Book Slot**
   - Navigate to slot browser
   - Select available slot
   - Initiate booking

3. **Fund Escrow**
   - Choose crypto payment option
   - Confirm transaction in wallet
   - Wait for blockchain confirmation

4. **Verify Escrow Creation**
   - Check transaction on Etherscan
   - Verify escrow record in database
   - Confirm NFT minting

5. **Complete Audit**
   - Log in as auditor
   - Complete quality verification
   - Submit audit results

6. **Release Funds**
   - Trigger escrow release
   - Verify multi-wallet distribution
   - Check all wallet balances updated

### Automated Testing Script

Create `scripts/test-deployment.js`:

```javascript
const hre = require("hardhat");

async function main() {
  const escrowAddress = "0xYOUR_ESCROW_ADDRESS";
  const escrow = await hre.ethers.getContractAt("DeSynthEscrow", escrowAddress);

  console.log("Testing DeSynthEscrow contract...\n");

  // Test 1: Check contract owner
  const owner = await escrow.owner();
  console.log("✅ Contract Owner:", owner);

  // Test 2: Check insurance pool address
  const insurancePool = await escrow.insurancePool();
  console.log("✅ Insurance Pool:", insurancePool);

  // Test 3: Check platform wallet
  const platformWallet = await escrow.platformWallet();
  console.log("✅ Platform Wallet:", platformWallet);

  // Test 4: Check if auditor is authorized
  const auditorAddress = "0xAUDITOR_ADDRESS";
  const isAuthorized = await escrow.authorizedAuditors(auditorAddress);
  console.log("✅ Auditor authorized:", isAuthorized);

  console.log("\n✅ All tests passed!");
}

main();
```

---

## Monitoring & Maintenance

### Transaction Monitoring

**Etherscan Dashboard:**
- [Sepolia Etherscan](https://sepolia.etherscan.io/)
- Search for your contract addresses
- Monitor all transactions and events
- Set up email alerts for contract activity

**Key Events to Monitor:**
- `EscrowCreated`: New booking escrows
- `EscrowReleased`: Successful completions
- `DisputeRaised`: Issues requiring attention
- `AuditorAdded`: New auditor authorizations

### Wallet Balance Monitoring

Set up automated balance checks:

```javascript
// scripts/monitor-wallets.js
const ethers = require('ethers');
const nodemailer = require('nodemailer');

async function monitorWallets() {
  const provider = new ethers.providers.AlchemyProvider('sepolia', process.env.ALCHEMY_API_KEY);
  
  const wallets = {
    platform: process.env.PLATFORM_WALLET_ADDRESS,
    insurance: process.env.INSURANCE_POOL_ADDRESS,
    // ... other wallets
  };

  for (const [name, address] of Object.entries(wallets)) {
    const balance = await provider.getBalance(address);
    const ethBalance = ethers.utils.formatEther(balance);
    
    console.log(`${name}: ${ethBalance} ETH`);
    
    // Alert if balance exceeds threshold
    if (parseFloat(ethBalance) > 1.0) {
      console.log(`⚠️  ${name} wallet has high balance: ${ethBalance} ETH`);
      // Send email alert or trigger withdrawal
    }
  }
}

// Run every hour
setInterval(monitorWallets, 3600000);
```

### Contract Maintenance

**Update Platform Wallet:**
```javascript
const escrow = await hre.ethers.getContractAt("DeSynthEscrow", escrowAddress);
const tx = await escrow.updatePlatformWallet(newAddress);
await tx.wait();
console.log("✅ Platform wallet updated");
```

**Update Insurance Pool:**
```javascript
const tx = await escrow.updateInsurancePool(newAddress);
await tx.wait();
console.log("✅ Insurance pool updated");
```

**Remove Auditor:**
```javascript
const tx = await escrow.removeAuditor(auditorAddress);
await tx.wait();
console.log("✅ Auditor removed");
```

---

## Security Considerations

### Critical Security Practices

1. **Private Key Management**
   - Never commit private keys to version control
   - Use hardware wallets for mainnet
   - Implement key rotation policies
   - Store backups in secure locations

2. **Multi-Signature Wallets**
   - Consider using Gnosis Safe for platform wallet
   - Require multiple signatures for large transactions
   - Separate hot wallets (operations) from cold storage (treasury)

3. **Fee Wallet Security**
   - Use separate wallets for each fee type
   - Implement automated withdrawal to cold storage
   - Monitor for suspicious transaction patterns
   - Set up real-time alerts for all transactions

4. **Smart Contract Security**
   - Built-in fee caps prevent excessive charges
   - Only contract owner can resolve disputes
   - Auditor authorization prevents unauthorized releases
   - Time-locks on sensitive operations

5. **Access Control**
   - Limit number of authorized auditors
   - Regular audits of authorized addresses
   - Implement role-based access control
   - Document all permission changes

6. **Monitoring & Alerts**
   - Real-time transaction monitoring
   - Automated balance checks
   - Alert on unusual activity patterns
   - Regular security audits

### Emergency Procedures

**If Private Key Compromised:**
1. Immediately transfer all funds to secure wallet
2. Deploy new contracts if necessary
3. Update all application configs
4. Notify users of contract address changes

**If Smart Contract Issue Detected:**
1. Pause affected functions if possible
2. Assess severity and impact
3. Notify users immediately
4. Deploy patched version if needed

---

## Troubleshooting

### Common Issues & Solutions

**Deployment Fails**
```
Error: insufficient funds for gas
```
Solution: Get more Sepolia ETH from faucet

**Transaction Stuck**
- Check Sepolia network status
- Increase gas price in MetaMask
- Use "Speed Up" transaction option
- Wait for network congestion to clear

**Contract Verification Fails**
- Ensure constructor arguments match deployment
- Check Solidity version in hardhat.config.js
- Verify optimizer settings match
- Use `--constructor-args` flag

**Wrong Network**
```
Error: network does not match
```
Solution:
- Check `hardhat.config.js` network settings
- Verify MetaMask is on Sepolia
- Confirm Alchemy endpoint URL

**Auditor Authorization Fails**
```
Error: caller is not the owner
```
Solution: Ensure you're calling from deployer wallet

**Fee Distribution Not Working**
- Verify all wallet addresses in contract
- Check escrow release transaction logs
- Ensure sufficient gas for multi-send
- Review event logs on Etherscan

### Debug Commands

```bash
# Check contract bytecode
npx hardhat verify --list-networks

# Get transaction receipt
npx hardhat run scripts/get-receipt.js --network sepolia

# Check contract state
npx hardhat console --network sepolia
```

---

## Mainnet Migration

### When Ready for Production

**Pre-Launch Checklist:**
- [ ] Smart contracts professionally audited
- [ ] All tests passing with 100% coverage
- [ ] Security review completed
- [ ] Fee wallets secured (preferably multi-sig)
- [ ] Emergency procedures documented
- [ ] Monitoring systems in place
- [ ] Legal compliance verified
- [ ] Insurance coverage obtained

**Migration Steps:**

1. **Get Mainnet ETH**
   - Estimate deployment costs (~0.05-0.1 ETH)
   - Add buffer for gas price fluctuations

2. **Update Configuration**
   ```javascript
   // hardhat.config.js
   mainnet: {
     url: process.env.ALCHEMY_MAINNET_URL,
     accounts: [process.env.DEPLOYER_PRIVATE_KEY],
     chainId: 1
   }
   ```

3. **Deploy to Mainnet**
   ```bash
   npx hardhat run scripts/deploy.js --network mainnet
   ```

4. **Verify Contracts**
   ```bash
   npx hardhat verify --network mainnet ESCROW_ADDRESS "..." "..."
   ```

5. **Update Application**
   - Update all config files with mainnet addresses
   - Switch RainbowKit to mainnet chain
   - Test thoroughly before public launch

6. **Consider Upgradeable Contracts**
   - Use OpenZeppelin's proxy pattern
   - Enables bug fixes without redeployment
   - Maintains contract address consistency

---

## Support Resources

### Documentation
- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/)
- [Ethereum Developer Docs](https://ethereum.org/en/developers/)
- [Solidity Documentation](https://docs.soliditylang.org/)

### Tools & Services
- [Alchemy Dashboard](https://dashboard.alchemy.com/) - RPC provider
- [Sepolia Etherscan](https://sepolia.etherscan.io/) - Block explorer
- [Sepolia Faucet](https://sepoliafaucet.com/) - Test ETH
- [Tenderly](https://tenderly.co/) - Contract debugging
- [Gnosis Safe](https://gnosis-safe.io/) - Multi-sig wallet

### Community
- [Hardhat Discord](https://hardhat.org/discord)
- [OpenZeppelin Forum](https://forum.openzeppelin.com/)
- [Ethereum Stack Exchange](https://ethereum.stackexchange.com/)

---

## Quick Deploy Summary

```bash
# 1. Install dependencies
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox ethers dotenv

# 2. Create .env with all wallet addresses and keys
# See Configuration section above

# 3. Create hardhat.config.js
# Copy configuration from above

# 4. Compile contracts
npx hardhat compile

# 5. Deploy to Sepolia
npx hardhat run scripts/deploy.js --network sepolia

# 6. Save deployed addresses from console output

# 7. Update frontend config
# Edit src/lib/blockchain/config.ts with deployed addresses

# 8. Update backend config  
# Edit supabase/functions/_shared/blockchain.ts

# 9. Authorize auditors
npx hardhat run scripts/add-auditor.js --network sepolia

# 10. Test complete booking flow
# Use application to create and complete a booking

# 11. Monitor wallets
# Check Etherscan for all fee collection wallets
```

---

## Appendix: Fee Wallet Best Practices

### Recommended Production Setup

**Development/Testing:**
- Use single wallet address for all fees
- Simplifies testing and monitoring
- Easy to track total platform revenue

**Production:**
- Use separate wallet for each fee type
- Enables granular accounting
- Simplifies tax reporting and audits
- Allows role-based access control

### Wallet Security Tiers

**Tier 1 - Hot Wallets (Operational):**
- Platform wallet (frequent small transactions)
- Priority matching (automated processing)

**Tier 2 - Warm Wallets (Regular Access):**
- Auditor network (periodic payouts)
- Tokenization (automated but monitored)

**Tier 3 - Cold Storage (High Security):**
- Insurance pool (emergency reserves only)
- Treasury/revenue collection

### Automated Fund Management

```javascript
// Example: Auto-sweep to cold storage when threshold reached
async function autoSweep() {
  const balance = await provider.getBalance(hotWalletAddress);
  const threshold = ethers.utils.parseEther('5.0');
  
  if (balance.gt(threshold)) {
    const amountToSweep = balance.sub(ethers.utils.parseEther('1.0')); // Keep 1 ETH for operations
    
    const tx = await hotWallet.sendTransaction({
      to: coldStorageAddress,
      value: amountToSweep
    });
    
    await tx.wait();
    console.log(`✅ Swept ${ethers.utils.formatEther(amountToSweep)} ETH to cold storage`);
  }
}
```

---

**Last Updated:** 2025-01-30  
**Network:** Ethereum Sepolia Testnet  
**Status:** Ready for deployment with multi-wallet fee collection  
**Version:** 2.0
