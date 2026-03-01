import React, { useState, useEffect, useCallback } from "react";
import {
  connectWallet,
  listenForAccountChanges,
  getAllPolls,
  castVote,
  hasVoted,
  createPoll,
  deletePoll,
} from "./services/blockchain";

// ─── Helper Components ─────────────────────────────────────────────────────────

const Spinner = () => (
  <div className="spinner">
    <div className="spin-circle"></div>
  </div>
);

const Badge = ({ status }) => {
  const classes = {
    active: "badge badge-active",
    ended: "badge badge-ended",
    upcoming: "badge badge-upcoming",
  };
  return <span className={classes[status] || "badge"}>{status}</span>;
};

const getPollStatus = (poll) => {
  const now = Math.floor(Date.now() / 1000);
  if (now < poll.startTime) return "upcoming";
  if (now > poll.endTime) return "ended";
  return "active";
};

const formatDate = (unix) =>
  new Date(unix * 1000).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

// ─── Header ────────────────────────────────────────────────────────────────────

const Header = ({ account, onConnect, onCreatePoll }) => (
  <header className="site-header">
    <div className="header-top">
      <div className="navbar-brand">
        <div className="brand-text">
          <span className="brand-name">DecentraVote</span>
          <span className="brand-sub">Powered by Ethereum</span>
        </div>
      </div>
      <nav className="header-nav">
        <a href="#polls" className="nav-link">Polls</a>
        <a href="#how-it-works" className="nav-link">How It Works</a>
        <a href="#stats" className="nav-link">Stats</a>
      </nav>
      <div className="navbar-right">
        {account ? (
          <>
            <div className="account-badge">
              <span className="account-dot" />
              <span className="address-pill">
                {account.slice(0, 6)}…{account.slice(-4)}
              </span>
            </div>
            <button className="btn btn-primary" onClick={onCreatePoll}>
              + New Poll
            </button>
          </>
        ) : (
          <button className="btn btn-primary" onClick={onConnect}>
            Connect MetaMask
          </button>
        )}
      </div>
    </div>
  </header>
);

// ─── Hero ───────────────────────────────────────────────────────────────────────

const Hero = ({ account, onConnect, onCreatePoll, polls }) => {
  const activeCount = polls.filter(p => getPollStatus(p) === "active").length;
  const totalVotes = polls.reduce((s, p) => s + p.totalVotes, 0);

  return (
    <section className="hero">
      <div className="hero-content">
        <div className="hero-badge">On-Chain · Trustless · Transparent</div>
        <h1 className="hero-title">
          Decentralised Voting<br />
          <span className="hero-gradient">for Everyone</span>
        </h1>
        <p className="hero-desc">
          Create and participate in tamper-proof polls secured by the Ethereum blockchain.
          Every vote is recorded on-chain — no central authority, no manipulation.
        </p>
        <div className="hero-actions">
          {account ? (
            <button className="btn btn-primary btn-lg" onClick={onCreatePoll}>
              + Create a Poll
            </button>
          ) : (
            <button className="btn btn-primary btn-lg" onClick={onConnect}>
              Connect Wallet to Start
            </button>
          )}
          <a href="#polls" className="btn btn-secondary btn-lg">Browse Polls</a>
        </div>
      </div>
      <div className="hero-stats">
        <div className="hero-stat">
          <span className="hero-stat-value">{polls.length}</span>
          <span className="hero-stat-label">Total Polls</span>
        </div>
        <div className="hero-stat-divider" />
        <div className="hero-stat">
          <span className="hero-stat-value">{activeCount}</span>
          <span className="hero-stat-label">Active Now</span>
        </div>
        <div className="hero-stat-divider" />
        <div className="hero-stat">
          <span className="hero-stat-value">{totalVotes}</span>
          <span className="hero-stat-label">Votes Cast</span>
        </div>
      </div>
    </section>
  );
};

// ─── How It Works ───────────────────────────────────────────────────────────────

