'use client';

import { Dialog, DialogTitle, DialogContent, Typography, Chip, Stack, IconButton, Box, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FastCarousel from '../ui/FastCarousel';
import Loading from "@/components/loading/Loading";
import Rating from '@mui/material/Rating';
import Image from 'next/image';
import { useState } from 'react';
import { useToast } from '@/context/ToastContext';
import { useUser } from '@/context/UserContext';
import { useTheme } from '@/context/ThemeContext';
import FavoriteButton from '../common/FavoriteButton';
import { LocationOn, Park, Streetview, Star, Link as LinkIcon } from '@mui/icons-material';

interface SkateparkModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  tags: string[];
  photoNames: string[];
  coordinates: { lat: number; lng: number };
  externalLinks?: {
    url: string;
    sentBy: { id: string; name: string };
    sentAt: string;
  }[];
  isPark: boolean;
  size: string;
  levels: string[];
  _id: string;
  avgRating?: number;
  distanceKm?: number;
}

function getRatingWord(rating: number): string {
  if (rating >= 4.5) return 'Gnarly';
  if (rating >= 3.5) return 'Steezy';
  if (rating >= 2.5) return 'Decent';
  if (rating >= 1.5) return 'Meh';
  if (rating > 0) return 'Whack';
  return 'Unrated';
}

