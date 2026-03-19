import React, {useEffect, useRef, useState} from 'react';
import styles from './styles.module.css';

type ExpandableImageProps = {
  src: string;
  alt: string;
  className?: string;
  hintText?: string;
};

/**
 * Reusable image component with a full-screen lightbox view.
 */
export default function ExpandableImage({
  src,
  alt,
  className = '',
  hintText = 'Click to expand',
}: ExpandableImageProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const containerClassName = [styles.container, className].filter(Boolean).join(' ');

  useEffect(() => {
    if (!isFullscreen) {
      return undefined;
    }

    const originalOverflow = document.body.style.overflow;
    previouslyFocusedElementRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsFullscreen(false);
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);

      const elementToRestore =
        previouslyFocusedElementRef.current === triggerRef.current
          ? triggerRef.current
          : previouslyFocusedElementRef.current ?? triggerRef.current;

      if (elementToRestore && document.contains(elementToRestore)) {
        elementToRestore.focus();
      }
    };
  }, [isFullscreen]);

  return (
    <>
      <div className={containerClassName}>
        <button
          ref={triggerRef}
          type="button"
          className={styles.imageButton}
          onClick={() => setIsFullscreen(true)}
          aria-label={`Open ${alt} in full screen`}
        >
          <img src={src} alt={alt} className={styles.image} />
          <span className={styles.expandHint}>{hintText}</span>
        </button>
      </div>

      {isFullscreen && (
        <div
          className={styles.lightbox}
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          onClick={() => setIsFullscreen(false)}
        >
          <div
            className={styles.lightboxContent}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              ref={closeButtonRef}
              type="button"
              className={styles.closeButton}
              onClick={() => setIsFullscreen(false)}
              aria-label="Close full-screen image"
            >
              ×
            </button>
            <img
              src={src}
              alt={alt}
              className={styles.lightboxImage}
            />
          </div>
        </div>
      )}
    </>
  );
}
