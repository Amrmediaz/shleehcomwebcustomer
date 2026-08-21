import { useEffect, useCallback } from 'react';
import './Lightbox.css';

// Simple full-screen gallery viewer. No external deps — just a fixed overlay
// with prev/next/close, keyboard arrows/escape, and a thumbnail strip.
export default function Lightbox({ images, index, onClose, onChange }) {
    const go = useCallback((delta) => {
        if (!images.length) return;
        onChange((index + delta + images.length) % images.length);
    }, [images.length, index, onChange]);

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') go(1);
            if (e.key === 'ArrowLeft') go(-1);
        };
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [onClose, go]);

    if (!images.length) return null;

    return (
        <div className="lightbox-overlay" onClick={onClose}>
            <button className="lightbox-close" onClick={onClose} aria-label="Close">
                <i className="fa-solid fa-xmark"></i>
            </button>

            <div className="lightbox-count">{index + 1} / {images.length}</div>

            <button
                className="lightbox-nav lightbox-prev"
                onClick={(e) => { e.stopPropagation(); go(-1); }}
                aria-label="Previous"
            >
                <i className="fa-solid fa-chevron-left"></i>
            </button>

            <div className="lightbox-stage" onClick={(e) => e.stopPropagation()}>
                <img src={images[index]} alt="" />
            </div>

            <button
                className="lightbox-nav lightbox-next"
                onClick={(e) => { e.stopPropagation(); go(1); }}
                aria-label="Next"
            >
                <i className="fa-solid fa-chevron-right"></i>
            </button>

            <div className="lightbox-thumbs" onClick={(e) => e.stopPropagation()}>
                {images.map((src, i) => (
                    <button
                        key={i}
                        className={`lightbox-thumb ${i === index ? 'active' : ''}`}
                        onClick={() => onChange(i)}
                    >
                        <img src={src} alt="" />
                    </button>
                ))}
            </div>
        </div>
    );
}
