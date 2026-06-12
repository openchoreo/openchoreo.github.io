import React, { useMemo, useState } from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';
import communityEvents from './events.json';

type EventCategory = 'Meetups' | 'Community calls' | 'Conferences';

type EventItem = {
  month: string;
  day: string;
  category: EventCategory;
  title: string;
  meta: string;
  primaryAction: string;
  primaryActionHref: string;
};

type PastEventItem = {
  date: string;
  title: string;
  action: string;
  actionHref: string;
};

const events = communityEvents.events as EventItem[];
const pastEvents = communityEvents.pastEvents as PastEventItem[];

const filters = [
  'All',
  ...Array.from(new Set(events.map((event) => event.category))),
];

const categoryMeta: Record<
  string,
  {
    tag: string;
    variant: string;
  }
> = {
  Meetups: {
    tag: 'Meetup',
    variant: 'amber',
  },
  'Community calls': {
    tag: 'Community call',
    variant: 'blue',
  },
  Conferences: {
    tag: 'Conference',
    variant: 'green',
  },
};

function getCategoryMeta(category: string) {
  return (
    categoryMeta[category] ?? {
      tag: category,
      variant: 'blue',
    }
  );
}

const channels = [
  {
    title: 'Slack',
    description: 'CNCF Slack - #openchoreo',
    cta: 'Join',
    href: '/slack',
    icon: SlackIcon,
  },
  {
    title: 'GitHub',
    description: 'Issues, PRs, discussions',
    cta: 'Star',
    href: 'https://github.com/openchoreo/openchoreo',
    icon: GitHubIcon,
  },
  {
    title: 'YouTube',
    description: 'Demos and community calls',
    cta: 'Subscribe',
    href: 'https://www.youtube.com/channel/UCDbwm2OF2KI6C9awR9TnNEg',
    icon: YouTubeIcon,
  },
  {
    title: 'LinkedIn',
    description: 'News and announcements',
    cta: 'Follow',
    href: 'https://www.linkedin.com/company/openchoreo/',
    icon: LinkedInIcon,
  },
  {
    title: 'X',
    description: 'Updates and conversations',
    cta: 'Follow',
    href: 'https://x.com/openchoreo',
    icon: XIcon,
  },
];

