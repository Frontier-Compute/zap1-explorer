import { useState, useEffect, useCallback } from "react";

const API = "https://pay.frontiercompute.io";
const C = {
  bg: "#0a0a0a", card: "#0e1219", border: "#181e2a", borderL: "#222b3a",
  gold: "#c8a84e", goldDim: "#7a6830", teal: "#4a9e93",
  text: "#d0d3d9", dim: "#6b7385", muted: "#3e4556", white: "#eceef1",
  purple: "#8b5cf6", green: "#22c55e", red: "#ef4444",
};
const mono = "'JetBrains Mono', monospace";
const sans = "'Space Grotesk', sans-serif";

function truncHash(h, n = 12) {
  if (!h || h.length <= n * 2) return h || "";
  return h.slice(0, n) + "\u2026" + h.slice(-n);
}

// Router
function useHash() {
  const [hash, setHash] = useState(window.location.hash || "#/");
  useEffect(() => {
    const h = () => setHash(window.location.hash || "#/");
    window.addEventListener("hashchange", h);
    return () => window.removeEventListener("hashchange", h);
  }, []);
  return hash;
}

// Nav
function Nav() {
  const hash = useHash();
  const links = [
    ["#/", "Dashboard"],
    ["#/leaves", "Leaves"],
    ["#/search", "Search"],
  ];
  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: `${C.bg}f0`, backdropFilter: "blur(10px)",
      borderBottom: `1px solid ${C.border}`,
      padding: "0 32px", display: "flex", alignItems: "center", height: 56,
    }}>
      <a href="#/" style={{ fontFamily: sans, fontSize: 14, fontWeight: 700, color: C.gold, textDecoration: "none", letterSpacing: "0.06em", marginRight: 48 }}>
        NSM1 EXPLORER
      </a>
      {links.map(([href, label]) => (
        <a key={href} href={href} style={{
          fontFamily: mono, fontSize: 12, color: hash === href ? C.gold : C.dim,
          textDecoration: "none", marginRight: 28, letterSpacing: "0.04em",
          borderBottom: hash === href ? `2px solid ${C.gold}` : "2px solid transparent",
          paddingBottom: 2,
        }}>{label}</a>
      ))}
    </nav>
  );
}

// Stat Card
function Stat({ label, value, color }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: "20px 24px" }}>
      <div style={{ fontFamily: mono, fontSize: 28, fontWeight: 600, color: color || C.white }}>{value}</div>
      <div style={{ fontFamily: mono, fontSize: 10, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 4 }}>{label}</div>
    </div>
  );
}

// Event Type Pie (SVG)
const TYPE_COLORS = {
  PROGRAM_ENTRY: "#c8a84e", OWNERSHIP_ATTEST: "#8b5cf6", CONTRACT_ANCHOR: "#4a9e93",
  DEPLOYMENT: "#60a5fa", HOSTING_PAYMENT: "#f59e0b", SHIELD_RENEWAL: "#22c55e",
  TRANSFER: "#ec4899", EXIT: "#ef4444", MERKLE_ROOT: "#6b7385",
  STAKING_DEPOSIT: "#818cf8", STAKING_WITHDRAW: "#a78bfa", STAKING_REWARD: "#34d399",
};

