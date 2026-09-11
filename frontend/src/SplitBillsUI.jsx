import React, { useState } from "react";
import { io } from "socket.io-client";
import { api, SOCKET_URL } from "./api";

function friendlyError(err, fallback) {
  if (err && err.message === "Failed to fetch") {
    return "Cannot reach the server. Please check your connection and try again.";
  }
  return (err && err.message) || fallback;
}

const NAVY = "#10131C";
const CARD_NAVY = "#171B26";
const ROW_NAVY = "#1D2230";
const LIME = "#D6F23C";
const TEAL = "#3ADDC4";
const BLUE = "#4A9FF5";
const RED = "#E8604F";
const MUTED = "#8B90A0";
const WHITE = "#F4F5F8";

const participants = [
  { name: "Ben S", pct: 30, color: TEAL },
  { name: "Leslie", pct: 25, color: WHITE },
  { name: "Guy", pct: 22, color: LIME },
  { name: "krishtin", pct: 20, color: BLUE },
];

const payments = [
  { name: "Ben S Williamson", initial: "B", bg: TEAL, pct: 30, status: "Paid", amount: "$100.00", ok: true },
  { name: "Leslie Alexander", initial: "L", bg: "#E8A63C", pct: 24, status: "Paid", amount: "$60.00", ok: true },
  { name: "Guy Hawkins", initial: "G", bg: BLUE, pct: 22, status: "Unpaid", amount: "$40.00", ok: false },
  { name: "Kristin Watson", initial: "K", bg: "#8B90A0", pct: 20, status: "Unpaid", amount: "$20.00", ok: false },
];



function Avatar({ initial, bg, size = 34 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: bg,
        color: NAVY,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.42,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {initial}
    </div>
  );
}

