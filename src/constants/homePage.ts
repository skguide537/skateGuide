export const HOME_PAGE_CONSTANTS = {
    BACKGROUND_REFRESH_INTERVAL: 5 * 60 * 1000, // 5 minutes in milliseconds
    GRID_BREAKPOINTS: {
        MOBILE: 600,
        SMALL_TABLET: 900,
        MEDIUM_TABLET: 1200,
    },
    GRID_COLUMNS: {
        MOBILE: 2,
        SMALL_TABLET: 2,
        MEDIUM_TABLET: 3,
        DESKTOP: 3,
    },
    VIRTUAL_SCROLL: {
        CARD_HEIGHT: 420,
        SPACING: 20,
        ROW_HEIGHT: 440, // card height + spacing
        OVERSCAN: 3,
    },
    LOCAL_STORAGE_KEYS: {
        REFRESH_INTERVAL: 'skateGuide_refreshInterval',
        SHOW_HERO: 'skateGuide_showHero',
        SPOT_JUST_ADDED: 'spotJustAdded',
        SPOT_ADDED_AT: 'spotAddedAt',
    },
    TIMEOUTS: {
        DELETE_OPERATION: 10000, // 10 seconds
        CACHE_INVALIDATION: 500, // 500ms
        NEW_SPOT_CHECK: 2000, // 2 seconds
        NEW_SPOT_REFRESH: 1000, // 1 second
        NEW_SPOT_THRESHOLD: 10000, // 10 seconds
    },
} as const;

export const HERO_STYLES = {
    heroBox: {
        p: 6,
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-xl)',
        border: '1px solid var(--color-border)',
        position: 'relative' as const,
        overflow: 'hidden' as const,
    },
    closeButton: {
        position: 'absolute' as const,
        top: 16,
        right: 16,
        zIndex: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        color: 'white',
        '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
        },
    },
    heroTitle: {
        mb: 3,
        fontSize: { xs: '2.5rem', md: '3.5rem', lg: '4rem' },
        position: 'relative' as const,
        zIndex: 2,
    },
    heroSubtitle: {
        mb: 5,
        maxWidth: '600px',
        mx: 'auto',
        position: 'relative' as const,
        zIndex: 2,
    },
    exploreButton: {
        fontWeight: 'bold',
        fontSize: '1.1rem',
        px: 5,
        py: 2,
        borderRadius: 'var(--radius-lg)',
        border: '3px solid var(--color-accent-rust)',
        boxShadow: 'var(--shadow-lg)',
        transition: 'all var(--transition-fast)',
        textTransform: 'none' as const,
        position: 'relative' as const,
        zIndex: 2,
    },
    showHeroButton: {
        fontWeight: 'bold',
        px: 2,
        py: 1,
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-sm)',
        transition: 'all var(--transition-fast)',
        textTransform: 'none' as const,
    },
} as const;
