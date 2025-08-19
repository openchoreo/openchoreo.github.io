import type {ReactNode} from 'react';
import React from 'react';
import ThemedImage from '@theme/ThemedImage';
import useBaseUrl from '@docusaurus/useBaseUrl';
import SectionHeader from '@site/src/components/common/SectionHeader';
import Button from '@site/src/components/common/Button';
import styles from './styles.module.css';

/**
 * TypeScript Interface for Community Action
 * Each action has a description, button text, link, and themed icons
 */
interface CommunityAction {
  description: string;
  buttonText: string;
  link: string;
  iconLight: string;
  iconDark: string;
}

/**
 * Community actions data
 * Three ways to engage with the OpenChoreo community
 */
const communityActions: CommunityAction[] = [
  {
    description: 'Help shape OpenChoreo by submitting features, fixes, or improvements.',
    buttonText: 'Contribute',
    link: 'https://github.com/openchoreo/openchoreo/blob/main/docs/contributors/README.md',
    iconLight: '/img/icons/community-icon-contribute.webp',
    iconDark: '/img/icons/community-icon-contribute-dark.webp'
  },
  {
    description: 'Identify bugs and suggest enhancements to make the platform better for everyone.',
    buttonText: 'Report Issues',
    link: 'https://github.com/openchoreo/openchoreo/issues',
    iconLight: '/img/icons/community-icon-issues.webp',
    iconDark: '/img/icons/community-icon-issues-dark.webp'
  },
  {
    description: 'Get real-time support, ask questions, and engage with other users and maintainers.',
    buttonText: 'Join Our Discord',
    link: 'https://discord.com/invite/asqDFC8suT',
    iconLight: '/img/icons/community-icon-discord.webp',
    iconDark: '/img/icons/community-icon-discord-dark.webp'
  }
];

/**
 * Individual Community Card Component
 * Renders a card with action details and CTA button
 */
function CommunityCard({action}: { action: CommunityAction }) {
  return (
    <div className={styles.card}>
      <Button to={action.link} className={styles.communityButton}>
        <ThemedImage
          sources={{
            light: useBaseUrl(action.iconLight),
            dark: useBaseUrl(action.iconDark)
          }}
          alt=""
          className={styles.buttonIcon}
        />
        <span>{action.buttonText}</span>
      </Button>
      <p className={styles.description}>{action.description}</p>
    </div>
  );
}

/**
 * Main Community Component
 * Renders the community engagement section
 */
export default function Community(): ReactNode {
  return (
    <section className={styles.section}>
      <div className="container">
        <SectionHeader title="Join the OpenChoreo Community">
          <p>We're building OpenChoreo with you — for the next generation of platform engineering.</p>
        </SectionHeader>

        <div className={styles.grid}>
          {communityActions.map((action, index) => (
            <CommunityCard key={index} action={action}/>
          ))}
        </div>
      </div>
    </section>
  );
}
