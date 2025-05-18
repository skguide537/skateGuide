'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Chip,
  Stack,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Carousel from 'react-material-ui-carousel';

interface SkateparkModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  tags: string[];
  photoNames: string[];
  coordinates: { lat: number; lng: number };
  isPark: boolean;
  size: string;
  level: string;
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
  level
}: SkateparkModalProps) {
  const formatSrc = (src: string) =>
    src.startsWith('http') ? src : `/${src}`;

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
        <Carousel autoPlay={false} navButtonsAlwaysVisible>
          {photoNames.map((src, idx) => (
            <img
              key={idx}
              src={formatSrc(src)}
              alt={`Skatepark photo ${idx + 1}`}
              style={{
                width: '100%',
                height: 400,
                objectFit: 'cover',
                borderRadius: 8
              }}
            />
          ))}
        </Carousel>

        <Typography
          variant="body2"
          sx={{
            mt: 2,
            maxHeight: 100,
            overflowY: 'auto',
            whiteSpace: 'pre-line'
          }}
        >
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
