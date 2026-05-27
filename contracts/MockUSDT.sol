// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./StandardTRC20.sol";

/// @title MockUSDT
/// @notice Development-only mock stablecoin for Tron test environments.
/// @dev Uses 6 decimals like USDT, but is intentionally branded as mock-only.
contract MockUSDT is StandardTRC20 {
    constructor(address initialOwner, uint256 initialSupply)
        StandardTRC20("Mock USDT", "mUSDT", 6, initialSupply, initialOwner)
    {}

    function faucet(address to, uint256 value) external onlyOwner returns (bool) {
        _mint(to, value);
        return true;
    }
}
