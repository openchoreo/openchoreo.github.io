import React, { useMemo } from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import communityEvents from '../events.json';
import styles from './styles.module.css';
import {
  type CommunityEvent,
  useNow,
  splitEvents,
  getCategoryMeta,
  dateSpanLabel,
  yearLabel,
  resolveCta,
} from '@site/src/utils/communityEvents';

const events = communityEvents.events as CommunityEvent[];

export default function CommunityEvents(): React.JSX.Element {
  const now = useNow();
  const { past } = useMemo(() => splitEvents(events, now), [now]);

  return (
    <Layout
      title='Past Events'
      description='Browse past OpenChoreo community events, talks, meetups, and recordings.'
    >
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.container}>
            <Link className={styles.backLink} to='/community'>
              Back to Community
            </Link>

            <h1>Past Events</h1>
            <p>
              Explore OpenChoreo community calls, conference sessions, meetups,
              and recordings from previous events.
            </p>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.container}>
            <div className={styles.eventList}>
              {past.map((event) => {
                const cta = resolveCta(event, true);
                const eventCategoryMeta = getCategoryMeta(event.category);

                return (
                  <article className={styles.eventCard} key={event.title}>
                    <div className={styles.eventDate}>
                      <span>{dateSpanLabel(event)}</span>
                      <strong>{yearLabel(event)}</strong>
                    </div>

                    <div className={styles.eventContent}>
                      <div className={styles.eventMeta}>
                        <span>{eventCategoryMeta.tag}</span>
                        <span>{event.location}</span>
                      </div>

                      <h2>{event.title}</h2>
                      {event.description && <p>{event.description}</p>}
                    </div>

                    <Link
                      className='button button--primary button--sm'
                      to={cta.href}
                    >
                      {cta.label}
                    </Link>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
