'use client';

import { useEffect, useMemo, useState } from 'react';
import { 
  Avatar, Box, Button, Chip, Container, Divider, Drawer, FormControl, IconButton, 
  InputLabel, MenuItem, OutlinedInput, Select, Stack, Switch, TextField, Typography, Tooltip 
} from '@mui/material';
import Rating from '@mui/material/Rating';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import FastCarousel from '@/components/ui/FastCarousel';
import FavoriteButton from '@/components/common/FavoriteButton';
import ApprovedBadge from '@/components/common/ApprovedBadge';
import CollapsibleCommentSection from '@/components/comments/CollapsibleCommentSection';
import Loading from '@/components/loading/Loading';
import { useToast } from '@/hooks/useToast';
import { useUser } from '@/hooks/useUser';
import { useTheme } from '@/hooks/useTheme';
import { skateparkClient } from '@/services/skateparkClient';
import { UtilityService } from '@/services/utility.service';
import { Size, Tag, SkaterLevel } from '@/types/enums';

type Park = Awaited<ReturnType<typeof skateparkClient.getSkateparkById>>;

function toMapsLink(lat?: number, lng?: number) {
  if (typeof lat !== 'number' || typeof lng !== 'number') return undefined;
  return `https://www.google.com/maps?q=${lat},${lng}&hl=es;z=14`;
}

function hostLabel(url: string) {
  try {
    const h = new URL(url).hostname.replace(/^www\./, '');
    const base = h.split('.')[0];
    return base.charAt(0).toUpperCase() + base.slice(1);
  } catch {
    return 'Link';
  }
}

