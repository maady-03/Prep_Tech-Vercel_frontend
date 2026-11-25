import { useState } from "react";
import { analyzeJD } from "../api/ai";

const MIN_CHARS = 30;
const STEPS = ["reading job description", "loading your profile", "comparing skills", "writing report"];

// Theme lives in plain CSS so colours never depend on Tailwind class order.
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Silkscreen:wght@400;700&family=Space+Mono:wght@400;700&display=swap');
.jd{--ink:#1c1c1c;--bg:#ede6d3;--dot:#d2c9b0;--win:#fff8e1;--card:#fffbf0;--amber:#e8b04b;--rust:#d4603b;--purple:#b7a1f8;--mint:#b5e5cb;--salmon:#f4b9a8;--lav:#e8e4ff;
 min-height:100vh;padding:32px 16px;color:var(--ink);font-family:'Space Mono',monospace;background-color:var(--bg);background-image:radial-gradient(var(--dot) 1px,transparent 1px);background-size:16px 16px}
.jd *{box-sizing:border-box}
.jd .px{font-family:'Silkscreen',monospace;letter-spacing:.12em}
.jd .wrap{max-width:760px;margin:0 auto}
.jd .win{background:var(--win);border:2px solid var(--ink);box-shadow:6px 6px 0 var(--ink)}
.jd .bar{display:flex;align-items:center;gap:12px;background:var(--amber);border-bottom:2px solid var(--ink);padding:8px 12px}
.jd .bar i{flex:1;height:8px;border-top:2px solid var(--ink);border-bottom:2px solid var(--ink)}
.jd .sq{width:20px;height:20px;border:2px solid var(--ink);background:var(--card)}
.jd .body{padding:24px;display:flex;flex-direction:column;gap:20px}
.jd .row{display:flex;gap:16px;align-items:flex-start}
.jd .ico{flex:none;width:34px;height:34px;border:2px solid var(--ink);background:var(--purple);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px}
.jd .card{border:2px solid var(--ink);background:var(--card);padding:16px;flex:1;min-width:0}
.jd .card h3{margin:0 0 12px;font-size:11px;font-weight:400}
.jd textarea{width:100%;resize:vertical;border:2px solid var(--ink);background:#fffdf5;padding:12px;font:14px 'Space Mono',monospace;color:var(--ink)}
.jd textarea:focus{outline:3px solid var(--rust);outline-offset:0}
.jd .foot{display:flex;align-items:center;justify-content:space-between;gap:12px;background:var(--amber);border-top:2px solid var(--ink);padding:14px 24px;font-size:12px}
.jd .btn{background:var(--rust);color:var(--card);border:2px solid var(--ink);box-shadow:4px 4px 0 var(--ink);padding:10px 28px;font:700 14px 'Space Mono',monospace;cursor:pointer}
.jd .btn:active:not(:disabled){transform:translate(3px,3px);box-shadow:none}
.jd .btn:disabled{opacity:.5;cursor:not-allowed}
.jd .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.jd .chips{display:flex;flex-wrap:wrap;gap:8px}
.jd .chip{border:2px solid var(--ink);padding:4px 10px;font-size:12px;font-weight:700}
.jd .ok{background:var(--mint)} .jd .no{background:var(--salmon)}
.jd .next{background:var(--lav)}
.jd .next label{display:flex;gap:12px;align-items:flex-start;cursor:pointer;font-size:14px;margin-bottom:8px}
.jd .next input{appearance:none;flex:none;width:18px;height:18px;margin-top:1px;border:2px solid var(--ink);background:var(--card)}
.jd .next input:checked{background:var(--rust)}
.jd .num{font-weight:700;margin-right:10px}
.jd .done{text-decoration:line-through;opacity:.5}
.jd .seg{display:flex;gap:4px;margin-bottom:12px}
.jd .seg span{flex:1;height:20px;border:2px solid var(--ink);background:var(--card)}
.jd .seg .on{background:var(--rust)}
.jd .pulse{animation:jdp 1s steps(2) infinite} @keyframes jdp{50%{opacity:.35}}
.jd .err{background:var(--salmon)}
.jd .link{background:none;border:0;font:700 12px 'Space Mono',monospace;text-decoration:underline;cursor:pointer;color:var(--ink)}
@media(max-width:640px){.jd .grid{grid-template-columns:1fr}.jd .ico{display:none}.jd .body{padding:16px}.jd .foot{padding:12px 16px}}
`;

function ScoreRing({ score }) {
  const r = 50, c = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: 140, height: 140, flex: "none" }}>
      <svg viewBox="0 0 120 120" style={{ transform: "rotate(-90deg)", width: "100%", height: "100%" }}>
        <circle cx="60" cy="60" r={r} fill="none" stroke="#e6dcc0" strokeWidth="14" />
        <circle
          cx="60" cy="60" r={r} fill="none" stroke="#d4603b" strokeWidth="14"
          strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)}
          style={{ transition: "stroke-dashoffset 1s steps(20)" }}
        />
      </svg>
      <div className="px" style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 2 }}>
        <b style={{ fontSize: 34 }}>{score}</b><small style={{ fontSize: 10 }}>/100</small>
      </div>
    </div>
  );
}

export default function Analyzer() {
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [step, setStep] = useState(0);
  const [done, setDone] = useState({});

  const analyze = async () => {
    if (jd.trim().length < MIN_CHARS || loading) return;
    setLoading(true); setError(""); setResult(null); setDone({}); setStep(0);
    const timer = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 1800);
    try {
      setResult(await analyzeJD(jd));
    } catch (e) {
      setError(e.message || "Could not reach the server.");
    } finally {
      clearInterval(timer);
      setLoading(false);
    }
  };

  const reset = () => { setResult(null); setError(""); setJd(""); };

  return (
    <div className="jd">
      <style>{CSS}</style>
      <div className="wrap">
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 }}>
          <h1 className="px" style={{ margin: 0, fontSize: 24 }}>JD_ANALYZER</h1>
          <span style={{ fontSize: 12 }}>PrepTech / tools / <b>analyze-jd</b></span>
        </header>

        <div className="win">
          <div className="bar">
            <span className="sq" /><i />
            <span className="px" style={{ fontSize: 11 }}>JD-ANALYZER.EXE</span>
            <i />
          </div>

          <div className="body">
            {/* INPUT */}
            <div className="row">
              <span className="ico">&gt;_</span>
              <div className="card">
                <h3 className="px">JOB DESCRIPTION</h3>
                <textarea
                  rows={8}
                  value={jd}
                  disabled={loading}
                  onChange={(e) => setJd(e.target.value)}
                  placeholder="paste job description here..."
                />
              </div>
            </div>

            {/* LOADING */}
            {loading && (
              <div className="row">
                <span className="ico">&gt;_</span>
                <div className="card">
                  <h3 className="px">PROCESSING</h3>
                  <div className="seg">
                    {STEPS.map((_, i) => (
                      <span key={i} className={`${i <= step ? "on" : ""} ${i === step ? "pulse" : ""}`} />
                    ))}
                  </div>
                  <div style={{ fontSize: 14 }}>&gt; {STEPS[step]}<span className="pulse">_</span></div>
                </div>
              </div>
            )}

            {/* ERROR */}
            {error && (
              <div className="row">
                <span className="ico">!</span>
                <div className="card err">
                  <h3 className="px">ERROR</h3>
                  <div style={{ fontSize: 14 }}>{error}</div>
                  <button className="link" style={{ marginTop: 8 }} onClick={analyze}>retry</button>
                </div>
              </div>
            )}

            {/* REPORT */}
            {result && (
              <>
                <div className="row">
                  <span className="ico">&gt;_</span>
                  <div className="card" style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
                    <ScoreRing score={result.matchScore} />
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <h3 className="px">MATCH SCORE</h3>
                      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>{result.verdict}</p>
                    </div>
                  </div>
                </div>

                <div className="grid">
                  <div className="card">
                    <h3 className="px">YOU HAVE</h3>
                    <div className="chips">
                      {result.matchedSkills?.length
                        ? result.matchedSkills.map((s) => <span key={s} className="chip ok">+ {s}</span>)
                        : <small>none found</small>}
                    </div>
                  </div>
                  <div className="card">
                    <h3 className="px">YOU'RE MISSING</h3>
                    <div className="chips">
                      {result.missingSkills?.length
                        ? result.missingSkills.map((s) => <span key={s} className="chip no">× {s}</span>)
                        : <small>no gaps</small>}
                    </div>
                  </div>
                </div>

                {result.strengths?.length > 0 && (
                  <div className="card" style={{ flex: "none" }}>
                    <h3 className="px">STRENGTHS</h3>
                    {result.strengths.map((s, i) => (
                      <p key={i} style={{ margin: "0 0 8px", fontSize: 14 }}>
                        <span className="num">{String(i + 1).padStart(2, "0")}</span>{s}
                      </p>
                    ))}
                  </div>
                )}

                <div className="card next" style={{ flex: "none" }}>
                  <h3 className="px">DO THIS NEXT</h3>
                  {result.suggestions?.map((s, i) => (
                    <label key={i}>
                      <input type="checkbox" checked={!!done[i]} onChange={() => setDone((d) => ({ ...d, [i]: !d[i] }))} />
                      <span className={done[i] ? "done" : ""}>{s}</span>
                    </label>
                  ))}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span>answered by {result.model}</span>
                  <button className="link" onClick={reset}>new analysis</button>
                </div>
              </>
            )}
          </div>

          <div className="foot">
            <span>{jd.length} chars (min {MIN_CHARS})</span>
            <button className="btn" onClick={analyze} disabled={loading || jd.trim().length < MIN_CHARS}>
              {loading ? "RUNNING..." : "ANALYZE >"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}