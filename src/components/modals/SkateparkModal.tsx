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
import { useEffect, useMemo, useState } from 'react';
import FavoriteButton from '../common/FavoriteButton';
import FastCarousel from '../ui/FastCarousel';
import { SkateparkDetail } from '@/types/skatepark';

interface SkateparkModalProps {
  open: boolean;
  onClose: () => void;
  _id: string;
  title?: string;
  description?: string;
  tags?: string[];
  photoNames?: string[];
  coordinates?: { lat: number; lng: number };
  externalLinks?: {
    url: string;
    sentBy: { id: string; name: string };
    sentAt: string;
  }[];
  isPark?: boolean;
  size?: string;
  levels?: string[];
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
  _id,
  title,
  description,
  tags,
  photoNames,
  coordinates,
  isPark,
  size,
  levels,
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

  const [parkDetails, setParkDetails] = useState<SkateparkDetail | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setParkDetails(null);
      setFetchError(null);
      return;
    }

    let cancelled = false;
    setIsFetching(true);

    skateparkClient.getSkateparkById(_id)
      .then((data) => {
        if (cancelled) return;
        setParkDetails(data);
        setFetchError(null);
        if (typeof data.userRating === 'number') {
          setUserRating(data.userRating);
        } else {
          setUserRating(null);
        }
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : 'Failed to load skatepark details.';
        setFetchError(message);
        showToast(message, 'error');
      })
      .finally(() => {
        if (cancelled) return;
        setIsFetching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, _id, showToast]);

  const resolvedData = useMemo(() => {
    const source = parkDetails;

    const normalizedExternalLinks = (source?.externalLinks ?? externalLinks ?? []).map((link) => {
      if (!link) return null;
      const sentBy = (link as any).sentBy;
      const sentAtValue = (link as any).sentAt;
      return {
        url: link.url,
        sentBy: {
          id:
            (sentBy?.id as string) ||
            (sentBy?._id as string) ||
            (typeof sentBy === 'string' ? sentBy : 'unknown'),
          name: sentBy?.name || 'Unknown',
        },
        sentAt:
          typeof sentAtValue === 'string'
            ? sentAtValue
            : sentAtValue instanceof Date
              ? sentAtValue.toISOString()
              : new Date().toISOString(),
      };
    }).filter(Boolean) as {
      url: string;
      sentBy: { id: string; name: string };
      sentAt: string;
    }[];

    const resolvedCoordinates = source?.location?.coordinates
      ? { lat: source.location.coordinates[1], lng: source.location.coordinates[0] }
      : coordinates;

    const resolvedCreatedBy = (() => {
      const detailCreator = source?.createdBy;
      if (detailCreator && typeof detailCreator === 'object' && '_id' in detailCreator) {
        return {
          _id: detailCreator._id?.toString?.() ?? detailCreator._id,
          name: detailCreator.name ?? 'Unknown',
          photoUrl: detailCreator.photoUrl,
          role: detailCreator.role,
        };
      }
      return createdBy;
    })();

    return {
      title: source?.title ?? title ?? 'Skate spot',
      description: source?.description ?? description ?? '',
      tags: source?.tags?.length ? source.tags : tags ?? [],
      photoNames: source?.photoNames?.length ? source.photoNames : photoNames ?? [],
      isPark: source?.isPark ?? isPark ?? false,
      size: source?.size ?? size ?? 'Unknown',
      levels: source?.levels ?? levels ?? [],
      avgRating: source?.avgRating ?? avgRating ?? 0,
      distanceKm,
      coordinates: resolvedCoordinates,
      externalLinks: normalizedExternalLinks,
      createdBy: resolvedCreatedBy,
    };
  }, [
    parkDetails,
    title,
    description,
    tags,
    photoNames,
    isPark,
    size,
    levels,
    avgRating,
    distanceKm,
    coordinates,
    externalLinks,
    createdBy,
  ]);

  const {
    title: resolvedTitle,
    description: resolvedDescription,
    tags: resolvedTags,
    photoNames: resolvedPhotoNames,
    isPark: resolvedIsPark,
    size: resolvedSize,
    levels: resolvedLevels,
    avgRating: resolvedAvgRating,
    coordinates: resolvedCoordinates,
    externalLinks: resolvedExternalLinks,
    createdBy: resolvedCreatedBy,
    distanceKm: resolvedDistanceKm,
  } = resolvedData;

  const isLoading = (!resolvedPhotoNames || resolvedPhotoNames.length === 0) && (isFetching || !parkDetails) && !fetchError;

  if (isLoading) return <Loading />;

  // Ensure tags, levels, and external links are always arrays
  const safeTags = resolvedTags || [];
  const safeLevels = resolvedLevels || [];
  const safeExternalLinks = resolvedExternalLinks || [];

  const locationEmbedUrl = resolvedCoordinates
    ? `https://www.google.com/maps?q=${resolvedCoordinates.lat},${resolvedCoordinates.lng}&hl=es;z=14&output=embed`
    : null;

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
          {resolvedIsPark ? (
            <Park sx={{ color: 'var(--color-accent-green)', fontSize: 28 }} />
          ) : (
            <Streetview sx={{ color: 'var(--color-accent-rust)', fontSize: 28 }} />
          )}
          {resolvedTitle}
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
            images={resolvedPhotoNames}
            alt={resolvedTitle}
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
          {resolvedDescription}
        </Typography>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          {/* Left column: creator, actions, chips, CTA */}
          <Box sx={{ flex: { xs: '1 1 auto', md: '0 0 320px' }, width: { md: '320px' }, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
            <Stack spacing={2} sx={{ width: '100%', alignItems: 'center' }}>
              {/* Created By Section */}
              {resolvedCreatedBy && typeof resolvedCreatedBy === 'object' && resolvedCreatedBy !== null && (
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
                    href={`/profile/${resolvedCreatedBy._id}`}
                    style={{ 
                      textDecoration: 'none', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      color: 'inherit'
                    }}
                  >
                    <Avatar 
                      src={resolvedCreatedBy.photoUrl} 
                      alt={resolvedCreatedBy.name}
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
                      {resolvedCreatedBy.name}
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
                    {typeof resolvedAvgRating === 'number' && resolvedAvgRating > 0 && (
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                        Avg: {resolvedAvgRating.toFixed(1)}
                      </Typography>
                    )}
                  </Stack>
                </Box>
              </Stack>

              {/* Type & Distance Chips */}
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <Chip
                  label={resolvedIsPark ? 'Skatepark' : 'Street Spot'}
                  size="small"
                  icon={resolvedIsPark ? <Park sx={{ fontSize: 16 }} /> : <Streetview sx={{ fontSize: 16 }} />}
                  sx={{
                    backgroundColor: resolvedIsPark ? 'var(--color-accent-green)' : 'var(--color-accent-rust)',
                    color: 'var(--color-surface-elevated)',
                    fontWeight: 700,
                  }}
                />

                {typeof resolvedDistanceKm === 'number' && (
                  <Chip
                    icon={<LocationOn sx={{ fontSize: 16 }} />}
                    label={`${resolvedDistanceKm.toFixed(1)}km away`}
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
              {resolvedSize && (
                  <Chip
                  label={resolvedSize}
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
            {locationEmbedUrl ? (
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
                src={locationEmbedUrl}
              />
            ) : (
              <Box
                sx={{
                  height: 260,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text-secondary)',
                  fontStyle: 'italic'
                }}
              >
                Location unavailable
              </Box>
            )}
          </Box>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
