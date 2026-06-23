"use client";

import { useEffect, useState } from "react";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("wapi_cookie_consent");
    if (!stored) {
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = (choice: string) => {
    localStorage.setItem("wapi_cookie_consent", choice);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        zIndex: 100,
        maxWidth: 340,
        padding: "var(--spacing-16, 16px)",
        borderRadius: "var(--radius-panels, 12px)",
        border: "1px solid var(--color-graphite-border, #4d4d4d)",
        backgroundColor: "var(--surface-instrument-panel, #000000)",
        fontFamily: "var(--font-times), 'Times New Roman', Georgia, serif",
        fontSize: "var(--text-body-lg, 16px)",
        lineHeight: "var(--leading-body-lg, 1.88)",
        color: "var(--color-pure-white, #ffffff)",
      }}
    >
      <p style={{ margin: 0, marginBottom: "var(--spacing-14, 14px)" }}>
        Our site uses essential cookies and, with your consent, analytics
        cookies. Details in{" "}
        <a
          href="/privacy"
          style={{
            color: "var(--color-ash-link, #c6c6c6)",
            textDecoration: "underline",
          }}
        >
          PRIVACY NOTICE
        </a>
        .
      </p>
      <div
        style={{
          display: "flex",
          gap: "var(--element-gap, 6px)",
          justifyContent: "flex-end",
        }}
      >
        <button
          onClick={() => dismiss("rejected")}
          style={{
            background: "transparent",
            border: "1px solid var(--color-fog-border, #999999)",
            borderRadius: "var(--radius-buttons, 5px)",
            color: "var(--color-pure-white, #ffffff)",
            fontFamily: "var(--font-nbarchitekt), monospace",
            fontSize: 13,
            fontWeight: "var(--font-weight-regular, 400)",
            textTransform: "uppercase",
            padding: "4px 18px",
            cursor: "pointer",
            letterSpacing: "0.05em",
          }}
        >
          Reject
        </button>
        <button
          onClick={() => dismiss("accepted")}
          style={{
            background: "var(--color-midnight-violet, #343755)",
            border: "1px solid var(--color-midnight-violet, #343755)",
            borderRadius: "var(--radius-buttons, 5px)",
            color: "var(--color-pure-white, #ffffff)",
            fontFamily: "var(--font-nbarchitekt), monospace",
            fontSize: 13,
            fontWeight: "var(--font-weight-regular, 400)",
            textTransform: "uppercase",
            padding: "6px 18px",
            cursor: "pointer",
            letterSpacing: "0.05em",
          }}
        >
          Accept
        </button>
      </div>
    </div>
  );
}
