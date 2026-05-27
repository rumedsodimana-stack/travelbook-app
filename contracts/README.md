# Tron Token Contracts

This folder contains two safe, legitimate Tron-compatible token examples:

- `StandardTRC20.sol`: a general-purpose TRC-20 style token for your own project.
- `MockUSDT.sol`: a clearly labeled mock stablecoin for development and testnet use only.

## Important

These contracts are for legitimate token development only.

- Do not market `MockUSDT` as real USDT.
- Do not use it to impersonate Tether or mislead wallets, exchanges, or users.
- For testing, prefer Tron testnets and private dev environments.

## Contracts

### `StandardTRC20.sol`

Constructor:

```solidity
constructor(
    string memory tokenName,
    string memory tokenSymbol,
    uint8 tokenDecimals,
    uint256 initialSupply,
    address initialOwner
)
```

Example values:

- `tokenName`: `"TravelBook Token"`
- `tokenSymbol`: `"TBK"`
- `tokenDecimals`: `18`
- `initialSupply`: `1_000_000 ether`
- `initialOwner`: your Tron-compatible owner address

Features:

- transfer / approve / transferFrom
- owner-controlled minting
- holder burning
- ownership transfer

### `MockUSDT.sol`

Constructor:

```solidity
constructor(address initialOwner, uint256 initialSupply)
```

Defaults:

- name: `Mock USDT`
- symbol: `mUSDT`
- decimals: `6`

Example initial supply:

```solidity
1_000_000 * 10 ** 6
```

## Deployment notes

TRC-20 contracts are typically Solidity contracts deployed on Tron using tools such as:

- TronBox
- Tron IDE
- TronWeb-based deployment scripts

This repository does not currently include a Tron deployment toolchain, so these files are provided as standalone contract sources.
