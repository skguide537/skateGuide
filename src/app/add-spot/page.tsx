'use client';

import {
  Box, Button, FormControl, FormLabel, MenuItem, Select,
  Switch, TextField, Typography, InputLabel, OutlinedInput, Chip,
  Snackbar, AlertColor
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import { useState } from 'react';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Loading from '@/components/loading/Loading'; // ✅ Import

// Fix Leaflet default icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: '/marker-icon.png',
  shadowUrl: '/marker-shadow.png'
});

const sizes = ['Tiny', 'Small', 'Medium', 'Large', 'Huge'];
const tags = [
  "Rail", "Ledge", "Stairs", "Manual Pad", "Bank", "Quarter Pipe", "Half Pipe",
  "Bowl", "Pool", "Pyramid", "Hubba", "Flatbar", "Kicker", "Spine", "Funbox", "DIY"
];

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

  const [isSubmitting, setIsSubmitting] = useState(false); // ✅ new state
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<AlertColor>('success');

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const showSnackbar = (message: string, severity: AlertColor) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coords) {
      showSnackbar('Please select a location on the map.', 'warning');
      return;
    }

    setIsSubmitting(true); // ✅ start loading

    const formData = new FormData();
    formData.append('data', JSON.stringify({
      title,
      description,
      size,
      isPark,
      tags: tagList,
      location: coords
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
        showSnackbar('Skatepark added successfully!', 'success');
      } else {
        const text = await res.text();
        console.error('Error response text:', text);
        try {
          const data = JSON.parse(text);
          showSnackbar(data.error || 'Failed to submit skatepark.', 'error');
        } catch {
          showSnackbar('Unexpected server error. Check console.', 'error');
        }
      }
    } catch (err: any) {
      showSnackbar(err.message || 'Something went wrong.', 'error');
    } finally {
      setIsSubmitting(false); // ✅ end loading
    }
  };

  if (isSubmitting) return <Loading />; // ✅ render loading UI

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

      <input type="file" multiple accept="image/*" onChange={(e) => setPhotos(e.target.files)} />

      <Button type="submit" variant="contained" sx={{ mt: 3, backgroundColor: '#2F2F2F' }}>
        Submit Skate Spot
      </Button>

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <MuiAlert elevation={6} variant="filled" onClose={handleCloseSnackbar} severity={snackbarSeverity}>
          {snackbarMessage}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
}
