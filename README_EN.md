# Quick Trader

## Introduction
Quick Trader is a Chrome extension for Solana contract address recognition and fast DEX navigation on Twitter. It automatically detects Solana contract addresses in tweets and displays a floating window next to the address, allowing users to quickly jump to major DEX platforms for trading.

## Main Features
- Automatically detects Solana contract addresses (32-44 character Base58 strings) on Twitter pages
- Shows a floating DEX navigation window when hovering over the address
- One-click jump to major DEX platforms: GMGN, AVE, OKX, Axiom, etc.
- Automatically copies the contract address to clipboard for Axiom platform
- Supports closing the floating window, which can be restored after refreshing the page
- Does not interfere with input boxes or editors
- Clean and beautiful UI, supports dark mode

## Installation
1. Open Chrome and go to the Chrome Web Store.
2. Search for "Quick Trader".
3. Click "Add to Chrome" and follow the instructions to complete the installation.

## Permissions
- `storage`: Save user platform preferences
- `tabs`: Open DEX platforms in new tabs
- `scripting`: Inject content scripts
- Only works on twitter.com and x.com

## Contact
For questions or suggestions, please contact the developer:
- Twitter: https://x.com/0x15lfg

## Privacy Statement
This extension does not collect, store, or upload any user private data.

## Default Platform
- Default platform: GMGN

## Post-Installation Note
After installation, the extension will select GMGN as the default DEX platform unless changed by the user. 