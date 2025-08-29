import { useState, useEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { HOME_PAGE_CONSTANTS } from '@/constants/homePage';

export function useVirtualGrid(parksWithDistance: any[], gridColumns: number) {
    const parentRef = useRef<HTMLDivElement>(null);
    
    // Virtual scrolling setup
    const virtualizer = useVirtualizer({
        count: Math.ceil(parksWithDistance.length / gridColumns), // Count rows, not individual items
        getScrollElement: () => parentRef.current,
        estimateSize: () => HOME_PAGE_CONSTANTS.VIRTUAL_SCROLL.ROW_HEIGHT, // 420px card height + 20px spacing between rows
        overscan: HOME_PAGE_CONSTANTS.VIRTUAL_SCROLL.OVERSCAN, // Number of rows to render outside the viewport
    });

    return {
        parentRef,
        virtualizer,
    };
}

export function useResponsiveGrid() {
    const [gridColumns, setGridColumns] = useState<number>(HOME_PAGE_CONSTANTS.GRID_COLUMNS.MOBILE);

    useEffect(() => {
        const updateGridColumns = () => {
            if (window.innerWidth < HOME_PAGE_CONSTANTS.GRID_BREAKPOINTS.MOBILE) { // Mobile
                setGridColumns(HOME_PAGE_CONSTANTS.GRID_COLUMNS.MOBILE);
            } else if (window.innerWidth < HOME_PAGE_CONSTANTS.GRID_BREAKPOINTS.SMALL_TABLET) { // Small tablet
                setGridColumns(HOME_PAGE_CONSTANTS.GRID_COLUMNS.SMALL_TABLET);
            } else if (window.innerWidth < HOME_PAGE_CONSTANTS.GRID_BREAKPOINTS.MEDIUM_TABLET) { // Medium tablet
                setGridColumns(HOME_PAGE_CONSTANTS.GRID_COLUMNS.MEDIUM_TABLET);
            } else { // Desktop and up
                setGridColumns(HOME_PAGE_CONSTANTS.GRID_COLUMNS.DESKTOP);
            }
        };

        updateGridColumns(); // Set initial value
        window.addEventListener('resize', updateGridColumns);
        return () => window.removeEventListener('resize', updateGridColumns);
    }, []);

    return gridColumns;
}
