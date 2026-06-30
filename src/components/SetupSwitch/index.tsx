import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import styles from "./styles.module.css";

// Split switch for the install pages. Both panels stay in the DOM and toggle
// via `hidden` (not unmounted) so the manual guide stays crawlable.

type Choice = "agent" | "manual";

const SwitchCtx = createContext<{ sel: Choice; setSel: (s: Choice) => void }>({
  sel: "agent",
  setSel: () => {},
});

export function SetupSwitch({ children }: { children: React.ReactNode }) {
  const [sel, setSel] = useState<Choice>("agent");

  // Expose the active pane on <html> so the page TOC (rendered outside this
  // component) can hide the manual headings while the agent panel is showing.
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-setup-pane", sel);
    return () => root.removeAttribute("data-setup-pane");
  }, [sel]);

  return (
    <SwitchCtx.Provider value={{ sel, setSel }}>
      <div className={styles.band} role="tablist">
        <button
          type="button"
          className={styles.half}
          role="tab"
          aria-selected={sel === "agent"}
          onClick={() => setSel("agent")}
        >
          <span className={styles.title}>Set this up with your agent</span>
          <span className={styles.desc}>Install the skill and paste one prompt into Claude Code, Codex, Cursor, or any coding agent.</span>
        </button>
        <button
          type="button"
          className={styles.half}
          role="tab"
          aria-selected={sel === "manual"}
          onClick={() => setSel("manual")}
        >
          <span className={styles.title}>Set this up manually</span>
          <span className={styles.desc}>Install each plane yourself, step by step, and learn what every piece does and how it fits together.</span>
        </button>
      </div>
      {children}
    </SwitchCtx.Provider>
  );
}

export function SetupAgent({ children }: { children: React.ReactNode }) {
  const { sel } = useContext(SwitchCtx);
  return <div hidden={sel !== "agent"}>{children}</div>;
}

export function SetupManual({ children }: { children: React.ReactNode }) {
  const { sel, setSel } = useContext(SwitchCtx);
  const ref = useRef<HTMLDivElement>(null);
  const pendingId = useRef<string | null>(null);

  // A deep link or TOC click to a manual heading should reveal this panel.
  useEffect(() => {
    const reveal = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id || !ref.current) return;
      const target = document.getElementById(id);
      if (target && ref.current.hidden && ref.current.contains(target)) {
        pendingId.current = id;
        setSel("manual");
      }
    };
    reveal();
    window.addEventListener("hashchange", reveal);
    return () => window.removeEventListener("hashchange", reveal);
  }, [setSel]);

  useEffect(() => {
    if (sel === "manual" && pendingId.current) {
      const target = document.getElementById(pendingId.current);
      pendingId.current = null;
      if (target) target.scrollIntoView();
    }
  }, [sel]);

  return (
    <div ref={ref} hidden={sel !== "manual"}>
      {children}
    </div>
  );
}
