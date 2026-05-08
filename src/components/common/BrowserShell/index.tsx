import React from "react";
import clsx from "clsx";
import styles from "./styles.module.css";

type BrowserShellProps = {
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  style?: React.CSSProperties;
};

export default function BrowserShell({
  children,
  className,
  bodyClassName,
  style,
}: BrowserShellProps) {
  return (
    <div className={clsx(styles.shell, className)} style={style}>
      <div className={styles.chrome}>
        <div className={styles.dots} aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
      <div className={clsx(styles.body, bodyClassName)}>{children}</div>
    </div>
  );
}
