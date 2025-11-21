import { configureStore, combineReducers, AnyAction, Reducer } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import themeReducer from './slices/themeSlice';
import toastReducer from './slices/toastSlice';
import cacheReducer, { cacheListenerMiddleware } from './slices/cacheSlice';

// Essential slices loaded immediately (needed for layout/navbar)
const essentialReducers = {
  auth: authReducer,
  theme: themeReducer,
  toast: toastReducer,
  cache: cacheReducer,
};

// Lazy-loaded reducers (loaded on-demand)
const lazyReducers: Record<string, Reducer> = {};

// Create root reducer with lazy reducer injection support
const createRootReducer = (): Reducer => {
  const combinedReducer = combineReducers({
    ...essentialReducers,
    ...lazyReducers,
  });

  return (state: ReturnType<typeof combinedReducer> | undefined, action: AnyAction) => {
    return combinedReducer(state, action);
  };
};

// Create store with only essential reducers
export const store = configureStore({
  reducer: createRootReducer(),
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for serialization checks
        ignoredActions: [],
        // Ignore these field paths in all actions
        ignoredActionPaths: [],
        // Ignore these paths in the state
        ignoredPaths: [],
      },
    }).prepend(cacheListenerMiddleware.middleware),
});

// Lazy reducer injection function
export const injectReducer = (name: string, reducer: Reducer) => {
  if (lazyReducers[name]) {
    // Reducer already injected
    return;
  }

  lazyReducers[name] = reducer;
  store.replaceReducer(createRootReducer());
};

// Lazy load functions for each slice
export const lazyLoadParksSlice = async () => {
  if (lazyReducers.parks) return;
  const { default: parksReducer } = await import('./slices/parksSlice');
  injectReducer('parks', parksReducer);
};

export const lazyLoadFiltersSlice = async () => {
  if (lazyReducers.filters) return;
  const { default: filtersReducer } = await import('./slices/filtersSlice');
  injectReducer('filters', filtersReducer);
};

export const lazyLoadFavoritesSlice = async () => {
  if (lazyReducers.favorites) return;
  const { default: favoritesReducer } = await import('./slices/favoritesSlice');
  injectReducer('favorites', favoritesReducer);
};

export const lazyLoadGeolocationSlice = async () => {
  if (lazyReducers.geolocation) return;
  const { default: geolocationReducer } = await import('./slices/geolocationSlice');
  injectReducer('geolocation', geolocationReducer);
};

// Re-export types for convenience
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

