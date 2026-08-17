"use client";

import React, { useState, useEffect } from "react";
import { Play, Plus, Trash2, Cpu, Zap, Eye, CheckCircle2, XCircle, AlertCircle, RefreshCw, FileCode2, Terminal, Wrench, Grid, List } from "lucide-react";
import GlassSurface from "../ui/GlassSurface";

interface AttackVector {
  description: string;
  auth: { uid: string; [key: string]: any } | null;
  path: string;
  operation: "get" | "create" | "update" | "delete";
  data?: any;
  expectedOutcome: "allowed" | "blocked";
}

interface TestResult {
  description: string;
  expected: "allowed" | "blocked";
  actual?: "allowed" | "blocked";
  passed?: boolean;
  explanation?: string;
  traceTable?: { step: number; operation: string; condition: string; result: string; details: string }[];
  simulationType?: string;
  running?: boolean;
  error?: string;
}

interface RulesPlaygroundProps {
  activeRules: string;
  selectedModel: string;
}

const DEFAULT_TESTS: AttackVector[] = [
  {
    description: "Allow read for authenticated user",
    auth: { uid: "user_abc", email_verified: true },
    path: "/databases/$(database)/documents/users/user_abc",
    operation: "get",
    expectedOutcome: "allowed"
  },
  {
    description: "Block write for unauthenticated user",
    auth: null,
    path: "/databases/$(database)/documents/users/user_xyz",
    operation: "create",
    data: { displayName: "Unauthorized User" },
    expectedOutcome: "blocked"
  }
];

// Helper functions for formatting SQL-like traces
function generateASCIITable(traceTable: any[]): string {
  if (!traceTable || traceTable.length === 0) return "";
  
  const headers = ["STEP", "OPERATION", "CONDITION", "RESULT", "DETAILS"];
  const colWidths = [4, 15, 30, 8, 35];
  
  // Create table divider line
  const divider = "+" + colWidths.map(w => "-".repeat(w + 2)).join("+") + "+";
  
  // Format line helper
  const formatRow = (cols: string[]) => {
    return "|" + cols.map((col, idx) => {
      const w = colWidths[idx];
      const val = col.length > w ? col.substring(0, w - 3) + "..." : col;
      return " " + val.padEnd(w) + " ";
    }).join("|") + "|";
  };
  
  const lines = [
    divider,
    formatRow(headers),
    divider
  ];
  
  traceTable.forEach(row => {
    lines.push(formatRow([
      String(row.step || ""),
      String(row.operation || ""),
      String(row.condition || ""),
      String(row.result || ""),
      String(row.details || "")
    ]));
  });
  
  lines.push(divider);
  return lines.join("\n");
}

