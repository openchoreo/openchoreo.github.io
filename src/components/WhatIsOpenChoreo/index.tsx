import type {ReactNode} from 'react';
import React, { useState } from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import SectionHeader from '@site/src/components/common/SectionHeader';
import styles from './styles.module.css';

/**
 * WhatIsOpenChoreo Component
 * This section explains what OpenChoreo is and includes an animated video
 */
export default function WhatIsOpenChoreo(): ReactNode {
  const [videoLoaded, setVideoLoaded] = useState(false);
  return (
    <section className={styles.section}>
      <div className="container">

        <SectionHeader title="What is OpenChoreo?">
          <p>
            OpenChoreo is an internal developer platform that helps platform engineering teams
            streamline developer workflows, simplify complexity, and deliver secure, scalable
            Internal Developer Portals — without building everything from scratch.
          </p>
        </SectionHeader>

        {/* Video Container */}
        <div className={styles.videoContainer}>
          {!videoLoaded && (
            <div className={styles.videoPlaceholder}>
              <div className={styles.loadingSpinner}></div>
              <p>Loading video...</p>
            </div>
          )}
          <video
            className={`${styles.video} ${videoLoaded ? styles.videoLoaded : ''}`}
            autoPlay  // Video plays automatically
            loop      // Video loops continuously
            muted     // Video is muted (required for autoplay in most browsers)
            playsInline // Plays inline on mobile devices
            onLoadedData={() => setVideoLoaded(true)}
            preload="metadata"
            aria-label="Animated visualization of OpenChoreo platform architecture being built layer by layer"
            role="img"  // Treats video as a decorative image since it's like a GIF
            title="OpenChoreo Architecture Animation"
          >
            <source src={useBaseUrl('/videos/openchoreo-architecture-animation.mp4')} type="video/mp4"/>
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
    </section>
  );
}