export default function SkateparkModal({
  open,
  onClose,
  title,
  description,
  tags,
  photoNames,
  coordinates,
  isPark,
  size,
  levels,
  _id,
  externalLinks,
  avgRating,
  distanceKm
}: SkateparkModalProps) {
  // All hooks must be called at the top level, before any conditional returns
  const [userRating, setUserRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(-1);
  const { showToast } = useToast();
  const { user } = useUser();
  const { theme } = useTheme();

  const formatSrc = (src: string) => src.startsWith('http') ? src : `/${src}`;
  const isLoading = !photoNames || photoNames.length === 0;
  
  // Ensure tags is always an array
  const safeTags = tags || [];
  
  // Ensure levels is always an array
  const safeLevels = levels || [];
  
  // Ensure externalLinks is always an array
  const safeExternalLinks = externalLinks || [];
  
  if (isLoading) return <Loading />;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: 'var(--color-surface-elevated)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-xl)',
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
        }
      }}
    >
      <DialogTitle 
        sx={{ 
          backgroundColor: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
          color: 'var(--color-text-primary)',
          fontWeight: 700,
          fontSize: '1.5rem',
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: 'linear-gradient(90deg, transparent 0%, var(--color-accent-blue) 50%, transparent 100%)',
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {isPark ? (
            <Park sx={{ color: 'var(--color-accent-green)', fontSize: 28 }} />
          ) : (
            <Streetview sx={{ color: 'var(--color-accent-rust)', fontSize: 28 }} />
          )}
          {title}
        </Box>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ 
            position: 'absolute', 
            right: 12, 
            top: 12,
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-secondary)',
            transition: 'all var(--transition-fast)',
            '&:hover': {
              backgroundColor: 'var(--color-accent-rust)',
              color: 'var(--color-surface-elevated)',
              transform: 'scale(1.1)',
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent 
        sx={{ 
          backgroundColor: 'var(--color-surface)',
          color: 'var(--color-text-primary)',
          p: 3
        }}
      >
        {/* Image Carousel */}
        <Box sx={{ 
          mb: 3,
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--color-border)'
        }}>
          <FastCarousel 
            images={photoNames} 
            alt={title}
            height={400}
          />
        </Box>

        {/* Description */}
        <Typography 
          variant="body1" 
          sx={{ 
            mb: 3, 
            maxHeight: 120, 
            overflowY: 'auto', 
            whiteSpace: 'pre-line',
            color: 'var(--color-text-primary)',
            lineHeight: 1.6,
            padding: 2,
            backgroundColor: 'var(--color-surface-elevated)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)'
          }}
        >
          {description}
        </Typography>

        {/* Distance Display */}
        {distanceKm !== undefined && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            mb: 3,
            px: 2,
            py: 1.5,
            backgroundColor: 'var(--color-surface-elevated)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            alignSelf: 'flex-start'
          }}>
            <LocationOn sx={{ 
              fontSize: '1.2rem', 
              color: 'var(--color-accent-blue)' 
            }} />
            <Typography variant="body2" sx={{ 
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              fontSize: '0.9rem'
            }}>
              {distanceKm.toFixed(1)}km away
            </Typography>
          </Box>
        )}

        {/* Spot Info */}
        <Box sx={{ 
          mb: 3,
          p: 2,
          backgroundColor: 'var(--color-surface-elevated)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          flexWrap: 'wrap'
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            px: 2,
            py: 1,
            backgroundColor: isPark ? 'var(--color-accent-green)' : 'var(--color-accent-rust)',
            color: 'var(--color-surface-elevated)',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            fontSize: '0.875rem'
          }}>
            {isPark ? <Park sx={{ fontSize: 16 }} /> : <Streetview sx={{ fontSize: 16 }} />}
            {isPark ? 'Skatepark' : 'Street Spot'}
          </Box>
          
          {size && (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              px: 2,
              py: 1,
              backgroundColor: 'var(--color-accent-blue)',
              color: 'var(--color-surface-elevated)',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              fontSize: '0.875rem'
            }}>
              Size: {size}
            </Box>
          )}
          
          {safeLevels && safeLevels.length > 0 && safeLevels.some(level => level !== null && level !== undefined) && (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              px: 2,
              py: 1,
              backgroundColor: 'var(--color-accent-rust)',
              color: 'var(--color-surface-elevated)',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              fontSize: '0.875rem'
            }}>
              Levels: {safeLevels.filter(level => level !== null && level !== undefined).join(', ')}
            </Box>
          )}
        </Box>

        {/* Tags */}
        <Box sx={{ mb: 3 }}>
          <Typography 
            variant="subtitle2" 
            sx={{ 
              mb: 1.5, 
              color: 'var(--color-text-secondary)',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            🏷️ Tags
          </Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            {safeTags.map((tag, idx) => (
              <Chip
                key={idx}
                label={tag}
                size="small"
                sx={{ 
                  backgroundColor: 'var(--color-accent-green)',
                  color: 'var(--color-surface-elevated)',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  height: 28,
                  '&:hover': {
                    backgroundColor: 'var(--color-accent-green)',
                    transform: 'translateY(-1px)',
                    boxShadow: 'var(--shadow-md)',
                  }
                }}
              />
            ))}
          </Stack>
        </Box>

        {/* Favorites Button */}
        <Box sx={{ mb: 3 }}>
          <Typography 
            variant="subtitle2" 
            sx={{ 
              mb: 1.5, 
              color: 'var(--color-text-secondary)',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            ❤️ Favorites
          </Typography>
          <FavoriteButton 
            spotId={_id} 
            size="medium" 
            showCount={true}
            variant="button"
          />
        </Box>

        {/* External Links */}
        {safeExternalLinks && safeExternalLinks.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography 
              variant="subtitle2" 
              sx={{ 
                mb: 1.5, 
                color: 'var(--color-text-secondary)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              🔗 External Links
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              gap: 2, 
              pb: 1,
              flexWrap: 'wrap'
            }}>
              {safeExternalLinks.map((link, idx) => {
                let hostname = '';
                try {
                  const urlObj = new URL(link.url);
                  hostname = urlObj.hostname.replace(/^www\./, '').split('.')[0];
                  hostname = hostname.charAt(0).toUpperCase() + hostname.slice(1);
                } catch {
                  hostname = 'Link';
                }

                // Safely handle sentBy property
                const sentByName = link.sentBy && typeof link.sentBy === 'object' && 'name' in link.sentBy 
                  ? link.sentBy.name 
                  : typeof link.sentBy === 'string' 
                    ? link.sentBy 
                    : 'Unknown User';

                return (
                  <Box key={idx} sx={{ textAlign: 'center' }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => window.open(link.url, '_blank')}
                      sx={{ 
                        textTransform: 'none',
                        borderColor: 'var(--color-accent-blue)',
                        color: 'var(--color-accent-blue)',
                        borderRadius: 'var(--radius-md)',
                        transition: 'all var(--transition-fast)',
                        '&:hover': {
                          backgroundColor: 'rgba(93, 173, 226, 0.1)',
                          borderColor: 'var(--color-accent-blue)',
                          transform: 'translateY(-1px)',
                          boxShadow: 'var(--shadow-sm)',
                        }
                      }}
                    >
                      <LinkIcon sx={{ mr: 1, fontSize: 16 }} />
                      {hostname}
                    </Button>
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}

        {/* Rating Section */}
        <Box sx={{ 
          mb: 3,
          p: 2,
          backgroundColor: 'var(--color-surface-elevated)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)'
        }}>
          <Typography 
            variant="subtitle2" 
            sx={{ 
              mb: 1.5,
              color: 'var(--color-text-primary)',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            ⭐ Rate this spot
          </Typography>
          
          {/* Current Average Rating Display */}
          {avgRating && avgRating > 0 && (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1, 
              mb: 2,
              p: 1.5,
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)'
            }}>
              <Rating 
                value={avgRating} 
                readOnly 
                size="small"
                sx={{
                  '& .MuiRating-iconFilled': {
                    color: '#FFD700', // Gold color for filled stars
                  },
                  '& .MuiRating-iconEmpty': {
                    color: theme === 'dark' ? 'var(--color-border)' : '#000000',
                  }
                }}
              />
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'var(--color-text-primary)',
                  fontWeight: 600,
                  ml: 1
                }}
              >
                ({avgRating.toFixed(1)})
              </Typography>
            </Box>
          )}
          
          {/* User Rating Input */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Rating
              name="user-rating"
              value={userRating}
              onChange={async (_, value) => {
                if (!value) return;
                if (!user) return showToast("You must be logged in to rate.", "error");

                try {
                  const res = await fetch(`/api/skateparks/${_id}/rate`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "x-user-id": user._id
                    },
                    body: JSON.stringify({ rating: value })
                  });
                  const result = await res.json();
                  if (!res.ok) throw new Error(result.error);
                  setUserRating(value);
                  showToast("Thanks for rating!", "success");
                } catch (err: any) {
                  showToast(err.message, "error");
                }
              }}
              onChangeActive={(_, hover) => setHoverRating(hover)}
              sx={{
                '& .MuiRating-iconFilled': {
                  color: 'var(--color-accent-rust)',
                },
                '& .MuiRating-iconHover': {
                  color: 'var(--color-accent-rust)',
                },
                '& .MuiRating-iconEmpty': {
                  color: theme === 'dark' ? 'var(--color-border)' : '#000000',
                }
              }}
            />
            {(hoverRating !== -1 || userRating) && (
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'var(--color-accent-rust)',
                  fontWeight: 600,
                  backgroundColor: 'rgba(255, 107, 53, 0.1)',
                  px: 2,
                  py: 0.5,
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-accent-rust)'
                }}
              >
                {getRatingWord(
                  hoverRating !== null && hoverRating !== -1
                    ? hoverRating
                    : userRating !== null
                      ? userRating
                      : 0
                )}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Map */}
        <Box sx={{ 
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--color-border)'
        }}>
          <Box sx={{ 
            p: 2, 
            backgroundColor: 'var(--color-surface-elevated)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <LocationOn sx={{ color: 'var(--color-accent-blue)' }} />
            <Typography 
              variant="subtitle2" 
              sx={{ 
                color: 'var(--color-text-primary)',
                fontWeight: 600
              }}
            >
              Location
            </Typography>
          </Box>
          <iframe
            width="100%"
            height="300"
            loading="lazy"
            style={{ 
              border: 0, 
              borderRadius: 0,
              backgroundColor: 'var(--color-surface)'
            }}
            allowFullScreen
            src={`https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}&hl=es;z=14&output=embed`}
          />
        </Box>
      </DialogContent>
    </Dialog>
  );
}
