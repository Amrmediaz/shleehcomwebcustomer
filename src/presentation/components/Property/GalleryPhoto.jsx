import './GalleryPhoto.css';

// Sharp, cropped-to-fill preview image — used for the small gallery
// thumbnails on the detail page. Deliberately NOT the full-photo/no-crop
// treatment: at this smaller display size a tight, clear crop reads much
// better than showing the whole photo tiny, and clicking always opens the
// full uncropped photo in the Lightbox (object-fit: contain there), so
// nothing is ever permanently hidden — just not shown at thumbnail size.
export default function GalleryPhoto({ src, alt = '', onClick, className = '' }) {
    return (
        <img className={`gallery-photo ${className}`} src={src} alt={alt} onClick={onClick} loading="lazy" />
    );
}
