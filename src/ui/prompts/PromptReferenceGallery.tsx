import { useMemo, useState } from 'react';
import type { MouseEvent } from 'react';

export interface PromptThumbnailItem {
  id: string;
  label: string;
  title: string;
  docPath: string;
  url: string | null;
}

interface PromptReferenceGalleryProps {
  /** Images extracted from the prompt markdown. */
  images: PromptThumbnailItem[];
  /** Optional callback fired when a thumbnail is activated. */
  onOpen?: (image: PromptThumbnailItem) => void;
  /** Current active image id to style selected cards. */
  activeImageId?: string | null;
  /** Maximum thumbnails per page (ignored when expanded). */
  itemsPerPage?: number;
}

/**
 * Renders a compact, 2025-style thumbnail list that lets designers skim references quickly.
 * Each item opens the resolved asset (or fallback doc path) in a new tab.
 */
export function PromptReferenceGallery({
  images,
  onOpen,
  activeImageId,
  itemsPerPage = 10,
}: PromptReferenceGalleryProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  const pageCount = Math.max(1, Math.ceil(images.length / itemsPerPage));

  const paginatedImages = useMemo(() => {
    const start = currentPage * itemsPerPage;
    return images.slice(start, start + itemsPerPage);
  }, [currentPage, images, itemsPerPage]);

  const visibleImages = isExpanded ? images : paginatedImages;

  const showingFrom = isExpanded ? 1 : currentPage * itemsPerPage + 1;
  const showingTo = isExpanded ? images.length : Math.min((currentPage + 1) * itemsPerPage, images.length);

  const canGoPrev = !isExpanded && currentPage > 0;
  const canGoNext = !isExpanded && currentPage < pageCount - 1;

  const handleChangePage = (delta: number) => {
    setCurrentPage((prev) => {
      const next = prev + delta;
      if (next < 0) return 0;
      if (next > pageCount - 1) return pageCount - 1;
      return next;
    });
  };

  const toggleExpanded = () => {
    setIsExpanded((prev) => !prev);
  };

  if (images.length === 0) {
    return (
      <div className="prompt-thumb-card-grid">
        <div className="prompt-thumb-card">
          <div className="prompt-thumb-card__preview">
            <span className="prompt-thumb-card__missing">N/A</span>
          </div>
          <div className="prompt-thumb-card__meta">
            <span className="prompt-thumb-card__label">Placeholder</span>
            <span className="prompt-thumb-card__title">Nessuna immagine collegata</span>
          </div>
        </div>
      </div>
    );
  }

  const handleOpen = (event: MouseEvent<HTMLButtonElement>, image: PromptThumbnailItem) => {
    event.preventDefault();
    onOpen?.(image);
  };

  return (
    <div className="prompt-thumb-gallery">
      <div className="prompt-thumb-controls">
        <div className="prompt-thumb-range">
          {images.length === 0 ? '0 elementi' : `${showingFrom}–${showingTo} di ${images.length}`}
        </div>
        <div className="prompt-thumb-actions">
          {!isExpanded && pageCount > 1 && (
            <div className="prompt-thumb-pagination">
              <button
                type="button"
                className="prompt-thumb-nav"
                onClick={() => handleChangePage(-1)}
                disabled={!canGoPrev}
                aria-label="Pagina precedente"
              >
                ‹
              </button>
              <span className="prompt-thumb-page">
                {currentPage + 1} / {pageCount}
              </span>
              <button
                type="button"
                className="prompt-thumb-nav"
                onClick={() => handleChangePage(1)}
                disabled={!canGoNext}
                aria-label="Pagina successiva"
              >
                ›
              </button>
            </div>
          )}
          <button
            type="button"
            className={`prompt-thumb-expand ${isExpanded ? 'is-active' : ''}`}
            onClick={toggleExpanded}
          >
            {isExpanded ? 'Vista condensata' : 'Vista completa'}
          </button>
        </div>
      </div>
      <div className={`prompt-thumb-card-grid ${isExpanded ? 'prompt-thumb-card-grid--expanded' : ''}`}>
        {visibleImages.map((image) => (
          <button
            key={image.id}
            id={image.id}
            type="button"
            className={`prompt-thumb-card ${activeImageId === image.id ? 'is-active' : ''}`}
            onClick={(event) => handleOpen(event, image)}
          >
            <div className="prompt-thumb-card__preview">
              {image.url ? (
                <img src={image.url} alt={image.title} loading="lazy" />
              ) : (
                <span className="prompt-thumb-card__missing">Missing</span>
              )}
            </div>
            <div className="prompt-thumb-card__meta">
              <span className="prompt-thumb-card__label">{image.label}</span>
              <span className="prompt-thumb-card__title">{image.title}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
