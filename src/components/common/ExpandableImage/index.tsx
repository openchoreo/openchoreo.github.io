import React, { useEffect, useRef, useState } from "react";
import styles from "./styles.module.css";
import clsx from "clsx";

type SvgrComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>;

type ExpandableImageProps = {
  src: string | SvgrComponent;
  alt: string;
  className?: string;
  hintText?: string;
  /** adds a 1rem margin to the bottom of the container, enabled by default */
  gutterBottom?: boolean;
};

/**
 * Reusable image component with a full-screen lightbox view.
 */
export default function ExpandableImage({
  src,
  alt,
  className = "",
  hintText = "Click to expand",
  gutterBottom = true,
}: ExpandableImageProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const containerClassName = clsx({
    [styles.container]: true,
    [className]: Boolean(className),
    [styles.gutterBottom]: gutterBottom,
  });

  const SvgSrc = typeof src !== "string" ? src : null;

  function ImageContent({ imgClassName }: { imgClassName: string }) {
    if (SvgSrc) {
      return <SvgSrc role="img" aria-label={alt} className={imgClassName} />;
    }
    return <img src={src as string} alt={alt} className={imgClassName} />;
  }

  useEffect(() => {
    if (!isFullscreen) {
      return undefined;
    }

    const originalOverflow = document.body.style.overflow;
    previouslyFocusedElementRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsFullscreen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);

      const elementToRestore =
        previouslyFocusedElementRef.current === triggerRef.current
          ? triggerRef.current
          : (previouslyFocusedElementRef.current ?? triggerRef.current);

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
          <ImageContent imgClassName={styles.image} />
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
            <ImageContent imgClassName={styles.lightboxImage} />
          </div>
        </div>
      )}
    </>
  );
}
