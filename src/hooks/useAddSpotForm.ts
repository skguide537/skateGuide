import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/useToast';
import { useUser } from '@/hooks/useUser';
import { FormValidationService, SpotFormData } from '@/services/formValidation.service';
import { skateparkClient } from '@/services/skateparkClient';
import { Size, Tag, SkaterLevel } from '@/types/enums';
import { GeoapifyService, GeoapifyResult } from '@/services/geoapify.service';

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
    const [showMap, setShowMap] = useState(false);
    const [locationMethod, setLocationMethod] = useState<'address' | 'gps' | 'map' | null>(null);
    
    // Geoapify autocomplete state
    const [addressSuggestions, setAddressSuggestions] = useState<GeoapifyResult[]>([]);
    const [isLoadingAddress, setIsLoadingAddress] = useState(false);
    const [selectedResult, setSelectedResult] = useState<GeoapifyResult | null>(null);

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
            fullAddress
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
            // Use browser's geolocation API
            if (!("geolocation" in navigator)) {
                throw new Error("Geolocation is not supported in your browser");
            }

            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            });

            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            if (setValidatedCoords(lat, lng)) {
                setLocationMethod('gps');
                setFullAddress(''); // Clear address when using GPS
                setShowMap(true); // Keep map open when using GPS
                showToast(`Location set: ${lat.toFixed(4)}, ${lng.toFixed(4)}`, 'success');
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unable to get location';
            showToast(errorMessage, 'error');
        }
    };

    const handleMapClick = (coords: { lat: number; lng: number }) => {
        if (setValidatedCoords(coords.lat, coords.lng)) {
            setLocationMethod('map');
            setFullAddress(''); // Clear address when selecting from map
            showToast(`Location selected on map: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`, 'success');
        }
    };

    // Coordinate validation
    const setValidatedCoords = (lat: number, lng: number) => {
        if (GeoapifyService.validateCoordinates(lat, lng)) {
            setCoords({ lat, lng });
            return true;
        } else {
            showToast('Invalid coordinates received. Please try again.', 'error');
            return false;
        }
    };

    // Geoapify autocomplete functions
    const debouncedFetchAddress = useCallback(
        async (query: string) => {
            if (query.length < 3) {
                setAddressSuggestions([]);
                return;
            }

            setIsLoadingAddress(true);
            try {
                const results = await GeoapifyService.searchAddress(query, 5);
                // Prioritize Israeli addresses for Israeli users
                const sortedResults = GeoapifyService.sortForIsraeliUsers(results);
                setAddressSuggestions(sortedResults);
            } catch (error) {
                console.error('Address search error:', error);
                setAddressSuggestions([]);
                const errorMessage = error instanceof Error ? error.message : 'Address search failed';
                showToast(errorMessage, 'error');
            } finally {
                setIsLoadingAddress(false);
            }
        },
        [showToast]
    );

    // Debounce wrapper (500ms delay)
    const fetchAddressSuggestions = useCallback((query: string) => {
        const timeoutId = setTimeout(() => debouncedFetchAddress(query), 500);
        return () => clearTimeout(timeoutId);
    }, [debouncedFetchAddress]);

    // Handle address selection from dropdown
    const handleAddressSelect = useCallback((result: GeoapifyResult | null) => {
        if (!result) return;

        setSelectedResult(result);
        setFullAddress(result.formatted);
        
        // Validate and set coordinates
        if (GeoapifyService.validateCoordinates(result.lat, result.lon)) {
            setCoords({ lat: result.lat, lng: result.lon });
            setLocationMethod('address');
            setShowMap(true);
            
            const shortAddress = GeoapifyService.formatShortAddress(result);
            showToast(`Location set: ${shortAddress}`, 'success');
        } else {
            showToast('Invalid coordinates received', 'error');
        }
    }, [setCoords, showToast]);

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
        showMap, setShowMap,
        locationMethod,
        
        // Geoapify autocomplete state
        addressSuggestions,
        isLoadingAddress,
        selectedResult,
        
        // Constants
        sizes,
        tags,
        levels,
        
        // State flags
        isAllLevelsSelected,
        
        // Functions
        handleSubmit,
        getMyLocation,
        handleMapClick,
        fetchAddressSuggestions,
        handleAddressSelect,
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
            fullAddress
        })
    };
};