function NavBar({ screen, setScreen }) {
  const items = [
    { id: "home", label: "Home", icon: "M4 11l8-7 8 7v9a1 1 0 01-1 1h-4v-6H9v6H5a1 1 0 01-1-1z" },
    { id: "history", label: "Groups", icon: "M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-4a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-4-4" },
  ];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        padding: "10px 8px",
        borderTop: `1px solid ${ROW_NAVY}`,
        background: NAVY,
      }}
    >
      {items.map((it) => (
        <button
          key={it.id}
          onClick={() => setScreen(it.id)}
          style={{ background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={screen === it.id ? LIME : MUTED} strokeWidth="1.8">
            <path d={it.icon} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontSize: 10, color: screen === it.id ? LIME : MUTED, fontWeight: 600 }}>{it.label}</span>
        </button>
      ))}
      <button
        onClick={() => setScreen("addExpense")}
        style={{
          width: 42,
          height: 42,
          borderRadius: "50%",
          background: LIME,
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
      >
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <path d="M14 14h3v3h-3zM20 14v3M17 20h4" />
        </svg>
      </button>
      {["report", "profile"].map((id) => (
        <button
          key={id}
          onClick={() => setScreen(id)}
          style={{ background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={screen === id ? LIME : MUTED} strokeWidth="1.8">
            <circle cx="12" cy="12" r="8" />
          </svg>
          <span style={{ fontSize: 10, color: screen === id ? LIME : MUTED, fontWeight: 600 }}>
            {id === "report" ? "Report" : "Profile"}
          </span>
        </button>
      ))}
    </div>
  );
}

function OnboardScreen({ onStart }) {
  const cards = [
    { rot: -14, x: -46, y: 10, bg: TEAL },
    { rot: -5, x: -14, y: -6, bg: "#B9A6F0" },
    { rot: 6, x: 16, y: 8, bg: LIME },
    { rot: 15, x: 44, y: 26, bg: "#3ADDC4" },
  ];
  return (
    <div style={{ padding: "24px 22px 26px", display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ position: "relative", height: 230, marginTop: 20, marginBottom: 10 }}>
        {cards.map((c, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `calc(50% + ${c.x}px)`,
              top: c.y,
              transform: `translateX(-50%) rotate(${c.rot}deg)`,
              width: 150,
              height: 92,
              borderRadius: 14,
              background: c.bg,
              boxShadow: "0 12px 24px rgba(0,0,0,0.35)",
            }}
          />
        ))}
      </div>
      <div style={{ marginTop: "auto" }}>
        <h1 style={{ fontSize: 30, fontWeight: 700, color: WHITE, margin: "0 0 4px", lineHeight: 1.15 }}>
          Manage your
          <br />
          Group expenses
        </h1>
        <p style={{ fontSize: 13, color: MUTED, fontStyle: "italic", margin: "0 0 22px" }}>Split the bill, now the fun</p>
        <button
          onClick={onStart}
          style={{
            width: "100%",
            background: LIME,
            color: NAVY,
            border: "none",
            borderRadius: 14,
            padding: "15px 0",
            fontSize: 14.5,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Get started
        </button>
      </div>
    </div>
  );
}

function HomeScreen({ groupId, currentUser, onAddExpense, onExport }) {
  const [chartData, setChartData] = React.useState(null);
  const [group, setGroup] = React.useState(null);
  const [pendingExpenses, setPendingExpenses] = React.useState([]);
  const [voting, setVoting] = React.useState({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  async function refreshPending() {
    try {
      const all = await api.listExpenses(groupId);
      setPendingExpenses(all.filter((e) => e.status === "pending"));
    } catch (err) {
      // non-fatal, pending list just stays stale
    }
  }

  async function handleVote(expenseId, vote) {
    setVoting((prev) => ({ ...prev, [expenseId]: true }));
    try {
      await api.vote(groupId, expenseId, vote);
      await refreshPending();
    } catch (err) {
      setError(friendlyError(err, "Failed to cast vote"));
    } finally {
      setVoting((prev) => ({ ...prev, [expenseId]: false }));
    }
  }

  React.useEffect(() => {
    if (!groupId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const [chart, groupDetail, allExpenses] = await Promise.all([
          api.getChartData(groupId),
          api.getGroup(groupId),
          api.listExpenses(groupId),
        ]);
        if (!cancelled) {
          setChartData(chart);
          setGroup(groupDetail);
          setPendingExpenses(allExpenses.filter((e) => e.status === "pending"));
        }
      } catch (err) {
        if (!cancelled) setError(friendlyError(err, "Failed to load"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    const socket = io(SOCKET_URL);
    socket.emit("join_group", groupId);
    socket.on("balances_updated", (data) => {
      if (!cancelled) setChartData(data);
    });
    socket.on("expense_pending", () => {
      if (!cancelled) refreshPending();
    });
    socket.on("expense_vote_cast", () => {
      if (!cancelled) refreshPending();
    });
    socket.on("expense_approved", () => {
      if (!cancelled) refreshPending();
    });
    socket.on("expense_rejected", () => {
      if (!cancelled) refreshPending();
    });

    return () => {
      cancelled = true;
      socket.disconnect();
    };
  }, [groupId]);

  if (loading) {
    return <div style={{ padding: 24, color: MUTED, fontSize: 13 }}>Loading...</div>;
  }
  if (error) {
    return <div style={{ padding: 24, color: RED, fontSize: 13 }}>{error}</div>;
  }
  if ((!chartData || chartData.spending_by_person.length === 0) && pendingExpenses.length === 0) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: WHITE, marginBottom: 8 }}>
          Welcome, {currentUser?.name}
        </div>
        <div style={{ fontSize: 13, color: MUTED, marginBottom: 20 }}>
          No expenses yet in {group?.name || "your group"}. Add one to get started.
        </div>
        <button
          onClick={onAddExpense}
          style={{ background: LIME, color: NAVY, border: "none", borderRadius: 14, padding: "14px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
        >
          + Add expense
        </button>
      </div>
    );
  }

  if ((!chartData || chartData.spending_by_person.length === 0) && pendingExpenses.length > 0) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: WHITE, marginBottom: 8 }}>
          Welcome, {currentUser?.name}
        </div>
        <div style={{ fontSize: 13, color: MUTED, marginBottom: 20 }}>
          No approved expenses yet in {group?.name || "your group"}, but you have pending approvals below.
        </div>
        {pendingExpenses.map((exp) => (
          <div
            key={exp.id}
            style={{
              background: CARD_NAVY,
              border: `1px solid ${LIME}`,
              borderRadius: 14,
              padding: "12px 14px",
              marginBottom: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: WHITE }}>{exp.description}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: LIME }}>&#8377;{exp.amount}</span>
            </div>
            <div style={{ fontSize: 11, color: MUTED, marginBottom: 4 }}>
              Paid by user {exp.paid_by}
            </div>
            <div style={{ fontSize: 10.5, color: MUTED, marginBottom: 10 }}>
              {(() => {
                const total = group?.members?.length || 1;
                const approveNeeded = Math.floor(total / 2) + 1;
                const rejectNeeded = total - approveNeeded + 1;
                return `Needs ${approveNeeded}/${total} to approve, ${rejectNeeded}/${total} to reject`;
              })()}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => handleVote(exp.id, "approve")}
                disabled={voting[exp.id]}
                style={{ flex: 1, background: LIME, color: NAVY, border: "none", borderRadius: 10, padding: "8px 0", fontSize: 12.5, fontWeight: 700, cursor: voting[exp.id] ? "default" : "pointer", opacity: voting[exp.id] ? 0.6 : 1 }}
              >
                Approve
              </button>
              <button
                onClick={() => handleVote(exp.id, "reject")}
                disabled={voting[exp.id]}
                style={{ flex: 1, background: "transparent", color: RED, border: `1px solid ${RED}`, borderRadius: 10, padding: "8px 0", fontSize: 12.5, fontWeight: 700, cursor: voting[exp.id] ? "default" : "pointer", opacity: voting[exp.id] ? 0.6 : 1 }}
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const spenders = chartData.spending_by_person.filter((p) => p.paid > 0);
  const totalSpend = chartData.total_group_spend || 0;
  const totalSpendForMath = totalSpend || 1; // avoid divide-by-zero in percentage math only
  const colorPalette = [TEAL, WHITE, LIME, BLUE, "#E8A63C", RED];
  const withPct = spenders.map((p, i) => ({
    ...p,
    pct: Math.round((p.paid / totalSpendForMath) * 100),
    color: colorPalette[i % colorPalette.length],
  }));

  const circumference = 2 * Math.PI * 46;
  let offset = 0;

  const settled = chartData.net_balances.filter((b) => Math.abs(b.net) < 0.01).length;
  const totalMembers = chartData.net_balances.length;
  const settledPct = totalMembers > 0 ? Math.round((settled / totalMembers) * 100) : 0;

  return (
    <div style={{ padding: "18px 18px 8px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 12, color: MUTED }}>Welcome back</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: WHITE }}>{currentUser?.name}</div>
          <div style={{ fontSize: 11, color: LIME, fontWeight: 600, marginTop: 2 }}>
            {group?.name} &middot; {totalMembers} member{totalMembers !== 1 ? "s" : ""}
          </div>
        </div>
        <Avatar initial={(currentUser?.name || "?")[0].toUpperCase()} bg="#E8A63C" size={36} />
      </div>

      <div style={{ background: LIME, borderRadius: 18, padding: "18px", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <svg width="96" height="96" viewBox="0 0 100 100">
            {withPct.map((p) => {
              const len = (p.pct / 100) * circumference;
              const dash = `${len} ${circumference - len}`;
              const el = (
                <circle
                  key={p.user_id}
                  cx="50"
                  cy="50"
                  r="46"
                  fill="none"
                  stroke={p.color === LIME ? NAVY : p.color}
                  strokeWidth="7"
                  strokeDasharray={dash}
                  strokeDashoffset={-offset}
                  transform="rotate(-90 50 50)"
                  strokeLinecap="round"
                />
              );
              offset += len;
              return el;
            })}
            <text x="50" y="46" textAnchor="middle" fontSize="15" fontWeight="700" fill={NAVY}>
              &#8377;{totalSpend}
            </text>
            <text x="50" y="60" textAnchor="middle" fontSize="8" fill="#5A5A20">
              Total bill
            </text>
          </svg>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: NAVY, marginBottom: 8 }}>{withPct.length} Participants</div>
            {withPct.map((p) => (
              <div key={p.user_id} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: p.color === LIME ? NAVY : p.color, display: "inline-block" }} />
                <span style={{ fontSize: 11.5, color: "#3A3A10" }}>
                  <b>{p.pct}%</b> {p.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {pendingExpenses.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: WHITE, marginBottom: 8 }}>Needs your approval</div>
          {pendingExpenses.map((exp) => (
            <div
              key={exp.id}
              style={{
                background: CARD_NAVY,
                border: `1px solid ${LIME}`,
                borderRadius: 14,
                padding: "12px 14px",
                marginBottom: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: WHITE }}>{exp.description}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: LIME }}>&#8377;{exp.amount}</span>
              </div>
              <div style={{ fontSize: 11, color: MUTED, marginBottom: 4 }}>
                Paid by user {exp.paid_by}
              </div>
              <div style={{ fontSize: 10.5, color: MUTED, marginBottom: 10 }}>
                {(() => {
                  const total = totalMembers;
                  const approveNeeded = Math.floor(total / 2) + 1;
                  const rejectNeeded = total - approveNeeded + 1;
                  return `Needs ${approveNeeded}/${total} to approve, ${rejectNeeded}/${total} to reject`;
                })()}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => handleVote(exp.id, "approve")}
                  disabled={voting[exp.id]}
                  style={{
                    flex: 1,
                    background: LIME,
                    color: NAVY,
                    border: "none",
                    borderRadius: 10,
                    padding: "8px 0",
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: voting[exp.id] ? "default" : "pointer",
                    opacity: voting[exp.id] ? 0.6 : 1,
                  }}
                >
                  Approve
                </button>
                <button
                  onClick={() => handleVote(exp.id, "reject")}
                  disabled={voting[exp.id]}
                  style={{
                    flex: 1,
                    background: "transparent",
                    color: RED,
                    border: `1px solid ${RED}`,
                    borderRadius: 10,
                    padding: "8px 0",
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: voting[exp.id] ? "default" : "pointer",
                    opacity: voting[exp.id] ? 0.6 : 1,
                  }}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: WHITE }}>Net balances</span>
        <button onClick={onExport} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={LIME} strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
          <span style={{ fontSize: 11, color: LIME, fontWeight: 600 }}>Export</span>
        </button>
      </div>
      <div style={{ background: ROW_NAVY, borderRadius: 999, height: 20, marginBottom: 6, position: "relative", overflow: "hidden" }}>
        <div style={{ width: `${settledPct}%`, height: "100%", background: TEAL, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: NAVY }}>{settledPct}%</span>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: MUTED, marginBottom: 14 }}>
        <span>{settled} of {totalMembers} settled</span>
        <span>&#8377;{totalSpend} Total bill</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 320, overflowY: "auto" }}>
        {chartData.net_balances.map((b) => {
          const ok = b.net >= 0;
          return (
            <div key={b.user_id} style={{ display: "flex", alignItems: "center", gap: 12, background: CARD_NAVY, borderRadius: 14, padding: "10px 12px" }}>
              <Avatar initial={b.name[0].toUpperCase()} bg={ok ? TEAL : RED} size={34} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: WHITE }}>{b.name}</div>
                <div style={{ fontSize: 11, color: ok ? TEAL : RED, fontWeight: 600 }}>
                  {ok ? "is owed" : "owes"}
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: ok ? TEAL : RED, fontVariantNumeric: "tabular-nums" }}>
                &#8377;{Math.abs(b.net)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QRPattern({ size = 200 }) {
  const cells = 21;
  const cellSize = size / cells;
  const seed = [
    1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1,
  ];
  const rows = [];
  for (let r = 0; r < cells; r++) {
    const row = [];
    for (let c = 0; c < cells; c++) {
      const isFinder =
        (r < 7 && c < 7) || (r < 7 && c >= cells - 7) || (r >= cells - 7 && c < 7);
      let on;
      if (isFinder) {
        const lr = r < 7 ? r : r - (cells - 7);
        const lc = c < 7 ? c : c >= cells - 7 ? c - (cells - 7) : c;
        on = lr === 0 || lr === 6 || lc === 0 || lc === 6 || (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4);
      } else {
        on = (r * 31 + c * 17 + r * c) % 5 < 2;
      }
      row.push(on);
    }
    rows.push(row);
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <rect width={size} height={size} fill={WHITE} rx="8" />
      {rows.map((row, r) =>
        row.map(
          (on, c) =>
            on && <rect key={`${r}-${c}`} x={c * cellSize} y={r * cellSize} width={cellSize} height={cellSize} fill={NAVY} />
        )
      )}
    </svg>
  );
}

function GroupsScreen({ currentUser, activeGroupId, onSwitchGroup }) {
  const [groups, setGroups] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  // create-group form
  const [showCreate, setShowCreate] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  // expanded group (show members + invite)
  const [expandedId, setExpandedId] = React.useState(null);
  const [members, setMembers] = React.useState([]);
  const [loadingMembers, setLoadingMembers] = React.useState(false);

  // invite form
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [inviteName, setInviteName] = React.useState("");
  const [inviting, setInviting] = React.useState(false);
  const [inviteMsg, setInviteMsg] = React.useState("");

  async function loadGroups() {
    try {
      setLoading(true);
      const data = await api.myGroups();
      setGroups(data);
    } catch (err) {
      setError(friendlyError(err, "Failed to load groups"));
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { loadGroups(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setError("");
    try {
      const group = await api.createGroup(newName.trim(), "INR");
      setNewName("");
      setShowCreate(false);
      await loadGroups();
      onSwitchGroup(group.id);
    } catch (err) {
      setError(friendlyError(err, "Failed to create group"));
    } finally {
      setCreating(false);
    }
  }

  async function handleExpand(groupId) {
    if (expandedId === groupId) { setExpandedId(null); return; }
    setExpandedId(groupId);
    setMembers([]);
    setInviteMsg("");
    setInviteEmail("");
    setInviteName("");
    setLoadingMembers(true);
    try {
      const data = await api.getGroup(groupId);
      setMembers(data.members || []);
    } catch (err) {
      setMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  }

  async function handleInvite(e, groupId) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setInviteMsg("");
    try {
      const result = await api.addMember(groupId, {
        email: inviteEmail.trim(),
        name: inviteName.trim() || inviteEmail.trim().split("@")[0],
      });
      setMembers(result.members || []);
      setInviteEmail("");
      setInviteName("");
      setInviteMsg("Member added!");
      loadGroups(); // refresh member_count
    } catch (err) {
      setInviteMsg(friendlyError(err, "Failed to add member"));
    } finally {
      setInviting(false);
    }
  }

  async function handleLeave(groupId) {
    if (!confirm("Leave this group? You can be re-invited later.")) return;
    try {
      await api.leaveGroup(groupId);
      if (activeGroupId === groupId) {
        // switch to another group
        const remaining = groups.filter((g) => g.id !== groupId);
        onSwitchGroup(remaining.length > 0 ? remaining[0].id : null);
      }
      setExpandedId(null);
      loadGroups();
    } catch (err) {
      setError(friendlyError(err, "Failed to leave group"));
    }
  }

  const MEMBER_COLORS = [TEAL, BLUE, "#E8A63C", "#B9A6F0", "#3ADDC4", LIME];

  return (
    <div style={{ padding: "18px 18px 8px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: WHITE }}>Groups</div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          style={{
            background: LIME, color: NAVY, border: "none", borderRadius: 10,
            padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 5,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New group
        </button>
      </div>

      {/* Create group form */}
      {showCreate && (
        <form onSubmit={handleCreate} style={{
          background: CARD_NAVY, borderRadius: 14, padding: 16, marginBottom: 14,
          display: "flex", gap: 8, alignItems: "flex-end",
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: MUTED, marginBottom: 4 }}>Group name</div>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Goa Trip, Flat 3B..."
              autoFocus
              style={{
                width: "100%", background: ROW_NAVY, border: "none", borderRadius: 8,
                padding: "10px 12px", color: WHITE, fontSize: 13, outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          <button type="submit" disabled={creating || !newName.trim()} style={{
            background: LIME, color: NAVY, border: "none", borderRadius: 8,
            padding: "10px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer",
            opacity: creating || !newName.trim() ? 0.5 : 1,
          }}>
            {creating ? "..." : "Create"}
          </button>
        </form>
      )}

      {error && (
        <div style={{ color: RED, fontSize: 12, marginBottom: 10, textAlign: "center" }}>{error}</div>
      )}

      {loading ? (
        <div style={{ color: MUTED, fontSize: 13, textAlign: "center", padding: 20 }}>Loading groups...</div>
      ) : groups.length === 0 ? (
        <div style={{ textAlign: "center", padding: "30px 10px" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>👥</div>
          <div style={{ color: WHITE, fontSize: 14, fontWeight: 600, marginBottom: 4 }}>No groups yet</div>
          <div style={{ color: MUTED, fontSize: 12 }}>Create a group to start splitting expenses with friends</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {groups.map((g) => {
            const isActive = g.id === activeGroupId;
            const isExpanded = g.id === expandedId;
            return (
              <div key={g.id} style={{
                background: CARD_NAVY, borderRadius: 14, overflow: "hidden",
                border: isActive ? `1.5px solid ${LIME}` : `1.5px solid transparent`,
              }}>
                {/* Group header row */}
                <div
                  onClick={() => handleExpand(g.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
                    cursor: "pointer",
                  }}
                >
                  <div style={{
                    width: 38, height: 38, borderRadius: 12,
                    background: isActive ? LIME : ROW_NAVY,
                    color: isActive ? NAVY : MUTED,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16, fontWeight: 700, flexShrink: 0,
                  }}>
                    {g.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: WHITE, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {g.name}
                    </div>
                    <div style={{ fontSize: 11, color: MUTED }}>
                      {g.member_count || 1} member{(g.member_count || 1) !== 1 ? "s" : ""}
                      {isActive && <span style={{ color: LIME, marginLeft: 8 }}>● Active</span>}
                    </div>
                  </div>
                  <svg
                    width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke={MUTED} strokeWidth="2"
                    style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s" }}
                  >
                    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div style={{ padding: "0 16px 14px", borderTop: `1px solid ${ROW_NAVY}` }}>
                    {/* Switch / Leave buttons */}
                    <div style={{ display: "flex", gap: 8, marginTop: 12, marginBottom: 14 }}>
                      {!isActive && (
                        <button
                          onClick={() => onSwitchGroup(g.id)}
                          style={{
                            flex: 1, background: LIME, color: NAVY, border: "none", borderRadius: 8,
                            padding: "9px 0", fontSize: 12, fontWeight: 700, cursor: "pointer",
                          }}
                        >
                          Switch to this group
                        </button>
                      )}
                      <button
                        onClick={() => handleLeave(g.id)}
                        style={{
                          flex: isActive ? 1 : 0, minWidth: isActive ? undefined : 80,
                          background: "transparent", color: RED, border: `1px solid ${RED}`, borderRadius: 8,
                          padding: "9px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer",
                        }}
                      >
                        Leave
                      </button>
                    </div>

                    {/* Members list */}
                    <div style={{ fontSize: 12, fontWeight: 600, color: MUTED, marginBottom: 8 }}>Members</div>
                    {loadingMembers ? (
                      <div style={{ color: MUTED, fontSize: 12, padding: "6px 0" }}>Loading...</div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                        {members.map((m, i) => (
                          <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 0" }}>
                            <Avatar initial={m.name.charAt(0).toUpperCase()} bg={MEMBER_COLORS[i % MEMBER_COLORS.length]} size={28} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, color: WHITE, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {m.name}{m.id === currentUser.id ? " (you)" : ""}
                              </div>
                              <div style={{ fontSize: 10.5, color: MUTED }}>{m.email}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Invite form */}
                    <div style={{ fontSize: 12, fontWeight: 600, color: MUTED, marginBottom: 6 }}>Invite member</div>
                    <form onSubmit={(e) => handleInvite(e, g.id)} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <input
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="Email address"
                        type="email"
                        style={{
                          width: "100%", background: ROW_NAVY, border: "none", borderRadius: 8,
                          padding: "9px 12px", color: WHITE, fontSize: 12, outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                      <div style={{ display: "flex", gap: 6 }}>
                        <input
                          value={inviteName}
                          onChange={(e) => setInviteName(e.target.value)}
                          placeholder="Name (optional)"
                          style={{
                            flex: 1, background: ROW_NAVY, border: "none", borderRadius: 8,
                            padding: "9px 12px", color: WHITE, fontSize: 12, outline: "none",
                          }}
                        />
                        <button type="submit" disabled={inviting || !inviteEmail.trim()} style={{
                          background: TEAL, color: NAVY, border: "none", borderRadius: 8,
                          padding: "9px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer",
                          opacity: inviting || !inviteEmail.trim() ? 0.5 : 1,
                        }}>
                          {inviting ? "..." : "Invite"}
                        </button>
                      </div>
                      {inviteMsg && (
                        <div style={{ fontSize: 11, color: inviteMsg.includes("added") ? TEAL : RED, marginTop: 2 }}>{inviteMsg}</div>
                      )}
                    </form>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const spendByGroup = [
  { name: "Goa Trip", amount: 8920, color: LIME },
  { name: "Flat 3B", amount: 5340, color: TEAL },
  { name: "Office lunch", amount: 2100, color: BLUE },
];

function ReportScreen() {
  const total = spendByGroup.reduce((s, g) => s + g.amount, 0);
  return (
    <div style={{ padding: "18px 18px 8px" }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: WHITE, marginBottom: 4 }}>Report</div>
      <div style={{ fontSize: 12, color: MUTED, marginBottom: 18 }}>Your spending across all groups</div>

      <div style={{ background: CARD_NAVY, borderRadius: 16, padding: 16, marginBottom: 18 }}>
        <div style={{ fontSize: 11, color: MUTED, marginBottom: 4 }}>Total this month</div>
        <div style={{ fontSize: 26, fontWeight: 700, color: WHITE, fontVariantNumeric: "tabular-nums" }}>
          ${total.toLocaleString("en-US")}
        </div>
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, color: WHITE, marginBottom: 10 }}>By group</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {spendByGroup.map((g) => {
          const pct = Math.round((g.amount / total) * 100);
          return (
            <div key={g.name} style={{ background: CARD_NAVY, borderRadius: 14, padding: "12px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: WHITE }}>{g.name}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: g.color, fontVariantNumeric: "tabular-nums" }}>
                  ${g.amount.toLocaleString("en-US")}
                </span>
              </div>
              <div style={{ background: ROW_NAVY, borderRadius: 999, height: 6, overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: g.color, borderRadius: 999 }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProfileScreen({ currentUser, onSignOut }) {
  const [groupCount, setGroupCount] = React.useState("-");
  React.useEffect(() => {
    api.myGroups().then((g) => setGroupCount(String(g.length))).catch(() => {});
  }, []);
  const rows = [
    { label: "Groups joined", value: groupCount },
    { label: "Total settled", value: "-" },
    { label: "Pending approvals", value: "-" },
  ];
  return (
    <div style={{ padding: "18px 18px 8px" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 20 }}>
        <Avatar initial={(currentUser?.name || "?")[0].toUpperCase()} bg="#E8A63C" size={64} />
        <div style={{ fontSize: 16, fontWeight: 700, color: WHITE, marginTop: 10 }}>{currentUser?.name}</div>
        <div style={{ fontSize: 12, color: MUTED }}>{currentUser?.email}</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
        {rows.map((r) => (
          <div
            key={r.label}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: CARD_NAVY,
              borderRadius: 14,
              padding: "12px 14px",
            }}
          >
            <span style={{ fontSize: 13, color: MUTED }}>{r.label}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: WHITE }}>{r.value}</span>
          </div>
        ))}
      </div>

      <button
        onClick={onSignOut}
        style={{
          width: "100%",
          background: CARD_NAVY,
          color: WHITE,
          border: `1px solid ${ROW_NAVY}`,
          borderRadius: 14,
          padding: "13px 0",
          fontSize: 13.5,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Sign out
      </button>
    </div>
  );
}

function AddExpenseScreen({ groupId, onBack, onScanReceipt, onSuccess }) {
  const [split, setSplit] = useState("equal");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [members, setMembers] = useState([]);
  const [selected, setSelected] = useState({});
  const [customAmounts, setCustomAmounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  React.useEffect(() => {
    if (!groupId) return;
    let cancelled = false;
    api.getGroup(groupId).then((group) => {
      if (cancelled) return;
      setMembers(group.members || []);
      const initial = {};
      (group.members || []).forEach((m) => { initial[m.id] = true; });
      setSelected(initial);
      setLoading(false);
    }).catch((err) => {
      if (!cancelled) { setError(friendlyError(err, "Failed to load group members")); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [groupId]);

  const selectedIds = Object.keys(selected).filter((id) => selected[id]).map(Number);
  const numAmount = parseFloat(amount) || 0;
  const equalShare = selectedIds.length > 0 ? (numAmount / selectedIds.length) : 0;
  const customSum = selectedIds.reduce((s, id) => s + (parseFloat(customAmounts[id]) || 0), 0);

  function toggleMember(id) {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  async function handleSubmit() {
    setError("");
    if (!title.trim()) return setError("Title is required");
    if (numAmount <= 0) return setError("Enter a valid amount");
    if (selectedIds.length === 0) return setError("Select at least one person to split with");

    let payload;
    if (split === "equal") {
      payload = { description: title.trim(), amount: numAmount, split_type: "equal", participants: selectedIds };
    } else {
      if (Math.abs(customSum - numAmount) > 0.01) {
        return setError("Custom amounts must sum to " + numAmount + " (currently " + customSum.toFixed(2) + ")");
      }
      payload = {
        description: title.trim(),
        amount: numAmount,
        split_type: "custom",
        splits: selectedIds.map((id) => ({ user_id: id, share_amount: parseFloat(customAmounts[id]) || 0 })),
      };
    }

    setSubmitting(true);
    try {
      await api.addExpense(groupId, payload);
      onSuccess();
    } catch (err) {
      setError(friendlyError(err, "Failed to add expense"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ padding: "18px 18px 8px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={WHITE} strokeWidth="1.8">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <span style={{ fontSize: 15, fontWeight: 700, color: WHITE }}>Add expense</span>
      </div>

      <button
        onClick={onScanReceipt}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: CARD_NAVY,
          border: `1px dashed ${LIME}`,
          borderRadius: 14,
          padding: "12px 14px",
          marginBottom: 18,
          cursor: "pointer",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={LIME} strokeWidth="1.8">
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="M8 8h.01M16 8h.01M4 16l4-4 3 3 5-5 4 4" />
        </svg>
        <span style={{ fontSize: 13, color: LIME, fontWeight: 600 }}>Scan a receipt instead</span>
      </button>

      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 11.5, color: MUTED, marginBottom: 6, display: "block" }}>Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Dinner at Cafe"
          style={{
            width: "100%",
            background: CARD_NAVY,
            border: `1px solid ${ROW_NAVY}`,
            borderRadius: 12,
            padding: "12px 14px",
            fontSize: 13.5,
            color: WHITE,
            boxSizing: "border-box",
          }}
        />
      </div>

      <div style={{ marginBottom: 18 }}>
        <label style={{ fontSize: 11.5, color: MUTED, marginBottom: 6, display: "block" }}>Amount</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          style={{
            width: "100%",
            background: CARD_NAVY,
            border: `1px solid ${ROW_NAVY}`,
            borderRadius: 12,
            padding: "12px 14px",
            fontSize: 20,
            fontWeight: 700,
            color: WHITE,
            boxSizing: "border-box",
          }}
        />
      </div>

      <div style={{ marginBottom: 18 }}>
        <label style={{ fontSize: 11.5, color: MUTED, marginBottom: 8, display: "block" }}>Split</label>
        <div style={{ display: "flex", gap: 8 }}>
          {["equal", "custom"].map((s) => (
            <button
              key={s}
              onClick={() => setSplit(s)}
              style={{
                flex: 1,
                background: split === s ? LIME : CARD_NAVY,
                color: split === s ? NAVY : WHITE,
                border: `1px solid ${split === s ? LIME : ROW_NAVY}`,
                borderRadius: 10,
                padding: "9px 0",
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 22 }}>
        <label style={{ fontSize: 11.5, color: MUTED, marginBottom: 8, display: "block" }}>Split with</label>
        {loading ? (
          <div style={{ fontSize: 12, color: MUTED }}>Loading members...</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {members.map((m) => (
              <div
                key={m.id}
                onClick={() => toggleMember(m.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: CARD_NAVY,
                  border: `1px solid ${selected[m.id] ? LIME : ROW_NAVY}`,
                  borderRadius: 12,
                  padding: "8px 12px",
                  cursor: "pointer",
                }}
              >
                <Avatar initial={m.name[0].toUpperCase()} bg={selected[m.id] ? LIME : ROW_NAVY} size={30} />
                <span style={{ flex: 1, fontSize: 13, color: WHITE }}>{m.name}</span>
                {split === "custom" && selected[m.id] && (
                  <input
                    type="number"
                    value={customAmounts[m.id] || ""}
                    onChange={(e) => { e.stopPropagation(); setCustomAmounts((prev) => ({ ...prev, [m.id]: e.target.value })); }}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="0.00"
                    style={{ width: 70, background: NAVY, border: `1px solid ${ROW_NAVY}`, borderRadius: 8, padding: "5px 8px", fontSize: 12, color: WHITE }}
                  />
                )}
                {split === "equal" && selected[m.id] && (
                  <span style={{ fontSize: 12, color: LIME, fontWeight: 600 }}>{equalShare.toFixed(2)}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div style={{ color: RED, fontSize: 12.5, marginBottom: 14 }}>{error}</div>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        style={{
          width: "100%",
          background: LIME,
          color: NAVY,
          border: "none",
          borderRadius: 14,
          padding: "14px 0",
          fontSize: 14,
          fontWeight: 700,
          cursor: submitting ? "default" : "pointer",
          opacity: submitting ? 0.7 : 1,
        }}
      >
        {submitting ? "Adding..." : "Add expense"}
      </button>
    </div>
  );
}

const scannedItems = [
  { name: "Paneer tikka", price: 320, category: "Food" },
  { name: "Cold coffee x2", price: 240, category: "Beverages" },
  { name: "Garlic naan x3", price: 180, category: "Food" },
];

function ReceiptUploadScreen({ onBack, onConfirm }) {
  const [stage, setStage] = useState("upload");
  const total = scannedItems.reduce((s, i) => s + i.price, 0);

  return (
    <div style={{ padding: "18px 18px 8px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={WHITE} strokeWidth="1.8">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <span style={{ fontSize: 15, fontWeight: 700, color: WHITE }}>Scan receipt</span>
      </div>

      {stage === "upload" && (
        <>
          <div
            style={{
              position: "relative",
              background: "#0A0C12",
              borderRadius: 16,
              height: 260,
              marginBottom: 18,
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="120" height="150" viewBox="0 0 120 150" style={{ opacity: 0.5 }}>
              <rect x="6" y="6" width="108" height="138" rx="4" fill="none" stroke={MUTED} strokeWidth="1.5" strokeDasharray="4 4" />
              <line x1="18" y1="24" x2="86" y2="24" stroke={MUTED} strokeWidth="2" />
              <line x1="18" y1="34" x2="70" y2="34" stroke={MUTED} strokeWidth="2" />
              <line x1="18" y1="52" x2="100" y2="52" stroke={MUTED} strokeWidth="1.5" />
              <line x1="18" y1="60" x2="100" y2="60" stroke={MUTED} strokeWidth="1.5" />
              <line x1="18" y1="68" x2="82" y2="68" stroke={MUTED} strokeWidth="1.5" />
              <line x1="18" y1="86" x2="100" y2="86" stroke={MUTED} strokeWidth="1.5" />
              <line x1="18" y1="94" x2="90" y2="94" stroke={MUTED} strokeWidth="1.5" />
              <line x1="60" y1="118" x2="100" y2="118" stroke={MUTED} strokeWidth="2" />
            </svg>

            {[
              { top: 14, left: 14, rot: 0 },
              { top: 14, right: 14, rot: 90 },
              { bottom: 14, left: 14, rot: -90 },
              { bottom: 14, right: 14, rot: 180 },
            ].map((c, i) => (
              <svg
                key={i}
                width="28"
                height="28"
                viewBox="0 0 28 28"
                style={{ position: "absolute", top: c.top, left: c.left, right: c.right, bottom: c.bottom, transform: `rotate(${c.rot}deg)` }}
              >
                <path d="M2 12V4a2 2 0 012-2h8" fill="none" stroke={LIME} strokeWidth="3" strokeLinecap="round" />
              </svg>
            ))}

            <div
              style={{
                position: "absolute",
                left: 14,
                right: 14,
                top: "42%",
                height: 2,
                background: LIME,
                boxShadow: `0 0 8px ${LIME}`,
                animation: "evenup-scan 1.8s ease-in-out infinite",
              }}
            />
            <style>{`@keyframes evenup-scan { 0%,100% { top: 18%; } 50% { top: 82%; } }`}</style>
          </div>

          <div style={{ fontSize: 11.5, color: MUTED, textAlign: "center", marginBottom: 18 }}>
            Line the receipt up inside the frame
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <button
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                background: CARD_NAVY,
                color: WHITE,
                border: `1px solid ${ROW_NAVY}`,
                borderRadius: 14,
                padding: "13px 0",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={WHITE} strokeWidth="1.8">
                <rect x="4" y="4" width="16" height="16" rx="2" />
                <path d="M8 8h.01M16 8h.01M4 16l4-4 3 3 5-5 4 4" />
              </svg>
              From gallery
            </button>
            <button
              onClick={() => setStage("scanning")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                background: LIME,
                color: NAVY,
                border: "none",
                borderRadius: 14,
                padding: "13px 0",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="2">
                <circle cx="12" cy="12" r="8" />
                <circle cx="12" cy="12" r="3" fill={NAVY} />
              </svg>
              Capture
            </button>
          </div>
        </>
      )}

      {stage === "scanning" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px" }}>
          <div style={{ position: "relative", width: 56, height: 56, marginBottom: 18 }}>
            <svg width="56" height="56" viewBox="0 0 56 56" style={{ animation: "evenup-spin 1s linear infinite" }}>
              <circle cx="28" cy="28" r="24" fill="none" stroke={ROW_NAVY} strokeWidth="4" />
              <circle cx="28" cy="28" r="24" fill="none" stroke={LIME} strokeWidth="4" strokeDasharray="60 100" strokeLinecap="round" />
            </svg>
            <style>{`@keyframes evenup-spin { to { transform: rotate(360deg); } }`}</style>
          </div>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: WHITE, marginBottom: 4 }}>Reading your receipt</div>
          <div style={{ fontSize: 11.5, color: MUTED, textAlign: "center", marginBottom: 24 }}>
            Running OCR, then sorting items into categories
          </div>
          <button
            onClick={() => setStage("extracted")}
            style={{
              background: "none",
              border: `1px solid ${ROW_NAVY}`,
              color: MUTED,
              borderRadius: 12,
              padding: "9px 20px",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Skip to results
          </button>
        </div>
      )}

      {stage === "extracted" && (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 11.5,
              color: TEAL,
              marginBottom: 14,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth="2">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            Extracted 3 items &middot; review before adding
          </div>

          <div style={{ background: CARD_NAVY, borderRadius: 14, overflow: "hidden", marginBottom: 14 }}>
            {scannedItems.map((it, i) => (
              <div
                key={it.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 14px",
                  borderBottom: i < scannedItems.length - 1 ? `1px solid ${ROW_NAVY}` : "none",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: WHITE }}>{it.name}</div>
                  <div style={{ fontSize: 10.5, color: MUTED }}>{it.category}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: WHITE, fontVariantNumeric: "tabular-nums" }}>
                  &#8377;{it.price}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18, padding: "0 2px" }}>
            <span style={{ fontSize: 13, color: MUTED }}>Total</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: LIME }}>&#8377;{total}</span>
          </div>

          <button
            onClick={onConfirm}
            style={{
              width: "100%",
              background: LIME,
              color: NAVY,
              border: "none",
              borderRadius: 14,
              padding: "14px 0",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Confirm and split
          </button>
        </>
      )}
    </div>
  );
}

function ExportShareScreen({ onBack }) {
  return (
    <div style={{ padding: "18px 18px 8px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={WHITE} strokeWidth="1.8">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <span style={{ fontSize: 15, fontWeight: 700, color: WHITE }}>Settlement summary</span>
      </div>

      <div style={{ background: LIME, borderRadius: 16, padding: 18, marginBottom: 18 }}>
        <div style={{ fontSize: 11, color: "#3A3A10", fontWeight: 600, marginBottom: 2 }}>Goa Trip</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: NAVY, marginBottom: 12 }}>&#8377;8,920 total</div>
        <div style={{ borderTop: "1px solid rgba(0,0,0,0.15)", paddingTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "#3A3A10" }}>
            <span>Karan &rarr; You</span>
            <b>&#8377;1,180</b>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "#3A3A10" }}>
            <span>You &rarr; Riya</span>
            <b>&#8377;560</b>
          </div>
        </div>
      </div>

      <div style={{ fontSize: 11.5, color: MUTED, marginBottom: 18, textAlign: "center" }}>
        4 members &middot; 12 expenses &middot; settled on request
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <button
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            background: CARD_NAVY,
            color: WHITE,
            border: `1px solid ${ROW_NAVY}`,
            borderRadius: 12,
            padding: "12px 0",
            fontSize: 12.5,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={WHITE} strokeWidth="1.8">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
          Download PDF
        </button>
        <button
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            background: LIME,
            color: NAVY,
            border: "none",
            borderRadius: 12,
            padding: "12px 0",
            fontSize: 12.5,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="1.8">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
          </svg>
          Share
        </button>
      </div>
    </div>
  );
}

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 900 : false
  );
  React.useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 900);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return isDesktop;
}

function Sidebar({ screen, setScreen, currentUser }) {
  const items = [
    { id: "home", label: "Home", icon: "M4 11l8-7 8 7v9a1 1 0 01-1 1h-4v-6H9v6H5a1 1 0 01-1-1z" },
    { id: "history", label: "Groups", icon: "M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-4a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-4-4" },
    { id: "report", label: "Report", icon: "M4 6h16M4 12h10M4 18h6" },
    { id: "profile", label: "Profile", icon: "" },
  ];
  return (
    <div
      style={{
        width: 220,
        flexShrink: 0,
        background: CARD_NAVY,
        borderRight: `1px solid ${ROW_NAVY}`,
        padding: "24px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 8px", marginBottom: 28 }}>
        <div style={{ width: 26, height: 26, borderRadius: 8, background: LIME, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="2.5">
            <path d="M4 12h16M12 4v16" />
          </svg>
        </div>
        <span style={{ fontSize: 15, fontWeight: 700, color: WHITE, letterSpacing: -0.3 }}>EvenUp</span>
      </div>

      {items.map((it) => (
        <button
          key={it.id}
          onClick={() => setScreen(it.id)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: screen === it.id ? "rgba(214,242,60,0.1)" : "transparent",
            border: "none",
            borderRadius: 10,
            padding: "10px 12px",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          {it.id === "profile" ? (
            <Avatar initial="A" bg="#E8A63C" size={18} />
          ) : (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={screen === it.id ? LIME : MUTED} strokeWidth="1.8">
              <path d={it.icon} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          <span style={{ fontSize: 13, fontWeight: 600, color: screen === it.id ? LIME : MUTED }}>{it.label}</span>
        </button>
      ))}

      <button
        onClick={() => setScreen("addExpense")}
        style={{
          marginTop: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          background: LIME,
          color: NAVY,
          border: "none",
          borderRadius: 10,
          padding: "11px 0",
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="2.2">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Add expense
      </button>

      {currentUser && (
        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 8, padding: "10px 8px", borderTop: `1px solid ${ROW_NAVY}` }}>
          <Avatar initial={currentUser.name ? currentUser.name.charAt(0).toUpperCase() : "?"} bg="#E8A63C" size={30} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: WHITE }}>{currentUser.name}</div>
            <div style={{ fontSize: 10.5, color: MUTED }}>{currentUser.email}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SplitBillsUI({ currentUser, groupId, onSignOut, onGroupChange }) {
  const [screen, setScreen] = useState("onboard");
  const isDesktop = useIsDesktop();

  function handleSwitchGroup(newGroupId) {
    if (onGroupChange) onGroupChange(newGroupId);
    setScreen("home");
  }

  const screenMap = {
    onboard: <OnboardScreen onStart={() => setScreen("home")} />,
    home: <HomeScreen groupId={groupId} currentUser={currentUser} onAddExpense={() => setScreen("addExpense")} onExport={() => setScreen("export")} />,
    history: <GroupsScreen currentUser={currentUser} activeGroupId={groupId} onSwitchGroup={handleSwitchGroup} />,
    split: <GroupsScreen currentUser={currentUser} activeGroupId={groupId} onSwitchGroup={handleSwitchGroup} />,
    report: <ReportScreen />,
    profile: <ProfileScreen currentUser={currentUser} onSignOut={onSignOut} />,
    addExpense: <AddExpenseScreen groupId={groupId} onBack={() => setScreen("home")} onScanReceipt={() => setScreen("receipt")} onSuccess={() => setScreen("home")} />,
    receipt: <ReceiptUploadScreen onBack={() => setScreen("addExpense")} onConfirm={() => setScreen("home")} />,
    export: <ExportShareScreen onBack={() => setScreen("home")} />,
  };

  if (isDesktop && screen !== "onboard") {
    return (
      <div
        style={{
          width: "100%",
          minHeight: 640,
          background: NAVY,
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          borderRadius: 16,
          overflow: "hidden",
          display: "flex",
        }}
      >
        <Sidebar screen={screen} setScreen={setScreen} currentUser={currentUser} />
        <div style={{ flex: 1, overflowY: "auto", display: "flex", justifyContent: "center", padding: "8px 0" }}>
          <div style={{ width: "100%", maxWidth: 640 }}>{screenMap[screen]}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 380,
        margin: "0 auto",
        background: NAVY,
        minHeight: 660,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        borderRadius: 22,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ flex: 1, overflowY: "auto" }}>{screenMap[screen]}</div>
      {screen !== "onboard" && <NavBar screen={screen} setScreen={setScreen} />}
    </div>
  );
}