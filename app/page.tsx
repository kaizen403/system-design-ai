"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";

export default function Home() {
  const [idea, setIdea] = useState("");
  const [svgOutput, setSvgOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [cursorVisible, setCursorVisible] = useState(true);

  // Blinking cursor effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible((prev) => !prev);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  // Focus input on load
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50 flex flex-col items-center justify-center p-8 transition-all duration-500 ease-in-out">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]"></div>
      </div>

      {/* Homepage remains unchanged */}
      {!submitted && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-12 relative z-10"
        >
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full bg-blue-100 text-blue-700"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Sparkles size={16} className="text-blue-500" />
            <span className="text-sm font-medium">AI-Powered Design</span>
          </motion.div>

          <motion.h1
            className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            System Design AI
          </motion.h1>

          <motion.p
            className="text-xl text-gray-600 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Idea into reality in seconds.
          </motion.p>

          <motion.form
            onSubmit={handleSubmit}
            className="relative max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-sky-500 to-indigo-500 rounded-lg blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative flex items-center">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Enter your idea here"
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  className="w-full px-6 py-4 text-lg rounded-lg border-2 border-gray-200 bg-white shadow-xl focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                  autoFocus
                />
                {idea.length === 0 && (
                  <span
                    className={`absolute left-[24px] h-5 w-[2px] bg-gray-400 ${
                      cursorVisible ? "opacity-100" : "opacity-0"
                    } transition-opacity duration-100`}
                  ></span>
                )}
                <button
                  type="submit"
                  className="absolute right-2 h-12 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-md shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
                >
                  Generate
                  <ArrowRight size={16} className="ml-1" />
                </button>
              </div>
            </div>
          </motion.form>
        </motion.div>
      )}

      {submitted && loading && (
        <div
          style={{ textAlign: "center", animation: "fadeIn 1s ease-in-out" }}
        >
          <div className="spinner" style={{ marginBottom: "1rem" }}></div>
          <p style={{ fontSize: "1.5rem" }}>Generating architecture...</p>
        </div>
      )}

      {/* SVG output with white background */}
      {submitted && !loading && svgOutput && (
        <div
          style={{
            marginTop: "2rem",
            maxWidth: "600px",
            width: "100%",
            textAlign: "center",
            backgroundColor: "white",
            padding: "1rem",
            borderRadius: "8px",
          }}
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
        .bg-grid-pattern {
          background-size: 40px 40px;
          background-image: linear-gradient(
              to right,
              rgba(128, 128, 128, 0.1) 1px,
              transparent 1px
            ),
            linear-gradient(
              to bottom,
              rgba(128, 128, 128, 0.1) 1px,
              transparent 1px
            );
        }
      `}</style>
    </div>
  );
}