function PieChart({ data }) {
  const total = Object.values(data).reduce((s, v) => s + v, 0);
  if (!total) return null;
  let angle = 0;
  const slices = [];
  for (const [type, count] of Object.entries(data)) {
    if (!count) continue;
    const pct = count / total;
    const start = angle;
    angle += pct * 360;
    const end = angle;
    const largeArc = pct > 0.5 ? 1 : 0;
    const r = 80;
    const sx = 100 + r * Math.cos((Math.PI / 180) * (start - 90));
    const sy = 100 + r * Math.sin((Math.PI / 180) * (start - 90));
    const ex = 100 + r * Math.cos((Math.PI / 180) * (end - 90));
    const ey = 100 + r * Math.sin((Math.PI / 180) * (end - 90));
    if (pct >= 0.999) {
      slices.push(<circle key={type} cx={100} cy={100} r={r} fill={TYPE_COLORS[type] || "#555"} />);
    } else {
      slices.push(
        <path key={type} d={`M100,100 L${sx},${sy} A${r},${r} 0 ${largeArc},1 ${ex},${ey} Z`}
          fill={TYPE_COLORS[type] || "#555"} />
      );
    }
  }
  return (
    <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
      <svg viewBox="0 0 200 200" width={160} height={160}>{slices}</svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {Object.entries(data).filter(([, v]) => v > 0).map(([type, count]) => (
          <div key={type} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, fontFamily: mono }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: TYPE_COLORS[type] || "#555", flexShrink: 0 }} />
            <span style={{ color: C.dim }}>{type}</span>
            <span style={{ color: C.white, marginLeft: "auto" }}>{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Anchor Timeline (SVG)
function AnchorTimeline({ anchors }) {
  if (!anchors || !anchors.length) return null;
  const w = 600, h = 120, pad = 40;
  const minT = new Date(anchors[0].created_at).getTime();
  const maxT = new Date(anchors[anchors.length - 1].created_at).getTime();
  const range = maxT - minT || 1;
  const maxLeaves = Math.max(...anchors.map((a) => a.leaf_count));
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ maxWidth: w }}>
      <line x1={pad} y1={h - 30} x2={w - 10} y2={h - 30} stroke={C.border} strokeWidth={1} />
      {anchors.map((a, i) => {
        const x = pad + ((new Date(a.created_at).getTime() - minT) / range) * (w - pad - 20);
        const barH = (a.leaf_count / maxLeaves) * (h - 50);
        return (
          <g key={i}>
            <rect x={x - 8} y={h - 30 - barH} width={16} height={barH} rx={2} fill={C.gold} opacity={0.7} />
            <text x={x} y={h - 33 - barH} textAnchor="middle" fill={C.white} fontSize={10} fontFamily={mono}>{a.leaf_count}</text>
            <text x={x} y={h - 16} textAnchor="middle" fill={C.muted} fontSize={8} fontFamily={mono}>
              {a.height ? a.height.toLocaleString() : "..."}
            </text>
          </g>
        );
      })}
      <text x={pad - 4} y={h - 6} fill={C.muted} fontSize={9} fontFamily={mono}>Block height</text>
    </svg>
  );
}

