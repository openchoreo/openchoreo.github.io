import React, { useState } from "react";
import styles from "./styles.module.css";

interface Props {
  children: React.ReactNode;
}

export default function AgentCallout({ children }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.callout}>
      <button
        type="button"
        className={styles.summary}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span>✦&nbsp; Have your agent set this up for you</span>
        <span className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`}>›</span>
      </button>
      {open && <div className={styles.content}>{children}</div>}
    </div>
  );
}
