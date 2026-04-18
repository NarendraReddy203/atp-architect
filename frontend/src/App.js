import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = "http://localhost:8000";

export default function App() {
  const [step, setStep] = useState(1);
  const [proposal, setProposal] = useState("");
  const [userInput, setUserInput] = useState("");
  const [code, setCode] = useState("");
  const [module, setModule] = useState("DDR RAM");
  const [filename, setFilename] = useState("");
  const [hardware, setHardware] = useState("CPU");
  const [metrics, setMetrics] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch history logs
  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API_BASE}/history`);
      setHistory(res.data.history || []);
    } catch {
      setHistory([]);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Upload PDF
  const onUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setFilename(file.name);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(`${API_BASE}/propose`, formData);
      setProposal(res.data.proposal);
      setStep(2);
    } catch {
      alert("Failed to connect to backend.");
    } finally {
      setLoading(false);
    }
  };

  // Generate Code
  const onGenerate = async () => {
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE}/generate`, {
        module,
        user_input: userInput,
        ai_proposal: proposal,
        filename,
        hardware,
      });

      setCode(res.data.code);
      setMetrics({
        time: res.data.execution_time,
        hw: hardware,
      });

      setStep(3);
      fetchHistory();
    } catch {
      alert("Code generation failed.");
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = () => {
    const blob = new Blob([code], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "main.c";
    link.click();
  };

  const reset = () => {
    setStep(1);
    setProposal("");
    setCode("");
    setMetrics(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* HEADER */}
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              ATP Architect
            </h1>
            <p className="text-gray-500 text-sm">
              Embedded Test Code Generator
            </p>
          </div>

          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`px-4 py-1 rounded-full text-sm font-semibold ${
                  step === s
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                Step {s}
              </div>
            ))}
          </div>
        </header>

        {/* STEP 1 */}
        {step === 1 && (
          <div className="bg-white p-10 rounded-xl shadow text-center">
            <h2 className="text-xl font-semibold mb-4">
              Upload Datasheet PDF
            </h2>

            <input
              type="file"
              onChange={onUpload}
              className="block mx-auto"
            />

            {loading && (
              <p className="mt-4 text-blue-500">Analyzing...</p>
            )}
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="grid md:grid-cols-2 gap-6">

            {/* Proposal */}
            <div className="bg-white p-6 rounded-xl shadow">
              <h3 className="font-semibold mb-2">AI Proposal</h3>
              <div className="text-sm text-gray-600 h-72 overflow-auto whitespace-pre-wrap border p-3 rounded">
                {proposal}
              </div>
            </div>

            {/* Controls */}
            <div className="bg-white p-6 rounded-xl shadow space-y-4">

              <textarea
                placeholder="Refine test logic..."
                className="w-full border p-3 rounded"
                onChange={(e) => setUserInput(e.target.value)}
              />

              <select
                value={module}
                onChange={(e) => setModule(e.target.value)}
                className="w-full border p-2 rounded"
              >
                <option>DDR RAM</option>
                <option>I2C Sensor</option>
                <option>SPI Peripheral</option>
                <option>NAND Flash</option>
              </select>

              <select
                value={hardware}
                onChange={(e) => setHardware(e.target.value)}
                className="w-full border p-2 rounded"
              >
                <option>CPU</option>
                <option>Arc GPU</option>
                <option>NPU</option>
              </select>

              <button
                onClick={onGenerate}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-500"
              >
                {loading ? "Generating..." : "Generate Code"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="space-y-6">

            <div className="bg-green-100 p-4 rounded">
              Generated on <b>{metrics?.hw}</b> in{" "}
              <b>{metrics?.time}s</b>
            </div>

            <div className="bg-black text-green-400 p-4 rounded h-96 overflow-auto text-sm">
              <pre>{code}</pre>
            </div>

            <div className="flex gap-3">
              <button
                onClick={downloadFile}
                className="bg-black text-white px-4 py-2 rounded"
              >
                Download main.c
              </button>

              <button
                onClick={reset}
                className="bg-gray-300 px-4 py-2 rounded"
              >
                New Project
              </button>
            </div>
          </div>
        )}

        {/* HISTORY */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="font-semibold mb-4">History</h3>

          {history.length === 0 ? (
            <p className="text-gray-400">No records yet</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2">File</th>
                  <th>Module</th>
                  <th>Hardware</th>
                  <th>Time</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {history.map((row, i) => (
                  <tr key={i} className="border-b">
                    <td className="py-2">{row[1]}</td>
                    <td>{row[2]}</td>
                    <td>{row[4]}</td>
                    <td>{row[5]}s</td>
                    <td>{row[6]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
}
