import type {ReactNode} from 'react';
import React from 'react';
import styles from './styles.module.css';

type CardGridProps = {
  children: ReactNode;
  columns?: number;
};

type CardProps = {
  title: string;
  children: ReactNode;
  variant?: 'default' | 'flat';
};

export function CardGrid({children, columns}: CardGridProps): ReactNode {
  const style = columns
    ? {gridTemplateColumns: `repeat(${columns}, 1fr)`}
    : undefined;

  return (
    <div className={styles.grid} style={style}>
      {children}
    </div>
  );
}

export function Card({title, children, variant = 'default'}: CardProps): ReactNode {
  const cardClass = variant === 'flat'
    ? `${styles.card} ${styles.cardFlat}`
    : styles.card;

  return (
    <div className={cardClass}>
      <h3 className={styles.cardTitle}>{title}</h3>
      <div className={styles.cardContent}>{children}</div>
    </div>
  );
}
