// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title DeSynthSlotTokens
 * @dev NFT contract for biomanufacturing production slots with fractionalization
 */
contract DeSynthSlotTokens is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIdCounter;
    
    struct SlotMetadata {
        string bookingId;
        string facilityName;
        string productionType;
        uint256 capacity;
        uint256 startDate;
        uint256 endDate;
        string complianceLevel;
        bool fractionalized;
        address fractionalToken;
    }
    
    mapping(uint256 => SlotMetadata) public slotMetadata;
    mapping(string => uint256) public bookingToToken;
    mapping(uint256 => bool) public tradeable;
    
    event SlotTokenMinted(uint256 indexed tokenId, string bookingId, address to);
    event SlotTokenFractionalized(uint256 indexed tokenId, address fractionalToken, uint256 totalSupply);
    event SlotTokenTradeEnabled(uint256 indexed tokenId);
    
    constructor() ERC721("DeSynth Slot Tokens", "DSST") {}
    
    /**
     * @dev Mint a new slot token
     */
    function mintSlotToken(
        address to,
        string memory bookingId,
        string memory facilityName,
        string memory productionType,
        uint256 capacity,
        uint256 startDate,
        uint256 endDate,
        string memory complianceLevel,
        string memory tokenURI
    ) external onlyOwner returns (uint256) {
        require(bookingToToken[bookingId] == 0, "Token already exists for booking");
        
        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        
        slotMetadata[tokenId] = SlotMetadata({
            bookingId: bookingId,
            facilityName: facilityName,
            productionType: productionType,
            capacity: capacity,
            startDate: startDate,
            endDate: endDate,
            complianceLevel: complianceLevel,
            fractionalized: false,
            fractionalToken: address(0)
        });
        
        bookingToToken[bookingId] = tokenId;
        
        emit SlotTokenMinted(tokenId, bookingId, to);
        return tokenId;
    }
    
    /**
     * @dev Fractionalize a slot token into ERC20 tokens
     */
    function fractionalize(uint256 tokenId, uint256 totalSupply) external returns (address) {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Not token owner or approved");
        require(!slotMetadata[tokenId].fractionalized, "Already fractionalized");
        require(totalSupply > 0, "Invalid total supply");
        
        SlotMetadata storage metadata = slotMetadata[tokenId];
        
        // Deploy fractional ERC20 token
        string memory tokenName = string(abi.encodePacked("Fractional ", metadata.facilityName, " Slot"));
        string memory tokenSymbol = string(abi.encodePacked("F", metadata.productionType));
        
        FractionalSlotToken fractionalToken = new FractionalSlotToken(
            tokenName,
            tokenSymbol,
            totalSupply,
            msg.sender,
            tokenId
        );
        
        metadata.fractionalized = true;
        metadata.fractionalToken = address(fractionalToken);
        
        // Transfer NFT to this contract (locked)
        _transfer(msg.sender, address(this), tokenId);
        
        emit SlotTokenFractionalized(tokenId, address(fractionalToken), totalSupply);
        return address(fractionalToken);
    }
    
    /**
     * @dev Enable trading for a slot token
     */
    function enableTrading(uint256 tokenId) external onlyOwner {
        require(_exists(tokenId), "Token does not exist");
        tradeable[tokenId] = true;
        emit SlotTokenTradeEnabled(tokenId);
    }
    
    /**
     * @dev Override transfer to check if trading is enabled
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override {
        if (from != address(0) && to != address(0)) { // Not mint/burn
            require(tradeable[tokenId] || from == owner() || to == owner(), "Trading not enabled");
        }
        super._beforeTokenTransfer(from, to, tokenId);
    }
    
    /**
     * @dev Get slot metadata
     */
    function getSlotMetadata(uint256 tokenId) external view returns (SlotMetadata memory) {
        require(_exists(tokenId), "Token does not exist");
        return slotMetadata[tokenId];
    }
    
    /**
     * @dev Get token ID by booking ID
     */
    function getTokenByBooking(string memory bookingId) external view returns (uint256) {
        return bookingToToken[bookingId];
    }
    
    // Override required functions
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }
    
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
}

/**
 * @title FractionalSlotToken
 * @dev ERC20 token representing fractions of a slot NFT
 */
contract FractionalSlotToken is ERC20 {
    uint256 public immutable parentTokenId;
    address public immutable parentContract;
    
    constructor(
        string memory name,
        string memory symbol,
        uint256 totalSupply,
        address recipient,
        uint256 _parentTokenId
    ) ERC20(name, symbol) {
        parentTokenId = _parentTokenId;
        parentContract = msg.sender;
        _mint(recipient, totalSupply);
    }
    
    /**
     * @dev Get parent slot metadata
     */
    function getParentMetadata() external view returns (DeSynthSlotTokens.SlotMetadata memory) {
        return DeSynthSlotTokens(parentContract).getSlotMetadata(parentTokenId);
    }
}