const HowItWorks = () => (
  <section className="how-it-works" id="how-it-works">
    <h2 className="section-title">How It Works</h2>
    <div className="steps-grid">
      {[
        { step: "1", title: "Connect Wallet", desc: "Link your MetaMask wallet to authenticate on the Ethereum network." },
        { step: "2", title: "Create a Poll", desc: "Set a title, candidates, and voting window. The poll is deployed on-chain." },
        { step: "3", title: "Cast Your Vote", desc: "Select a candidate and sign the transaction. One vote per address, forever recorded." },
        { step: "4", title: "See Results", desc: "Live vote counts and the winner are publicly visible to anyone." },
      ].map(({ step, title, desc }) => (
        <div className="step-card" key={step}>
          <div className="step-num">Step {step}</div>
          <h3 className="step-title">{title}</h3>
          <p className="step-desc">{desc}</p>
        </div>
      ))}
    </div>
  </section>
);

// ─── Stats Bar ──────────────────────────────────────────────────────────────────

const StatsBar = ({ polls }) => {
  const active = polls.filter(p => getPollStatus(p) === "active").length;
  const ended = polls.filter(p => getPollStatus(p) === "ended").length;
  const upcoming = polls.filter(p => getPollStatus(p) === "upcoming").length;
  const totalVotes = polls.reduce((s, p) => s + p.totalVotes, 0);
  const directors = new Set(polls.map(p => p.director)).size;

  return (
    <section className="stats-bar" id="stats">
      {[
        { label: "Total Polls", value: polls.length },
        { label: "Active", value: active },
        { label: "Upcoming", value: upcoming },
        { label: "Ended", value: ended },
        { label: "Total Votes", value: totalVotes },
        { label: "Creators", value: directors },
      ].map(({ label, value }) => (
        <div className="stat-item" key={label}>
          <span className="stat-value">{value}</span>
          <span className="stat-label">{label}</span>
        </div>
      ))}
    </section>
  );
};

// ─── Footer ─────────────────────────────────────────────────────────────────────

const Footer = () => (
  <footer className="site-footer">
    <div className="footer-inner">
      <div className="footer-brand">
        <span className="brand-name">DecentraVote</span>
      </div>
      <p className="footer-desc">
        A decentralised voting platform built on Ethereum. Transparent, tamper-proof, and open to all.
      </p>
      <div className="footer-meta">
        <span>CN6035 — Mobile &amp; Distributed Systems</span>
        <span className="footer-dot">·</span>
        <span>Solidity · Hardhat · React · Ethers.js</span>
      </div>
    </div>
  </footer>
);

// ─── PollCard ──────────────────────────────────────────────────────────────────

const PollCard = ({ poll, account, onDelete, onSelect }) => {
  const status = getPollStatus(poll);
  const isDirector = account && account.toLowerCase() === poll.director.toLowerCase();

  return (
    <div className="poll-card" onClick={() => onSelect(poll)}>
      <div className="poll-card-header">
        <h3>{poll.title}</h3>
        <Badge status={status} />
      </div>
      <p className="poll-description">{poll.description}</p>
      <div className="poll-meta">
        <span>{poll.totalVotes} votes</span>
        <span>Ends {formatDate(poll.endTime)}</span>
      </div>
      <div className="poll-candidates-preview">
        {poll.candidates.slice(0, 3).map(c => (
          <span key={c.id} className="candidate-chip">{c.name}</span>
        ))}
        {poll.candidates.length > 3 && (
          <span className="candidate-chip candidate-chip-more">+{poll.candidates.length - 3}</span>
        )}
      </div>
      {isDirector && (
        <button
          className="btn btn-danger btn-sm"
          style={{ marginTop: "0.75rem" }}
          onClick={(e) => { e.stopPropagation(); onDelete(poll.id); }}
        >
          Delete Poll
        </button>
      )}
    </div>
  );
};

// ─── PollDetail ────────────────────────────────────────────────────────────────

