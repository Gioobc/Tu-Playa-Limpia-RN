// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MissionNFT is ERC721URIStorage, Ownable {
    uint256 public tokenCounter;
    mapping(uint256 => mapping(address => bool)) public missionCompleted;

    constructor() ERC721("Clean Missions", "CMISS") Ownable(msg.sender) {
        tokenCounter = 0;
    }

    /// @notice Permite al usuario completar una misión y mintear su propio NFT
    function completeMission(
        uint256 missionId,
        string memory tokenURI
    ) external {
        require(!missionCompleted[missionId][msg.sender], "Mission already completed");

        uint256 tokenId = tokenCounter;
        tokenCounter++;

        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);

        missionCompleted[missionId][msg.sender] = true;
    }

    /// @notice Minteo por admin/backend a favor de un usuario
    function adminMint(
        address recipient,
        uint256 missionId,
        string memory tokenURI
    ) external onlyOwner {
        require(!missionCompleted[missionId][recipient], "Mission already completed");

        uint256 tokenId = tokenCounter;
        tokenCounter++;

        _safeMint(recipient, tokenId);
        _setTokenURI(tokenId, tokenURI);

        missionCompleted[missionId][recipient] = true;
    }
}
