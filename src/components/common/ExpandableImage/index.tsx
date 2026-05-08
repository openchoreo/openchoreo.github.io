import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./styles.module.css";
import clsx from "clsx";

type SvgrComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>;

type ExpandableImageProps = {
  src: string | SvgrComponent;
  alt: string;
  className?: string;
  hintText?: string;
  /** makes the trigger behave like a fill media surface instead of a standalone content block */
  fillContainer?: boolean;
  /** removes the component's built-in padded frame so the image can fill edge-to-edge */
  fullBleed?: boolean;
  /** lets the inline image define the container height instead of forcing a fixed fill box */
  wrapToImage?: boolean;
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
  fillContainer = false,
  fullBleed = false,
  wrapToImage = false,
  gutterBottom = true,
}: ExpandableImageProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const containerClassName = clsx(
    styles.container,
    className,
    gutterBottom && styles.gutterBottom,
    fillContainer && styles.fillContainer,
    wrapToImage && styles.wrapToImageContainer,
  );
  const buttonClassName = clsx(
    styles.imageButton,
    fillContainer && styles.fillButton,
    wrapToImage && styles.wrapToImageButton,
  );
  const imageClassName = clsx(
    styles.image,
    fillContainer && styles.fillImage,
    fullBleed && styles.fullBleedImage,
    wrapToImage && styles.wrapToImage,
  );
  const svgImageClassName = clsx(
    imageClassName,
    styles.svgImage,
    fillContainer && styles.fillSvgImage,
    wrapToImage && styles.wrapToImageSvg,
  );
  const hintClassName = clsx(
    styles.expandHint,
    fillContainer && styles.fillExpandHint,
  );
  const lightboxImageClassName = clsx(
    styles.lightboxImage,
    fullBleed && styles.fullBleedLightboxImage,
  );
  const lightboxSvgImageClassName = clsx(
    styles.lightboxSvgImage,
    fullBleed && styles.fullBleedLightboxSvgImage,
  );
  const lightboxSvgFrameClassName = clsx(
    styles.lightboxSvgFrame,
    fullBleed && styles.fullBleedLightboxSvgFrame,
  );

  const SvgSrc = typeof src !== "string" ? src : null;
  const isSvgAsset =
    typeof src === "string" && src.toLowerCase().split("?")[0].endsWith(".svg");

  function ImageContent({
    imgClassName,
    isLightbox = false,
  }: {
    imgClassName: string;
    isLightbox?: boolean;
  }) {
    if (SvgSrc) {
      if (isLightbox) {
        return (
          <div className={lightboxSvgFrameClassName}>
            <SvgSrc
              role="img"
              aria-label={alt}
              className={lightboxSvgImageClassName}
            />
          </div>
        );
      }

      return (
        <SvgSrc
          role="img"
          aria-label={alt}
          className={isLightbox ? lightboxSvgImageClassName : svgImageClassName}
        />
      );
    }

    if (isLightbox && isSvgAsset) {
      return (
        <div className={lightboxSvgFrameClassName}>
          <img
            src={src as string}
            alt={alt}
            className={lightboxSvgImageClassName}
          />
        </div>
      );
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
          className={buttonClassName}
          onClick={() => setIsFullscreen(true)}
          aria-label={`Open ${alt} in full screen`}
        >
          <ImageContent imgClassName={imageClassName} />
          <span className={hintClassName}>{hintText}</span>
        </button>
      </div>

      {isFullscreen &&
        typeof document !== "undefined" &&
        createPortal(
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
              <ImageContent imgClassName={lightboxImageClassName} isLightbox />
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
