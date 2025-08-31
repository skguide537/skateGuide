'use client';

import Box from '@mui/material/Box';
import SkateparkCard from '@/components/skateparkCard/LightSkateparkCard';
import { HOME_PAGE_CONSTANTS } from '@/constants/homePage';
import { FilteredSkatepark } from '@/services/parksFilter.service';

interface VirtualGridProps {
    parentRef: React.RefObject<HTMLDivElement>;
    virtualizer: any;
    parks: FilteredSkatepark[]; // Changed from parksWithDistance to match usage
    gridColumns: number;
    onSpotDelete: (spotId: string) => void; // Changed from onDelete to match usage
    deletingSpotIds: string[] | Set<string>; // Updated to handle both types
}

export default function VirtualGrid({ 
    parentRef, 
    virtualizer, 
    parks, 
    gridColumns, 
    onSpotDelete,
    deletingSpotIds
}: VirtualGridProps) {
    // Safety check: don't render if parks is undefined or empty
    if (!parks || parks.length === 0) {
        return (
            <Box
                sx={{
                    height: '600px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'var(--color-surface)',
                    p: 2,
                }}
            >
                <Box sx={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                    No skate spots available
                </Box>
            </Box>
        );
    }

    return (
        <Box
            ref={parentRef}
            sx={{
                height: '600px',
                overflow: 'auto',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--color-surface)',
                p: 2,
            }}
        >
            <div
                style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                }}
            >
                {virtualizer.getVirtualItems().map((virtualRow: any) => {
                    const rowIndex = virtualRow.index;
                    const startIndex = rowIndex * gridColumns;
                    
                    // Render all cards in this row
                    return Array.from({ length: gridColumns }, (_, colIndex) => {
                        const parkIndex = startIndex + colIndex;
                        const park = parks[parkIndex];
                        
                        if (!park) return null;
                        
                        return (
                            <div
                                key={`${rowIndex}-${colIndex}`}
                                style={{
                                    position: 'absolute',
                                    top: `${rowIndex * HOME_PAGE_CONSTANTS.VIRTUAL_SCROLL.ROW_HEIGHT}px`,
                                    left: `${colIndex * (100 / gridColumns)}%`,
                                    width: `${100 / gridColumns}%`,
                                    height: `${HOME_PAGE_CONSTANTS.VIRTUAL_SCROLL.CARD_HEIGHT}px`,
                                    padding: '10px',
                                    boxSizing: 'border-box',
                                }}
                            >
                                <SkateparkCard
                                    _id={park._id}
                                    title={park.title}
                                    description={park.description}
                                    tags={park.tags}
                                    photoNames={park.photoNames}
                                    distanceKm={park.distanceKm}
                                    coordinates={park.coordinates}
                                    isPark={park.isPark}
                                    size={park.size}
                                    levels={park.levels ? park.levels.filter(level => level !== null && level !== undefined) : []}
                                    avgRating={park.avgRating}
                                    externalLinks={park.externalLinks || []}
                                    isDeleting={deletingSpotIds instanceof Set ? deletingSpotIds.has(park._id) : deletingSpotIds.includes(park._id)}
                                    onDelete={onSpotDelete}
                                />
                            </div>
                        );
                    });
                })}
            </div>
        </Box>
    );
}
