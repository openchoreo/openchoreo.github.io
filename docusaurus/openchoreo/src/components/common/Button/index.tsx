import React from 'react';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

type ButtonProps = {
  to: string;
  size?: 'small' | 'medium' | 'large';
  children: React.ReactNode;
  className?: string;
};

export default function Button(props: ButtonProps) {
  const size = props.size || 'medium';
  const className = props.className || '';
  const classes = `${styles.button} ${styles[size]} ${className}`.trim();

  return (
    <Link to={props.to} className={classes}>
      {props.children}
    </Link>
  );
}
