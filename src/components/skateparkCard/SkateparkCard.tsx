'use client';

import {
    Card,
    CardContent,
    CardMedia,
    Typography,
    Chip,
    Button,
    Stack,
    Box
} from '@mui/material';
import Carousel from 'react-material-ui-carousel';
import { useState } from 'react';
import SkateparkModal from '../modals/SkateparkModal';

interface SkateparkCardProps {
    title: string;
    description: string;
    tags: string[];
    photoNames: string[];
    distanceKm: number;
    coordinates: { lat: number; lng: number };
    isPark: boolean;
    size: string;
    level: string;
}

export default function SkateparkCard({
    title,
    description,
    tags,
    photoNames,
    distanceKm,
    coordinates,
    isPark,
    size,
    level
}: SkateparkCardProps) {
    const [open, setOpen] = useState(false);

    const openInMaps = () => {
        const url = `https://www.google.com/maps/search/?api=1&query=${coordinates.lat},${coordinates.lng}`;
        window.open(url, '_blank');
    };


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
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                    }}
                >
                    {photoNames.length > 1 ? (
                        <Carousel autoPlay={false} navButtonsAlwaysVisible>
                            {photoNames.map((src, idx) => (
                                <CardMedia
                                    key={idx}
                                    component="img"
                                    height="200"
                                    image={`/${src}`}
                                    alt={`Skatepark photo ${idx + 1}`}
                                />
                            ))}
                        </Carousel>
                    ) : (
                        <CardMedia
                            component="img"
                            height="200"
                            image={`/${photoNames[0]}`}
                            alt="Skatepark photo"
                        />
                    )}
                    <CardContent>
                        <Typography gutterBottom variant="h6" component="div">
                            {title}
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
                                <img src="/waze.png" alt="Waze" style={{ width: 16, height: 16, marginRight: 6 }} />
                                Waze
                            </Button>
                        </Stack>

                    </CardContent>
                </Card>
            </Box>

            <SkateparkModal
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
            />
        </>
    );
}