const renderSQLTraceTable = (traceTable: any[]) => {
  if (!traceTable || traceTable.length === 0) return null;
  
  return (
    <div className="w-full overflow-x-auto custom-scrollbar border border-border/40 rounded-xl bg-background/90 text-[10px] font-mono leading-relaxed text-zinc-300">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-muted/80 border-b border-border/60 text-muted-foreground uppercase text-[9px] tracking-wider text-left">
            <th className="py-2 px-3 border-r border-border/40 text-center w-12">Step</th>
            <th className="py-2 px-3 border-r border-border/40 w-32">Operation</th>
            <th className="py-2 px-3 border-r border-border/40 w-44">Condition / Code</th>
            <th className="py-2 px-3 border-r border-border/40 text-center w-24">Result</th>
            <th className="py-2 px-3">Details / Bindings</th>
          </tr>
        </thead>
        <tbody>
          {traceTable.map((row, idx) => {
            const resultUpper = String(row.result || "").toUpperCase();
            const isSuccess = resultUpper === "MATCH" || resultUpper === "TRUE" || resultUpper === "ALLOWED" || resultUpper === "PASSED";
            const isFailure = resultUpper === "MISMATCH" || resultUpper === "FALSE" || resultUpper === "BLOCKED" || resultUpper === "FAILED" || resultUpper === "ERROR";
            
            let badgeClass = "text-zinc-400";
            if (isSuccess) badgeClass = "text-emerald-400 font-bold";
            if (isFailure) badgeClass = "text-red-400 font-bold";
            
            return (
              <tr key={idx} className="border-b border-border/20 hover:bg-muted/20 transition-all">
                <td className="py-2 px-3 border-r border-border/20 text-center text-muted-foreground">{row.step}</td>
                <td className="py-2 px-3 border-r border-border/20 text-blue-400 font-semibold">{row.operation}</td>
                <td className="py-2 px-3 border-r border-border/20 text-zinc-200 select-text max-w-xs truncate" title={row.condition}>{row.condition}</td>
                <td className={`py-2 px-3 border-r border-border/20 text-center ${badgeClass}`}>{resultUpper}</td>
                <td className="py-2 px-3 text-zinc-400 select-text leading-normal max-w-sm" title={row.details}>{row.details}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default function RulesPlayground({ activeRules, selectedModel }: RulesPlaygroundProps) {
  const [rules, setRules] = useState<string>("");
  const [testCases, setTestCases] = useState<AttackVector[]>(DEFAULT_TESTS);
  const [results, setResults] = useState<Record<number, TestResult>>({});
  const [selectedIdx, setSelectedIdx] = useState<number | null>(0);
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);
  const [traceViewMode, setTraceViewMode] = useState<"table" | "ascii" | "text">("table");
  
  // Custom test case form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [desc, setDesc] = useState("");
  const [path, setPath] = useState("/databases/$(database)/documents/posts/post_1");
  const [operation, setOperation] = useState<"get" | "create" | "update" | "delete">("get");
  const [isAuth, setIsAuth] = useState(true);
  const [authUid, setAuthUid] = useState("user_123");
  const [authClaimsRaw, setAuthClaimsRaw] = useState("{}");
  const [payloadRaw, setPayloadRaw] = useState("{}");
  const [expected, setExpected] = useState<"allowed" | "blocked">("allowed");
  const [formError, setFormError] = useState("");

  const [model, setModel] = useState<string>(selectedModel || "gemini-2.5-flash");

  // Sync with orchestrator rules and model on load/change
  useEffect(() => {
    if (activeRules) {
      setRules(activeRules);
    }
    if (selectedModel) {
      setModel(selectedModel);
    }
  }, [activeRules, selectedModel]);

  const handleAddTestCase = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!desc.trim()) {
      setFormError("Description is required");
      return;
    }
    if (!path.trim()) {
      setFormError("Document path is required");
      return;
    }

    try {
      let authObj = null;
      if (isAuth) {
        const claims = JSON.parse(authClaimsRaw || "{}");
        authObj = { uid: authUid, ...claims };
      }

      let payloadObj = undefined;
      if (operation === "create" || operation === "update") {
        payloadObj = JSON.parse(payloadRaw || "{}");
      }

      const newCase: AttackVector = {
        description: desc,
        auth: authObj,
        path: path.trim(),
        operation,
        data: payloadObj,
        expectedOutcome: expected
      };

      setTestCases((prev) => [...prev, newCase]);
      setDesc("");
      setAuthClaimsRaw("{}");
      setPayloadRaw("{}");
      setShowAddForm(false);
      
      // Auto select the newly added case
      setSelectedIdx(testCases.length);

    } catch (err: any) {
      setFormError(`JSON parsing error: ${err.message}. Ensure your payload is valid JSON.`);
    }
  };

  const handleDeleteTestCase = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setTestCases((prev) => prev.filter((_, i) => i !== idx));
    setResults((prev) => {
      const newResults = { ...prev };
      delete newResults[idx];
      return newResults;
    });
    if (selectedIdx === idx) {
      setSelectedIdx(null);
    } else if (selectedIdx !== null && selectedIdx > idx) {
      setSelectedIdx(selectedIdx - 1);
    }
  };

  const handleGenerateAI = async () => {
    const rulesToUse = rules || activeRules;
    if (!rulesToUse || rulesToUse.length < 10) return;
    setIsGeneratingAI(true);
    try {
      const res = await fetch("/api/test-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rules: rulesToUse,
          generateAI: true,
          model: model
        })
      });

      if (!res.ok) throw new Error("Failed to generate test cases");
      const data = await res.json();
      
      if (data.testCases && data.testCases.length > 0) {
        setTestCases(data.testCases);
        setResults({});
        setSelectedIdx(0);
      }
    } catch (error: any) {
      console.error(error);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const runSingleTest = async (idx: number) => {
    const rulesToUse = rules || activeRules;
    setResults((prev) => ({
      ...prev,
      [idx]: {
        description: testCases[idx].description,
        expected: testCases[idx].expectedOutcome,
        running: true
      }
    }));

    try {
      const res = await fetch("/api/test-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rules: rulesToUse,
          testCases: [testCases[idx]],
          model: model,
          simulateOnly: false
        })
      });

      if (!res.ok) throw new Error("Failed to run rules validation endpoint");
      
      const data = await res.json();
      if (data.success && data.results && data.results.length > 0) {
        const itemResult = data.results[0];
        setResults((prev) => ({
          ...prev,
          [idx]: {
            description: testCases[idx].description,
            expected: testCases[idx].expectedOutcome,
            actual: itemResult.actual,
            passed: itemResult.passed,
            explanation: itemResult.explanation,
            traceTable: itemResult.traceTable,
            simulationType: itemResult.simulationType,
            running: false
          }
        }));
      } else {
        throw new Error("No results returned from testing service");
      }

    } catch (err: any) {
      setResults((prev) => ({
        ...prev,
        [idx]: {
          description: testCases[idx].description,
          expected: testCases[idx].expectedOutcome,
          running: false,
          error: err.message || "Failed to execute"
        }
      }));
    }
  };

  const runAllTests = async (customRules?: string) => {
    const rulesToUse = customRules || rules || activeRules;
    if (testCases.length === 0 || !rulesToUse) return;
    setIsRunningAll(true);

    // Set all to running state
    const runningStates: Record<number, TestResult> = {};
    testCases.forEach((tc, idx) => {
      runningStates[idx] = {
        description: tc.description,
        expected: tc.expectedOutcome,
        running: true
      };
    });
    setResults(runningStates);

    try {
      const res = await fetch("/api/test-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rules: rulesToUse,
          testCases: testCases,
          model: model,
          simulateOnly: false
        })
      });

      if (!res.ok) throw new Error("Server returned an error running test suite");
      
      const data = await res.json();
      if (data.success && data.results) {
        const finalResults: Record<number, TestResult> = {};
        data.results.forEach((r: any, idx: number) => {
          finalResults[idx] = {
            description: testCases[idx].description,
            expected: testCases[idx].expectedOutcome,
            actual: r.actual,
            passed: r.passed,
            explanation: r.explanation,
            traceTable: r.traceTable,
            simulationType: r.simulationType,
            running: false
          };
        });
        setResults(finalResults);
      }
    } catch (err: any) {
      const errorStates: Record<number, TestResult> = {};
      testCases.forEach((tc, idx) => {
        errorStates[idx] = {
          description: tc.description,
          expected: tc.expectedOutcome,
          running: false,
          error: err.message || "Failed to complete test run"
        };
      });
      setResults(errorStates);
    } finally {
      setIsRunningAll(false);
    }
  };

  const failedCasesList = Object.keys(results)
    .map(idx => parseInt(idx))
    .filter(idx => results[idx]?.passed === false)
    .map(idx => testCases[idx]);

  const hasFailures = failedCasesList.length > 0;

  const handleRepairRules = async () => {
    const rulesToUse = rules || activeRules;
    if (!rulesToUse || failedCasesList.length === 0) return;
    
    setIsRepairing(true);
    try {
      const res = await fetch("/api/repair-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rules: rulesToUse,
          failedCases: failedCasesList,
          model: model
        })
      });

      if (!res.ok) throw new Error("Failed to repair rules");
      
      const data = await res.json();
      if (data.success && data.rules) {
        setRules(data.rules);
        
        // Trigger auto rerun tests using the repaired rules immediately!
        setTimeout(() => {
          runAllTests(data.rules);
        }, 100);
      }
    } catch (err: any) {
      console.error(err);
      alert(`Repair failed: ${err.message || err}`);
    } finally {
      setIsRepairing(false);
    }
  };

  const activeResult = selectedIdx !== null ? results[selectedIdx] : null;
  const activeTestCase = selectedIdx !== null ? testCases[selectedIdx] : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full text-left relative overflow-hidden rounded-[2.5rem] bg-card/90 backdrop-blur-xl border-2 border-border/60 p-4 md:p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* COLUMN 1: Active Rules Editor */}
      <section className="lg:col-span-4 flex flex-col space-y-4 min-w-0">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-base font-black text-foreground flex items-center gap-1.5">
              <FileCode2 className="w-5 h-5 text-primary" /> Active Rules
            </h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Paste or edit your security rules to run tests.
            </p>
          </div>
          
          {activeRules && rules !== activeRules && (
            <button
              onClick={() => setRules(activeRules)}
              className="px-2 py-1 rounded text-[10px] bg-muted hover:bg-muted/80 text-muted-foreground font-bold transition-all"
              title="Reset rules to match current orchestrator results"
            >
              Sync Orchestrator
            </button>
          )}
        </div>

        <div className="flex-1 flex flex-col min-h-[450px] border border-border/40 rounded-2xl bg-background/50 overflow-hidden shadow-inner p-3">
          <textarea
            value={rules}
            onChange={(e) => setRules(e.target.value)}
            placeholder={`rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    // Paste your rules here\n  }\n}`}
            className="w-full h-full min-h-[400px] p-3 rounded-xl bg-background text-foreground font-mono text-xs border border-border/60 focus:ring-1 focus:ring-primary focus:outline-none resize-none leading-relaxed"
          />
        </div>
      </section>

      {/* COLUMN 2: Test Suite Manager */}
      <section className="lg:col-span-4 flex flex-col space-y-4 min-w-0">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-base font-black text-foreground flex items-center gap-1.5">
              <Zap className="w-5 h-5 text-yellow-500" /> Test Suite
            </h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Define the security vectors and check outcomes.
            </p>
          </div>
          
          <div className="flex gap-1.5">
            <button
              onClick={handleGenerateAI}
              disabled={isGeneratingAI || !rules}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-extrabold bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 transition-all disabled:opacity-50"
            >
              {isGeneratingAI ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <Cpu className="w-3 h-3" />
              )}
              AI Cases
            </button>
            
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-extrabold bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 transition-all"
            >
              <Plus className="w-3 h-3" />
              Add Test
            </button>
          </div>
        </div>

        {showAddForm && (
          <GlassSurface width="100%" height="auto" className="p-4 border border-border rounded-xl bg-muted/20">
            <form onSubmit={handleAddTestCase} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground mb-1 uppercase tracking-wider">Description</label>
                <input
                  type="text"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Allow writing to posts if author"
                  className="w-full h-8 px-2.5 rounded-lg bg-background border border-border text-foreground text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground mb-1 uppercase tracking-wider">Operation</label>
                  <select
                    value={operation}
                    onChange={(e) => setOperation(e.target.value as any)}
                    className="w-full h-8 px-2 rounded-lg bg-background border border-border text-foreground text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    <option value="get">Read (get)</option>
                    <option value="create">Create</option>
                    <option value="update">Update</option>
                    <option value="delete">Delete</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground mb-1 uppercase tracking-wider">Expected</label>
                  <select
                    value={expected}
                    onChange={(e) => setExpected(e.target.value as any)}
                    className="w-full h-8 px-2 rounded-lg bg-background border border-border text-foreground text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    <option value="allowed">Allowed</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-muted-foreground mb-1 uppercase tracking-wider">Document Path</label>
                <input
                  type="text"
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  placeholder="/databases/$(database)/documents/users/{userId}"
                  className="w-full h-8 px-2.5 rounded-lg bg-background border border-border text-foreground text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="border-t border-border/60 pt-2.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Authentication context</span>
                  <input
                    type="checkbox"
                    checked={isAuth}
                    onChange={(e) => setIsAuth(e.target.checked)}
                    className="rounded bg-background border-border text-primary focus:ring-0"
                  />
                </div>

                {isAuth && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2 items-center">
                      <span className="text-[10px] font-semibold text-muted-foreground/80">UID</span>
                      <input
                        type="text"
                        value={authUid}
                        onChange={(e) => setAuthUid(e.target.value)}
                        placeholder="user_123"
                        className="col-span-2 h-7 px-2 rounded bg-background border border-border text-foreground text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-muted-foreground/80 mb-1">Custom Claims (JSON)</label>
                      <textarea
                        value={authClaimsRaw}
                        onChange={(e) => setAuthClaimsRaw(e.target.value)}
                        rows={1}
                        placeholder='{ "admin": true }'
                        className="w-full p-1.5 rounded bg-background border border-border text-foreground font-mono text-[10px] focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {(operation === "create" || operation === "update") && (
                <div className="border-t border-border/60 pt-2.5">
                  <label className="block text-[10px] font-bold text-muted-foreground mb-1 uppercase tracking-wider">Payload Data (JSON)</label>
                  <textarea
                    value={payloadRaw}
                    onChange={(e) => setPayloadRaw(e.target.value)}
                    rows={2}
                    placeholder='{ "title": "hello" }'
                    className="w-full p-1.5 rounded bg-background border border-border text-foreground font-mono text-[10px] focus:outline-none"
                  />
                </div>
              )}

              {formError && (
                <div className="text-red-500 text-[10px] flex items-center gap-1 bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-2.5 py-1.5 rounded text-[10px] font-bold bg-muted hover:bg-muted/80 text-muted-foreground transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-2.5 py-1.5 rounded text-[10px] font-bold bg-primary text-primary-foreground hover:bg-primary/95 transition-all shadow"
                >
                  Add Case
                </button>
              </div>
            </form>
          </GlassSurface>
        )}

        <div className="flex-1 overflow-y-auto space-y-2 max-h-[480px] pr-1">
          {testCases.map((tc, idx) => {
            const res = results[idx];
            const isSelected = selectedIdx === idx;
            
            let statusIcon = <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/40" />;
            let containerBorder = isSelected ? "border-primary/50" : "border-border/40 hover:border-border/80";
            
            if (res) {
              if (res.running) {
                statusIcon = <RefreshCw className="w-3.5 h-3.5 text-primary animate-spin" />;
              } else if (res.error) {
                statusIcon = <AlertCircle className="w-3.5 h-3.5 text-red-500" />;
              } else if (res.passed) {
                statusIcon = <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />;
              } else {
                statusIcon = <XCircle className="w-3.5 h-3.5 text-red-500" />;
              }
            }

            return (
              <div
                key={idx}
                onClick={() => setSelectedIdx(idx)}
                className={`flex items-center justify-between p-3 rounded-xl bg-card border-2 cursor-pointer transition-all ${containerBorder}`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex-shrink-0">{statusIcon}</div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-foreground truncate">{tc.description}</p>
                    <p className="text-[9px] text-muted-foreground font-mono truncate mt-0.5">{tc.path}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase ${tc.expectedOutcome === "allowed" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                    {tc.expectedOutcome}
                  </span>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      runSingleTest(idx);
                    }}
                    disabled={res?.running || isRunningAll}
                    className="p-1 rounded bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all disabled:opacity-50"
                  >
                    <Play className="w-3 h-3 fill-current" />
                  </button>

                  <button
                    onClick={(e) => handleDeleteTestCase(idx, e)}
                    className="p-1 rounded bg-muted hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}

          {testCases.length === 0 && (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border/30 rounded-xl">
              <Eye className="w-6 h-6 mx-auto opacity-30 mb-1" />
              <p className="text-[10px]">No test cases. Click AI Cases or Add Test above.</p>
            </div>
          )}
        </div>
      </section>

      {/* COLUMN 3: Trace Results & Runner */}
      <section className="lg:col-span-4 flex flex-col space-y-4 min-w-0 h-full">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-base font-black text-foreground flex items-center gap-1.5">
              <Terminal className="w-5 h-5 text-primary" /> Live Simulation
            </h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Trace rules execution logs and outcomes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {hasFailures && (
              <button
                onClick={handleRepairRules}
                disabled={isRepairing || isRunningAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-extrabold bg-amber-600 hover:bg-amber-500 text-white border border-amber-500/40 transition-all shadow disabled:opacity-50"
              >
                {isRepairing ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <Wrench className="w-3 h-3" />
                )}
                Repair Rules
              </button>
            )}

            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="h-8 px-2.5 rounded-lg bg-background border border-border text-foreground text-[10px] focus:ring-1 focus:ring-primary focus:outline-none"
            >
              <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
              <option value="google/gemma-4-26b-a4b-it:free">Gemma 4 26B (Free)</option>
              <option value="google/gemma-4-31b-it:free">Gemma 4 31B (Free)</option>
            </select>

            <button
              onClick={() => runAllTests()}
              disabled={isRunningAll || testCases.length === 0 || !rules}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-black bg-primary text-primary-foreground hover:bg-primary/95 transition-all shadow disabled:opacity-50"
            >
              {isRunningAll ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <Play className="w-3 h-3 fill-current" />
              )}
              Run All
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-[450px] border border-border/40 rounded-2xl bg-muted/10 overflow-hidden shadow-inner p-3">
          {activeTestCase ? (
            <div className="flex flex-col h-full space-y-4">
              {/* Test Case Overview */}
              <div className="bg-card/75 border border-border/30 p-3 rounded-xl">
                <h3 className="text-xs font-black text-foreground truncate">{activeTestCase.description}</h3>
                <div className="flex items-center justify-between mt-2.5 font-mono text-[9px] text-muted-foreground">
                  <span className="bg-muted px-1.5 py-0.5 rounded text-foreground uppercase">{activeTestCase.operation}</span>
                  <span className="truncate ml-2">{activeTestCase.path}</span>
                </div>
                
                <div className="flex justify-between items-center border-t border-border/30 mt-2.5 pt-2">
                  <div className="flex flex-col">
                    <span className="text-[8px] text-muted-foreground font-bold">EXPECTED</span>
                    <span className={`text-[10px] font-black uppercase ${activeTestCase.expectedOutcome === "allowed" ? "text-green-400" : "text-red-400"}`}>
                      {activeTestCase.expectedOutcome}
                    </span>
                  </div>
                  {activeResult && activeResult.actual && (
                    <div className="flex flex-col text-right">
                      <span className="text-[8px] text-muted-foreground font-bold">ACTUAL</span>
                      <span className={`text-[10px] font-black uppercase ${activeResult.actual === "allowed" ? "text-green-400" : "text-red-400"}`}>
                        {activeResult.actual}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Execution Trace */}
              <div className="flex-1 flex flex-col min-h-0 border border-border/30 rounded-xl bg-background/90 overflow-hidden">
                <div className="bg-muted/40 border-b border-border/30 px-3 py-1.5 flex justify-between items-center text-[9px]">
                  <span className="font-bold text-muted-foreground uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Evaluation Trace Log
                  </span>
                  
                  {activeResult?.traceTable && activeResult.traceTable.length > 0 && (
                    <div className="flex bg-background border border-border/40 rounded-md p-0.5 gap-1 select-none">
                      <button
                        onClick={() => setTraceViewMode("table")}
                        className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold flex items-center gap-0.5 transition-all ${traceViewMode === "table" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                      >
                        <Grid className="w-2.5 h-2.5" /> Table
                      </button>
                      <button
                        onClick={() => setTraceViewMode("ascii")}
                        className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold flex items-center gap-0.5 transition-all ${traceViewMode === "ascii" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                      >
                        <Terminal className="w-2.5 h-2.5" /> SQL CLI
                      </button>
                      <button
                        onClick={() => setTraceViewMode("text")}
                        className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold flex items-center gap-0.5 transition-all ${traceViewMode === "text" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                      >
                        <List className="w-2.5 h-2.5" /> Text
                      </button>
                    </div>
                  )}
                  
                  {activeResult?.simulationType && (!activeResult?.traceTable || activeResult.traceTable.length === 0) && (
                    <span className="text-[8px] font-extrabold uppercase text-primary">
                      {activeResult.simulationType}
                    </span>
                  )}
                </div>

                <div className="flex-1 p-3 font-mono text-[10px] overflow-y-auto max-h-[300px] leading-relaxed text-foreground select-text selection:bg-primary/30">
                  {activeResult ? (
                    activeResult.running ? (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
                        <RefreshCw className="w-5 h-5 animate-spin text-primary mb-2" />
                        <p className="text-[10px]">Evaluating rules against request context...</p>
                      </div>
                    ) : activeResult.error ? (
                      <div className="text-red-400 bg-red-950/10 p-2.5 rounded-lg border border-red-500/10">
                        <p className="font-bold">Error</p>
                        <p className="mt-1">{activeResult.error}</p>
                      </div>
                    ) : (
                      traceViewMode === "table" && activeResult.traceTable && activeResult.traceTable.length > 0 ? (
                        renderSQLTraceTable(activeResult.traceTable)
                      ) : traceViewMode === "ascii" && activeResult.traceTable && activeResult.traceTable.length > 0 ? (
                        <pre className="whitespace-pre overflow-x-auto text-[9px] text-emerald-400 font-mono bg-zinc-950 p-3 rounded-lg border border-border/40 leading-4">
                          {generateASCIITable(activeResult.traceTable)}
                        </pre>
                      ) : (
                        <div className="whitespace-pre-wrap text-emerald-400/90 leading-5">
                          {activeResult.explanation}
                        </div>
                      )
                    )
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
                      <Play className="w-5 h-5 text-muted-foreground/30 mb-1" />
                      <p className="text-[10px]">Click Run to execute trace.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground py-16 text-center">
              <Eye className="w-8 h-8 opacity-20 mb-2" />
              <p className="text-xs font-semibold">No Case Selected</p>
              <p className="text-[10px] mt-0.5">Select a test case to view trace logs.</p>
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
