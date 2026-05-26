// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TPLToken is ERC20, Ownable {

    constructor()
        ERC20("TPL Token", "TPL")
        Ownable(msg.sender)
    {}

    // =========================
    // MINT (solo backend / owner)
    // Supply ilimitado
    // =========================
    function mint(address to, uint256 amount) external onlyOwner {
        uint256 amountWithDecimals = amount * 10**decimals();
        _mint(to, amountWithDecimals);
    }

    // =========================
    // BURN voluntario
    // =========================
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    // =========================
    // TITULOS DINAMICOS
    // =========================
    function getTitle(address user) public view returns (string memory) {
        uint256 balance = balanceOf(user) / 10**decimals();

        if (balance >= 300) {
            return "Golden Eco Legend";
        } else if (balance >= 100) {
            return "Ocean Protector";
        } else if (balance >= 50) {
            return "Beach Guardian";
        } else if (balance >= 5) {
            return "Collector Starter";
        } else {
            return "Cleanup Rookie";
        }
    }
}
