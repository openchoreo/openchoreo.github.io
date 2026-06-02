import type {ReactNode} from 'react';
import React from 'react';
import Layout from '@theme/Layout';
import ThemedImage from '@theme/ThemedImage';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {UserPlus, Users} from 'lucide-react';
import Button from '@site/src/components/common/Button';
import styles from './slack.module.css';

type SlackOption = {
  title: string;
  description: string;
  buttonLabel: string;
  buttonLink: string;
  icon: ReactNode;
  iconVariant: 'negative' | 'positive';
  cardVariant: 'default' | 'highlight';
  buttonVariant: 'secondary' | 'primary';
};

const slackOptions: SlackOption[] = [
  {
    title: 'No, not yet',
    description: 'Get your CNCF Slack invite first, then join the OpenChoreo channel.',
    buttonLabel: 'Get CNCF Slack Invite',
    buttonLink: 'https://slack.cncf.io/',
    icon: <UserPlus size={22} aria-hidden="true" />,
    iconVariant: 'negative',
    cardVariant: 'default',
    buttonVariant: 'secondary',
  },
  {
    title: "Yes, I'm already in",
    description: 'Jump straight into the OpenChoreo channel and join the conversation.',
    buttonLabel: 'Join openchoreo',
    buttonLink: 'https://cloud-native.slack.com/channels/openchoreo',
    icon: <Users size={22} aria-hidden="true" />,
    iconVariant: 'positive',
    cardVariant: 'highlight',
    buttonVariant: 'primary',
  },
];

function SlackOptionCard({option}: {option: SlackOption}) {
  return (
    <article className={`${styles.optionCard} ${styles[option.cardVariant]}`}>
      <div className={styles.optionContent}>
        <span className={`${styles.optionIcon} ${styles[option.iconVariant]}`} aria-hidden="true">
          {option.icon}
        </span>
        <div className={styles.optionText}>
          <h3 className={styles.optionTitle}>{option.title}</h3>
          <p className={styles.optionDescription}>{option.description}</p>
        </div>
      </div>
      <Button to={option.buttonLink} className={`${styles.optionButton} ${styles[option.buttonVariant]}`}>
        <span>{option.buttonLabel}</span>
      </Button>
    </article>
  );
}

export default function SlackCommunity(): ReactNode {
  return (
    <Layout
      title="Slack Community"
      description="Join the OpenChoreo community on CNCF Slack."
    >
      <main className={styles.page}>
        <div className="container">
          <section className={styles.shell}>
            <div className={styles.section}>
              <div className={styles.iconWrap}>
                <ThemedImage
                  alt="Slack"
                  className={styles.icon}
                  sources={{
                    light: useBaseUrl('/img/icons/community-icon-slack.png'),
                    dark: useBaseUrl('/img/icons/community-icon-slack-dark.png'),
                  }}
                />
              </div>

              <div className={styles.header}>
                <h1>Join OpenChoreo on Slack</h1>
                <p className={styles.subtitle}>Connect with the community, ask questions, and stay updated.</p>
                <div className={styles.titleUnderline} />
              </div>

              <p className={styles.prompt}>Are you already a member of the CNCF Slack workspace?</p>

              <div className={styles.optionsGrid}>
                {slackOptions.map((option) => (
                  <SlackOptionCard key={option.title} option={option} />
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
    </Layout>
  );
}