const PollDetail = ({ poll, account, onVote, onBack }) => {
  const [voted, setVoted] = useState(false);
  const [choice, setChoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const status = getPollStatus(poll);
  const total = poll.candidates.reduce((s, c) => s + c.voteCount, 0);

  useEffect(() => {
    const checkVoted = async () => {
      if (!account) return;
      try {
        const v = await hasVoted(poll.id, account);
        setVoted(v);
      } catch {}
    };
    checkVoted();
  }, [poll.id, account]);

  const handleVote = async (candidateId) => {
    if (!account) return alert("Connect your wallet first!");
    setLoading(true);
    try {
      await onVote(poll.id, candidateId);
      setVoted(true);
      setChoice(candidateId);
    } catch (err) {
      alert("Vote failed: " + (err.reason || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="poll-detail">
      <button className="btn btn-secondary" onClick={onBack}>
        ← Back to Polls
      </button>

      <div className="poll-detail-header">
        <h2>{poll.title}</h2>
        <Badge status={status} />
      </div>

      <p className="poll-detail-desc">{poll.description}</p>

      <div className="poll-times">
        <span>Start: {formatDate(poll.startTime)}</span>
        <span>End: {formatDate(poll.endTime)}</span>
      </div>

      <h3>Candidates</h3>
      <div className="candidates-grid">
        {poll.candidates.map((c) => {
          const pct = total > 0 ? ((c.voteCount / total) * 100).toFixed(1) : 0;
          const isChosen = choice === c.id;

          return (
            <div key={c.id} className={`candidate-card ${isChosen ? "candidate-chosen" : ""}`}>
              <div className="candidate-info">
                <span className="candidate-name">{c.name}</span>
                <span className="candidate-votes">
                  {c.voteCount} vote{c.voteCount !== 1 ? "s" : ""} ({pct}%)
                </span>
              </div>

              <div className="vote-bar-bg">
                <div className="vote-bar-fill" style={{ width: `${pct}%` }} />
              </div>

              {status === "active" && !voted && account && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleVote(c.id)}
                  disabled={loading}
                >
                  {loading ? "Submitting…" : "Vote"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {voted && (
        <div className="alert alert-success">
          Your vote has been recorded on the blockchain.
        </div>
      )}
    </div>
  );
};

// ─── CreatePollModal ───────────────────────────────────────────────────────────

const CreatePollModal = ({ onClose, onCreate }) => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    candidates: ["", ""],
  });
  const [loading, setLoading] = useState(false);

  const updateCandidate = (i, val) => {
    const updated = [...form.candidates];
    updated[i] = val;
    setForm({ ...form, candidates: updated });
  };

  const addCandidate = () =>
    setForm({ ...form, candidates: [...form.candidates, ""] });

  const removeCandidate = (i) => {
    if (form.candidates.length <= 2) return;
    const updated = form.candidates.filter((_, idx) => idx !== i);
    setForm({ ...form, candidates: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const names = form.candidates.filter((c) => c.trim().length > 0);
      await onCreate({
        title: form.title,
        description: form.description,
        startTime: Math.floor(new Date(form.startTime).getTime() / 1000),
        endTime: Math.floor(new Date(form.endTime).getTime() / 1000),
        candidateNames: names,
        candidateImages: names.map(() => ""),
      });
      onClose();
    } catch (err) {
      alert("Error creating poll: " + (err.reason || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Create New Poll</h2>
        <form onSubmit={handleSubmit}>
          <label>Title</label>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            placeholder="e.g. Best Blockchain Platform 2025"
          />

          <label>Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Brief description of the poll"
          />

          <label>Start Time</label>
          <input
            type="datetime-local"
            value={form.startTime}
            onChange={(e) => setForm({ ...form, startTime: e.target.value })}
            required
          />

          <label>End Time</label>
          <input
            type="datetime-local"
            value={form.endTime}
            onChange={(e) => setForm({ ...form, endTime: e.target.value })}
            required
          />

          <label>Candidates (min. 2)</label>
          {form.candidates.map((c, i) => (
            <div key={i} className="candidate-input-row">
              <input
                value={c}
                onChange={(e) => updateCandidate(i, e.target.value)}
                placeholder={`Candidate ${i + 1}`}
                required
              />
              {form.candidates.length > 2 && (
                <button
                  type="button"
                  className="btn btn-danger btn-xs"
                  onClick={() => removeCandidate(i)}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button type="button" className="btn btn-secondary btn-sm" onClick={addCandidate}>
            + Add Candidate
          </button>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Creating…" : "Create Poll"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main App ──────────────────────────────────────────────────────────────────

export default function App() {
  const [account, setAccount] = useState(null);
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState("all");

  const fetchPolls = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllPolls();
      setPolls(data);
    } catch (err) {
      console.error("Failed to load polls:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPolls();
    listenForAccountChanges((accounts) => {
      setAccount(accounts[0] || null);
    });
  }, [fetchPolls]);

  const handleConnect = async () => {
    try {
      const addr = await connectWallet();
      setAccount(addr);
      await fetchPolls();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleVote = async (pollId, candidateId) => {
    await castVote(pollId, candidateId);
    await fetchPolls();
    if (selectedPoll && selectedPoll.id === pollId) {
      const updated = polls.find((p) => p.id === pollId);
      if (updated) setSelectedPoll(updated);
    }
  };

  const handleDelete = async (pollId) => {
    if (!window.confirm("Delete this poll?")) return;
    try {
      await deletePoll(pollId);
      await fetchPolls();
      setSelectedPoll(null);
    } catch (err) {
      alert("Delete failed: " + (err.reason || err.message));
    }
  };

  const handleCreate = async (formData) => {
    await createPoll(formData);
    await fetchPolls();
  };

  const filteredPolls = polls.filter((p) => {
    if (filter === "all") return true;
    return getPollStatus(p) === filter;
  });

  return (
    <div className="app">
      <Header
        account={account}
        onConnect={handleConnect}
        onCreatePoll={() => setShowCreate(true)}
      />

      {!selectedPoll && (
        <>
          <Hero
            account={account}
            onConnect={handleConnect}
            onCreatePoll={() => setShowCreate(true)}
            polls={polls}
          />
          <HowItWorks />
          {polls.length > 0 && <StatsBar polls={polls} />}
        </>
      )}

      <main className="main" id="polls">
        {selectedPoll ? (
          <PollDetail
            poll={selectedPoll}
            account={account}
            onVote={handleVote}
            onBack={() => setSelectedPoll(null)}
          />
        ) : (
          <>
            <div className="polls-section-header">
              <h2 className="section-title" style={{ textAlign: "left", marginBottom: 0 }}>
                All Polls
              </h2>
              <div className="filter-tabs">
                {["all", "active", "upcoming", "ended"].map((f) => (
                  <button
                    key={f}
                    className={`filter-tab ${filter === f ? "active" : ""}`}
                    onClick={() => setFilter(f)}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="loading-center">
                <Spinner />
                <p>Loading polls from blockchain…</p>
              </div>
            ) : filteredPolls.length === 0 ? (
              <div className="empty-state">
                <h3>No polls found</h3>
                <p>{account ? "Create the first poll!" : "Connect your wallet to create a poll."}</p>
                {!account && (
                  <button className="btn btn-primary" style={{ marginTop: "1rem" }} onClick={handleConnect}>
                    Connect MetaMask
                  </button>
                )}
              </div>
            ) : (
              <div className="polls-grid">
                {filteredPolls.map((poll) => (
                  <PollCard
                    key={poll.id}
                    poll={poll}
                    account={account}
                    onDelete={handleDelete}
                    onSelect={setSelectedPoll}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <Footer />

      {showCreate && (
        <CreatePollModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}
