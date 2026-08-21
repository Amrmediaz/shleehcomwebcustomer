// Shown while a property grid is loading — mirrors PropertyCard's layout so
// the page doesn't jump once real cards swap in, and reads as "loading
// fast" rather than a blank spinner-only page.
export default function PropertyCardSkeleton() {
    return (
        <div className="skeleton-card">
            <div className="skeleton-media"></div>
            <div className="skeleton-body">
                <div className="skeleton-line skeleton-title"></div>
                <div className="skeleton-line skeleton-loc"></div>
                <div className="skeleton-line skeleton-footer"></div>
            </div>
        </div>
    );
}

export function PropertyGridSkeleton({ count = 4 }) {
    return (
        <div className="property-grid">
            {Array.from({ length: count }, (_, i) => <PropertyCardSkeleton key={i} />)}
        </div>
    );
}
