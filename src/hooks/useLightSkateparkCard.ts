// Custom hook for LightSkateparkCard state and logic
import { useState, useCallback, useMemo } from 'react';
import { useUser } from '@/context/UserContext';
import { CardService, CardData } from '@/services/card.service';

export interface LightSkateparkCardState {
  modalOpen: boolean;
  deleteDialogOpen: boolean;
  isDeleting: boolean;
}

export const useLightSkateparkCard = (
  cardData: CardData,
  onDelete?: (spotId: string) => void
) => {
  const { user } = useUser();
  
  // State
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Computed values
  const isAdmin = useMemo(() => user?.role === 'admin', [user?.role]);
  
  const typeInfo = useMemo(() => 
    CardService.getTypeInfo(cardData.isPark), [cardData.isPark]
  );
  
  const imagesToShow = useMemo(() => 
    CardService.getImagesToShow(cardData.photoNames), [cardData.photoNames]
  );
  
  const tagsInfo = useMemo(() => 
    CardService.getTagsToDisplay(cardData.tags ?? [], 2), [cardData.tags]
  );
  
  const distanceText = useMemo(() => {
    if (typeof cardData.distanceKm !== 'number') return null;
    return CardService.formatDistance(cardData.distanceKm);
  }, [cardData.distanceKm]);
  
  const ratingText = useMemo(() => 
    CardService.formatRating(cardData.avgRating), [cardData.avgRating]
  );
  
  const isPremium = useMemo(() => 
    CardService.isPremiumCard(cardData), [cardData]
  );
  
  const colorScheme = useMemo(() => 
    CardService.getCardColorScheme(cardData), [cardData]
  );
  
  const accessibilityLabel = useMemo(() => 
    CardService.getAccessibilityLabel(cardData), [cardData]
  );
  
  const tooltipText = useMemo(() => 
    CardService.getTooltipText(cardData), [cardData]
  );

  // Actions
  const openModal = useCallback(() => {
    if (!isDeleting) {
      setModalOpen(true);
    }
  }, [isDeleting]);

  const closeModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  const openDeleteDialog = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteDialogOpen(true);
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setDeleteDialogOpen(false);
  }, []);

  const handleDelete = useCallback(async () => {
    if (onDelete) {
      setIsDeleting(true);
      try {
        await onDelete(cardData._id);
      } finally {
        setIsDeleting(false);
      }
    }
    setDeleteDialogOpen(false);
  }, [onDelete, cardData._id]);

  const formatImageSrc = useCallback((src: string) => {
    return CardService.formatImageSrc(src);
  }, []);

  // Card click handler
  const handleCardClick = useCallback(() => {
    if (!isDeleting) {
      openModal();
    }
  }, [isDeleting, openModal]);

  // Get card styles based on state
  const getCardStyles = useCallback(() => {
    const baseStyles = {
      width: '100%',
      maxWidth: '21rem',
      display: 'flex',
      flexDirection: 'column' as const,
      boxShadow: 'var(--shadow-md)',
      borderRadius: 'var(--radius-lg)',
      backgroundColor: colorScheme.background,
      color: 'var(--color-text-primary)',
      transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
      opacity: isDeleting ? 0.6 : 1,
      border: '1px solid var(--color-border)',
      overflow: 'hidden' as const,
      cursor: isDeleting ? 'not-allowed' as const : 'pointer' as const,
      position: 'relative' as const,
      minHeight: 'auto',
    };

    const hoverStyles = isDeleting
      ? {}
      : {
          '&:hover': {
            transform: 'translateY(-0.2rem)',
            boxShadow: 'var(--shadow-xl)',
            backgroundColor: 'var(--color-surface)',
          },
          '&:active': {
            transform: 'translateY(-0.1rem)',
          },
        };

    return { ...baseStyles, ...hoverStyles };
  }, [isDeleting, colorScheme.background]);

  // Get delete button styles
  const getDeleteButtonStyles = useCallback(() => ({
    position: 'absolute' as const,
    top: 8,
    right: 8,
    backgroundColor: 'rgba(220, 53, 69, 0.9)',
    color: 'white',
    width: 32,
    height: 32,
    zIndex: 10,
    '&:hover': {
      backgroundColor: 'var(--color-error)',
      transform: 'scale(1.1)',
    },
    transition: 'all var(--transition-fast)',
  }), []);

  // Get type badge styles
  const getTypeBadgeStyles = useCallback(() => ({
    position: 'absolute' as const,
    top: 8,
    left: 8,
    backgroundColor: typeInfo.color,
    color: 'var(--color-surface-elevated)',
    px: 2,
    py: 0.5,
    borderRadius: 'var(--radius-md)',
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    boxShadow: 'var(--shadow-sm)',
  }), [typeInfo.color]);

  // Get distance badge styles
  const getDistanceBadgeStyles = useCallback(() => ({
    position: 'absolute' as const,
    top: 8,
    right: isAdmin ? 48 : 8,
    backgroundColor: 'rgba(52, 152, 219, 0.9)',
    color: 'var(--color-surface-elevated)',
    px: 2,
    py: 0.5,
    borderRadius: 'var(--radius-md)',
    fontSize: '0.75rem',
    fontWeight: 600,
    boxShadow: 'var(--shadow-sm)',
  }), [isAdmin]);

  return {
    // State
    modalOpen,
    deleteDialogOpen,
    isDeleting,
    
    // Computed values
    isAdmin,
    typeInfo,
    imagesToShow,
    tagsInfo,
    distanceText,
    ratingText,
    isPremium,
    colorScheme,
    accessibilityLabel,
    tooltipText,
    
    // Actions
    openModal,
    closeModal,
    openDeleteDialog,
    closeDeleteDialog,
    handleDelete,
    handleCardClick,
    formatImageSrc,
    
    // Style getters
    getCardStyles,
    getDeleteButtonStyles,
    getTypeBadgeStyles,
    getDistanceBadgeStyles
  };
};
