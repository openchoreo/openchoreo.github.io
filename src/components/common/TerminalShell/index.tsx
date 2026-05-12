import React from "react";
import clsx from "clsx";
import styles from "./styles.module.css";

type TerminalShellProps = {
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  style?: React.CSSProperties;
};

export default function TerminalShell({
  children,
  className,
  bodyClassName,
  style,
}: TerminalShellProps) {
  return (
    <div className={clsx(styles.shell, className)} style={style}>
      <div className={styles.chrome}>
        <div className={styles.dots} aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className={styles.title}>Claude Code, Codex, OpenCode, Gemini connected to OpenChoreo MCP Servers</div>
      </div>
      <div className={clsx(styles.body, bodyClassName)}>{children}</div>
    </div>
  );
}
