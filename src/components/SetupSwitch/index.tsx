import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import styles from "./styles.module.css";

// A two-way picker for the install guides. Each SetupOption is a panel with a
// title/description shown in the band. Both panels render on the server so
// crawlers and the markdown export see them; after hydration only the selected
// one shows. Options flagged noToc hide the page table of contents while active
// (they don't own the page's headings).

const Ctx = createContext<{ sel: number; setSel: (i: number) => void; mounted: boolean }>({
  sel: 0,
  setSel: () => {},
  mounted: false,
});

interface OptionProps {
  title: string;
  desc: string;
  noToc?: boolean;
  // Marks an interactive panel dropped from the markdown export; no runtime effect.
  interactive?: boolean;
  children: React.ReactNode;
}

export function SetupOption(_props: OptionProps) {
  // Rendered by SetupSwitch via cloneElement, which injects the index.
  const { sel, setSel, mounted } = useContext(Ctx);
  const index = (_props as OptionProps & { _index?: number })._index ?? 0;
  const ref = useRef<HTMLDivElement>(null);
  const pendingId = useRef<string | null>(null);

  // A deep link or TOC click to a heading in this panel reveals it. Wait for
  // hydration: before mount the panel isn't hidden yet, so the guard can't tell.
  useEffect(() => {
    if (!mounted) return;
    const reveal = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id || !ref.current) return;
      const target = document.getElementById(id);
      if (target && ref.current.hidden && ref.current.contains(target)) {
        pendingId.current = id;
        setSel(index);
      }
    };
    reveal();
    window.addEventListener("hashchange", reveal);
    return () => window.removeEventListener("hashchange", reveal);
  }, [setSel, mounted, index]);

  useEffect(() => {
    if (sel === index && pendingId.current) {
      const target = document.getElementById(pendingId.current);
      pendingId.current = null;
      if (target) target.scrollIntoView();
    }
  }, [sel, index]);

  return (
    <div ref={ref} hidden={mounted && sel !== index}>
      {_props.children}
    </div>
  );
}

export function SetupSwitch({ children }: { children: React.ReactNode }) {
  const options = React.Children.toArray(children).filter(React.isValidElement) as React.ReactElement<OptionProps>[];
  const [sel, setSel] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (options[sel]?.props.noToc) root.setAttribute("data-setup-pane", "notoc");
    else root.removeAttribute("data-setup-pane");
    return () => root.removeAttribute("data-setup-pane");
  }, [sel, mounted, options]);

  return (
    <Ctx.Provider value={{ sel, setSel, mounted }}>
      <div className={styles.band} role="tablist">
        {options.map((opt, i) => (
          <button
            key={i}
            type="button"
            className={styles.half}
            role="tab"
            aria-selected={sel === i}
            onClick={() => setSel(i)}
          >
            <span className={styles.title}>{opt.props.title}</span>
            <span className={styles.desc}>{opt.props.desc}</span>
          </button>
        ))}
      </div>
      {options.map((opt, i) => React.cloneElement(opt as React.ReactElement<OptionProps & { _index: number }>, { _index: i, key: i }))}
    </Ctx.Provider>
  );
}
