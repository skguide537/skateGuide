'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Chip, FormControl, FormLabel, InputLabel, MenuItem, OutlinedInput, Select, Switch, TextField, Typography } from '@mui/material';
import { useToast } from '@/context/ToastContext';
import { useUser } from '@/context/UserContext';
import { Size, Tag, SkaterLevel } from '@/types/enums';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

const sizes = Object.values(Size);
const tags = Object.values(Tag);
const levels = Object.values(SkaterLevel);

// ✅ SSR-safe import
const AddSpotMap = dynamic(() => import('@/components/map/AddSpotMap'), { ssr: false });

export default function AddSpotPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [size, setSize] = useState('');
  const [level, setLevel] = useState('');
  const [isPark, setIsPark] = useState(false);
  const [tagList, setTagList] = useState<string[]>([]);
  const [photos, setPhotos] = useState<FileList | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [externalLinks, setExternalLinks] = useState<string[]>([]);
  const [newLink, setNewLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user } = useUser();
  const { showToast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?._id) return;
    if (!coords) {
      showToast('Please select a location on the map.', 'error');
      return;
    }

    const spotData = {
      title,
      description,
      size,
      level,
      isPark,
      tags: tagList,
      location: {
        type: 'Point',
        coordinates: [coords.lng, coords.lat]
      },
      externalLinks: externalLinks
        .filter(link => link.trim())
        .map(link => ({
          url: link,
          sentBy: { id: user._id, name: user.name },
          sentAt: new Date()
        }))
    };

    const formData = new FormData();
    formData.append('data', JSON.stringify(spotData));
    if (photos) Array.from(photos).forEach(photo => formData.append('photos', photo));

    try {
      const res = await fetch('/api/skateparks', {
        method: 'POST',
        headers: { 'x-user-id': user._id },
        body: formData
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('Error response text:', text);
        showToast('Failed to add skatepark', 'error');
        return;
      }

      showToast('Skatepark added!', 'success');
      setTimeout(() => router.push('/'), 1000);
    } catch (err: any) {
      showToast(err.message || 'Unexpected error', 'error');
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} maxWidth="md" mx="auto" mt={4} sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>Add New Skate Spot</Typography>

      <TextField fullWidth label="Title" value={title} onChange={e => setTitle(e.target.value)} sx={{ mb: 2 }} />
      <TextField fullWidth multiline rows={4} label="Description" value={description} onChange={e => setDescription(e.target.value)} sx={{ mb: 2 }} />

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Size</InputLabel>
        <Select value={size} label="Size" onChange={e => setSize(e.target.value)}>
          {sizes.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </Select>
      </FormControl>

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Level</InputLabel>
        <Select value={level} label="Level" onChange={e => setLevel(e.target.value)}>
          {levels.map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
        </Select>
      </FormControl>

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Tags</InputLabel>
        <Select
          multiple
          value={tagList}
          onChange={(e) => setTagList(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
          input={<OutlinedInput label="Tags" />}
          renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selected.map((value) => <Chip key={value} label={value} />)}
            </Box>
          )}
        >
          {tags.map(tag => <MenuItem key={tag} value={tag}>{tag}</MenuItem>)}
        </Select>
      </FormControl>

      <FormControl sx={{ mb: 2 }}>
        <FormLabel>Park Type</FormLabel>
        <Switch checked={isPark} onChange={e => setIsPark(e.target.checked)} />
        <Typography variant="caption">{isPark ? 'Park' : 'Street'}</Typography>
      </FormControl>

      <Box sx={{ height: '300px', width: '100%', my: 2 }}>
        <AddSpotMap coords={coords} setCoords={setCoords} />
      </Box>

      <TextField fullWidth label="Add External Link" value={newLink} onChange={(e) => setNewLink(e.target.value)} sx={{ mt: 2 }} />
      <Button variant="outlined" onClick={() => {
        if (newLink.trim()) {
          setExternalLinks(prev => [...prev, newLink.trim()]);
          setNewLink('');
        }
      }}>Add Link</Button>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, my: 2 }}>
        {externalLinks.map((link, i) => (
          <Chip key={i} label={link} onDelete={() => setExternalLinks(prev => prev.filter((_, j) => j !== i))} />
        ))}
      </Box>

      <input type="file" multiple accept="image/*" onChange={(e) => setPhotos(e.target.files)} />

      <Button type="submit" variant="contained" sx={{ mt: 3, backgroundColor: '#2F2F2F' }}>
        Submit Skate Spot
      </Button>
    </Box>
  );
}
