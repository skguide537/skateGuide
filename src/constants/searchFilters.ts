import { Size, SkaterLevel, Tag } from '@/types/enums';

export const SEARCH_FILTER_CONSTANTS = {
    SORT_OPTIONS: [
        { value: 'distance', label: 'Distance', icon: 'LocationOn' },
        { value: 'rating', label: 'Rating', icon: 'Star' },
        { value: 'recent', label: 'Recently Added', icon: 'Schedule' },
    ],
    TYPE_OPTIONS: [
        { value: 'all', label: 'All Types' },
        { value: 'park', label: 'Skateparks' },
        { value: 'street', label: 'Street Spots' },
    ],
    SIZE_OPTIONS: [
        Size.Tiny,
        Size.Small,
        Size.Medium, 
        Size.Large,
        Size.Huge,
    ],
    LEVEL_OPTIONS: [
        SkaterLevel.AllLevels,
        SkaterLevel.Beginner,
        SkaterLevel.Intermediate,
        SkaterLevel.Expert,
    ],
    TAG_OPTIONS: [
        Tag.Rail,
        Tag.Ledge,
        Tag.Stairs,
        Tag.ManualPad,
        Tag.Bank,
        Tag.QuarterPipe,
        Tag.HalfPipe,
        Tag.Bowl,
        Tag.Pool,
        Tag.Pyramid,
        Tag.Hubba,
        Tag.Flatbar,
        Tag.Kicker,
        Tag.Spine,
        Tag.Funbox,
        Tag.DIY,
        Tag.Miniramp,
    ],
    RATING_RANGE: {
        min: 0,
        max: 5,
        step: 0.1,
        marks: [
            { value: 0, label: '0' },
            { value: 2.5, label: '2.5' },
            { value: 5, label: '5' },
        ] as Array<{ value: number; label: string }>,
    },
    DISTANCE_RANGE: {
        min: 1,
        max: 50,
        step: 1,
        marks: [
            { value: 1, label: '1km' },
            { value: 10, label: '10km' },
            { value: 25, label: '25km' },
            { value: 50, label: '50km' },
        ] as Array<{ value: number; label: string }>,
    },
} as const;

export const SEARCH_FILTER_STYLES = {
    container: {
        p: 3,
        backgroundColor: 'var(--color-surface-elevated)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--color-border)',
        background: 'linear-gradient(135deg, var(--color-surface-elevated) 0%, var(--color-surface) 100%)',
        position: 'relative' as const,
        overflow: 'hidden' as const,
        '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, var(--color-accent-green) 0%, var(--color-accent-blue) 50%, var(--color-accent-rust) 100%)',
        },
    },
    header: {
        mb: 3,
        color: 'var(--color-text-primary)',
        fontWeight: 700,
        textAlign: 'center' as const,
        textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    },
    searchBar: {
        flex: 1,
        '& .MuiOutlinedInput-root': {
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--color-surface)',
            border: '2px solid var(--color-border)',
            transition: 'all var(--transition-fast)',
            '&:hover': {
                borderColor: 'var(--color-accent-blue)',
                backgroundColor: 'var(--color-surface-elevated)',
            },
            '&.Mui-focused': {
                borderColor: 'var(--color-accent-blue)',
                boxShadow: '0 0 0 3px rgba(93, 173, 226, 0.2)',
            },
        },
        '& .MuiInputBase-input': {
            color: 'var(--color-text-primary)',
            '&::placeholder': {
                color: 'var(--color-text-secondary)',
                opacity: 1,
            },
        },
    },
    sortControl: {
        minWidth: 200,
        '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'var(--color-border)',
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'var(--color-accent-blue)',
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: 'var(--color-accent-blue)',
        },
        '& .MuiSelect-select': {
            color: 'var(--color-text-primary)',
        },
    },
    filterSection: {
        mb: 3,
        p: 3,
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-sm)',
    },
    filterRow: {
        display: 'flex',
        gap: 3,
        alignItems: 'center',
        flexWrap: 'wrap' as const,
        mb: 3,
    },
    chip: {
        backgroundColor: 'var(--color-accent-blue)',
        color: 'white',
        '&:hover': {
            backgroundColor: 'var(--color-accent-blue-dark)',
        },
    },
    activeChip: {
        backgroundColor: 'var(--color-accent-green)',
        color: 'white',
        '&:hover': {
            backgroundColor: 'var(--color-accent-green-dark)',
        },
    },
} as const;
