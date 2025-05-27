'use client';

import Loading from '@/components/loading/Loading';
import { useToast } from '@/context/ToastContext';
import { Box, Button, Chip, FormControl, FormLabel, InputLabel, MenuItem, OutlinedInput, Select, Switch, TextField, Typography } from '@mui/material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useState } from 'react';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import { Size, Tag } from '@/types/enums';

// Fix Leaflet default icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: '/marker-icon.png',
    shadowUrl: '/marker-shadow.png'
});

const sizes = Object.values(Size);
const tags = Object.values(Tag);

function LocationPicker({ onSelect }: { onSelect: (coords: { lat: number, lng: number }) => void }) {
    useMapEvents({
        click(e) {
            onSelect(e.latlng);
        }
    });
    return null;
}

export default function AddSpotPage() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [size, setSize] = useState('');
    const [isPark, setIsPark] = useState(false);
    const [tagList, setTagList] = useState<string[]>([]);
    const [photos, setPhotos] = useState<FileList | null>(null);
    const [coords, setCoords] = useState<{ lat: number, lng: number } | null>(null);
    const [externalLinks, setExternalLinks] = useState<string[]>([]);
    const [newLink, setNewLink] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { showToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!coords) {
            showToast('Please select a location on the map.', 'warning');
            return;
        }

        setIsSubmitting(true);

        const formData = new FormData();
        formData.append('data', JSON.stringify({
            title,
            description,
            size,
            isPark,
            tags: tagList,
            location: coords,
            externalLinks: externalLinks.filter(link => link.trim() !== '')
        }));

        if (photos) {
            Array.from(photos).forEach(photo => formData.append('photos', photo));
        }

        try {
            const res = await fetch('/api/skateparks', {
                method: 'POST',
                headers: { 'x-user-id': 'mock-user-id' },
                body: formData
            });

            if (res.ok) {
                showToast('Skatepark added successfully!', 'success');
            } else {
                const text = await res.text();
                console.error('Error response text:', text);
                try {
                    const data = JSON.parse(text);
                    showToast(data.error || 'Failed to submit skatepark.', 'error');
                } catch {
                    showToast('Unexpected server error. Check console.', 'error');
                }
            }
        } catch (err: any) {
            showToast(err.message || 'Something went wrong.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSubmitting) return <Loading />;

    return (
        <Box maxWidth="md" mx="auto" mt={4} component="form" onSubmit={handleSubmit} sx={{ p: 2 }}>
            <Typography variant="h4" gutterBottom>Add New Skate Spot</Typography>

            <TextField
                fullWidth label="Title" value={title} onChange={e => setTitle(e.target.value)}
                sx={{ mb: 2 }}
            />
            <TextField
                fullWidth multiline rows={4} label="Description"
                value={description} onChange={e => setDescription(e.target.value)}
                sx={{ mb: 2 }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Size</InputLabel>
                <Select value={size} label="Size" onChange={e => setSize(e.target.value)}>
                    {sizes.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Tags</InputLabel>
                <Select
                    multiple value={tagList}
                    onChange={e => setTagList(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                    input={<OutlinedInput label="Tags" />}
                    renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => <Chip key={value} label={value} />)}
                        </Box>
                    )}
                >
                    {tags.map(tag => (
                        <MenuItem key={tag} value={tag}>{tag}</MenuItem>
                    ))}
                </Select>
            </FormControl>

            <FormControl sx={{ mb: 2 }}>
                <FormLabel>Spot Type</FormLabel>
                <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="body2">Street</Typography>
                    <Switch checked={isPark} onChange={() => setIsPark(!isPark)} />
                    <Typography variant="body2">Skatepark</Typography>
                </Box>
            </FormControl>

            <Box sx={{ height: 300, mb: 2 }}>
                <MapContainer center={[32.0853, 34.7818]} zoom={13} style={{ height: '100%' }}>
                    <TileLayer
                        attribution='&copy; OpenStreetMap'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LocationPicker onSelect={(c) => setCoords(c)} />
                    {coords && <Marker position={[coords.lat, coords.lng]} />}
                </MapContainer>
            </Box>

            <TextField
                fullWidth
                label="Add External Link"
                value={newLink}
                onChange={(e) => setNewLink(e.target.value)}
                sx={{ mt: 2 }}
            />
            <Button
                variant="outlined"
                onClick={() => {
                    if (newLink.trim()) {
                        setExternalLinks(prev => [...prev, newLink.trim()]);
                        setNewLink('');
                    }
                }}
                sx={{ mt: 1 }}
            >
                Add Link
            </Button>

            <Box sx={{ mt: 2 }}>
                {externalLinks.map((link, index) => (
                    <Chip
                        key={index}
                        label={link}
                        onDelete={() => setExternalLinks(prev => prev.filter((_, i) => i !== index))}
                        sx={{ mr: 1, mb: 1 }}
                    />
                ))}
            </Box>


            <input type="file" multiple accept="image/*" onChange={(e) => setPhotos(e.target.files)} />


            <Button type="submit" variant="contained" sx={{ mt: 3, backgroundColor: '#2F2F2F' }}>
                Submit Skate Spot
            </Button>
        </Box>
    );
}
