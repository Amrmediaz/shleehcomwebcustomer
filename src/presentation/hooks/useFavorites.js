// Favorites moved from a plain localStorage-backed hook to a real,
// API-backed context (src/presentation/context/FavoritesContext.jsx) once
// favorites became backend-synced instead of local-only — see
// FAVORITES-API-SPEC.md at the project root. Re-exported here so nothing
// importing the old path breaks.
export { useFavorites } from '../context/FavoritesContext.jsx';