export default function ParkDetailsPage() {
  const { id } = useParams<{ id: string }>() || {};
  const { showToast } = useToast();
  const { user } = useUser();
  const { theme } = useTheme();

  const [park, setPark] = useState<Park | null>(null);
  const [loading, setLoading] = useState(true);
  const [ratingBusy, setRatingBusy] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editSize, setEditSize] = useState('');
  const [editLevels, setEditLevels] = useState<string[]>([]);
  const [editIsPark, setEditIsPark] = useState(false);
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editExternalLinks, setEditExternalLinks] = useState<string[]>([]);
  const [editKeepPhotos, setEditKeepPhotos] = useState<string[]>([]);
  const [editNewPhotos, setEditNewPhotos] = useState<FileList | null>(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  // Get user location (consistent with home/map pages)
  useEffect(() => {
    if (!navigator?.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUserCoords(null),
      { enableHighAccuracy: true }
    );
  }, []);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const p = await skateparkClient.getSkateparkById(id);
        if (!cancelled) {
          setPark(p);
          setUserRating((p as any).userRating ?? null);
        }
      } catch (e: any) {
        if (!cancelled) showToast(e?.message || 'Failed to load park', 'error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, showToast]);

  const mapsHref = useMemo(() => {
    const lat = (park as any)?.location?.coordinates?.[1];
    const lng = (park as any)?.location?.coordinates?.[0];
    return toMapsLink(lat, lng);
  }, [park]);

  const distanceText = useMemo(() => {
    const lat = (park as any)?.location?.coordinates?.[1];
    const lng = (park as any)?.location?.coordinates?.[0];
    if (!userCoords || typeof lat !== 'number' || typeof lng !== 'number') return undefined;
    const km = UtilityService.getDistanceKm(userCoords.lat, userCoords.lng, lat, lng);
    return UtilityService.formatDistance(km);
  }, [park, userCoords]);

  // Check if user can edit
  const canEdit = useMemo(() => {
    if (!user || !park) return false;
    const parkAny = park as any;
    const isOwner = parkAny.createdBy?._id === user._id;
    const isAdmin = user.role === 'admin';
    return isOwner || isAdmin;
  }, [user, park]);

  // Populate edit form when park loads or edit opens
  useEffect(() => {
    if (park && editOpen) {
      const parkAny = park as any;
      setEditTitle(parkAny.title || '');
      setEditDescription(parkAny.description || '');
      setEditSize(parkAny.size || '');
      setEditLevels(Array.isArray(parkAny.levels) ? parkAny.levels : []);
      setEditIsPark(parkAny.isPark || false);
      setEditTags(Array.isArray(parkAny.tags) ? parkAny.tags : []);
      setEditExternalLinks(
        Array.isArray(parkAny.externalLinks) 
          ? parkAny.externalLinks.map((link: any) => link.url || link).filter(Boolean)
          : []
      );
      setEditKeepPhotos(Array.isArray(parkAny.photoNames) ? parkAny.photoNames : []);
      setEditNewPhotos(null);
      setHasAttemptedSubmit(false);
    }
  }, [park, editOpen]);

  // Handle photo deletion
  const handleDeletePhoto = (photoUrl: string) => {
    setEditKeepPhotos(prev => prev.filter(url => url !== photoUrl));
  };

  // Handle level selection with mutual exclusivity
  const handleEditLevelChange = (selectedLevels: string[]) => {
    if (selectedLevels.includes('All Levels')) {
      setEditLevels(['All Levels']);
    } else {
      const filtered = selectedLevels.filter(l => l !== 'All Levels');
      setEditLevels(filtered);
    }
  };

  // Handle external link management
  const addExternalLink = (link: string) => {
    const trimmed = link.trim();
    if (trimmed && !editExternalLinks.includes(trimmed)) {
      setEditExternalLinks([...editExternalLinks, trimmed]);
    }
  };

  const removeExternalLink = (index: number) => {
    setEditExternalLinks(editExternalLinks.filter((_, i) => i !== index));
  };

  // Submit edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!park || !id || !user?._id) return;

    setHasAttemptedSubmit(true);

    const parkAny = park as any;
    const coords = {
      lat: parkAny.location?.coordinates?.[1],
      lng: parkAny.location?.coordinates?.[0],
    };

    if (typeof coords.lat !== 'number' || typeof coords.lng !== 'number') {
      showToast('Invalid location', 'error');
      return;
    }

    // Basic validation (location not needed for edit)
    if (!editTitle.trim()) {
      showToast('Title is required', 'error');
      return;
    }
    if (!editSize) {
      showToast('Size is required', 'error');
      return;
    }
    if (editLevels.length === 0) {
      showToast('At least one difficulty level is required', 'error');
      return;
    }

    setIsSubmittingEdit(true);

    try {
      const parkAny = park as any;
      const existingLinks = Array.isArray(parkAny.externalLinks) ? parkAny.externalLinks : [];
      
      // Preserve existing links (with sentBy) or create new ones with current user
      const updatedExternalLinks = editExternalLinks.map(url => {
        const existing = existingLinks.find((link: any) => {
          const linkUrl = typeof link === 'string' ? link : link.url;
          return linkUrl === url;
        });
        
        if (existing && typeof existing === 'object' && existing.sentBy) {
          // Preserve existing link with its sentBy (handle both populated and non-populated)
          const sentById = typeof existing.sentBy === 'object' && existing.sentBy._id
            ? existing.sentBy._id
            : existing.sentBy;
          
          return {
            url: existing.url || url,
            sentBy: sentById,
            sentAt: existing.sentAt || new Date(),
          };
        } else {
          // New link - use current user
          return {
            url,
            sentBy: user._id,
            sentAt: new Date(),
          };
        }
      });

      const updateData = {
        title: editTitle,
        description: editDescription,
        size: editSize,
        levels: editLevels,
        isPark: editIsPark,
        tags: editTags,
        externalLinks: updatedExternalLinks,
        keepPhotoNames: editKeepPhotos,
      };

      const formDataToSend = new FormData();
      formDataToSend.append('data', JSON.stringify(updateData));
      if (editNewPhotos) {
        Array.from(editNewPhotos).forEach(photo => formDataToSend.append('photos', photo));
      }

      await skateparkClient.updateSkateparkWithFiles(id, formDataToSend);
      
      // Refetch park data
      const updated = await skateparkClient.getSkateparkById(id);
      setPark(updated);
      setEditOpen(false);
      showToast('Park updated successfully!', 'success');
    } catch (e: any) {
      showToast(e?.message || 'Failed to update park', 'error');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const isAllLevelsSelected = editLevels.includes('All Levels');
  const sizeOptions = Object.values(Size);
  const tagOptions = Object.values(Tag);
  const levelOptions = Object.values(SkaterLevel);

  if (!id) {
    return (
      <Container maxWidth="lg" sx={{ mt: 6 }}>
        <Typography variant="h6" color="error">Invalid park id</Typography>
      </Container>
    );
  }

  if (loading) return <Loading />;

  if (!park) {
    return (
      <Container maxWidth="lg" sx={{ mt: 6 }}>
        <Typography variant="h6" color="error">Park not found</Typography>
      </Container>
    );
  }

  const {
    _id, title, description, tags = [], photoNames = [], isPark,
    size, levels = [], externalLinks = [], avgRating,
    createdBy, favoritesCount, commentsCount, location,
  } = park as any;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>{title}</Typography>
          {(park as any)?.isApproved && (
            <Tooltip title="This park is approved by an admin" arrow>
              <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
                <ApprovedBadge size="large" variant="icon" />
              </Box>
            </Tooltip>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {canEdit && (
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => setEditOpen(true)}
              sx={{ textTransform: 'none' }}
            >
              Edit
            </Button>
          )}
          {createdBy && typeof createdBy === 'object' && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar src={createdBy.photoUrl} alt={createdBy.name} sx={{ width: 32, height: 32 }} />
              <Typography variant="body2" sx={{ fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                by&nbsp;
                <Link href={`/profile/${createdBy._id}`} style={{ textDecoration: 'none' }}>
                  <span style={{ color: 'var(--color-accent-blue)' }}>{createdBy.name}</span>
                </Link>
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Gallery */}
      {photoNames.length > 0 && (
        <Box sx={{ mb: 3, borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-md)', border: '1px solid var(--color-border)' }}>
          <FastCarousel images={photoNames} alt={title} height={460} />
        </Box>
      )}

      {/* Description */}
      {description && (
        <Typography
          variant="body1"
          sx={{
            mb: 3,
            whiteSpace: 'pre-line',
            color: 'var(--color-text-primary)',
            lineHeight: 1.65,
            p: 2,
            backgroundColor: 'var(--color-surface-elevated)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
          }}
        >
          {description}
        </Typography>
      )}

      {/* Quick info */}
      <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', mb: 3 }}>
        <Chip
          label={isPark ? 'Skatepark' : 'Street Spot'}
          size="small"
          sx={{
            backgroundColor: isPark ? 'var(--color-accent-green)' : 'var(--color-accent-rust)',
            color: 'var(--color-surface-elevated)',
            fontWeight: 700,
          }}
        />
        {size && (
          <Chip
            label={size}
            size="small"
            title="Size"
            sx={{ backgroundColor: 'var(--color-accent-blue)', color: 'var(--color-surface-elevated)', fontWeight: 700 }}
          />
        )}
        {Array.isArray(levels) && levels.length > 0 && (
          <Chip
            label={levels.join(', ')}
            size="small"
            title="Difficulty level"
            sx={{ backgroundColor: 'var(--color-accent-rust)', color: 'var(--color-surface-elevated)', fontWeight: 700 }}
          />
        )}
        {distanceText && (
          <Chip
            label={distanceText}
            size="small"
            sx={{ backgroundColor: 'var(--color-surface-elevated)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', fontWeight: 700 }}
          />
        )}
      </Stack>

      {/* Tags */}
      {Array.isArray(tags) && tags.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            {tags.map((tag: string, idx: number) => (
              <Chip
                key={idx}
                label={tag}
                size="small"
                title={`Tag: ${tag}`}
                sx={{
                  backgroundColor: 'var(--color-accent-green)',
                  color: 'var(--color-surface-elevated)',
                  fontWeight: 700,
                  height: 28,
                }}
              />
            ))}
          </Stack>
        </Box>
      )}

      {/* Favorites + Rating */}
      <Stack direction="row" spacing={3} sx={{ alignItems: 'center', flexWrap: 'wrap', mb: 3 }}>
        <Box title="Add to favorites">
          <FavoriteButton spotId={_id} size="medium" showCount variant="button" />
        </Box>
        <Box title="Rating">
          <Stack direction="row" spacing={2} alignItems="center">
            <Rating
              name="user-rating"
              value={userRating}
              onChange={async (_: React.SyntheticEvent, value: number | null) => {
                if (!value) return;
                if (!user?._id) return showToast('You must be logged in to rate.', 'error');
                setRatingBusy(true);
                try {
                  await skateparkClient.rateSkatepark(_id, { rating: value }, user._id);
                  setUserRating(value);
                  showToast('Thanks for rating!', 'success');
                  // Refetch park data to update avgRating
                  const updated = await skateparkClient.getSkateparkById(_id);
                  setPark(updated);
                } catch (e: any) {
                  showToast(e?.message || 'Failed to rate', 'error');
                } finally {
                  setRatingBusy(false);
                }
              }}
              disabled={ratingBusy}
              sx={{
                '& .MuiRating-iconFilled': { color: 'var(--color-accent-rust)' },
                '& .MuiRating-iconHover': { color: 'var(--color-accent-rust)' },
                '& .MuiRating-iconEmpty': { color: theme === 'dark' ? 'var(--color-border)' : '#000000' },
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

      {/* External links */}
      {Array.isArray(externalLinks) && externalLinks.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1.25, color: 'var(--color-text-secondary)', fontWeight: 700 }}>
            External links
          </Typography>
          <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
            {externalLinks.map((link: any, idx: number) => (
              <Chip key={idx} label={hostLabel(link.url)} component="a" clickable href={link.url} target="_blank" rel="noopener noreferrer" />
            ))}
          </Stack>
        </Box>
      )}

      <Divider sx={{ my: 3 }} />

      {/* Comments */}
      <CollapsibleCommentSection skateparkId={_id} />

      {/* Embedded map moved below comments */}
      {location?.coordinates?.length === 2 && (
        <Box sx={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-md)', border: '1px solid var(--color-border)', my: 4 }}>
          <iframe
            width="100%"
            height="340"
            loading="lazy"
            style={{ border: 0 }}
            allowFullScreen
            src={`https://www.google.com/maps?q=${location.coordinates[1]},${location.coordinates[0]}&hl=es;z=14&output=embed`}
          />
        </Box>
      )}

      {/* Edit Drawer */}
      <Drawer
        anchor="right"
        open={editOpen}
        onClose={() => setEditOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: '500px', md: '600px' },
            backgroundColor: 'var(--color-surface-elevated)',
            p: 3,
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Edit Park</Typography>
          <IconButton onClick={() => setEditOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>

        <form onSubmit={handleEditSubmit}>
          {/* Title */}
          <TextField
            fullWidth
            label="Title"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            required
            sx={{ mb: 2 }}
            error={hasAttemptedSubmit && !editTitle.trim()}
            helperText={hasAttemptedSubmit && !editTitle.trim() ? 'Title is required' : ''}
          />

          {/* Description */}
          <TextField
            fullWidth
            label="Description"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            multiline
            rows={3}
            sx={{ mb: 2 }}
          />

          {/* Size */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Size</InputLabel>
            <Select
              value={editSize}
              onChange={(e) => setEditSize(e.target.value)}
              label="Size"
              required
              error={hasAttemptedSubmit && !editSize}
            >
              {sizeOptions.map((sizeOption) => (
                <MenuItem key={sizeOption} value={sizeOption}>
                  {sizeOption}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Levels */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Difficulty Levels</InputLabel>
            <Select
              multiple
              value={editLevels}
              onChange={(e) => handleEditLevelChange(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
              input={<OutlinedInput label="Difficulty Levels" />}
              required
              error={hasAttemptedSubmit && editLevels.length === 0}
            >
              {levelOptions.map((level) => (
                <MenuItem
                  key={level}
                  value={level}
                  disabled={isAllLevelsSelected && level !== 'All Levels'}
                >
                  {level}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Is Park Toggle */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Switch
              checked={editIsPark}
              onChange={(e) => setEditIsPark(e.target.checked)}
              color="primary"
            />
            <Typography sx={{ ml: 1 }}>This is a skatepark (not a street spot)</Typography>
          </Box>

          {/* Tags */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Features/Tags</InputLabel>
            <Select
              multiple
              value={editTags}
              onChange={(e) => setEditTags(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
              input={<OutlinedInput label="Features/Tags" />}
            >
              {tagOptions.map((tag) => (
                <MenuItem key={tag} value={tag}>
                  {tag}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* External Links */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>External Links</Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <TextField
                placeholder="Add a link (e.g., Instagram, YouTube)"
                size="small"
                sx={{ flexGrow: 1 }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const input = e.target as HTMLInputElement;
                    addExternalLink(input.value);
                    input.value = '';
                  }
                }}
              />
              <Button
                variant="outlined"
                size="small"
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.preventDefault();
                  const input = (e.target as HTMLElement).closest('div')?.querySelector('input') as HTMLInputElement;
                  if (input) {
                    addExternalLink(input.value);
                    input.value = '';
                  }
                }}
              >
                Add
              </Button>
            </Box>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
              {editExternalLinks.map((link, i) => (
                <Chip
                  key={i}
                  label={link}
                  onDelete={() => removeExternalLink(i)}
                  size="small"
                />
              ))}
            </Stack>
          </Box>

          {/* Photos Management */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Photos</Typography>
            
            {/* Existing Photos */}
            {editKeepPhotos.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>Current Photos (click to remove)</Typography>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                  {editKeepPhotos.map((photoUrl, idx) => (
                    <Box key={idx} sx={{ position: 'relative', width: 100, height: 100 }}>
                      <Image
                        src={photoUrl}
                        alt={`Photo ${idx + 1}`}
                        fill
                        style={{ objectFit: 'cover', borderRadius: 'var(--radius-md)' }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => handleDeletePhoto(photoUrl)}
                        sx={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          backgroundColor: 'rgba(255, 0, 0, 0.7)',
                          color: 'white',
                          '&:hover': { backgroundColor: 'rgba(255, 0, 0, 0.9)' },
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}

            {/* Add New Photos */}
            <Box sx={{
              position: 'relative',
              display: 'inline-block',
              width: '100%'
            }}>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setEditNewPhotos(e.target.files)}
                style={{
                  position: 'absolute',
                  opacity: 0,
                  width: '100%',
                  height: '100%',
                  cursor: 'pointer'
                }}
                id="edit-file-upload"
              />
              <label
                htmlFor="edit-file-upload"
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
              >
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    📁 Add New Photos
                  </Typography>
                  <Typography variant="caption">
                    {editNewPhotos && editNewPhotos.length > 0
                      ? `${editNewPhotos.length} file(s) selected`
                      : 'Click to select photos'}
                  </Typography>
                </Box>
              </label>
            </Box>
          </Box>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={isSubmittingEdit}
            sx={{
              mt: 2,
              backgroundColor: 'var(--color-accent-green)',
              color: 'var(--color-surface-elevated)',
              fontWeight: 'bold',
              py: 1.5,
            }}
          >
            {isSubmittingEdit ? 'Updating...' : 'Update Park'}
          </Button>
        </form>
      </Drawer>
    </Container>
  );
}


