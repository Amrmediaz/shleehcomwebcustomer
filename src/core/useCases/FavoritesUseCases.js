import { FavoritesRepository } from '../../data/repositories/FavoritesRepository.js';

export const GetFavoritesUseCase = {
    execute: () => FavoritesRepository.getFavorites(),
};

export const ToggleFavoriteUseCase = {
    execute: (snapshot) => FavoritesRepository.toggleFavorite(snapshot),
};
