'use client';

// Direct MUI imports for better tree shaking
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Rating from '@mui/material/Rating';
import { useEffect, useState, memo } from 'react';
import Image from 'next/image';
import SkateparkModal from '../modals/SkateparkModal';
import FastCarousel from '../ui/FastCarousel';


interface SkateparkCardProps {
    _id: string;
    title: string;
    description: string;
    tags: string[];
    photoNames: string[];
    distanceKm: number;
    coordinates: { lat: number; lng: number };
    isPark: boolean;
    size: string;
    level: string;
    avgRating: number;
    externalLinks?: { url: string; sentBy: { id: string; name: string }; sentAt: string }[];
}

const SkateparkCard = memo(function SkateparkCard({
    title,
    description,
    tags,
    photoNames,
    distanceKm,
    coordinates,
    isPark,
    size,
    level,
    avgRating,
    _id,
    externalLinks
}: SkateparkCardProps) {
    const [open, setOpen] = useState(false);

    



    const openInMaps = () => {
        const url = `https://www.google.com/maps/search/?api=1&query=${coordinates.lat},${coordinates.lng}`;
        window.open(url, '_blank');
    };

    const hasPhotos = photoNames && photoNames.length > 0;
    const isMultiple = photoNames.length > 1;

    const formatSrc = (src: string) =>
        src.startsWith('http') ? src : `/${src}`;

    const photoStyle = {
        width: '100%',
        height: 200,
        objectFit: 'cover',
        flexShrink: 0
    };

    function getRatingWord(rating: number): string {
        if (rating >= 4.5) return 'Gnarly';
        if (rating >= 3.5) return 'Steezy';
        if (rating >= 2.5) return 'Decent';
        if (rating >= 1.5) return 'Meh';
        if (rating > 0) return 'Whack';
        return 'Unrated';
    }




    return (
        <>
            <Box onClick={() => setOpen(true)} sx={{ cursor: 'pointer' }}>
                <Card
                    sx={{
                        width: 345,
                        height: 420,
                        boxShadow: 5,
                        borderRadius: 2,
                        backgroundColor: '#A7A9AC',
                        color: '#2F2F2F',
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    {/* Fast custom carousel - replaces heavy react-material-ui-carousel */}
                    <FastCarousel 
                        images={hasPhotos ? photoNames : ["https://res.cloudinary.com/dcncqacrd/image/upload/v1747566727/skateparks/default-skatepark.png"]} 
                        alt={title}
                        height={200}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                        <Typography gutterBottom variant="h6" component="div">
                            {title}
                        </Typography>
                        <Rating value={avgRating} precision={0.5} readOnly size="small" sx={{ mb: 1 }} /><Typography variant="caption" sx={{ color: '#2F2F2F', fontStyle: 'italic', mb: 1 }}>
                            {getRatingWord(avgRating)}
                        </Typography>

                        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mb: 1 }}>
                            {tags.slice(0, 4).map((tag, idx) => (
                                <Chip
                                    key={idx}
                                    label={tag}
                                    size="small"
                                    sx={{ backgroundColor: '#6E7763', color: '#fff' }}
                                />
                            ))}
                        </Stack>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            {distanceKm.toFixed(1)} km from your location
                        </Typography>
                        <Stack direction="row" spacing={1} mt={1}>
                            <Button
                                variant="contained"
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    openInMaps();
                                }}
                                sx={{
                                    backgroundColor: '#2F2F2F',
                                    color: '#fff',
                                    '&:hover': {
                                        backgroundColor: '#1c1c1c'
                                    }
                                }}
                            >
                                Show on Map
                            </Button>

                            <Button
                                variant="outlined"
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const wazeUrl = `https://waze.com/ul?ll=${coordinates.lat},${coordinates.lng}&navigate=yes`;
                                    window.open(wazeUrl, '_blank');
                                }}
                                sx={{
                                    borderColor: '#2F2F2F',
                                    color: '#2F2F2F',
                                    fontWeight: 'bold',
                                    '&:hover': {
                                        borderColor: '#1c1c1c',
                                        color: '#1c1c1c'
                                    }
                                }}
                            >
                                <Image
                                    src="/waze.png"
                                    alt="Waze"
                                    width={16}
                                    height={16}
                                    style={{ marginRight: 6 }}
                                />
                                Waze
                            </Button>
                        </Stack>
                    </CardContent>
                </Card>
            </Box>

                            <SkateparkModal
                    _id={_id}
                    open={open}
                    onClose={() => setOpen(false)}
                    title={title}
                    description={description}
                    photoNames={photoNames}
                    isPark={isPark}
                    size={size}
                    level={level}
                    tags={tags}
                    coordinates={coordinates}
                    externalLinks={externalLinks}
                />
        </>
    );
});

export default SkateparkCard;
