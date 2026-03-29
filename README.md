# nsm1-explorer

NSM1 attestation explorer for Zcash mainnet.

## What it does

Single-page React app that queries the NSM1 backend and displays:

- **Dashboard** - total leaves, anchor count, event type distribution (pie chart), anchor history timeline, anchor transaction table with links to zcashblockexplorer.com
- **Leaves** - browse lifecycle events by wallet hash, view event types, leaf hashes, anchor status
- **Leaf detail** - full Merkle proof path visualization (SVG), root hash, on-chain anchor txid
- **Search** - look up any wallet hash or leaf hash

All data comes from the live API at `https://pay.frontiercompute.io`.

## Run locally

```
npm install
npm run dev
```

Vite dev server starts on `http://localhost:5173`. The app hits the production API directly - no local backend needed.

## Links

- [NSM1 protocol spec](https://github.com/Frontier-Compute/nsm1/blob/main/ONCHAIN_PROTOCOL.md)
- [nsm1-verify crate](https://github.com/Frontier-Compute/nsm1-verify)

## License

MIT
