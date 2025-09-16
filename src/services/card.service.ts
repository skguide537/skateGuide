// Card service for handling card-related utilities and logic
import { ExternalLink } from '@/types/skatepark';

export interface CardData {
  _id: string;
  title: string;
  description: string;
  tags: string[];
  photoNames: string[];
  coordinates: { lat: number; lng: number };
  isPark: boolean;
  size: string;
  levels: string[];
  avgRating: number;
  distanceKm: number;
  externalLinks: ExternalLink[];
}

export interface CardDisplayOptions {
  showDeleteButton: boolean;
  showFavoriteButton: boolean;
  showDistance: boolean;
  showRating: boolean;
  maxTagsToShow: number;
  maxDescriptionLength: number;
}

export class CardService {
  // Default display options
  static readonly DEFAULT_DISPLAY_OPTIONS: CardDisplayOptions = {
    showDeleteButton: false,
    showFavoriteButton: true,
    showDistance: true,
    showRating: true,
    maxTagsToShow: 3,
    maxDescriptionLength: 100
  };

  // Format image source
  static formatImageSrc(src: string): string {
    if (src.startsWith('http')) return src;
    return `/${src}`;
  }

  // Get default image if no photos available
  static getDefaultImage(): string {
    return "https://res.cloudinary.com/dcncqacrd/image/upload/v1747566727/skateparks/default-skatepark.png";
  }

  // Get images to display
  static getImagesToShow(photoNames: string[]): string[] {
    const hasPhotos = photoNames && photoNames.length > 0;
    return hasPhotos ? photoNames : [this.getDefaultImage()];
  }

  // Format distance for display
  static formatDistance(distanceKm: number): string {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)}m away`;
    } else if (distanceKm < 10) {
      return `${distanceKm.toFixed(1)}km away`;
    } else {
      return `${Math.round(distanceKm)}km away`;
    }
  }

  // Format rating for display
  static formatRating(rating: number): string {
    return rating.toFixed(1);
  }

  // Get type label and emoji
  static getTypeInfo(isPark: boolean): { label: string; emoji: string; color: string } {
    if (isPark) {
      return {
        label: 'Park',
        emoji: '🏞️',
        color: 'var(--color-accent-green)'
      };
    } else {
      return {
        label: 'Street',
        emoji: '🛣️',
        color: 'var(--color-accent-rust)'
      };
    }
  }

  // Get level display text
  static getLevelDisplayText(levels: string[]): string {
    if (!levels || levels.length === 0) return 'Unknown';
    
    const validLevels = levels.filter(level => level !== null && level !== undefined);
    if (validLevels.length === 0) return 'Unknown';
    
    return validLevels.join(', ');
  }

  // Truncate description
  static truncateDescription(description: string, maxLength: number = 100): string {
    if (!description) return 'No description available';
    if (description.length <= maxLength) return description;
    
    return description.substring(0, maxLength).trim() + '...';
  }

  // Get tags to display
  static getTagsToDisplay(tags: string[], maxToShow: number = 3): {
    displayTags: string[];
    hasMore: boolean;
    moreCount: number;
  } {
    if (!tags || tags.length === 0) {
      return { displayTags: [], hasMore: false, moreCount: 0 };
    }

    const displayTags = tags.slice(0, maxToShow);
    const hasMore = tags.length > maxToShow;
    const moreCount = tags.length - maxToShow;

    return { displayTags, hasMore, moreCount };
  }

  // Validate card data
  static validateCardData(data: Partial<CardData>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data._id) errors.push('Missing ID');
    if (!data.title) errors.push('Missing title');
    if (!data.size) errors.push('Missing size');
    if (!data.levels || data.levels.length === 0) errors.push('Missing levels');
    if (!data.coordinates) errors.push('Missing coordinates');
    if (data.distanceKm === undefined || data.distanceKm < 0) errors.push('Invalid distance');

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Get card accessibility label
  static getAccessibilityLabel(data: CardData): string {
    const typeInfo = this.getTypeInfo(data.isPark);
    const levelText = this.getLevelDisplayText(data.levels);
    const distanceText = this.formatDistance(data.distanceKm);
    
    return `${data.title}, ${typeInfo.label}, ${data.size}, ${levelText} level, ${distanceText}, rating ${this.formatRating(data.avgRating)}`;
  }

  // Get card tooltip text
  static getTooltipText(data: CardData): string {
    const typeInfo = this.getTypeInfo(data.isPark);
    const levelText = this.getLevelDisplayText(data.levels);
    
    return `${data.title}\n${typeInfo.emoji} ${typeInfo.label}\n📏 ${data.size}\n⭐ ${levelText}\n📍 ${this.formatDistance(data.distanceKm)}`;
  }

  // Check if card is premium/featured
  static isPremiumCard(data: CardData): boolean {
    return data.avgRating >= 4.5 || data.tags.includes('Premium') || data.tags.includes('Featured');
  }

  // Get card priority score for sorting
  static getCardPriorityScore(data: CardData): number {
    let score = 0;
    
    // Rating contribution
    score += data.avgRating * 10;
    
    // Distance contribution (closer = higher score)
    if (data.distanceKm <= 5) score += 50;
    else if (data.distanceKm <= 10) score += 30;
    else if (data.distanceKm <= 20) score += 15;
    
    // Type contribution
    if (data.isPark) score += 20; // Parks get bonus
    
    // Tags contribution
    const premiumTags = ['Premium', 'Featured', 'Popular'];
    if (data.tags.some(tag => premiumTags.includes(tag))) {
      score += 25;
    }
    
    return score;
  }

  // Get card color scheme based on data
  static getCardColorScheme(data: CardData): {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  } {
    const isPremium = this.isPremiumCard(data);
    
    if (isPremium) {
      return {
        primary: 'var(--color-accent-gold)',
        secondary: 'var(--color-accent-rust)',
        accent: 'var(--color-accent-blue)',
        background: 'var(--color-surface-premium)'
      };
    }
    
    return {
      primary: 'var(--color-accent-blue)',
      secondary: 'var(--color-accent-green)',
      accent: 'var(--color-accent-rust)',
      background: 'var(--color-surface-elevated)'
    };
  }
}
