import type { ReactNode } from 'react';
import React from 'react';
import ThemedImage from '@theme/ThemedImage';
import useBaseUrl from '@docusaurus/useBaseUrl';
import SectionHeader from '@site/src/components/common/SectionHeader';
import Button from '@site/src/components/common/Button';
import styles from './styles.module.css';
import Link from '@docusaurus/Link';

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

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  company: string;
  link: string;
  linkLabel?: string;
  avatar?: string;
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
    description: 'Join #openchoreo channel to get real-time support, ask questions, and engage with other users.',
    buttonText: 'Join CNCF Slack',
    link: '/slack',
    iconLight: '/img/icons/community-icon-slack.png',
    iconDark: '/img/icons/community-icon-slack-dark.png'
  }
];

/**
 * Testimonials data
 * TODO: replace placeholders with real testimonials before shipping.
 * Avatars can live in /static/img/testimonials/ (e.g. avatar: '/img/testimonials/jane.webp').
 */
const testimonials: Testimonial[] = [
  {
    quote:
      'The market is moving from internal developer platforms to agentic developer platforms and OpenChoreo is already there. Not just as a common interface, but as a platform where your developer agents become first-class citizens.',
    name: 'Artem Lajko',
    role: 'Head of Platform Engineering',
    company: 'iits-consulting',
    linkLabel: 'Watch Webinar',
    avatar: '/img/testimonials/artem-lajko.png',
    link: 'https://wso2.com/events/webinars/sovereignty-in-the-age-of-ai/',
  },
  {
    quote:
      'A common pitfall of many developer platforms is the attempt to hide Kubernetes behind proprietary layers. OpenChoreo takes a different approach by augmenting it. It delivers a complete, multi-plane developer platform that provides developers with self-service golden paths without stripping operational control away from infrastructure teams.',
    name: 'Abdel Sghiouar',
    role: 'Senior Developer Advocate',
    company: 'Google',
    linkLabel: 'Watch Video',
    avatar: '/img/testimonials/abdel-sghiouar.jpeg',
    link: 'https://youtu.be/AqGWjxEfj2g?si=I9sAJsOqTSecyEtZ',
  },
  {
    quote:
      'OpenChoreo doesn’t hide the cluster. It gives the right abstractions and makes agents first-class citizens of the platform.',
    name: 'Saiyam Pathak',
    role: 'Head of Developer Relations',
    company: 'vCluster',
    linkLabel: 'Watch Video',
    avatar: '/img/testimonials/saiyam-pathak.jpeg',
    link: 'https://youtu.be/lNi7gXxAbtw?si=NZ90kyZ81sZVZo1Y',
  },
];

/**
 * Builds up to two initials from a name, used when no avatar image is provided
 */
function getInitials(name: string): string {
  return name
    .replace(/[^\p{L}\s]/gu, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

/**
 * Individual Community Card Component
 * Renders a card with action details and CTA button
 */
function CommunityCard({ action }: { action: CommunityAction }) {
  return (
    <div className={styles.card}>
      <Button to={action.link} className={styles.communityButton}>
        <ThemedImage
          sources={{
            light: useBaseUrl(action.iconLight),
            dark: useBaseUrl(action.iconDark),
          }}
          alt=''
          className={styles.buttonIcon}
        />
        <span>{action.buttonText}</span>
      </Button>
      <p className={styles.description}>{action.description}</p>
    </div>
  );
}

/**
 * Avatar Component
 * Shows the avatar image if provided, otherwise the person's initials
 */
function Avatar({ testimonial }: { testimonial: Testimonial }) {
  const avatarUrl = useBaseUrl(testimonial.avatar ?? '');

  if (testimonial.avatar) {
    return (
      <img src={avatarUrl} alt='' className={styles.avatar} loading='lazy' />
    );
  }

  return (
    <span
      className={`${styles.avatar} ${styles.avatarFallback}`}
      aria-hidden='true'
    >
      {getInitials(testimonial.name)}
    </span>
  );
}

/**
 * Individual Testimonial Card Component
 * Renders a quote, a "Learn more" button and the person's details
 */
function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <figure className={styles.testimonialCard}>
      <span className={styles.quoteMark} aria-hidden='true'>
        “
      </span>
      <blockquote className={styles.quote}>
        <p>{testimonial.quote}</p>
      </blockquote>
      <div className={styles.linkRow}>
        {testimonial.link && testimonial.link !== '#' && (
          <Link to={testimonial.link} className={styles.learnMoreLink}>
            {testimonial.linkLabel ?? 'Learn more'}
            <span className={styles.visuallyHidden}>
              {' '}
              from {testimonial.name}
            </span>
          </Link>
        )}
      </div>
      <figcaption className={styles.attribution}>
        <Avatar testimonial={testimonial} />
        <span className={styles.person}>
          <span className={styles.personName}>{testimonial.name}</span>
          <span className={styles.personRole}>
            {testimonial.role}, {testimonial.company}
          </span>
        </span>
      </figcaption>
    </figure>
  );
}

/**
 * Main Community Component
 * Renders the community engagement section and testimonials
 */
export default function Community(): ReactNode {
  return (
    <section className={styles.section}>
      <div className='container'>
        <SectionHeader title='Join the OpenChoreo Community'>
          <p>
            We're building OpenChoreo with you — for the next generation of
            platform engineering.
          </p>
        </SectionHeader>

        <div className={styles.grid}>
          {communityActions.map((action, index) => (
            <CommunityCard key={index} action={action} />
          ))}
        </div>

        {testimonials.length > 0 && (
          <>
            <div className={styles.testimonialsDivider}>
              <h3 className={styles.testimonialsLabel}>From the community</h3>
            </div>

            <div className={styles.testimonialsGrid}>
              {testimonials.map((testimonial, index) => (
                <TestimonialCard key={index} testimonial={testimonial} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
