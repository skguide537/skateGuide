'use client';

import { Dialog, DialogTitle, DialogContent, Typography, Chip, Stack, IconButton, Box, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Carousel from 'react-material-ui-carousel';
import Loading from "@/components/loading/Loading";
import Rating from '@mui/material/Rating';
import { useState } from 'react';
import { useToast } from '@/context/ToastContext';
import { useUser } from '@/context/UserContext';
import Image from 'next/image';

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
  level: string;
  _id: string;
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
  level,
  _id,
  externalLinks
}: SkateparkModalProps) {
  // All hooks must be called at the top level, before any conditional returns
  const [userRating, setUserRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(-1);
  const { showToast } = useToast();
  const { user } = useUser();

  const formatSrc = (src: string) => src.startsWith('http') ? src : `/${src}`;
  const isLoading = photoNames.length === 0;
  
  if (isLoading) return <Loading />;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {title}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Carousel autoPlay={false} navButtonsAlwaysVisible={photoNames.length > 1} indicators={photoNames.length > 1}>
          {photoNames.map((src, idx) => (
            <Image
              key={idx}
              src={formatSrc(src)}
              alt={`Skatepark photo ${idx + 1}`}
              width={600}
              height={400}
              style={{
                width: '100%',
                height: 400,
                objectFit: 'cover',
                borderRadius: 8
              }}
            />
          ))}
        </Carousel>

        <Typography variant="body2" sx={{ mt: 2, maxHeight: 100, overflowY: 'auto', whiteSpace: 'pre-line' }}>
          {description}
        </Typography>

        <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
          {isPark ? 'Skatepark' : 'Street Spot'} • Size: {size || '—'} • Level: {level || '—'}
        </Typography>

        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mt: 2 }}>
          {tags.map((tag, idx) => (
            <Chip
              key={idx}
              label={tag}
              size="small"
              sx={{ backgroundColor: '#6E7763', color: '#fff' }}
            />
          ))}
        </Stack>

        {externalLinks && externalLinks.length > 0 && (
          <Box sx={{ mt: 3, overflowX: 'auto' }}>
            <Typography variant="subtitle2" gutterBottom>External Links</Typography>
            <Box sx={{ display: 'flex', gap: 2, pb: 1 }}>
              {externalLinks.map((link, idx) => {
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
                      sx={{ textTransform: 'none' }}
                    >
                      {hostname}
                    </Button>
                    <Typography variant="caption" display="block" mt={0.5}>
                      Sent by: {sentByName}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
            Rate this spot:
          </Typography>
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
          />
          {(hoverRating !== -1 || userRating) && (
            <Typography variant="caption" sx={{ ml: 1 }}>
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

        <div style={{ marginTop: 24 }}>
          <iframe
            width="100%"
            height="300"
            loading="lazy"
            style={{ border: 0, borderRadius: 8 }}
            allowFullScreen
            src={`https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}&hl=es;z=14&output=embed`}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