export default function Community(): React.JSX.Element {
  const [activeFilter, setActiveFilter] = useState('All');

  const filteredEvents = useMemo(() => {
    if (activeFilter === 'All') {
      return events;
    }

    return events.filter((event) => event.category === activeFilter);
  }, [activeFilter]);

  return (
    <Layout
      title='Community'
      description='Join the OpenChoreo community, explore events and resources, and help shape the project.'
    >
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.container}>
            <h1>Community</h1>
            <p>
              OpenChoreo is an open-source project driven by its community.
              Learn, contribute, share your experiences, and collaborate with
              platform engineers from around the world.
            </p>
          </div>
        </section>
        <section className={styles.section}>
          <div className={styles.container}>
            <h2>Events</h2>
            <p className={styles.sectionLead}>
              Join the OpenChoreo community online and in person.
            </p>

            <div className={styles.filters} aria-label='Event filters'>
              {filters.map((filter) => {
                const count =
                  filter === 'All'
                    ? events.length
                    : events.filter((event) => event.category === filter)
                        .length;

                return (
                  <button
                    className={[
                      'button',
                      activeFilter === filter
                        ? 'button--primary'
                        : 'button--secondary',
                      styles.filterButton,
                    ].join(' ')}
                    type='button'
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    aria-pressed={activeFilter === filter}
                  >
                    {filter}
                    <span className={styles.filterCount}>{count}</span>
                  </button>
                );
              })}
            </div>

            <div className={styles.eventGrid}>
              {filteredEvents.map((event) => {
                const eventCategoryMeta = getCategoryMeta(event.category);

                return (
                  <article className={styles.eventCard} key={event.title}>
                    <div
                      className={[
                        styles.eventDate,
                        event.day.length > 2 ? styles.eventDateRange : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      <span>{event.month}</span>
                      <strong>{event.day}</strong>
                    </div>

                    <div className={styles.eventDivider} />

                    <div className={styles.eventBody}>
                      <span
                        className={[
                          styles.eventTag,
                          styles[`tag${eventCategoryMeta.variant}`],
                        ].join(' ')}
                      >
                        {eventCategoryMeta.tag}
                      </span>

                      <h3>{event.title}</h3>
                      <p>{event.meta}</p>

                      <div className={styles.eventActions}>
                        {event.primaryActionHref ? (
                          <Link
                            className={`button button--primary button--sm ${styles.eventActionButton}`}
                            to={event.primaryActionHref}
                          >
                            {event.primaryAction}
                          </Link>
                        ) : (
                          <button
                            className={`button button--primary button--sm ${styles.eventActionButton}`}
                            type='button'
                            disabled
                          >
                            {event.primaryAction}
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className={styles.pastDivider}>
              <span>Past events</span>
            </div>

            <div className={styles.pastEventList}>
              {pastEvents.map((event) => (
                <article className={styles.pastEvent} key={event.title}>
                  <span>{event.date}</span>
                  <strong>{event.title}</strong>
                  <Link
                    className='button button--link button--sm'
                    to={event.actionHref}
                  >
                    {event.action}
                  </Link>
                </article>
              ))}
            </div>

            <div className={styles.pastEventsMore}>
              <Link to='/community/events'>
                See More <span aria-hidden='true'>→</span>
              </Link>
            </div>
          </div>
        </section>

        {/*To be added once resourced are created and we have more content */}
        {/* <section className={styles.section}>
          <div className={styles.container}>
            <h2>Resources</h2>
            <p className={styles.sectionLead}>
              Help spread the word about OpenChoreo using community resources.
            </p>

            <div className={styles.resourceMinimalGrid}>
              <article className={styles.resourceMinimalItem}>
                <div className={styles.resourceHeader}>
                  <div className={styles.resourceIcon} aria-hidden='true'>
                    <FolderIcon />
                  </div>
                  <h3>Resource library</h3>
                </div>

                <p>
                  Presentations, slide decks, talk points, and demo scripts
                  maintained by the community.
                </p>

                <Link
                  className='button button--primary'
                  to='/community/resources'
                >
                  Explore resources
                </Link>
              </article>

              <article className={styles.resourceMinimalItem}>
                <div className={styles.resourceHeader}>
                  <div className={styles.resourceIcon} aria-hidden='true'>
                    <MicIcon />
                  </div>
                  <h3>Submit a talk</h3>
                </div>

                <p>
                  Want to speak at a meetup or conference about OpenChoreo? Get
                  assistance from the core team and get featured in our
                  community.
                </p>

                <Link
                  className='button button--primary'
                  to='/community/submit-a-talk'
                >
                  Submit a Talk
                </Link>
              </article>
            </div>
          </div>
        </section> */}
        <section className={styles.section}>
          <div className={styles.container}>
            <h2>Join the community</h2>
            <p className={styles.sectionLead}>
              Find us where you already hang out.
            </p>

            <div className={styles.channelGrid}>
              {channels.map((channel) => {
                const Icon = channel.icon;

                return (
                  <article className={styles.channelCard} key={channel.title}>
                    <div className={styles.channelIcon} aria-hidden='true'>
                      <Icon />
                    </div>
                    <h3>{channel.title}</h3>
                    <p>{channel.description}</p>
                    <Link
                      className='button button--primary button--sm'
                      to={channel.href}
                    >
                      {channel.cta}
                    </Link>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
        <section className={styles.section}>
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <div>
                <h2>Adopters</h2>
                <p className={styles.sectionLead}>
                  See who's building with OpenChoreo and add your organization
                  to the list.
                </p>
              </div>
            </div>

            <article className={styles.adoptersCard}>
              <div className={styles.adoptersContent}>
                <h3>Using OpenChoreo?</h3>
                <p>
                  Whether you're running it in production, piloting it, or just
                  exploring, we'd love to have you in the community.
                </p>
              </div>

              <Link
                className={`button button--primary ${styles.adoptersButton}`}
                to='https://github.com/openchoreo/openchoreo/blob/main/ADOPTERS.md'
              >
                Add Your Organization
              </Link>
            </article>
          </div>
        </section>
      </main>
    </Layout>
  );
}

function SlackIcon() {
  return (
    <svg viewBox='0 0 122.8 122.8' aria-hidden='true'>
      <path
        fill='#E01E5A'
        d='M25.8 77.6c0 7.1-5.8 12.9-12.9 12.9S0 84.7 0 77.6s5.8-12.9 12.9-12.9h12.9v12.9z'
      />
      <path
        fill='#E01E5A'
        d='M32.3 77.6c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9v32.3c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V77.6z'
      />
      <path
        fill='#36C5F0'
        d='M45.2 25.8c-7.1 0-12.9-5.8-12.9-12.9S38.1 0 45.2 0s12.9 5.8 12.9 12.9v12.9H45.2z'
      />
      <path
        fill='#36C5F0'
        d='M45.2 32.3c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H12.9C5.8 58.1 0 52.3 0 45.2s5.8-12.9 12.9-12.9h32.3z'
      />
      <path
        fill='#2EB67D'
        d='M97 45.2c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9-5.8 12.9-12.9 12.9H97V45.2z'
      />
      <path
        fill='#2EB67D'
        d='M90.5 45.2c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V12.9C64.7 5.8 70.5 0 77.6 0s12.9 5.8 12.9 12.9v32.3z'
      />
      <path
        fill='#ECB22E'
        d='M77.6 97c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9-12.9-5.8-12.9-12.9V97h12.9z'
      />
      <path
        fill='#ECB22E'
        d='M77.6 90.5c-7.1 0-12.9-5.8-12.9-12.9s5.8-12.9 12.9-12.9h32.3c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H77.6z'
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox='0 0 24 24' aria-hidden='true'>
      <path
        fill='currentColor'
        d='M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2.17c-3.2.7-3.87-1.36-3.87-1.36-.52-1.34-1.28-1.7-1.28-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.68 0-1.25.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.16 1.18A10.9 10.9 0 0 1 12 6.02c.98 0 1.96.13 2.88.38 2.19-1.49 3.15-1.18 3.15-1.18.63 1.58.23 2.75.12 3.04.74.8 1.18 1.83 1.18 3.08 0 4.42-2.69 5.39-5.25 5.67.41.36.78 1.07.78 2.16v3.18c0 .31.21.67.8.56A11.52 11.52 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z'
      />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg viewBox='0 0 24 24' aria-hidden='true'>
      <path
        fill='#FF0000'
        d='M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31.3 31.3 0 0 0 0 12a31.3 31.3 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31.3 31.3 0 0 0 24 12a31.3 31.3 0 0 0-.5-5.8z'
      />
      <path fill='#fff' d='M9.6 15.6V8.4L15.8 12l-6.2 3.6z' />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox='0 0 24 24' aria-hidden='true'>
      <path
        fill='#0A66C2'
        d='M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.95v5.66H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.32 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.1 20.45H3.54V9H7.1v11.45zM22.23 0H1.76C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.76 24h20.47c.97 0 1.77-.77 1.77-1.72V1.72C24 .77 23.2 0 22.23 0z'
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox='0 0 24 24' aria-hidden='true'>
      <path
        fill='currentColor'
        d='M18.9 2H22l-6.8 7.8L23.2 22h-6.3L12 14.6 6.4 22H3.3l7.3-8.4L2.8 2h6.5l4.4 6.6L18.9 2zm-1.1 17.9h1.7L8.4 4H6.6l11.2 15.9z'
      />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg viewBox='0 0 24 24' aria-hidden='true'>
      <path
        d='M3 6.75A2.75 2.75 0 0 1 5.75 4h4.1c.73 0 1.42.29 1.94.8l1.41 1.45h5.05A2.75 2.75 0 0 1 21 9v6.25A2.75 2.75 0 0 1 18.25 18H5.75A2.75 2.75 0 0 1 3 15.25v-8.5Z'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.8'
        strokeLinejoin='round'
      />
      <path
        d='M3.75 10h16.5l-1.4 6.1A2.4 2.4 0 0 1 16.5 18H5.75A2.75 2.75 0 0 1 3 15.25V12.7A2.7 2.7 0 0 1 5.7 10h14.55'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.8'
        strokeLinejoin='round'
      />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg viewBox='0 0 24 24' aria-hidden='true'>
      <path
        d='M12 14a3.5 3.5 0 0 0 3.5-3.5v-4a3.5 3.5 0 0 0-7 0v4A3.5 3.5 0 0 0 12 14Z'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.8'
      />
      <path
        d='M5.5 10.5a6.5 6.5 0 0 0 13 0M12 17v4M8.5 21h7'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.8'
        strokeLinecap='round'
      />
    </svg>
  );
}
