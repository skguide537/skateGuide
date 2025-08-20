'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Chip, FormControl, FormLabel, InputLabel, MenuItem, OutlinedInput, Select, Switch, TextField, Typography, Autocomplete, CircularProgress } from '@mui/material';
import { useToast } from '@/context/ToastContext';
import { useUser } from '@/context/UserContext';
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
        <form onSubmit={handleSubmit}>
            <TextField 
                fullWidth 
                label="Title *" 
                value={title}
                onChange={e => setTitle(e.target.value)}
                sx={{ mb: 2 }}
                required
                placeholder="e.g., Central Park Skate Spot"
                error={hasAttemptedSubmit && !title.trim()}
                helperText={hasAttemptedSubmit && !title.trim() ? "Title is required" : ""}
            />
            <TextField fullWidth multiline rows={4} label="Description" placeholder="More info to help get to the spot?" value={description} onChange={e => setDescription(e.target.value)} sx={{ mb: 2 }} />

            <FormControl fullWidth sx={{ mb: 2 }} required error={hasAttemptedSubmit && !size}>
                <InputLabel>Size *</InputLabel>
                <Select value={size} label="Size *" onChange={e => setSize(e.target.value)}>
                    <MenuItem value="">Select a size</MenuItem>
                    {sizes.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
                {hasAttemptedSubmit && !size && <Typography variant="caption" color="error">Size is required</Typography>}
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }} required error={hasAttemptedSubmit && !level}>
                <InputLabel>Level *</InputLabel>
                <Select value={level} label="Level *" onChange={e => setLevel(e.target.value)}>
                    <MenuItem value="">Select a level</MenuItem>
                    {levels.map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
                </Select>
                {hasAttemptedSubmit && !level && <Typography variant="caption" color="error">Level is required</Typography>}
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

            {/* Address Fields */}
            <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Location</Typography>
            
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
                    />
                )}
                sx={{ mb: 2 }}
            />
            
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Autocomplete
                    freeSolo
                    options={citySuggestions}
                    value={city}
                    onChange={(_, newValue) => handleAddressChange('city', newValue || '')}
                    onInputChange={(_, newInputValue) => {
                        handleAddressChange('city', newInputValue);
                        // Small delay to avoid too many API calls while typing
                        setTimeout(() => fetchCitySuggestions(newInputValue), 300);
                    }}
                    disabled={locationMethod === 'gps' || locationMethod === 'map'}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="City *"
                            placeholder="e.g., תל אביב or Tel Aviv"
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
                        />
                    )}
                    sx={{ flex: 1 }}
                />
                <TextField 
                    fullWidth 
                    label="State/Province" 
                    value={state} 
                    onChange={e => handleAddressChange('state', e.target.value)} 
                    placeholder="e.g., תל אביב or Tel Aviv District"
                    disabled={locationMethod === 'gps' || locationMethod === 'map'}
                    sx={{ flex: 1 }}
                />
            </Box>
            
            <Autocomplete
                freeSolo
                options={countrySuggestions}
                value={country}
                onChange={(_, newValue) => handleAddressChange('country', newValue || '')}
                onInputChange={(_, newInputValue) => {
                    handleAddressChange('country', newInputValue);
                    // Small delay to avoid too many API calls while typing
                    setTimeout(() => fetchCountrySuggestions(newInputValue), 300);
                }}
                disabled={locationMethod === 'gps' || locationMethod === 'map'}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label="Country"
                        placeholder="e.g., ישראל or Israel"
                        InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                                <>
                                    {isLoadingCountry ? <CircularProgress color="inherit" size={20} /> : null}
                                    {params.InputProps.endAdornment}
                                </>
                            ),
                        }}
                    />
                )}
                sx={{ mb: 2 }}
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
                    p: 2, 
                    bgcolor: 'info.light', 
                    borderRadius: 1, 
                    mb: 2,
                    border: '1px solid',
                    borderColor: 'info.main'
                }}>
                    <Typography variant="body2" color="info.contrastText" sx={{ mb: 1 }}>
                        📍 Choose ONE location method:
                    </Typography>
                    <Typography variant="caption" color="info.contrastText" display="block">
                        • <strong>Address Search:</strong> Type street and city, then click "Search Address"
                    </Typography>
                    <Typography variant="caption" color="info.contrastText" display="block">
                        • <strong>Use My Location:</strong> Automatically get your current GPS coordinates
                    </Typography>
                    <Typography variant="caption" color="info.contrastText" display="block">
                        • <strong>Choose on Map:</strong> Click on the map to select a location
                    </Typography>
                </Box>
            )}

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Button
                    variant="contained"
                    onClick={searchAddress}
                    disabled={!street || !city || isGeocoding || locationMethod === 'gps' || locationMethod === 'map'}
                >
                    {isGeocoding ? 'Searching...' : 'Search Address'}
                </Button>
                
                <Button
                    variant="outlined"
                    onClick={() => setShowMap(!showMap)}
                    sx={{ flex: 1 }}
                >
                    {showMap ? 'Hide Map' : coords ? 'Show Map' : 'Choose on Map'}
                </Button>
            </Box>

            <Button
                variant="outlined"
                sx={{ mb: 2 }}
                onClick={getMyLocation}
                disabled={locationMethod === 'address' || locationMethod === 'map'}
            >
                Use My Location
            </Button>

            {/* Map - conditionally visible */}
            {showMap && (
                <Box sx={{ height: '300px', width: '100%', my: 2 }}>
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

            <Button 
                type="submit" 
                variant="contained" 
                sx={{ mt: 3, backgroundColor: '#2F2F2F' }}
                disabled={isSubmitting}
            >
                {isSubmitting ? 'Adding Spot...' : 'Submit Skate Spot'}
            </Button>
        </form>
    );
}
