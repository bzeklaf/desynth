# Complete Testnet Deployment Guide

This guide will walk you through deploying DeSynth smart contracts to Sepolia testnet and integrating them with your application.

---

## 📋 Prerequisites Checklist

Before starting, ensure you have:

- [ ] Node.js v18+ installed (`node --version`)
- [ ] A MetaMask wallet with a test account
- [ ] At least 0.5 SepoliaETH in your wallet (for deployment gas)
- [ ] An Alchemy account and API key
- [ ] Basic understanding of command line operations

---

## Phase 1: Environment Setup

### Step 1.1: Get Sepolia ETH

You need testnet ETH for gas fees. Get free SepoliaETH from these faucets:

1. **Alchemy Sepolia Faucet** (Recommended - 0.5 ETH/day)
   - Visit: https://sepoliafaucet.com/
   - Login with Alchemy account
   - Enter your wallet address
   - Click "Send Me ETH"

2. **Alternative Faucets:**
   - Infura: https://www.infura.io/faucet/sepolia
   - QuickNode: https://faucet.quicknode.com/ethereum/sepolia

**Wait 1-2 minutes** and verify you received funds:
- Check MetaMask balance
- Or visit: `https://sepolia.etherscan.io/address/YOUR_ADDRESS`

### Step 1.2: Get Alchemy API Key

1. Go to https://dashboard.alchemy.com/
2. Sign up or log in
3. Click "Create new app"
   - Name: "DeSynth Sepolia"
   - Chain: Ethereum
   - Network: Sepolia
4. Click "View key" and copy your API key
5. Save it - you'll need it in Step 2.2

### Step 1.3: Export Private Key from MetaMask

⚠️ **Security Warning**: NEVER share your private key or commit it to Git!

1. Open MetaMask
2. Click three dots → Account details
3. Click "Show private key"
4. Enter your password
5. Copy the private key (starts with `0x`)
6. Store it securely - you'll need it in Step 2.2

---

## Phase 2: Project Setup

### Step 2.1: Install Hardhat and Dependencies

In your project root directory, run:

```bash
# Install Hardhat and required plugins
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @nomicfoundation/hardhat-ethers ethers

# Install OpenZeppelin contracts (required for smart contracts)
npm install @openzeppelin/contracts

# Verify installation
npx hardhat --version
```

Expected output: `2.19.0` or higher

### Step 2.2: Create Hardhat Configuration

Create `hardhat.config.js` in your project root:

```javascript
require("@nomicfoundation/hardhat-toolbox");

// Load from environment or use empty strings
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

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
      url: SEPOLIA_RPC_URL,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 11155111,
      gasPrice: "auto"
    }
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY
  }
};
```

### Step 2.3: Create Environment Variables

Create `.env` file in project root:

```bash
# Alchemy RPC URL (replace YOUR_ALCHEMY_KEY)
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY

# Your wallet private key (replace YOUR_PRIVATE_KEY)
PRIVATE_KEY=0xYOUR_PRIVATE_KEY

# Optional: For contract verification
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_KEY
```

**Replace placeholders with your actual values from Phase 1!**

### Step 2.4: Update .gitignore

Ensure `.gitignore` includes:

```
.env
hardhat.config.js
node_modules/
cache/
artifacts/
```

---

## Phase 3: Smart Contract Deployment

### Step 3.1: Create Deployment Script

Create `scripts/deploy.js`:

