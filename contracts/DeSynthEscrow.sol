// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title DeSynthEscrow
 * @dev Escrow contract for DeSynth biomanufacturing slot bookings with platform fee collection
 */
contract DeSynthEscrow is Ownable, ReentrancyGuard {
    enum EscrowStatus { Created, Funded, Released, Disputed, Resolved }
    
    struct Escrow {
        string bookingId;
        address buyer;
        address facility;
        address token;
        uint256 totalAmount;      // Total amount including fees
        uint256 facilityAmount;   // Amount that goes to facility
        uint256 platformFees;     // Platform fees
        EscrowStatus status;
        uint256 createdAt;
        uint256 releasedAt;
        bool disputed;
    }
    
    mapping(string => Escrow) public escrows;
    mapping(address => bool) public authorizedAuditors;
    
    address public insurancePool;
    address public platformWallet;
    uint256 public insuranceFeePercent = 200; // 2%
    uint256 public constant PERCENT_BASE = 10000;
    
    event EscrowCreated(string indexed bookingId, address buyer, address facility, uint256 totalAmount, uint256 facilityAmount, uint256 platformFees);
    event EscrowFunded(string indexed bookingId, uint256 totalAmount);
    event EscrowReleased(string indexed bookingId, uint256 facilityAmount, uint256 platformFees);
    event EscrowDisputed(string indexed bookingId, address disputer);
    event EscrowResolved(string indexed bookingId, address winner, uint256 amount);
    event PlatformWalletUpdated(address indexed newPlatformWallet);
    
    modifier onlyAuthorizedAuditor() {
        require(authorizedAuditors[msg.sender], "Not authorized auditor");
        _;
    }
    
    modifier escrowExists(string memory bookingId) {
        require(bytes(escrows[bookingId].bookingId).length > 0, "Escrow does not exist");
        _;
    }
    
    constructor(address _insurancePool, address _platformWallet) {
        require(_insurancePool != address(0), "Invalid insurance pool address");
        require(_platformWallet != address(0), "Invalid platform wallet address");
        insurancePool = _insurancePool;
        platformWallet = _platformWallet;
    }
    
    /**
     * @dev Create a new escrow for a booking with fee breakdown
     */
    function createEscrow(
        string memory bookingId,
        address buyer,
        address facility,
        address token,
        uint256 totalAmount,
        uint256 facilityAmount,
        uint256 platformFees
    ) external {
        require(bytes(escrows[bookingId].bookingId).length == 0, "Escrow already exists");
        require(buyer != address(0) && facility != address(0), "Invalid addresses");
        require(totalAmount > 0, "Amount must be greater than 0");
        require(facilityAmount + platformFees == totalAmount, "Amounts must match total");
        
        escrows[bookingId] = Escrow({
            bookingId: bookingId,
            buyer: buyer,
            facility: facility,
            token: token,
            totalAmount: totalAmount,
            facilityAmount: facilityAmount,
            platformFees: platformFees,
            status: EscrowStatus.Created,
            createdAt: block.timestamp,
            releasedAt: 0,
            disputed: false
        });
        
        emit EscrowCreated(bookingId, buyer, facility, totalAmount, facilityAmount, platformFees);
    }
    
    /**
     * @dev Fund the escrow (buyer deposits tokens)
     */
    function fundEscrow(string memory bookingId) external escrowExists(bookingId) nonReentrant {
        Escrow storage escrow = escrows[bookingId];
        require(msg.sender == escrow.buyer, "Only buyer can fund");
        require(escrow.status == EscrowStatus.Created, "Escrow not in created state");
        
        // Calculate insurance fee on total amount
        uint256 insuranceFee = (escrow.totalAmount * insuranceFeePercent) / PERCENT_BASE;
        uint256 totalWithInsurance = escrow.totalAmount + insuranceFee;
        
        // Transfer tokens to this contract
        IERC20(escrow.token).transferFrom(msg.sender, address(this), totalWithInsurance);
        
        // Send insurance fee to pool
        if (insuranceFee > 0) {
            IERC20(escrow.token).transfer(insurancePool, insuranceFee);
        }
        
        escrow.status = EscrowStatus.Funded;
        emit EscrowFunded(bookingId, escrow.totalAmount);
    }
    
    /**
     * @dev Release escrow with platform fee split (called by authorized auditor)
     */
    function releaseEscrow(string memory bookingId) external onlyAuthorizedAuditor escrowExists(bookingId) nonReentrant {
        Escrow storage escrow = escrows[bookingId];
        require(escrow.status == EscrowStatus.Funded, "Escrow not funded");
        require(!escrow.disputed, "Escrow is disputed");
        
        // Transfer facility amount to facility
        if (escrow.facilityAmount > 0) {
            IERC20(escrow.token).transfer(escrow.facility, escrow.facilityAmount);
        }
        
        // Transfer platform fees to platform wallet
        if (escrow.platformFees > 0) {
            IERC20(escrow.token).transfer(platformWallet, escrow.platformFees);
        }
        
        escrow.status = EscrowStatus.Released;
        escrow.releasedAt = block.timestamp;
        
        emit EscrowReleased(bookingId, escrow.facilityAmount, escrow.platformFees);
    }
    
    /**
     * @dev Dispute an escrow
     */
    function disputeEscrow(string memory bookingId) external escrowExists(bookingId) {
        Escrow storage escrow = escrows[bookingId];
        require(msg.sender == escrow.buyer || msg.sender == escrow.facility, "Not authorized to dispute");
        require(escrow.status == EscrowStatus.Funded, "Escrow not funded");
        
        escrow.disputed = true;
        escrow.status = EscrowStatus.Disputed;
        
        emit EscrowDisputed(bookingId, msg.sender);
    }
    
    /**
     * @dev Resolve disputed escrow (admin only)
     */
    function resolveDispute(string memory bookingId, address winner) external onlyOwner escrowExists(bookingId) nonReentrant {
        Escrow storage escrow = escrows[bookingId];
        require(escrow.status == EscrowStatus.Disputed, "Escrow not disputed");
        require(winner == escrow.buyer || winner == escrow.facility, "Invalid winner");
        
        // Transfer total amount to winner (disputes don't split fees)
        IERC20(escrow.token).transfer(winner, escrow.totalAmount);
        
        escrow.status = EscrowStatus.Resolved;
        escrow.releasedAt = block.timestamp;
        
        emit EscrowResolved(bookingId, winner, escrow.totalAmount);
    }
    
    /**
     * @dev Add authorized auditor
     */
    function addAuditor(address auditor) external onlyOwner {
        authorizedAuditors[auditor] = true;
    }
    
    /**
     * @dev Remove authorized auditor
     */
    function removeAuditor(address auditor) external onlyOwner {
        authorizedAuditors[auditor] = false;
    }
    
    /**
     * @dev Update insurance pool address
     */
    function updateInsurancePool(address _insurancePool) external onlyOwner {
        require(_insurancePool != address(0), "Invalid address");
        insurancePool = _insurancePool;
    }
    
    /**
     * @dev Update platform wallet address
     */
    function updatePlatformWallet(address _platformWallet) external onlyOwner {
        require(_platformWallet != address(0), "Invalid address");
        platformWallet = _platformWallet;
        emit PlatformWalletUpdated(_platformWallet);
    }
    
    /**
     * @dev Update insurance fee percentage
     */
    function updateInsuranceFee(uint256 _insuranceFeePercent) external onlyOwner {
        require(_insuranceFeePercent <= 1000, "Fee too high"); // Max 10%
        insuranceFeePercent = _insuranceFeePercent;
    }
    
    /**
     * @dev Get escrow details
     */
    function getEscrow(string memory bookingId) external view returns (Escrow memory) {
        return escrows[bookingId];
    }
}