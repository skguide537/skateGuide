'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Chip, FormControl, FormLabel, InputLabel, MenuItem, OutlinedInput, Select, Switch, TextField, Typography, Autocomplete, CircularProgress } from '@mui/material';
import { useToast } from '@/context/ToastContext';
import { useUser } from '@/context/UserContext';
import { useTheme } from '@/context/ThemeContext';
import { Size, Tag, SkaterLevel } from '@/types/enums';
import AddSpotMap from '@/components/map/AddSpotMap';

const sizes = Object.values(Size);
const tags = Object.values(Tag);
const levels = Object.values(SkaterLevel);

interface AddSpotFormProps {
  coords: { lat: number; lng: number } | null;
  setCoords: (coords: { lat: number; lng: number }) => void;
}

export default function AddSpotForm({ coords, setCoords }: AddSpotFormProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [size, setSize] = useState('');
    const [level, setLevel] = useState('');
    const [isPark, setIsPark] = useState(false);
    const [tagList, setTagList] = useState<string[]>([]);
    const [photos, setPhotos] = useState<FileList | null>(null);
    const [externalLinks, setExternalLinks] = useState<string[]>([]);
    const [newLink, setNewLink] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
    
    // New address state variables
    const [street, setStreet] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [country, setCountry] = useState('');
    const [showMap, setShowMap] = useState(false);
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [locationMethod, setLocationMethod] = useState<'address' | 'gps' | 'map' | null>(null);
    
    // Autocomplete state
    const [streetSuggestions, setStreetSuggestions] = useState<string[]>([]);
    const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
    const [countrySuggestions, setCountrySuggestions] = useState<string[]>([]);
    const [isLoadingStreet, setIsLoadingStreet] = useState(false);
    const [isLoadingCity, setIsLoadingCity] = useState(false);
    const [isLoadingCountry, setIsLoadingCountry] = useState(false);

    const { user } = useUser();
    const { showToast, invalidateCache } = useToast();
    const { theme } = useTheme();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setHasAttemptedSubmit(true);

        if (!user?._id) return;
        
        // Form validation
        if (!title.trim()) {
            showToast('Please enter a title', 'error');
            return;
        }
        if (!size) {
            showToast('Please select a size', 'error');
            return;
        }
        if (!level) {
            showToast('Please select a level', 'error');
            return;
        }
        if (!coords) {
            showToast('Please select a location using "Search Address", "Use My Location", or click on the map.', 'error');
            return;
        }

        setIsSubmitting(true);

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
                      // Invalidate relevant caches to ensure new spot appears immediately
          invalidateCache('skateparks');
          invalidateCache('spots');
          invalidateCache('map-markers');
            
            // Set a flag that the home page can check
            localStorage.setItem('spotJustAdded', 'true');
            localStorage.setItem('spotAddedAt', Date.now().toString());
            
            setTimeout(() => router.push('/'), 1000);
        } catch (err: any) {
            showToast(err.message || 'Unexpected error', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getMyLocation = () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;
                    if (setValidatedCoords(lat, lng)) {
                        setLocationMethod('gps');
                        // Clear address fields when using GPS
                        setStreet('');
                        setCity('');
                        setState('');
                        setCountry('');
                        setShowMap(false);
                        showToast(`Location set: ${lat.toFixed(4)}, ${lng.toFixed(4)}`, 'success');
                    }
                },
                (err) => {
                    console.error(err);
                    showToast("Unable to get location", "error");
                }
            );
        } else {
            showToast("Geolocation is not supported in your browser", "error");
        }
    };

    const searchAddress = async () => {
        if (!street.trim() || !city.trim()) {
            showToast('Please enter at least street and city', 'error');
            return;
        }

        setIsGeocoding(true);
        
        try {
            // Build the search query
            const searchQuery = [street, city, state, country]
                .filter(part => part.trim())
                .join(', ');
            
            // Use OpenStreetMap Nominatim API for geocoding
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
            );
            
            if (!response.ok) {
                throw new Error('Geocoding service unavailable');
            }
            
            const data = await response.json();
            
            if (data && data.length > 0) {
                const result = data[0];
                const lat = parseFloat(result.lat);
                const lng = parseFloat(result.lon);
                
                if (setValidatedCoords(lat, lng)) {
                    setShowMap(true); // Show map with the found location
                    setLocationMethod('address');
                    showToast(`Location found: ${result.display_name}`, 'success');
                }
            } else {
                showToast('Address not found. Please try a different address or use the map.', 'error');
            }
        } catch (error) {
            console.error('Geocoding error:', error);
            showToast('Failed to find address. Please try again or use the map.', 'error');
        } finally {
            setIsGeocoding(false);
        }
    };

    const validateCoordinates = (lat: number, lng: number): boolean => {
        // Check if coordinates are within reasonable bounds
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return false;
        }
        // Check if coordinates are not exactly 0,0 (which is often an error)
        if (lat === 0 && lng === 0) {
            return false;
        }
        return true;
    };

    const setValidatedCoords = (lat: number, lng: number) => {
        if (validateCoordinates(lat, lng)) {
            setCoords({ lat, lng });
            return true;
        } else {
            showToast('Invalid coordinates received. Please try again.', 'error');
            return false;
        }
    };

    // Autocomplete functions
    const fetchStreetSuggestions = useCallback(async (query: string) => {
        if (query.length < 2) return;
        
        setIsLoadingStreet(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5&featuretype=street`
            );
            
            if (response.ok) {
                const data = await response.json();
                const streets = data
                    .map((item: any) => item.address?.road || item.display_name.split(',')[0])
                    .filter(Boolean)
                    .slice(0, 5);
                setStreetSuggestions(streets);
            }
        } catch (error) {
            console.error('Street autocomplete error:', error);
        } finally {
            setIsLoadingStreet(false);
        }
    }, []);

    const fetchCitySuggestions = useCallback(async (query: string) => {
        if (query.length < 2) return;
        
        setIsLoadingCity(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5&featuretype=city`
            );
            
            if (response.ok) {
                const data = await response.json();
                const cities = data
                    .map((item: any) => item.address?.city || item.address?.town || item.address?.village || item.display_name.split(',')[0])
                    .filter(Boolean)
                    .slice(0, 5);
                setCitySuggestions(cities);
            }
        } catch (error) {
            console.error('City autocomplete error:', error);
        } finally {
            setIsLoadingCity(false);
        }
    }, []);

    const fetchCountrySuggestions = useCallback(async (query: string) => {
        if (query.length < 2) return;
        
        setIsLoadingCountry(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5&featuretype=country`
            );
            
            if (response.ok) {
                const data = await response.json();
                const countries = data
                    .map((item: any) => item.address?.country || item.display_name.split(',')[0])
                    .filter(Boolean)
                    .slice(0, 5);
                setCountrySuggestions(countries);
            }
        } catch (error) {
            console.error('Country autocomplete error:', error);
        } finally {
            setIsLoadingCountry(false);
        }
    }, []);

    const handleMapClick = (coords: { lat: number; lng: number }) => {
        if (setValidatedCoords(coords.lat, coords.lng)) {
            setLocationMethod('map');
            // Clear address fields when using map selection
            setStreet('');
            setCity('');
            setState('');
            setCountry('');
            showToast(`Location selected on map: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`, 'success');
        }
    };

    // Handle address field changes - switch to address method
    const handleAddressChange = (field: 'street' | 'city' | 'state' | 'country', value: string) => {
        // If user starts typing in address fields, switch to address method
        if (locationMethod !== 'address') {
            setLocationMethod('address');
            // Clear coordinates when switching to address method
            // Note: We can't set coords to null, so we'll just update the location method
            // The coordinates will be cleared when a new address is searched
        }
        
        // Update the specific field
        switch (field) {
            case 'street':
                setStreet(value);
                break;
            case 'city':
                setCity(value);
                break;
            case 'state':
                setState(value);
                break;
            case 'country':
                setCountry(value);
                break;
        }
    };

    return (
        <Box sx={{
            p: 4,
            backgroundColor: 'var(--color-surface-elevated)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--color-border)',
            background: 'linear-gradient(135deg, var(--color-surface-elevated) 0%, var(--color-surface) 100%)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: 'linear-gradient(90deg, var(--color-accent-green) 0%, var(--color-accent-blue) 50%, var(--color-accent-rust) 100%)',
            }
        }}>
            <Typography 
                variant="h4" 
                sx={{ 
                    mb: 4, 
                    color: 'var(--color-text-primary)', 
                    fontWeight: 700,
                    textAlign: 'center',
                    textShadow: theme === 'dark' 
                        ? '0 2px 4px rgba(0, 0, 0, 0.5)'
                        : '0 1px 2px rgba(0, 0, 0, 0.2)'
                }}
            >
                🛹 Add New Skate Spot
            </Typography>
            
            <form onSubmit={handleSubmit}>
                <TextField 
                    fullWidth 
                    label="Title *" 
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    sx={{ 
                        mb: 3,
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: 'var(--color-surface)',
                            border: '1px solid var(--color-border)',
                            transition: 'all var(--transition-fast)',
                            '&:hover': {
                                borderColor: 'var(--color-accent-blue)',
                                backgroundColor: 'var(--color-surface-elevated)',
                            },
                            '&.Mui-focused': {
                                borderColor: 'var(--color-accent-blue)',
                                boxShadow: '0 0 0 2px rgba(93, 173, 226, 0.2)',
                            }
                        }
                    }}
                    required
                    placeholder="e.g., Central Park Skate Spot"
                    error={hasAttemptedSubmit && !title.trim()}
                    helperText={hasAttemptedSubmit && !title.trim() ? "Title is required" : ""}
                />
                
                <TextField 
                    fullWidth 
                    multiline 
                    rows={4} 
                    label="Description" 
                    placeholder="More info to help get to the spot?" 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    sx={{ 
                        mb: 3,
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: 'var(--color-surface)',
                            border: '1px solid var(--color-border)',
                            transition: 'all var(--transition-fast)',
                            '&:hover': {
                                borderColor: 'var(--color-accent-blue)',
                                backgroundColor: 'var(--color-surface-elevated)',
                            },
                            '&.Mui-focused': {
                                borderColor: 'var(--color-accent-blue)',
                                boxShadow: '0 0 0 2px rgba(93, 173, 226, 0.2)',
                            }
                        }
                    }} 
                />

                <FormControl fullWidth sx={{ mb: 3 }} required error={hasAttemptedSubmit && !size}>
                    <InputLabel sx={{ 
                        color: 'var(--color-text-secondary)',
                        '&.Mui-focused': {
                            color: 'var(--color-accent-blue)'
                        }
                    }}>Size *</InputLabel>
                    <Select 
                        value={size} 
                        label="Size *" 
                        onChange={e => setSize(e.target.value)}
                        sx={{
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'var(--color-border)',
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'var(--color-accent-blue)',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'var(--color-accent-blue)',
                            },
                            '& .MuiSelect-icon': {
                                color: 'var(--color-text-secondary)'
                            }
                        }}
                    >
                        <MenuItem value="">Select a size</MenuItem>
                        {sizes.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                    </Select>
                    {hasAttemptedSubmit && !size && <Typography variant="caption" sx={{ color: 'var(--color-error)', mt: 1 }}>Size is required</Typography>}
                </FormControl>

                <FormControl fullWidth sx={{ mb: 3 }} required error={hasAttemptedSubmit && !level}>
                    <InputLabel sx={{ 
                        color: 'var(--color-text-secondary)',
                        '&.Mui-focused': {
                            color: 'var(--color-accent-blue)'
                        }
                    }}>Level *</InputLabel>
                    <Select 
                        value={level} 
                        label="Level *" 
                        onChange={e => setLevel(e.target.value)}
                        sx={{
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'var(--color-border)',
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'var(--color-accent-blue)',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'var(--color-accent-blue)',
                            },
                            '& .MuiSelect-icon': {
                                color: 'var(--color-text-secondary)'
                            }
                        }}
                    >
                        <MenuItem value="">Select a level</MenuItem>
                        {levels.map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
                    </Select>
                    {hasAttemptedSubmit && !level && <Typography variant="caption" sx={{ color: 'var(--color-error)', mt: 1 }}>Level is required</Typography>}
                </FormControl>

                <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel sx={{ 
                        color: 'var(--color-text-secondary)',
                        '&.Mui-focused': {
                            color: 'var(--color-accent-blue)'
                        }
                    }}>Tags</InputLabel>
                    <Select
                        multiple
                        value={tagList}
                        onChange={(e) => setTagList(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                        input={<OutlinedInput label="Tags" />}
                        renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {selected.map((value) => (
                                    <Chip 
                                        key={value} 
                                        label={value} 
                                        sx={{
                                            backgroundColor: 'var(--color-accent-green)',
                                            color: 'var(--color-surface-elevated)',
                                            fontWeight: 600
                                        }}
                                    />
                                ))}
                            </Box>
                        )}
                        sx={{
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'var(--color-border)',
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'var(--color-accent-blue)',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'var(--color-accent-blue)',
                            },
                            '& .MuiSelect-icon': {
                                color: 'var(--color-text-secondary)'
                            }
                        }}
                    >
                        {tags.map(tag => <MenuItem key={tag} value={tag}>{tag}</MenuItem>)}
                    </Select>
                </FormControl>

                <FormControl sx={{ mb: 3 }}>
                    <FormLabel sx={{ color: 'var(--color-text-primary)', mb: 1 }}>Park Type</FormLabel>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Switch 
                            checked={isPark} 
                            onChange={e => setIsPark(e.target.checked)}
                            sx={{
                                '& .MuiSwitch-switchBase.Mui-checked': {
                                    color: 'var(--color-accent-green)',
                                },
                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                    backgroundColor: 'var(--color-accent-green)',
                                }
                            }}
                        />
                        <Typography 
                            variant="body2" 
                            sx={{ 
                                color: 'var(--color-text-secondary)',
                                fontWeight: 500
                            }}
                        >
                            {isPark ? 'Park' : 'Street'}
                        </Typography>
                    </Box>
                </FormControl>

                {/* Address Fields */}
                <Typography 
                    variant="h6" 
                    sx={{ 
                        mt: 4, 
                        mb: 3, 
                        color: 'var(--color-text-primary)',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                    }}
                >
                    📍 Location
                </Typography>
            
            <Autocomplete
                freeSolo
                options={streetSuggestions}
                value={street}
                onChange={(_, newValue) => handleAddressChange('street', newValue || '')}
                onInputChange={(_, newInputValue) => {
                    handleAddressChange('street', newInputValue);
                    // Small delay to avoid too many API calls while typing
                    setTimeout(() => fetchStreetSuggestions(newInputValue), 300);
                }}
                disabled={locationMethod === 'gps' || locationMethod === 'map'}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label="Street Address *"
                        placeholder="e.g., רחוב דיזנגוף 99 or 99 Dizengoff Street"
                        required
                        error={hasAttemptedSubmit && !street.trim()}
                        helperText={
                            hasAttemptedSubmit && !street.trim() ? "Street address is required" : 
                            locationMethod === 'gps' ? "Disabled when using GPS location" :
                            locationMethod === 'map' ? "Disabled when using map selection" : ""
                        }
                        InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                                <>
                                    {isLoadingStreet ? <CircularProgress color="inherit" size={20} /> : null}
                                    {params.InputProps.endAdornment}
                                </>
                            ),
                        }}
                        sx={{
                            mb: 2,
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 'var(--radius-md)',
                                backgroundColor: 'var(--color-surface)',
                                border: '1px solid var(--color-border)',
                                transition: 'all var(--transition-fast)',
                                '&:hover': {
                                    borderColor: 'var(--color-accent-blue)',
                                    backgroundColor: 'var(--color-surface-elevated)',
                                },
                                '&.Mui-focused': {
                                    borderColor: 'var(--color-accent-blue)',
                                    boxShadow: '0 0 0 2px rgba(93, 173, 226, 0.2)',
                                }
                            }
                        }}
                    />
                )}
            />
            
            <Autocomplete
                freeSolo
                options={citySuggestions}
                value={city}
                onChange={(_, newValue) => handleAddressChange('city', newValue || '')}
                onInputChange={(_, newInputValue) => {
                    handleAddressChange('city', newInputValue);
                    setTimeout(() => fetchCitySuggestions(newInputValue), 300);
                }}
                disabled={locationMethod === 'gps' || locationMethod === 'map'}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label="City *"
                        placeholder="e.g., Tel Aviv"
                        required
                        error={hasAttemptedSubmit && !city.trim()}
                        helperText={
                            hasAttemptedSubmit && !city.trim() ? "City is required" : 
                            locationMethod === 'gps' ? "Disabled when using GPS location" :
                            locationMethod === 'map' ? "Disabled when using map selection" : ""
                        }
                        InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                                <>
                                    {isLoadingCity ? <CircularProgress color="inherit" size={20} /> : null}
                                    {params.InputProps.endAdornment}
                                </>
                            ),
                        }}
                        sx={{
                            mb: 2,
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 'var(--radius-md)',
                                backgroundColor: 'var(--color-surface)',
                                border: '1px solid var(--color-border)',
                                transition: 'all var(--transition-fast)',
                                '&:hover': {
                                    borderColor: 'var(--color-accent-blue)',
                                    backgroundColor: 'var(--color-surface-elevated)',
                                },
                                '&.Mui-focused': {
                                    borderColor: 'var(--color-accent-blue)',
                                    boxShadow: '0 0 0 2px rgba(93, 173, 226, 0.2)',
                                }
                            }
                        }}
                    />
                )}
            />
            
            <TextField 
                fullWidth 
                label="State/Province" 
                value={state} 
                onChange={e => handleAddressChange('state', e.target.value)} 
                placeholder="e.g., Tel Aviv District"
                sx={{ 
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        transition: 'all var(--transition-fast)',
                        '&:hover': {
                            borderColor: 'var(--color-accent-blue)',
                            backgroundColor: 'var(--color-surface-elevated)',
                        },
                        '&.Mui-focused': {
                            borderColor: 'var(--color-accent-blue)',
                            boxShadow: '0 0 0 2px rgba(93, 173, 226, 0.2)',
                        }
                    }
                }} 
            />
            
            <Autocomplete
                freeSolo
                options={countrySuggestions}
                value={country} 
                onChange={(_, newValue) => handleAddressChange('country', newValue || '')}
                onInputChange={(_, newInputValue) => {
                    handleAddressChange('country', newInputValue);
                    setTimeout(() => fetchCountrySuggestions(newInputValue), 300);
                }}
                disabled={locationMethod === 'gps' || locationMethod === 'map'}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label="Country *"
                        placeholder="e.g., Israel"
                        required
                        error={hasAttemptedSubmit && !country.trim()}
                        helperText={
                            hasAttemptedSubmit && !country.trim() ? "Country is required" : 
                            locationMethod === 'gps' ? "Disabled when using GPS location" :
                            locationMethod === 'map' ? "Disabled when using map selection" : ""
                        }
                        InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                                <>
                                    {isLoadingCountry ? <CircularProgress color="inherit" size={20} /> : null}
                                    {params.InputProps.endAdornment}
                                </>
                            ),
                        }}
                        sx={{
                            mb: 3,
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 'var(--radius-md)',
                                backgroundColor: 'var(--color-surface)',
                                border: '1px solid var(--color-border)',
                                transition: 'all var(--transition-fast)',
                                '&:hover': {
                                    borderColor: 'var(--color-accent-blue)',
                                    backgroundColor: 'var(--color-surface-elevated)',
                                },
                                '&.Mui-focused': {
                                    borderColor: 'var(--color-accent-blue)',
                                    boxShadow: '0 0 0 2px rgba(93, 173, 226, 0.2)',
                                }
                            }
                        }}
                    />
                )}
            />

            {/* Location Status */}
            {coords && (
                <Box sx={{ 
                    p: 2, 
                    bgcolor: 'success.light', 
                    borderRadius: 1, 
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                }}>
                    <Typography variant="body2" color="success.contrastText">
                        ✅ Location set via {locationMethod === 'address' ? 'address search' : locationMethod === 'gps' ? 'GPS' : 'map selection'}: {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                    </Typography>
                </Box>
            )}

            {/* Location Method Instructions */}
            {!coords && (
                <Box sx={{ 
                    p: 3, 
                    backgroundColor: 'rgba(93, 173, 226, 0.1)', 
                    borderRadius: 'var(--radius-lg)', 
                    mb: 3,
                    border: '1px solid var(--color-accent-blue)',
                    boxShadow: 'var(--shadow-sm)'
                }}>
                    <Typography variant="body2" sx={{ color: 'var(--color-accent-blue)', mb: 1.5, fontWeight: 600 }}>
                        📍 Choose ONE location method:
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)', display: 'block', mb: 0.5 }}>
                        • <strong>Address Search:</strong> Type street and city, then click &quot;Search Address&quot;
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)', display: 'block', mb: 0.5 }}>
                        • <strong>Use My Location:</strong> Automatically get your current GPS coordinates
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)', display: 'block' }}>
                        • <strong>Choose on Map:</strong> Click on the map to select a location
                    </Typography>
                </Box>
            )}

            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <Button
                    variant="contained"
                    onClick={searchAddress}
                    disabled={!street || !city || isGeocoding || locationMethod === 'gps' || locationMethod === 'map'}
                    sx={{
                        backgroundColor: 'var(--color-accent-blue)',
                        color: 'var(--color-surface-elevated)',
                        fontWeight: 'bold',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: 'var(--shadow-md)',
                        transition: 'all var(--transition-fast)',
                        textTransform: 'none',
                        '&:hover': {
                            backgroundColor: 'var(--color-accent-blue)',
                            transform: 'translateY(-2px)',
                            boxShadow: 'var(--shadow-lg)',
                        },
                        '&:disabled': {
                            backgroundColor: 'var(--color-border)',
                            transform: 'none',
                            boxShadow: 'none'
                        }
                    }}
                >
                    {isGeocoding ? 'Searching...' : 'Search Address'}
                </Button>
                
                <Button
                    variant="outlined"
                    onClick={() => setShowMap(!showMap)}
                    sx={{ 
                        flex: 1,
                        borderColor: 'var(--color-accent-rust)',
                        color: 'var(--color-accent-rust)',
                        borderRadius: 'var(--radius-md)',
                        transition: 'all var(--transition-fast)',
                        textTransform: 'none',
                        '&:hover': {
                            backgroundColor: 'rgba(255, 107, 53, 0.1)',
                            borderColor: 'var(--color-accent-rust)',
                            transform: 'translateY(-1px)',
                        }
                    }}
                >
                    {showMap ? 'Hide Map' : coords ? 'Show Map' : 'Choose on Map'}
                </Button>
            </Box>

            <Button
                variant="outlined"
                sx={{ 
                    mb: 3,
                    borderColor: 'var(--color-accent-green)',
                    color: 'var(--color-accent-green)',
                    borderRadius: 'var(--radius-md)',
                    transition: 'all var(--transition-fast)',
                    textTransform: 'none',
                    '&:hover': {
                        backgroundColor: 'rgba(46, 204, 113, 0.1)',
                        borderColor: 'var(--color-accent-green)',
                        transform: 'translateY(-1px)',
                    },
                    '&:disabled': {
                        borderColor: 'var(--color-border)',
                        color: 'var(--color-text-secondary)',
                        opacity: 0.5
                    }
                }}
                onClick={getMyLocation}
                disabled={locationMethod === 'address' || locationMethod === 'map'}
            >
                Use My Location
            </Button>

            {/* Map - conditionally visible */}
            {showMap && (
                <Box sx={{ 
                    height: '300px', 
                    width: '100%', 
                    my: 3,
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-md)',
                    border: '1px solid var(--color-border)'
                }}>
                    <AddSpotMap 
                        coords={coords}
                        setCoords={setCoords}
                        onMapClick={(newCoords) => {
                            setCoords(newCoords);
                            setLocationMethod('map');
                            // Clear address fields when using map selection
                            setStreet('');
                            setCity('');
                            setState('');
                            setCountry('');
                        }}
                    />
                </Box>
            )}

            <TextField 
                fullWidth 
                label="Add External Link" 
                value={newLink} 
                onChange={(e) => setNewLink(e.target.value)} 
                sx={{ 
                    mt: 3,
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        transition: 'all var(--transition-fast)',
                        '&:hover': {
                            borderColor: 'var(--color-accent-blue)',
                            backgroundColor: 'var(--color-surface-elevated)',
                        },
                        '&.Mui-focused': {
                            borderColor: 'var(--color-accent-blue)',
                            boxShadow: '0 0 0 2px rgba(93, 173, 226, 0.2)',
                        }
                    }
                }} 
            />
            
            <Button 
                variant="outlined" 
                onClick={() => {
                    if (newLink.trim()) {
                        setExternalLinks(prev => [...prev, newLink.trim()]);
                        setNewLink('');
                    }
                }}
                sx={{
                    borderColor: 'var(--color-accent-rust)',
                    color: 'var(--color-accent-rust)',
                    borderRadius: 'var(--radius-md)',
                    transition: 'all var(--transition-fast)',
                    textTransform: 'none',
                    mb: 3,
                    '&:hover': {
                        backgroundColor: 'rgba(255, 107, 53, 0.1)',
                        borderColor: 'var(--color-accent-rust)',
                        transform: 'translateY(-1px)',
                    }
                }}
            >
                Add Link
            </Button>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                {externalLinks.map((link, i) => (
                    <Chip 
                        key={i} 
                        label={link} 
                        onDelete={() => setExternalLinks(prev => prev.filter((_, j) => j !== i))}
                        sx={{
                            backgroundColor: 'var(--color-accent-blue)',
                            color: 'var(--color-surface-elevated)',
                            fontWeight: 600,
                            '&:hover': {
                                backgroundColor: 'var(--color-accent-blue)',
                                transform: 'translateY(-1px)',
                                boxShadow: 'var(--shadow-sm)',
                            }
                        }}
                    />
                ))}
            </Box>

            <Box sx={{ 
                mb: 3,
                p: 2,
                backgroundColor: 'var(--color-surface-elevated)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)'
            }}>
                <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)', mb: 1, fontWeight: 500 }}>
                    📸 Photos (Optional)
                </Typography>
                <Box sx={{
                    position: 'relative',
                    display: 'inline-block',
                    width: '100%'
                }}>
                    <input 
                        type="file" 
                        multiple 
                        accept="image/*" 
                        onChange={(e) => setPhotos(e.target.files)}
                        style={{
                            position: 'absolute',
                            opacity: 0,
                            width: '100%',
                            height: '100%',
                            cursor: 'pointer'
                        }}
                        id="file-upload"
                    />
                    <label 
                        htmlFor="file-upload"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '12px 16px',
                            backgroundColor: 'var(--color-surface)',
                            border: '2px dashed var(--color-accent-blue)',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--color-accent-blue)',
                            cursor: 'pointer',
                            transition: 'all var(--transition-fast)',
                            minHeight: '60px',
                            textAlign: 'center'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(93, 173, 226, 0.1)';
                            e.currentTarget.style.borderColor = 'var(--color-accent-blue)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--color-surface)';
                            e.currentTarget.style.borderColor = 'var(--color-accent-blue)';
                        }}
                    >
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                📁 Choose Files
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'var(--color-text-secondary)' }}>
                                {photos && photos.length > 0 
                                    ? `${photos.length} file(s) selected` 
                                    : 'Click to select photos or drag and drop'
                                }
                            </Typography>
                        </Box>
                    </label>
                </Box>
            </Box>

            <Button 
                type="submit" 
                variant="contained" 
                sx={{ 
                    mt: 4, 
                    backgroundColor: 'var(--color-accent-green)',
                    color: 'var(--color-surface-elevated)',
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    px: 4,
                    py: 1.5,
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-lg)',
                    transition: 'all var(--transition-fast)',
                    textTransform: 'none',
                    '&:hover': {
                        backgroundColor: 'var(--color-accent-green)',
                        transform: 'translateY(-3px)',
                        boxShadow: 'var(--shadow-xl)',
                    },
                    '&:disabled': {
                        backgroundColor: 'var(--color-border)',
                        transform: 'none',
                        boxShadow: 'none'
                    }
                }}
                disabled={isSubmitting}
            >
                {isSubmitting ? 'Adding Spot...' : 'Submit Skate Spot'}
            </Button>
        </form>
    </Box>
    );
}
