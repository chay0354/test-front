// src/App.jsx
import React, { useState, useEffect } from "react";

function App() {
  const [question, setQuestion] = useState("");
  const [sql, setSql]           = useState("");
  const [results, setResults]   = useState([]);
  const [error, setError]       = useState("");

  const [tables, setTables]               = useState([]);
  const [selectedTable, setSelectedTable] = useState("");
  const [tableData, setTableData]         = useState({ columns: [], rows: [] });
  const [tableError, setTableError]       = useState("");

  // Load table names on mount
  useEffect(() => {
    fetch("/tables")
      .then(res => res.json())
      .then(data => {
        if (data.tables) setTables(data.tables);
        else setTableError(data.error || "Failed to load tables");
      })
      .catch(err => setTableError(err.message));
  }, []);

  const handleAsk = async () => {
    setError(""); setSql(""); setResults([]);
    try {
      const res = await fetch("/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Server error");
      setSql(data.sql);
      setResults(data.results);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleTableChange = async (e) => {
    const table = e.target.value;
    setSelectedTable(table);
    setTableData({ columns: [], rows: [] });
    setTableError("");
    if (!table) return;
    try {
      const res = await fetch(`/tables/${table}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Server error");
      setTableData({ columns: data.columns, rows: data.rows });
    } catch (e) {
      setTableError(e.message);
    }
  };

  return (
    <>
      <style>{`
        html, body, #root {
          margin: 0; padding: 0;
        }
        .app-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding-top: 60px;
          min-height: 100vh;
          background: linear-gradient(-45deg, #1e3a8a, #3b82f6, #60a5fa, #1e3a8a);
          background-size: 400% 400%;
          background-attachment: fixed;
          animation: gradientBG 15s ease infinite;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: #1f2937;
        }
        @keyframes gradientBG {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .title {
          margin-bottom: 16px;
          font-size: 2.5rem;
          font-weight: 600;
          color: #ffffff;
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }

        /* First bubble: fixed width */
        .card {
          background: #ffffff;
          border-radius: 16px;
          padding: 32px;
          max-width: 600px;
          width: 90%;
          box-shadow: 0 12px 24px rgba(0,0,0,0.15);
          text-align: center;
          margin-bottom: 40px;
        }

        /* Second bubble: flexible width */
        .browse-card {
          max-width: 90%;
          width: auto;
        }

        .section-title {
          margin-bottom: 16px;
          font-size: 1.5rem;
          color: #1f2937;
          font-weight: 500;
        }
        .input {
          width: 100%;
          padding: 12px;
          margin-bottom: 16px;
          font-size: 1rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
        }
        .button {
          padding: 12px 24px;
          font-size: 1rem;
          border: none;
          border-radius: 8px;
          background: #2563eb;
          color: #fff;
          cursor: pointer;
          transition: background 0.3s ease;
        }
        .button:hover {
          background: #1d4ed8;
        }
        .error {
          color: #dc2626;
          margin-top: 12px;
        }
        .sql {
          text-align: left;
          background: #f3f4f6;
          padding: 16px;
          border-radius: 8px;
          white-space: pre-wrap;
          margin-top: 24px;
          color: #111827;
        }
        .table-container {
          width: 100%;
          overflow-x: auto;
          margin-top: 24px;
        }
        table {
          width: auto;
          min-width: 100%;
          border-collapse: collapse;
        }
        th, td {
          padding: 12px;
          border: 1px solid #e5e7eb;
          text-align: left;
          color: #111827;
        }
        th {
          background: #f9fafb;
        }
      `}</style>

      <div className="app-container">
        <div className="title">Text-to-SQL</div>
        {/* fixed-width bubble */}
        <div className="card">
          <input
            className="input"
            type="text"
            placeholder="Type your question…"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAsk()}
          />
          <button className="button" onClick={handleAsk}>Ask</button>
          {error && <div className="error">{error}</div>}
          {sql && <pre className="sql">{sql}</pre>}

          {results.length > 0 && (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    {Object.keys(results[0]).map(col => (
                      <th key={col}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.map((row, i) => (
                    <tr key={i}>
                      {Object.values(row).map((val, j) => (
                        <td key={j}>{String(val)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="title">Browse Tables</div>
        {/* flexible-width bubble */}
        <div className="card browse-card">
          <div className="section-title">Select a Table</div>
          {tableError && <div className="error">{tableError}</div>}
          <select
            className="input"
            value={selectedTable}
            onChange={handleTableChange}
          >
            <option value="">-- Choose a table --</option>
            {tables.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {tableData.rows.length > 0 && (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    {tableData.columns.map(col => (
                      <th key={col}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableData.rows.map((row, i) => (
                    <tr key={i}>
                      {tableData.columns.map(col => (
                        <td key={col}>{String(row[col])}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default App;
