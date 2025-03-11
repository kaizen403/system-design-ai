"use client";

import { useState } from "react";

export default function Home() {
  const [idea, setIdea] = useState("");
  const [svgOutput, setSvgOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setLoading(true);
    setSvgOutput("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea }),
      });
      const data = await res.json();
      if (data.svg) {
        setSvgOutput(data.svg);
      } else {
        setSvgOutput("No SVG generated.");
      }
    } catch {
      setSvgOutput("Error generating SVG.");
    }
    setLoading(false);
  }

  return (
    <div style={containerStyle}>
      {!submitted && (
        <div style={introStyle}>
          <h1 style={headingStyle}>System Design AI</h1>
          <p style={subheadingStyle}>Idea into reality in seconds.</p>
          <form onSubmit={handleSubmit} style={formStyle}>
            <input
              type="text"
              placeholder="Enter your idea here"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              style={inputStyle}
              autoFocus
            />
            <button type="submit" style={buttonStyle}>
              Generate
            </button>
          </form>
        </div>
      )}
      {submitted && loading && (
        <div style={loadingStyle}>
          <div className="spinner" style={spinnerStyle}></div>
          <p style={loadingTextStyle}>Generating architecture...</p>
        </div>
      )}
      {submitted && !loading && svgOutput && (
        <div
          style={svgContainerStyle}
          dangerouslySetInnerHTML={{ __html: svgOutput }}
        ></div>
      )}

      <style jsx>{`
        .spinner {
          border: 8px solid #f3f3f3;
          border-top: 8px solid #0070f3;
          border-radius: 50%;
          width: 60px;
          height: 60px;
          animation: spin 1s linear infinite;
          margin: auto;
        }
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

// Inline styles with gradient background added
const containerStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #f7f7f7, #e0e0e0)",
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  transition: "all 0.5s ease-in-out",
  padding: "2rem",
};

const introStyle: React.CSSProperties = {
  textAlign: "center",
  animation: "fadeIn 1s ease-in-out",
};

const headingStyle: React.CSSProperties = {
  fontSize: "3rem",
  marginBottom: "0.5rem",
  fontWeight: "bold",
};

const subheadingStyle: React.CSSProperties = {
  fontSize: "1.5rem",
  marginBottom: "2rem",
};

const formStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
};

const inputStyle: React.CSSProperties = {
  width: "500px",
  padding: "1rem",
  fontSize: "1.25rem",
  borderRadius: "8px",
  border: "2px solid #ddd",
  outline: "none",
  transition: "all 0.3s ease",
};

const buttonStyle: React.CSSProperties = {
  marginLeft: "1rem",
  padding: "1rem 2rem",
  fontSize: "1.25rem",
  borderRadius: "8px",
  border: "none",
  background: "#0070f3",
  color: "#fff",
  cursor: "pointer",
  transition: "all 0.3s ease",
};

const loadingStyle: React.CSSProperties = {
  textAlign: "center",
  animation: "fadeIn 1s ease-in-out",
};

const spinnerStyle: React.CSSProperties = {
  marginBottom: "1rem",
};

const loadingTextStyle: React.CSSProperties = {
  fontSize: "1.5rem",
};

const svgContainerStyle: React.CSSProperties = {
  animation: "fadeIn 1s ease-in-out",
  textAlign: "center",
};
