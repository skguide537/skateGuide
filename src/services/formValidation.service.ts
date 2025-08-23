// Form validation service for AddSpotForm
export interface SpotFormData {
    title: string;
    description: string;
    size: string;
    levels: string[];
    isPark: boolean;
    tags: string[];
    coords: { lat: number; lng: number } | null;
    locationMethod: 'address' | 'gps' | 'map' | null;
    fullAddress: string;
    structuredAddress: {
        street: string;
        city: string;
        state: string;
        country: string;
    };
}

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

export class FormValidationService {
    // Validate the entire form
    static validateForm(data: SpotFormData): ValidationResult {
        const errors: string[] = [];

        // Title validation
        if (!data.title.trim()) {
            errors.push('Please enter a title');
        }

        // Size validation
        if (!data.size) {
            errors.push('Please select a size');
        }

        // Levels validation
        if (data.levels.length === 0) {
            errors.push('Please select at least one level');
        }

        // Location validation
        if (!data.coords) {
            errors.push('Please select a location using "Search Address", "Use My Location", or click on the map.');
        }

        // Smart address validation - only require address fields if using address method
        if (data.locationMethod === 'address' && !data.coords) {
            const hasFullAddress = data.fullAddress.trim();
            const hasStructuredAddress = data.structuredAddress.country.trim() && 
                                       data.structuredAddress.city.trim() && 
                                       data.structuredAddress.street.trim();
            
            if (!hasFullAddress && !hasStructuredAddress) {
                errors.push('Please enter either a full address or complete the structured address fields');
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Validate individual fields
    static validateTitle(title: string): boolean {
        return title.trim().length > 0;
    }

    static validateSize(size: string): boolean {
        return size.length > 0;
    }

    static validateLevels(levels: string[]): boolean {
        return levels.length > 0;
    }

    static validateLocation(coords: { lat: number; lng: number } | null): boolean {
        return coords !== null;
    }

    static validateAddress(
        fullAddress: string, 
        structuredAddress: { street: string; city: string; state: string; country: string }
    ): boolean {
        const hasFullAddress = fullAddress.trim().length > 0;
        const hasStructuredAddress = structuredAddress.street.trim().length > 0 && 
                                   structuredAddress.city.trim().length > 0;
        
        return hasFullAddress || hasStructuredAddress;
    }

    // Get field-specific error messages
    static getFieldError(field: keyof SpotFormData, value: any): string | null {
        switch (field) {
            case 'title':
                return !value.trim() ? 'Title is required' : null;
            case 'size':
                return !value ? 'Size is required' : null;
            case 'levels':
                return !value || value.length === 0 ? 'At least one level is required' : null;
            case 'coords':
                return !value ? 'Location is required' : null;
            default:
                return null;
        }
    }

    // Check if form can be submitted
    static canSubmit(data: SpotFormData): boolean {
        const validation = this.validateForm(data);
        return validation.isValid;
    }
}