// Dashboard Page
function Dashboard() {
  const [stats, setStats] = useState(null);
  const [anchors, setAnchors] = useState(null);
  const [anchorStatus, setAnchorStatus] = useState(null);
  useEffect(() => {
    fetch(API + "/stats").then((r) => r.json()).then(setStats).catch(() => {});
    fetch(API + "/anchor/history").then((r) => r.json()).then((d) => setAnchors(d.anchors || d)).catch(() => {});
    fetch(API + "/anchor/status").then((r) => r.json()).then(setAnchorStatus).catch(() => {});
  }, []);
  if (!stats) return <div style={{ color: C.dim, fontFamily: mono, fontSize: 12, padding: 40 }}>Loading...</div>;

  const typeDist = stats.type_counts || {};
  if (!Object.keys(typeDist).length) {
    for (const t of stats.event_types || []) typeDist[t] = 1;
  }

  return (
    <div>
      <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.green }} />
        <span style={{ fontFamily: mono, fontSize: 11, color: C.teal, letterSpacing: "0.08em" }}>MAINNET</span>
        <span style={{ fontFamily: mono, fontSize: 11, color: C.muted }}>{stats.protocol}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 32 }}>
        <Stat label="Total Leaves" value={stats.total_leaves} color={C.gold} />
        <Stat label="Anchors" value={stats.total_anchors} color={C.purple} />
        <Stat label="First Anchor Block" value={stats.first_anchor_block?.toLocaleString() || "-"} />
        <Stat label="Last Anchor Block" value={stats.last_anchor_block?.toLocaleString() || "-"} />
      </div>

      {anchorStatus && (
        <div style={{ background: anchorStatus.needs_anchor ? `${C.gold}10` : `${C.green}10`, border: `1px solid ${anchorStatus.needs_anchor ? C.gold + "30" : C.green + "30"}`, borderRadius: 4, padding: "12px 20px", marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ fontFamily: mono, fontSize: 12, color: anchorStatus.needs_anchor ? C.gold : C.green, fontWeight: 600 }}>
              {anchorStatus.needs_anchor ? "ANCHOR NEEDED" : "UP TO DATE"}
            </span>
            <span style={{ fontFamily: mono, fontSize: 11, color: C.dim, marginLeft: 16 }}>
              {anchorStatus.unanchored_leaves} unanchored leaves · {anchorStatus.leaf_count} total
            </span>
          </div>
          <span style={{ fontFamily: mono, fontSize: 10, color: C.muted }}>
            root: {truncHash(anchorStatus.current_root, 10)}
          </span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: 24 }}>
          <div style={{ fontFamily: mono, fontSize: 10, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>Event Types</div>
          <PieChart data={typeDist} />
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: 24 }}>
          <div style={{ fontFamily: mono, fontSize: 10, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>Anchor History</div>
          {anchors && <AnchorTimeline anchors={anchors} />}
        </div>
      </div>

      {anchors && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: 24 }}>
          <div style={{ fontFamily: mono, fontSize: 10, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>Anchor Transactions</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: mono, fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {["Height", "Leaves", "Root", "Txid", "Time"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: C.muted, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {anchors.map((a, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${C.border}08` }}>
                  <td style={{ padding: "10px 12px", color: C.white }}>{a.height ? a.height.toLocaleString() : "pending"}</td>
                  <td style={{ padding: "10px 12px", color: C.gold }}>{a.leaf_count}</td>
                  <td style={{ padding: "10px 12px", color: C.dim }}>{truncHash(a.root, 10)}</td>
                  <td style={{ padding: "10px 12px" }}>
                    <a href={`https://zcashblockexplorer.com/transactions/${a.txid}`} target="_blank" rel="noopener noreferrer"
                      style={{ color: "#60a5fa", textDecoration: "none", fontSize: 11 }}>{truncHash(a.txid, 10)} ↗</a>
                  </td>
                  <td style={{ padding: "10px 12px", color: C.muted, fontSize: 11 }}>{new Date(a.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Leaves Page
function Leaves() {
  const [wallet, setWallet] = useState("");
  const [events, setEvents] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  // Load e2e wallet on mount
  useEffect(() => {
    setWallet("e2e_wallet_20260327");
    doSearch("e2e_wallet_20260327");
  }, []);

  function doSearch(w) {
    const q = (w || wallet).trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    fetch(API + "/lifecycle/" + encodeURIComponent(q))
      .then((r) => { if (!r.ok) throw new Error("Not found"); return r.json(); })
      .then((d) => { setEvents(d.events || []); setLoading(false); })
      .catch((e) => { setError(e.message); setEvents(null); setLoading(false); });
  }

  return (
    <div>
      <div style={{ fontFamily: mono, fontSize: 10, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>Leaves by Wallet</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <input value={wallet} onChange={(e) => setWallet(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && doSearch()}
          placeholder="wallet hash..."
          style={{ flex: 1, fontFamily: mono, fontSize: 12, padding: "10px 14px", background: "#111118", border: `1px solid ${C.border}`, borderRadius: 4, color: C.white, outline: "none" }} />
        <button onClick={() => doSearch()} style={{ fontFamily: mono, fontSize: 12, padding: "10px 20px", background: C.gold, color: "#0a0a0a", border: "none", borderRadius: 4, fontWeight: 600, cursor: "pointer" }}>Load</button>
      </div>
      {loading && <div style={{ color: C.dim, fontFamily: mono, fontSize: 12 }}>Loading...</div>}
      {error && <div style={{ color: C.red, fontFamily: mono, fontSize: 12, marginBottom: 12 }}>{error}</div>}
      {events && (
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: mono, fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              {["Type", "Leaf Hash", "Serial", "Anchored", "Block", ""].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: C.muted, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {events.map((ev, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${C.border}08` }}>
                <td style={{ padding: "10px 12px" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 3, background: (TYPE_COLORS[ev.event_type] || "#555") + "20", color: TYPE_COLORS[ev.event_type] || "#999", letterSpacing: "0.04em" }}>{ev.event_type}</span>
                </td>
                <td style={{ padding: "10px 12px", color: C.dim }}>{truncHash(ev.leaf_hash, 10)}</td>
                <td style={{ padding: "10px 12px", color: C.muted }}>{ev.serial_number || "-"}</td>
                <td style={{ padding: "10px 12px" }}>
                  {ev.anchored
                    ? <span style={{ color: C.green, fontSize: 11 }}>Yes</span>
                    : <span style={{ color: C.muted, fontSize: 11 }}>No</span>}
                </td>
                <td style={{ padding: "10px 12px", color: C.muted, fontSize: 11 }}>{ev.anchor_height?.toLocaleString() || "-"}</td>
                <td style={{ padding: "10px 12px" }}>
                  <a href={`#/leaf/${ev.leaf_hash}`} style={{ color: C.gold, textDecoration: "none", fontSize: 11 }}>View →</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {searched && events && events.length === 0 && (
        <div style={{ color: C.muted, fontFamily: mono, fontSize: 12, marginTop: 12 }}>No events found for this wallet.</div>
      )}
    </div>
  );
}

// Leaf Detail Page
function LeafDetail({ leafHash }) {
  const [bundle, setBundle] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (!leafHash) return;
    fetch(API + "/verify/" + encodeURIComponent(leafHash) + "/proof.json")
      .then((r) => { if (!r.ok) throw new Error("Proof not found"); return r.json(); })
      .then(setBundle)
      .catch((e) => setError(e.message));
  }, [leafHash]);

  if (error) return <div style={{ color: C.red, fontFamily: mono, fontSize: 12 }}>{error}</div>;
  if (!bundle) return <div style={{ color: C.dim, fontFamily: mono, fontSize: 12 }}>Loading proof...</div>;

  const leaf = bundle.leaf || {};
  const proof = bundle.proof || [];
  const root = bundle.root || {};
  const anchor = bundle.anchor || {};

  return (
    <div>
      <a href="#/leaves" style={{ fontFamily: mono, fontSize: 11, color: C.gold, textDecoration: "none", marginBottom: 20, display: "inline-block" }}>← Back to leaves</a>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: 24, marginBottom: 16 }}>
        <div style={{ fontFamily: mono, fontSize: 10, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>Leaf</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div>
            <div style={{ fontFamily: mono, fontSize: 10, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase" }}>Event Type</div>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 3, background: (TYPE_COLORS[leaf.event_type] || "#555") + "20", color: TYPE_COLORS[leaf.event_type] || "#999" }}>{leaf.event_type}</span>
          </div>
          <div>
            <div style={{ fontFamily: mono, fontSize: 10, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase" }}>Created</div>
            <div style={{ fontFamily: mono, fontSize: 12, color: C.dim }}>{leaf.created_at ? new Date(leaf.created_at).toLocaleString() : "-"}</div>
          </div>
        </div>
        {leaf.wallet_hash && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontFamily: mono, fontSize: 10, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase" }}>Wallet Hash</div>
            <div style={{ fontFamily: mono, fontSize: 12, color: C.white, wordBreak: "break-all" }}>{leaf.wallet_hash}</div>
          </div>
        )}
        <div>
          <div style={{ fontFamily: mono, fontSize: 10, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase" }}>Leaf Hash</div>
          <div style={{ fontFamily: mono, fontSize: 12, color: "#818cf8", wordBreak: "break-all" }}>{leaf.hash}</div>
        </div>
      </div>

      {/* SVG Merkle Path */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: 24, marginBottom: 16 }}>
        <div style={{ fontFamily: mono, fontSize: 10, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>Merkle Path ({proof.length} steps)</div>
        <svg viewBox={`0 0 500 ${80 + proof.length * 80}`} width="100%" style={{ maxWidth: 500 }}>
          {/* Leaf node */}
          <rect x={175} y={10} width={150} height={30} rx={4} fill="rgba(99,102,241,0.08)" stroke="#818cf8" strokeWidth={1} />
          <text x={250} y={30} textAnchor="middle" fill="#818cf8" fontFamily={mono} fontSize={9} fontWeight={600}>
            {truncHash(leaf.hash, 8)}
          </text>
          <text x={250} y={48} textAnchor="middle" fill={C.muted} fontFamily={mono} fontSize={8}>LEAF</text>

          {proof.map((step, i) => {
            const y = 60 + i * 80;
            return (
              <g key={i}>
                <line x1={250} y1={y - 4} x2={250} y2={y + 10} stroke={C.border} strokeWidth={1} />
                {/* Sibling */}
                <rect x={step.position === "left" ? 30 : 310} y={y + 10} width={160} height={26} rx={4}
                  fill="rgba(55,65,81,0.15)" stroke="#374151" strokeWidth={1} />
                <text x={step.position === "left" ? 110 : 390} y={y + 27} textAnchor="middle"
                  fill="#9ca3af" fontFamily={mono} fontSize={8}>{truncHash(step.hash, 8)}</text>
                <text x={step.position === "left" ? 110 : 390} y={y + 48} textAnchor="middle"
                  fill={C.muted} fontFamily={mono} fontSize={7}>SIBLING ({step.position.toUpperCase()})</text>
                {/* Result node */}
                <rect x={175} y={y + 52} width={150} height={26} rx={4}
                  fill={i === proof.length - 1 ? "rgba(34,197,94,0.08)" : "rgba(99,102,241,0.06)"}
                  stroke={i === proof.length - 1 ? C.green : "#6366f1"} strokeWidth={1} />
                <text x={250} y={y + 69} textAnchor="middle"
                  fill={i === proof.length - 1 ? "#4ade80" : "#a5b4fc"} fontFamily={mono} fontSize={8}>
                  {i === proof.length - 1 ? "ROOT" : `NODE ${i + 1}`}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Root + Anchor */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: 24, marginBottom: 16 }}>
        <div style={{ fontFamily: mono, fontSize: 10, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Root</div>
        <div style={{ fontFamily: mono, fontSize: 12, color: C.green, wordBreak: "break-all", marginBottom: 16 }}>{root.hash}</div>
        {root.leaf_count && <div style={{ fontFamily: mono, fontSize: 11, color: C.muted }}>Tree contains {root.leaf_count} leaves</div>}
      </div>

      {anchor.txid && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: 24 }}>
          <div style={{ fontFamily: mono, fontSize: 10, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>On-Chain Anchor</div>
          <a href={`https://zcashblockexplorer.com/transactions/${anchor.txid}`} target="_blank" rel="noopener noreferrer"
            style={{ fontFamily: mono, fontSize: 12, color: "#60a5fa", textDecoration: "none", wordBreak: "break-all" }}>
            {anchor.txid} ↗
          </a>
          {anchor.height && <div style={{ fontFamily: mono, fontSize: 11, color: C.muted, marginTop: 8 }}>Block {anchor.height.toLocaleString()}</div>}
        </div>
      )}
    </div>
  );
}

// Search Page
function Search() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  function doSearch() {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    setResult(null);
    // Try as wallet hash first
    fetch(API + "/lifecycle/" + encodeURIComponent(q))
      .then((r) => { if (!r.ok) throw new Error("not found"); return r.json(); })
      .then((d) => {
        setResult({ type: "wallet", data: d });
        setLoading(false);
      })
      .catch(() => {
        // Try as leaf hash
        fetch(API + "/verify/" + encodeURIComponent(q) + "/proof.json")
          .then((r) => { if (!r.ok) throw new Error("not found"); return r.json(); })
          .then((d) => {
            setResult({ type: "leaf", data: d });
            setLoading(false);
          })
          .catch(() => {
            setError("Nothing found for this query. Try a wallet hash or leaf hash.");
            setLoading(false);
          });
      });
  }

  return (
    <div>
      <div style={{ fontFamily: mono, fontSize: 10, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>Search</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <input value={query} onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && doSearch()}
          placeholder="wallet hash, leaf hash, or txid..."
          style={{ flex: 1, fontFamily: mono, fontSize: 12, padding: "10px 14px", background: "#111118", border: `1px solid ${C.border}`, borderRadius: 4, color: C.white, outline: "none" }} />
        <button onClick={doSearch} style={{ fontFamily: mono, fontSize: 12, padding: "10px 20px", background: C.gold, color: "#0a0a0a", border: "none", borderRadius: 4, fontWeight: 600, cursor: "pointer" }}>Search</button>
      </div>
      {loading && <div style={{ color: C.dim, fontFamily: mono, fontSize: 12 }}>Searching...</div>}
      {error && <div style={{ color: C.red, fontFamily: mono, fontSize: 12 }}>{error}</div>}
      {result?.type === "wallet" && (
        <div>
          <div style={{ fontFamily: mono, fontSize: 12, color: C.green, marginBottom: 12 }}>Found wallet: {result.data.wallet_hash}</div>
          <div style={{ fontFamily: mono, fontSize: 11, color: C.dim, marginBottom: 8 }}>{result.data.event_count} events</div>
          {result.data.events?.map((ev, i) => (
            <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: "12px 16px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 3, background: (TYPE_COLORS[ev.event_type] || "#555") + "20", color: TYPE_COLORS[ev.event_type] || "#999", fontFamily: mono }}>{ev.event_type}</span>
                <span style={{ fontFamily: mono, fontSize: 11, color: C.dim }}>{truncHash(ev.leaf_hash, 10)}</span>
              </div>
              <a href={`#/leaf/${ev.leaf_hash}`} style={{ fontFamily: mono, fontSize: 11, color: C.gold, textDecoration: "none" }}>View →</a>
            </div>
          ))}
        </div>
      )}
      {result?.type === "leaf" && (
        <div>
          <div style={{ fontFamily: mono, fontSize: 12, color: C.green, marginBottom: 12 }}>Found leaf proof</div>
          <a href={`#/leaf/${result.data.leaf?.hash}`} style={{ fontFamily: mono, fontSize: 12, color: C.gold, textDecoration: "none" }}>View full proof →</a>
        </div>
      )}
    </div>
  );
}

// App
export default function App() {
  const hash = useHash();
  let page;
  if (hash.startsWith("#/leaf/")) {
    const leafHash = hash.slice(7);
    page = <LeafDetail leafHash={leafHash} />;
  } else if (hash === "#/leaves") {
    page = <Leaves />;
  } else if (hash === "#/search") {
    page = <Search />;
  } else {
    page = <Dashboard />;
  }

  return (
    <div>
      <Nav />
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "80px 32px 60px" }}>
        {page}
      </div>
      <footer style={{ borderTop: `1px solid ${C.border}`, padding: "24px 32px", maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: mono, fontSize: 10, color: C.muted }}>
          <span>NSM1 Explorer · <a href="https://frontiercompute.io" target="_blank" rel="noopener" style={{ color: C.dim, textDecoration: "none" }}>Frontier Compute</a></span>
          <span>Protocol: NSM1 · Zcash Mainnet</span>
        </div>
      </footer>
    </div>
  );
}
