import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/context/ToastContext';
import { useUser } from '@/context/UserContext';
import { GeocodingService, GeocodingResult, AddressField } from '@/services/geocoding.service';
import { FormValidationService, SpotFormData } from '@/services/formValidation.service';
import { skateparkClient } from '@/services/skateparkClient';
import { Size, Tag, SkaterLevel } from '@/types/enums';

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

export const useAddSpotForm = (coords: { lat: number; lng: number } | null, setCoords: (coords: { lat: number; lng: number }) => void) => {
    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [size, setSize] = useState('');
    const [levelList, setLevelList] = useState<string[]>([]);

    // Handle level selection with mutual exclusivity
    const handleLevelChange = useCallback((selectedLevels: string[]) => {
        if (selectedLevels.includes('All Levels')) {
            // If "All Levels" is selected, clear other selections
            setLevelList(['All Levels']);
        } else {
            // If specific levels are selected, ensure "All Levels" is not included
            const filteredLevels = selectedLevels.filter(level => level !== 'All Levels');
            setLevelList(filteredLevels);
        }
    }, []);

    // Check if "All Levels" is selected to disable other options
    const isAllLevelsSelected = levelList.includes('All Levels');
    const [isPark, setIsPark] = useState(false);
    const [tagList, setTagList] = useState<string[]>([]);
    const [photos, setPhotos] = useState<FileList | null>(null);
    const [externalLinks, setExternalLinks] = useState<string[]>([]);
    const [newLink, setNewLink] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
    
    // Address state
    const [fullAddress, setFullAddress] = useState('');
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

    // Constants
    const sizes = Object.values(Size);
    const tags = Object.values(Tag);
    const levels = Object.values(SkaterLevel);

    // Form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setHasAttemptedSubmit(true);

        if (!user?._id) return;
        
        const formData: SpotFormData = {
            title,
            description,
            size,
            levels: levelList,
            isPark,
            tags: tagList,
            coords,
            locationMethod,
            fullAddress,
            structuredAddress: { street, city, state, country }
        };

        const validation = FormValidationService.validateForm(formData);
        if (!validation.isValid) {
            validation.errors.forEach(error => showToast(error, 'error'));
            return;
        }

        setIsSubmitting(true);

        const spotData = {
            title,
            description,
            size,
            levels: levelList,
            isPark,
            tags: tagList,
            location: {
                type: 'Point',
                coordinates: [coords!.lng, coords!.lat]
            },
            externalLinks: externalLinks
                .filter(link => link.trim())
                .map(link => ({
                    url: link,
                    sentBy: { id: user._id, name: user.name },
                    sentAt: new Date()
                }))
        };

        const formDataToSend = new FormData();
        formDataToSend.append('data', JSON.stringify(spotData));
        if (photos) Array.from(photos).forEach(photo => formDataToSend.append('photos', photo));

        try {
            await skateparkClient.createSkateparkWithFiles(formDataToSend, user._id);
            showToast('Skatepark added!', 'success');
            
            // Invalidate relevant caches
            invalidateCache('skateparks');
            invalidateCache('spots');
            invalidateCache('map-markers');
            
            // Set a flag that the home page can check
            localStorage.setItem('spotJustAdded', 'true');
            localStorage.setItem('spotAddedAt', Date.now().toString());
            
            setTimeout(() => router.push('/'), 1000);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Unexpected error';
            showToast(errorMessage, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Location methods
    const getMyLocation = async () => {
        try {
            const location = await GeocodingService.getCurrentLocation();
            if (setValidatedCoords(location.lat, location.lng)) {
                setLocationMethod('gps');
                // Clear address fields when using GPS but keep map visible
                setStreet('');
                setCity('');
                setState('');
                setCountry('');
                setShowMap(true); // Keep map open when using GPS
                showToast(`Location set: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`, 'success');
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            showToast(errorMessage, 'error');
        }
    };

    const searchAddress = async () => {
        try {
            console.log('🔍 [useAddSpotForm] Starting address search with:', { fullAddress, street, city, state, country });
            setIsGeocoding(true);
            
            const result = await GeocodingService.searchAddress(fullAddress, { street, city, state, country });
            console.log('📄 [useAddSpotForm] Address search result:', result);
            
            if (result && setValidatedCoords(result.lat, result.lng)) {
                console.log('✅ [useAddSpotForm] Address search successful, setting coordinates');
                setShowMap(true);
                setLocationMethod('address');
                
                const shortAddress = GeocodingService.createShortAddress(result.displayName || fullAddress);
                showToast(`Location found: ${shortAddress}`, 'success');
            } else {
                console.error('❌ [useAddSpotForm] Address search failed - invalid coordinates');
            }
        } catch (error: unknown) {
            console.error('❌ [useAddSpotForm] Address search error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            showToast(errorMessage, 'error');
        } finally {
            setIsGeocoding(false);
        }
    };

    const handleMapClick = (coords: { lat: number; lng: number }) => {
        if (setValidatedCoords(coords.lat, coords.lng)) {
            setLocationMethod('map');
            clearAddressFields();
            showToast(`Location selected on map: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`, 'success');
        }
    };

    // Coordinate validation
    const setValidatedCoords = (lat: number, lng: number) => {
        if (GeocodingService.validateCoordinates(lat, lng)) {
            setCoords({ lat, lng });
            return true;
        } else {
            showToast('Invalid coordinates received. Please try again.', 'error');
            return false;
        }
    };

    // Address field handlers
    const handleAddressChange = (field: 'street' | 'city' | 'state' | 'country', value: string) => {
        console.log('🔄 [useAddSpotForm] handleAddressChange called:', { field, value });
        if (locationMethod !== 'address') {
            setLocationMethod('address');
        }
        
        setFullAddress('');
        
        switch (field) {
            case 'street':
                console.log('📝 [useAddSpotForm] Setting street to:', value);
                setStreet(value);
                break;
            case 'city':
                console.log('📝 [useAddSpotForm] Setting city to:', value);
                setCity(value);
                break;
            case 'state':
                console.log('📝 [useAddSpotForm] Setting state to:', value);
                setState(value);
                break;
            case 'country':
                console.log('📝 [useAddSpotForm] Setting country to:', value);
                setCountry(value);
                break;
        }
        
        if (locationMethod !== 'address') {
            clearSuggestions();
        }
    };
    
    const handleFullAddressChange = (value: string) => {
        if (locationMethod !== 'address') {
            setLocationMethod('address');
        }
        
        setFullAddress(value);
        clearAddressFields();
        clearSuggestions();
    };

    // Helper functions
    const clearAddressFields = () => {
        setStreet('');
        setCity('');
        setState('');
        setCountry('');
        setShowMap(false);
    };

    const clearSuggestions = () => {
        setStreetSuggestions([]);
        setCitySuggestions([]);
        setCountrySuggestions([]);
    };

    // Debounced autocomplete functions
         const debouncedFetchStreet = useCallback(
         async (query: string) => {
             if (query.length < 2) return;
             
             setIsLoadingStreet(true);
             try {
                 const suggestions = await GeocodingService.searchStreetSuggestions(query);
                 setStreetSuggestions(suggestions);
             } catch (error) {
                 setStreetSuggestions([]);
             } finally {
                 setIsLoadingStreet(false);
             }
         },
         []
     );

         const debouncedFetchCity = useCallback(
         async (query: string) => {
             if (query.length < 2) return;
             
             setIsLoadingCity(true);
             try {
                 const suggestions = await GeocodingService.searchCitySuggestions(query);
                 setCitySuggestions(suggestions);
             } catch (error) {
                 setCitySuggestions([]);
             } finally {
                 setIsLoadingCity(false);
             }
         },
         []
     );

         const debouncedFetchCountry = useCallback(
         async (query: string) => {
             if (query.length < 2) return;
             
             console.log('🔍 [useAddSpotForm] Fetching country suggestions for:', query);
             setIsLoadingCountry(true);
             try {
                 const suggestions = await GeocodingService.searchCountrySuggestions(query);
                 console.log('📄 [useAddSpotForm] Country suggestions received:', suggestions);
                 setCountrySuggestions(suggestions);
                 console.log('✅ [useAddSpotForm] Country suggestions set');
             } catch (error) {
                 console.error('❌ [useAddSpotForm] Country suggestions error:', error);
                 setCountrySuggestions([]);
             } finally {
                 setIsLoadingCountry(false);
             }
         },
         []
     );

         const fetchStreetSuggestions = useCallback((query: string) => {
         const timeoutId = setTimeout(() => debouncedFetchStreet(query), 500);
         return () => clearTimeout(timeoutId);
     }, [debouncedFetchStreet]);
 
     const fetchCitySuggestions = useCallback((query: string) => {
         const timeoutId = setTimeout(() => debouncedFetchCity(query), 500);
         return () => clearTimeout(timeoutId);
     }, [debouncedFetchCity]);
 
     const fetchCountrySuggestions = useCallback((query: string) => {
         const timeoutId = setTimeout(() => debouncedFetchCountry(query), 500);
         return () => clearTimeout(timeoutId);
     }, [debouncedFetchCountry]);

    // External links
    const addExternalLink = () => {
        if (newLink.trim() && !externalLinks.includes(newLink.trim())) {
            setExternalLinks(prev => [...prev, newLink.trim()]);
            setNewLink('');
        }
    };

    const removeExternalLink = (index: number) => {
        setExternalLinks(prev => prev.filter((_, i) => i !== index));
    };

    return {
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
        canSubmit: () => FormValidationService.canSubmit({
            title,
            description,
            size,
            levels: levelList,
            isPark,
            tags: tagList,
            coords,
            locationMethod,
            fullAddress,
            structuredAddress: { street, city, state, country }
        })
    };
};
