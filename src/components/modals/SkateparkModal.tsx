'use client';

import Loading from "@/components/loading/Loading";
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { useUser } from '@/context/UserContext';
import { skateparkClient } from '@/services/skateparkClient';
import { LocationOn, Park, Streetview } from '@mui/icons-material';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import { Box, Button, Chip, Dialog, DialogContent, DialogTitle, IconButton, Stack, Typography, Avatar } from '@mui/material';
import Link from 'next/link';
import Rating from '@mui/material/Rating';
import { useState } from 'react';
import FavoriteButton from '../common/FavoriteButton';
import FastCarousel from '../ui/FastCarousel';

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
  createdBy?: {
    _id: string;
    name: string;
    photoUrl?: string;
    role?: string;
  };
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
  distanceKm,
  createdBy
}: SkateparkModalProps) {
  // All hooks must be called at the top level, before any conditional returns
  const [userRating, setUserRating] = useState<number | null>(null);
  const [isRatingLoading, setIsRatingLoading] = useState(false);
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
          p: 2
        }}
      >
        {/* Image Carousel */}
        <Box sx={{ 
          mb: 2,
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--color-border)'
        }}>
          <FastCarousel 
            images={photoNames} 
            alt={title}
            height={280}
          />
        </Box>

        {/* Description */}
        <Typography 
          variant="body1" 
          sx={{ 
            mb: 2, 
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
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

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          {/* Left column: creator, actions, chips, CTA */}
          <Box sx={{ flex: { xs: '1 1 auto', md: '0 0 320px' }, width: { md: '320px' }, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
            <Stack spacing={2} sx={{ width: '100%', alignItems: 'center' }}>
              {/* Created By Section */}
              {createdBy && typeof createdBy === 'object' && createdBy !== null && (
                <Box sx={{ 
                  p: 1.5,
                  backgroundColor: 'var(--color-surface-elevated)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5
                }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: 'var(--color-text-secondary)',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    Created by:
                  </Typography>
                  <Link 
                    href={`/profile/${createdBy._id}`}
                    style={{ 
                      textDecoration: 'none', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      color: 'inherit'
                    }}
                  >
                    <Avatar 
                      src={createdBy.photoUrl} 
                      alt={createdBy.name}
                      sx={{ 
                        width: 28, 
                        height: 28 
                      }}
                    >
                      <PersonIcon />
                    </Avatar>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: 'var(--color-accent-blue)',
                        fontWeight: 600,
                        '&:hover': {
                          textDecoration: 'underline'
                        }
                      }}
                    >
                      {createdBy.name}
                    </Typography>
                  </Link>
                </Box>
              )}

              {/* Favorites + Rating */}
              <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                <Box title="Add to favorites">
                  <FavoriteButton 
                    spotId={_id} 
                    size="medium" 
                    showCount={true}
                    variant="button"
                  />
                </Box>

                <Box title="Rating">
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Rating
                      name="user-rating"
                      value={userRating}
                      disabled={isRatingLoading}
                      onChange={async (_, value) => {
                        if (!value) return;
                        if (!user) return showToast("You must be logged in to rate.", "error");

                        setIsRatingLoading(true);
                        try {
                          await skateparkClient.rateSkatepark(_id, { rating: value }, user._id);
                          setUserRating(value);
                        } catch (err: any) {
                          showToast(err.message, "error");
                        } finally {
                          setIsRatingLoading(false);
                        }
                      }}
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
                    {typeof avgRating === 'number' && avgRating > 0 && (
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                        Avg: {avgRating.toFixed(1)}
                      </Typography>
                    )}
                  </Stack>
                </Box>
              </Stack>

              {/* Type & Distance Chips */}
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <Chip
                  label={isPark ? 'Skatepark' : 'Street Spot'}
                  size="small"
                  icon={isPark ? <Park sx={{ fontSize: 16 }} /> : <Streetview sx={{ fontSize: 16 }} />}
                  sx={{
                    backgroundColor: isPark ? 'var(--color-accent-green)' : 'var(--color-accent-rust)',
                    color: 'var(--color-surface-elevated)',
                    fontWeight: 700,
                  }}
                />

                {distanceKm !== undefined && (
                  <Chip
                    icon={<LocationOn sx={{ fontSize: 16 }} />}
                    label={`${distanceKm.toFixed(1)}km away`}
                    size="small"
                    sx={{
                      backgroundColor: 'var(--color-surface-elevated)',
                      color: 'var(--color-text-primary)',
                      border: '1px solid var(--color-border)',
                      fontWeight: 700,
                    }}
                  />
                )}
              </Stack>

              {/* Size & Level Chips */}
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                {size && (
                  <Chip
                    label={size}
                    size="small"
                    title="Size"
                    sx={{
                      backgroundColor: 'var(--color-accent-blue)',
                      color: 'var(--color-surface-elevated)',
                      fontWeight: 700,
                    }}
                  />
                )}

                {safeLevels && safeLevels.length > 0 && safeLevels.some(level => level !== null && level !== undefined) && (
                  <Chip
                    label={safeLevels.filter(level => level !== null && level !== undefined).join(', ')}
                    size="small"
                    title="Difficulty level"
                    sx={{
                      backgroundColor: 'var(--color-accent-rust)',
                      color: 'var(--color-surface-elevated)',
                      fontWeight: 700,
                    }}
                  />
                )}
              </Stack>
            </Stack>

            {/* CTA Button */}
            <Button
              component={Link}
              href={`/parks/${_id}`}
              variant="contained"
              size="large"
              fullWidth
              sx={{
                backgroundColor: 'var(--color-accent-green)',
                color: 'var(--color-surface-elevated)',
                fontWeight: 700,
                py: 1.5,
                borderRadius: 'var(--radius-md)',
                textTransform: 'none',
                fontSize: '1rem',
                '&:hover': {
                  backgroundColor: 'var(--color-accent-green)',
                  transform: 'translateY(-2px)',
                  boxShadow: 'var(--shadow-lg)',
                }
              }}
            >
              View Full Park Details
            </Button>
          </Box>

          {/* Right column: Map */}
          <Box sx={{ 
            flex: 1,
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-md)',
            border: '1px solid var(--color-border)'
          }}>
            <Box sx={{ 
              p: 1.5, 
              backgroundColor: 'var(--color-surface-elevated)',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <LocationOn sx={{ color: 'var(--color-accent-blue)', fontSize: 20 }} />
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  color: 'var(--color-text-primary)',
                  fontWeight: 600,
                  fontSize: '0.875rem'
                }}
              >
                Location
              </Typography>
            </Box>
            <iframe
              width="100%"
              height={260}
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
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
