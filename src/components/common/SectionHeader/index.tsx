import React from 'react';
import styles from './styles.module.css';

type SectionHeaderProps = {
  title: string;
  children?: React.ReactNode;
  descriptionLayout?: "two-column";
  /** Heading level for the title; use "h1" when this is the page's main heading. */
  as?: "h1" | "h2";
};

/**
 * Reusable Section Header Component
 * Used across all homepage sections for consistent styling
 * Includes title, decorative underline, and optional description as children
 */
export default function SectionHeader({
  title,
  children,
  descriptionLayout,
  as: Heading = "h2",
}: SectionHeaderProps) {
  return (
    <>
      <div className={styles.header}>
        <Heading className={styles.title}>{title}</Heading>
        <div className={styles.titleUnderline}></div>
      </div>
      {children && (
        <div
          className={`${styles.description} ${
            descriptionLayout === "two-column"
              ? styles.descriptionTwoColumn
              : ""
          }`}
        >
          {children}
        </div>
      )}
    </>
  );
}
