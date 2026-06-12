import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import pastEventsData from '../past-events.json';
import styles from './styles.module.css';

type PastEvent = {
  date: string;
  year: string;
  title: string;
  description: string;
  type: string;
  location: string;
  action: string;
  href: string;
};

const pastEvents = pastEventsData.pastEvents as PastEvent[];

export default function CommunityEvents(): React.JSX.Element {
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
              {pastEvents.map((event) => (
                <article className={styles.eventCard} key={event.title}>
                  <div className={styles.eventDate}>
                    <span>{event.date}</span>
                    <strong>{event.year}</strong>
                  </div>

                  <div className={styles.eventContent}>
                    <div className={styles.eventMeta}>
                      <span>{event.type}</span>
                      <span>{event.location}</span>
                    </div>

                    <h2>{event.title}</h2>
                    <p>{event.description}</p>
                  </div>

                  <Link
                    className='button button--primary button--sm'
                    to={event.href}
                  >
                    {event.action}
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
