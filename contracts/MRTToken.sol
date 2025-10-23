// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title MRTToken
 * @dev Music Royalty Token (MRT) - 音乐版权收益代币
 * 
 * 功能特性:
 * - ERC-20标准代币
 * - 可暂停交易
 * - 可销毁代币
 * - 访问控制
 * - 重入攻击保护
 * - 版权元数据存储
 */
contract MRTToken is ERC20, ERC20Burnable, Ownable, Pausable, ReentrancyGuard {
    
    // 版权信息结构体
    struct RoyaltyInfo {
        string musicTitle;          // 音乐作品标题
        string artist;              // 艺术家名称
        string ipfsHash;            // IPFS存储哈希
        uint256 totalSupply;        // 该作品的总代币供应量
        uint256 royaltyPercentage;  // 版权收益百分比 (基点，10000 = 100%)
        bool isActive;              // 是否激活
        uint256 createdAt;          // 创建时间
    }
    
    // 代币ID到版权信息的映射
    mapping(uint256 => RoyaltyInfo) public royaltyInfos;
    
    // 艺术家地址到代币ID列表的映射
    mapping(address => uint256[]) public artistTokens;
    
    // 代币ID计数器
    uint256 private _tokenIdCounter;
    
    // 最小铸造数量
    uint256 public constant MIN_MINT_AMOUNT = 1000 * 10**18; // 1000 MRT
    
    // 最大铸造数量
    uint256 public constant MAX_MINT_AMOUNT = 1000000 * 10**18; // 1M MRT
    
    // 事件定义
    event RoyaltyTokenMinted(
        uint256 indexed tokenId,
        address indexed artist,
        string musicTitle,
        uint256 amount,
        string ipfsHash
    );
    
    event RoyaltyInfoUpdated(
        uint256 indexed tokenId,
        string musicTitle,
        uint256 royaltyPercentage
    );
    
    event TokenActivated(uint256 indexed tokenId);
    event TokenDeactivated(uint256 indexed tokenId);
    
    constructor() ERC20("Music Royalty Token", "MRT") {
        _tokenIdCounter = 1;
    }
    
    /**
     * @dev 为艺术家铸造MRT代币
     * @param artist 艺术家地址
     * @param amount 铸造数量
     * @param musicTitle 音乐作品标题
     * @param ipfsHash IPFS存储哈希
     * @param royaltyPercentage 版权收益百分比
     */
    function mintMRT(
        address artist,
        uint256 amount,
        string memory musicTitle,
        string memory ipfsHash,
        uint256 royaltyPercentage
    ) external onlyOwner nonReentrant returns (uint256) {
        require(artist != address(0), "MRT: artist cannot be zero address");
        require(amount >= MIN_MINT_AMOUNT && amount <= MAX_MINT_AMOUNT, "MRT: invalid mint amount");
        require(bytes(musicTitle).length > 0, "MRT: music title cannot be empty");
        require(bytes(ipfsHash).length > 0, "MRT: IPFS hash cannot be empty");
        require(royaltyPercentage > 0 && royaltyPercentage <= 10000, "MRT: invalid royalty percentage");
        
        uint256 tokenId = _tokenIdCounter++;
        
        // 存储版权信息
        royaltyInfos[tokenId] = RoyaltyInfo({
            musicTitle: musicTitle,
            artist: Strings.toHexString(uint160(artist), 20),
            ipfsHash: ipfsHash,
            totalSupply: amount,
            royaltyPercentage: royaltyPercentage,
            isActive: true,
            createdAt: block.timestamp
        });
        
        // 添加到艺术家代币列表
        artistTokens[artist].push(tokenId);
        
        // 铸造代币
        _mint(artist, amount);
        
        emit RoyaltyTokenMinted(tokenId, artist, musicTitle, amount, ipfsHash);
        
        return tokenId;
    }
    
    /**
     * @dev 批量铸造MRT代币
     */
    function batchMintMRT(
        address[] memory artists,
        uint256[] memory amounts,
        string[] memory musicTitles,
        string[] memory ipfsHashes,
        uint256[] memory royaltyPercentages
    ) external onlyOwner nonReentrant returns (uint256[] memory) {
        require(artists.length == amounts.length, "MRT: arrays length mismatch");
        require(artists.length == musicTitles.length, "MRT: arrays length mismatch");
        require(artists.length == ipfsHashes.length, "MRT: arrays length mismatch");
        require(artists.length == royaltyPercentages.length, "MRT: arrays length mismatch");
        require(artists.length <= 50, "MRT: too many tokens to mint");
        
        uint256[] memory tokenIds = new uint256[](artists.length);
        
        for (uint256 i = 0; i < artists.length; i++) {
            tokenIds[i] = mintMRT(
                artists[i],
                amounts[i],
                musicTitles[i],
                ipfsHashes[i],
                royaltyPercentages[i]
            );
        }
        
        return tokenIds;
    }
    
    /**
     * @dev 更新版权信息
     */
    function updateRoyaltyInfo(
        uint256 tokenId,
        string memory musicTitle,
        uint256 royaltyPercentage
    ) external onlyOwner {
        require(royaltyInfos[tokenId].createdAt > 0, "MRT: token does not exist");
        require(bytes(musicTitle).length > 0, "MRT: music title cannot be empty");
        require(royaltyPercentage > 0 && royaltyPercentage <= 10000, "MRT: invalid royalty percentage");
        
        royaltyInfos[tokenId].musicTitle = musicTitle;
        royaltyInfos[tokenId].royaltyPercentage = royaltyPercentage;
        
        emit RoyaltyInfoUpdated(tokenId, musicTitle, royaltyPercentage);
    }
    
    /**
     * @dev 激活/停用代币
     */
    function setTokenActive(uint256 tokenId, bool active) external onlyOwner {
        require(royaltyInfos[tokenId].createdAt > 0, "MRT: token does not exist");
        
        royaltyInfos[tokenId].isActive = active;
        
        if (active) {
            emit TokenActivated(tokenId);
        } else {
            emit TokenDeactivated(tokenId);
        }
    }
    
    /**
     * @dev 获取艺术家的所有代币ID
     */
    function getArtistTokens(address artist) external view returns (uint256[] memory) {
        return artistTokens[artist];
    }
    
    /**
     * @dev 获取版权信息
     */
    function getRoyaltyInfo(uint256 tokenId) external view returns (RoyaltyInfo memory) {
        require(royaltyInfos[tokenId].createdAt > 0, "MRT: token does not exist");
        return royaltyInfos[tokenId];
    }
    
    /**
     * @dev 获取当前代币ID计数器
     */
    function getCurrentTokenId() external view returns (uint256) {
        return _tokenIdCounter;
    }
    
    /**
     * @dev 暂停合约
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev 恢复合约
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev 重写transfer函数，添加暂停检查
     */
    function transfer(address to, uint256 amount) public override whenNotPaused returns (bool) {
        return super.transfer(to, amount);
    }
    
    /**
     * @dev 重写transferFrom函数，添加暂停检查
     */
    function transferFrom(address from, address to, uint256 amount) public override whenNotPaused returns (bool) {
        return super.transferFrom(from, to, amount);
    }
    
    /**
     * @dev 紧急提取函数
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        if (balance > 0) {
            payable(owner()).transfer(balance);
        }
    }
}