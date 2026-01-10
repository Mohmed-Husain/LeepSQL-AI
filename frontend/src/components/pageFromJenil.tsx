import React, { useState } from "react";

export const PageFromJenil = () => {
  const [userQuery, setUserQuery] = useState("");
  const [sqlQuery, setSqlQuery] = useState("");
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const generateSQL = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_query: userQuery,
          postgres_url: "",
          db_name: "",
        }),
      });
      const data = await res.json();
      setSqlQuery(data.sql_query || "");
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const executeSQL = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/executer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sql_query: sqlQuery,
        }),
      });
      const data = await res.json();
      setResults(data.results);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Natural Language to SQL</h2>

      <div style={{ display: "flex", gap: 10 }}>
        <input
          style={{ flex: 1, padding: 8 }}
          placeholder="Enter natural language query"
          value={userQuery}
          onChange={(e) => setUserQuery(e.target.value)}
        />
        <button onClick={generateSQL} disabled={loading}>
          Generate SQL
        </button>
      </div>

      {sqlQuery && (
        <>
          <h3>Generated SQL</h3>
          <pre>{sqlQuery}</pre>
          <button onClick={executeSQL} disabled={loading}>
            Execute SQL
          </button>
        </>
      )}

      {results && (
        <>
          <h3>Results</h3>
          <pre>{JSON.stringify(results, null, 2)}</pre>
        </>
      )}
    </div>
  );
};
