'use client';

import { Box, Button, Chip, FormControl, FormLabel, InputLabel, MenuItem, OutlinedInput, Select, Switch, TextField, Typography, Autocomplete, CircularProgress } from '@mui/material';
import { useTheme } from '@/context/ThemeContext';
import AddSpotMap from '@/components/map/AddSpotMap';
import { useAddSpotForm } from '@/hooks/useAddSpotForm';

interface AddSpotFormProps {
  coords: { lat: number; lng: number } | null;
  setCoords: (coords: { lat: number; lng: number }) => void;
}

export default function AddSpotForm({ coords, setCoords }: AddSpotFormProps) {
    const { theme } = useTheme();
    
    const {
        // Form state
        title, setTitle,
        description, setDescription,
        size, setSize,
        levelList, setLevelList,
        isPark, setIsPark,
        tagList, setTagList,
        photos, setPhotos,
        externalLinks, setExternalLinks,
        newLink, setNewLink,
        isSubmitting,
        hasAttemptedSubmit,
        
        // Address state
        fullAddress, setFullAddress,
        street, setStreet,
        city, setCity,
        state, setState,
        country, setCountry,
        showMap, setShowMap,
        isGeocoding,
        locationMethod,
    
    // Autocomplete state
        streetSuggestions, setStreetSuggestions,
        citySuggestions, setCitySuggestions,
        countrySuggestions, setCountrySuggestions,
        isLoadingStreet,
        isLoadingCity,
        isLoadingCountry,
        
        // Constants
        sizes,
        tags,
        levels,
        
        // State flags
        isAllLevelsSelected,
        
        // Functions
        handleSubmit,
        getMyLocation,
        searchAddress,
        handleMapClick,
        handleAddressChange,
        handleFullAddressChange,
        fetchStreetSuggestions,
        fetchCitySuggestions,
        fetchCountrySuggestions,
        addExternalLink,
        removeExternalLink,
        handleLevelChange,
        
        // Validation
        canSubmit
    } = useAddSpotForm(coords, setCoords);

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
                        : '0 2px 4px rgba(255, 255, 255, 0.3)'
                }}
            >
                Add New Skate Spot
            </Typography>
            
            <form onSubmit={handleSubmit}>
                {/* Basic Information */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2, color: 'var(--color-text-primary)', fontWeight: 600 }}>
                        📝 Basic Information
                    </Typography>
                    
                <TextField 
                    fullWidth 
                        label="Title"
                    value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    required
                        sx={{ mb: 2 }}
                    error={hasAttemptedSubmit && !title.trim()}
                        helperText={hasAttemptedSubmit && !title.trim() ? 'Title is required' : ''}
                />
                
                <TextField 
                    fullWidth 
                    label="Description" 
                    value={description} 
                        onChange={(e) => setDescription(e.target.value)}
                        multiline
                        rows={3}
                        sx={{ mb: 2 }}
                    />
                    
                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Size</InputLabel>
                    <Select 
                        value={size} 
                            onChange={(e) => setSize(e.target.value)}
                            label="Size"
                            required
                            error={hasAttemptedSubmit && !size}
                        >
                            {sizes.map((sizeOption) => (
                                <MenuItem key={sizeOption} value={sizeOption}>
                                    {sizeOption}
                                </MenuItem>
                            ))}
                    </Select>
                </FormControl>

                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Difficulty Levels</InputLabel>
                    <Select 
                            multiple
                            value={levelList}
                            onChange={(e) => handleLevelChange(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                            input={<OutlinedInput label="Difficulty Levels" />}
                            required
                            error={hasAttemptedSubmit && levelList.length === 0}
                        >
                            {levels.map((level) => (
                                <MenuItem 
                                    key={level} 
                                    value={level}
                                    disabled={isAllLevelsSelected && level !== 'All Levels'}
                                >
                                    {level}
                                </MenuItem>
                            ))}
                    </Select>
                                         {isAllLevelsSelected && (
                         <Typography variant="caption" sx={{ 
                             color: 'var(--color-accent-blue)', 
                             mt: 1, 
                             display: 'block',
                             fontStyle: 'italic'
                         }}>
                             ℹ️ &ldquo;All Levels&rdquo; selected - other options are disabled
                         </Typography>
                     )}
                     {!isAllLevelsSelected && levelList.length > 0 && (
                         <Typography variant="caption" sx={{ 
                             color: 'var(--color-accent-green)', 
                             mt: 1, 
                             display: 'block',
                             fontStyle: 'italic'
                         }}>
                             ℹ️ Specific levels selected - &ldquo;All Levels&rdquo; option is disabled
                         </Typography>
                     )}
                </FormControl>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Switch
                            checked={isPark}
                            onChange={(e) => setIsPark(e.target.checked)}
                            color="primary"
                        />
                        <Typography sx={{ ml: 1, color: 'var(--color-text-primary)' }}>
                            This is a skatepark (not a street spot)
                        </Typography>
                    </Box>
                    
                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Features/Tags</InputLabel>
                    <Select
                        multiple
                        value={tagList}
                        onChange={(e) => setTagList(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                            input={<OutlinedInput label="Features/Tags" />}
                        >
                            {tags.map((tag) => (
                                <MenuItem key={tag} value={tag}>
                                    {tag}
                                </MenuItem>
                            ))}
                    </Select>
                </FormControl>
                    </Box>

                {/* Location Section */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2, color: 'var(--color-text-primary)', fontWeight: 600 }}>
                    📍 Location
                </Typography>
            
                    {/* Quick Entry - Full Address */}
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)', mb: 1, fontWeight: 500 }}>
                            🚀 Quick Entry - Full Address
                        </Typography>
                        <TextField
                            fullWidth
                            placeholder="e.g., R. António Ferro, 2765-503 Estoril, Portugal"
                            value={fullAddress}
                            onChange={(e) => handleFullAddressChange(e.target.value)}
                            sx={{ mb: 1 }}
                        />
                        <Button
                            variant="outlined"
                            onClick={searchAddress}
                            disabled={isGeocoding}
                            startIcon={isGeocoding ? <CircularProgress size={16} /> : null}
                            sx={{ mr: 1 }}
                        >
                            {isGeocoding ? 'Searching...' : 'Search Address'}
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={getMyLocation}
                            sx={{ mr: 1 }}
                        >
                            📍 Use My Location
                        </Button>
                    </Box>

                    {/* Structured Address Fields */}
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)', mb: 1, fontWeight: 500 }}>
                            🏠 Structured Address (Optional)
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <Autocomplete
                freeSolo
                options={streetSuggestions}
                value={street}
                onChange={(_, newValue) => handleAddressChange('street', newValue || '')}
                onInputChange={(_, newInputValue) => {
                                    setStreet(newInputValue);
                                    fetchStreetSuggestions(newInputValue);
                }}
                                loading={isLoadingStreet}
                renderInput={(params) => (
                    <TextField
                        {...params}
                                        label="Street"
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
            />
            <Autocomplete
                freeSolo
                options={citySuggestions}
                value={city}
                onChange={(_, newValue) => handleAddressChange('city', newValue || '')}
                onInputChange={(_, newInputValue) => {
                                    setCity(newInputValue);
                                    fetchCitySuggestions(newInputValue);
                }}
                                loading={isLoadingCity}
                renderInput={(params) => (
                    <TextField
                        {...params}
                                        label="City"
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
            />
            <TextField 
                label="State/Province" 
                value={state} 
                                onChange={(e) => handleAddressChange('state', e.target.value)}
                            />
            <Autocomplete
                freeSolo
                options={countrySuggestions}
                value={country} 
                onChange={(_, newValue) => handleAddressChange('country', newValue || '')}
                onInputChange={(_, newInputValue) => {
                                    setCountry(newInputValue);
                                    fetchCountrySuggestions(newInputValue);
                }}
                                loading={isLoadingCountry}
                renderInput={(params) => (
                    <TextField
                        {...params}
                                        label="Country"
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
            />
                        </Box>
                </Box>

                    {/* Map Selection */}
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)', mb: 1, fontWeight: 500 }}>
                            🗺️ Map Selection
                    </Typography>
                <Button
                    variant="outlined"
                    onClick={() => setShowMap(!showMap)}
                            sx={{ mb: 2 }}
                        >
                            {showMap ? 'Hide Map' : 'Show Map'}
            </Button>

            {showMap && (
                            <Box sx={{ height: 400, mb: 2 }}>
                    <AddSpotMap 
                        coords={coords}
                        setCoords={setCoords}
                                    onMapClick={handleMapClick}
                    />
                </Box>
            )}

                        {coords && (
                            <Typography variant="body2" sx={{ color: 'var(--color-accent-green)', fontWeight: 500 }}>
                                ✅ Location set: {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                            </Typography>
                        )}
                    </Box>
                </Box>

                {/* External Links */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2, color: 'var(--color-text-primary)', fontWeight: 600 }}>
                        🔗 External Links (Optional)
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField 
                            placeholder="Add a link (e.g., Instagram, YouTube)"
                value={newLink} 
                onChange={(e) => setNewLink(e.target.value)} 
                            onKeyPress={(e) => e.key === 'Enter' && addExternalLink()}
                            sx={{ flexGrow: 1 }}
                        />
                        <Button variant="outlined" onClick={addExternalLink}>
                            Add
            </Button>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {externalLinks.map((link, i) => (
                    <Chip 
                        key={i} 
                        label={link} 
                                onDelete={() => removeExternalLink(i)}
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
            </Box>

                {/* Photos */}
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
                    disabled={isSubmitting || !canSubmit()}
            >
                {isSubmitting ? 'Adding Spot...' : 'Submit Skate Spot'}
            </Button>
        </form>
    </Box>
    );
}