```javascript
const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting DeSynth Testnet Deployment...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📍 Deploying with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  if (balance < hre.ethers.parseEther("0.1")) {
    console.error("❌ Insufficient balance! Need at least 0.1 ETH for deployment.");
    console.log("   Get more from: https://sepoliafaucet.com/");
    process.exit(1);
  }

  // Step 1: Deploy DeSynthEscrow
  console.log("📜 Deploying DeSynthEscrow...");
  const insurancePoolAddress = deployer.address; // Temporary - use deployer as insurance pool
  
  const DeSynthEscrow = await hre.ethers.getContractFactory("DeSynthEscrow");
  const escrow = await DeSynthEscrow.deploy(insurancePoolAddress);
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  
  console.log("✅ DeSynthEscrow deployed to:", escrowAddress);
  console.log("   Transaction:", escrow.deploymentTransaction().hash, "\n");

  // Step 2: Deploy DeSynthSlotTokens
  console.log("📜 Deploying DeSynthSlotTokens...");
  
  const DeSynthSlotTokens = await hre.ethers.getContractFactory("DeSynthSlotTokens");
  const slotTokens = await DeSynthSlotTokens.deploy();
  await slotTokens.waitForDeployment();
  const slotTokensAddress = await slotTokens.getAddress();
  
  console.log("✅ DeSynthSlotTokens deployed to:", slotTokensAddress);
  console.log("   Transaction:", slotTokens.deploymentTransaction().hash, "\n");

  // Step 3: Wait for confirmations
  console.log("⏳ Waiting for 3 block confirmations...");
  await escrow.deploymentTransaction().wait(3);
  await slotTokens.deploymentTransaction().wait(3);
  console.log("✅ Contracts confirmed!\n");

  // Step 4: Save deployment info
  const deploymentInfo = {
    network: "sepolia",
    chainId: 11155111,
    deployer: deployer.address,
    contracts: {
      escrow: escrowAddress,
      slotTokens: slotTokensAddress,
      insurancePool: insurancePoolAddress
    },
    timestamp: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber()
  };

  console.log("📋 DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log(JSON.stringify(deploymentInfo, null, 2));
  console.log("=".repeat(60));
  
  console.log("\n📝 NEXT STEPS:");
  console.log("1. Copy the contract addresses above");
  console.log("2. Update src/lib/blockchain/config.ts with these addresses");
  console.log("3. Update supabase/functions/_shared/blockchain.ts");
  console.log("4. Add yourself as an authorized auditor (see Step 4)");
  console.log("\n🔗 View on Etherscan:");
  console.log(`   Escrow: https://sepolia.etherscan.io/address/${escrowAddress}`);
  console.log(`   SlotTokens: https://sepolia.etherscan.io/address/${slotTokensAddress}`);
  
  console.log("\n✨ Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  });
```

### Step 3.2: Compile Contracts

```bash
npx hardhat compile
```

Expected output:
```
Compiled 10 Solidity files successfully
```

If you see errors, check that:
- OpenZeppelin contracts are installed
- Your Solidity files are in `contracts/` directory
- Solidity version matches in `hardhat.config.js`

### Step 3.3: Deploy to Sepolia

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

**Expected output:**
```
🚀 Starting DeSynth Testnet Deployment...

📍 Deploying with account: 0xYourAddress
💰 Account balance: 0.5 ETH

📜 Deploying DeSynthEscrow...
✅ DeSynthEscrow deployed to: 0xABC123...
   Transaction: 0xdef456...

📜 Deploying DeSynthSlotTokens...
✅ DeSynthSlotTokens deployed to: 0xGHI789...
   Transaction: 0xjkl012...

✨ Deployment complete!
```

**Save these addresses!** You'll need them in Phase 4.

If deployment fails:
- Check your `.env` file has correct values
- Verify you have enough SepoliaETH
- Ensure your RPC URL is correct
- Try again after a few minutes

---

## Phase 4: Configure Your Application

### Step 4.1: Update Frontend Config

Edit `src/lib/blockchain/config.ts`:

```typescript
// Replace these with YOUR deployed contract addresses from Step 3.3
export const CONTRACT_ADDRESSES = {
  ESCROW: '0xYOUR_ESCROW_ADDRESS_HERE',
  SLOT_TOKENS: '0xYOUR_SLOT_TOKENS_ADDRESS_HERE',
  INSURANCE_POOL: '0xYOUR_DEPLOYER_ADDRESS_HERE',
  ETH: '0x0000000000000000000000000000000000000000',
};
```

### Step 4.2: Update Backend Config

Edit `supabase/functions/_shared/blockchain.ts`:

```typescript
export const CONTRACT_ADDRESSES = {
  sepolia: {
    escrow: '0xYOUR_ESCROW_ADDRESS_HERE',
    slotTokens: '0xYOUR_SLOT_TOKENS_ADDRESS_HERE',
    insurancePool: '0xYOUR_DEPLOYER_ADDRESS_HERE'
  }
};
```

### Step 4.3: Add Alchemy API Key to Supabase

Your edge functions need the Alchemy API key:

1. Open your Supabase dashboard
2. Go to Project Settings → Edge Functions
3. Add secret:
   - Name: `ALCHEMY_API_KEY`
   - Value: Your Alchemy API key from Step 1.2

Or use Lovable's secret management (recommended).

### Step 4.4: Add Authorized Auditors

Your escrow contract needs authorized auditors to release funds. Add your address:

Create `scripts/add-auditor.js`:

```javascript
const hre = require("hardhat");

async function main() {
  const ESCROW_ADDRESS = "0xYOUR_ESCROW_ADDRESS"; // From deployment
  const AUDITOR_ADDRESS = "0xYOUR_WALLET_ADDRESS"; // Your address or auditor's
  
  console.log("Adding auditor:", AUDITOR_ADDRESS);
  
  const escrow = await hre.ethers.getContractAt("DeSynthEscrow", ESCROW_ADDRESS);
  const tx = await escrow.addAuditor(AUDITOR_ADDRESS);
  
  console.log("Transaction:", tx.hash);
  await tx.wait();
  console.log("✅ Auditor added successfully!");
}

main().catch(console.error);
```

Run it:

```bash
npx hardhat run scripts/add-auditor.js --network sepolia
```

---

## Phase 5: Testing Your Deployment

### Step 5.1: Verify Contracts on Etherscan (Optional but Recommended)

Get Etherscan API key:
1. Go to https://etherscan.io/
2. Sign up/login
3. API Keys → Create API Key
4. Copy the key

Verify contracts:

```bash
npx hardhat verify --network sepolia 0xYOUR_ESCROW_ADDRESS "0xYOUR_INSURANCE_POOL_ADDRESS"

npx hardhat verify --network sepolia 0xYOUR_SLOT_TOKENS_ADDRESS
```

This makes your contracts readable on Etherscan!

### Step 5.2: Test Contract Interaction

Create `scripts/test-deployment.js`:

```javascript
const hre = require("hardhat");

async function main() {
  const ESCROW_ADDRESS = "0xYOUR_ESCROW_ADDRESS";
  
  const escrow = await hre.ethers.getContractAt("DeSynthEscrow", ESCROW_ADDRESS);
  const [signer] = await hre.ethers.getSigners();
  
  console.log("Testing escrow contract...");
  
  // Test 1: Create escrow
  console.log("\n1. Creating test escrow...");
  const bookingId = "test-booking-" + Date.now();
  const buyerAddress = signer.address;
  const facilityAddress = "0x742d35Cc6634C0532925a3b8D30a5f7B5d6e8C29";
  const amount = hre.ethers.parseEther("0.01");
  const tokenAddress = hre.ethers.ZeroAddress; // ETH
  
  const tx = await escrow.createEscrow(
    bookingId,
    buyerAddress,
    facilityAddress,
    amount,
    tokenAddress
  );
  await tx.wait();
  console.log("✅ Escrow created!");
  
  // Test 2: Get escrow status
  console.log("\n2. Getting escrow status...");
  const escrowData = await escrow.getEscrow(bookingId);
  console.log("Status:", escrowData.status);
  console.log("Amount:", hre.ethers.formatEther(escrowData.amount), "ETH");
  
  console.log("\n✅ All tests passed!");
}

main().catch(console.error);
```

Run it:

```bash
npx hardhat run scripts/test-deployment.js --network sepolia
```

### Step 5.3: Test in Your Application

1. **Start your app** (if not running)
2. **Connect wallet:**
   - Open your app in browser
   - Connect MetaMask
   - Ensure you're on Sepolia network
3. **Test crypto payment flow:**
   - Browse available slots
   - Book a slot
   - Select "Pay with Crypto"
   - Confirm transaction in MetaMask
4. **Verify on Etherscan:**
   - Check transaction: `https://sepolia.etherscan.io/tx/0xYOUR_TX_HASH`
   - Verify escrow creation

---

## Phase 6: Monitoring & Maintenance

### Monitor Contract Activity

**Via Etherscan:**
- Escrow: `https://sepolia.etherscan.io/address/0xYOUR_ESCROW_ADDRESS`
- View all transactions, events, and state

**Via Edge Function Logs:**
```bash
# In Supabase dashboard
Project → Edge Functions → blockchain-service → Logs
```

### Monitor Database

Check `crypto_escrows` and `blockchain_transactions` tables in Supabase.

### Common Issues & Solutions

**Issue: "Insufficient funds for gas"**
- Solution: Get more SepoliaETH from faucets

**Issue: "Nonce too low"**
- Solution: Reset MetaMask account (Settings → Advanced → Reset Account)

**Issue: "Transaction reverted"**
- Solution: Check contract state, ensure auditor is authorized

**Issue: "Cannot estimate gas"**
- Solution: Function parameters might be incorrect, verify addresses

---

## 🎉 Success Checklist

- [ ] Contracts deployed to Sepolia
- [ ] Addresses updated in config files
- [ ] Alchemy API key added to Supabase
- [ ] Auditor addresses authorized
- [ ] Contracts verified on Etherscan (optional)
- [ ] Test transaction completed successfully
- [ ] Frontend connects to wallet
- [ ] Crypto payment flow works end-to-end

---

## 📚 Reference Links

- **Sepolia Explorer:** https://sepolia.etherscan.io/
- **Alchemy Dashboard:** https://dashboard.alchemy.com/
- **Sepolia Faucet:** https://sepoliafaucet.com/
- **Hardhat Docs:** https://hardhat.org/docs
- **OpenZeppelin:** https://docs.openzeppelin.com/contracts/

---

## 🔐 Security Best Practices

1. **Never commit private keys or `.env` files**
2. **Use hardware wallets for mainnet**
3. **Audit contracts before mainnet deployment**
4. **Set up monitoring and alerts**
5. **Test thoroughly on testnet first**
6. **Use multi-sig wallets for contract ownership**
7. **Implement emergency pause functionality**
8. **Keep dependencies updated**

---

## 🚀 Ready for Mainnet?

Before deploying to mainnet:

1. **Professional audit** of smart contracts
2. **Comprehensive testing** on testnet
3. **Security review** of all components
4. **Bug bounty program** setup
5. **Insurance coverage** consideration
6. **Legal compliance** review
7. **Incident response** plan
8. **Monitoring infrastructure** in place

---

## Need Help?

- Review logs in Supabase Edge Functions
- Check Etherscan for transaction details
- Test each component individually
- Verify all configuration values are correct

Good luck with your deployment! 🚀
