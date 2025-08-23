// Rich popup component for map markers
import { Box, Chip, Rating, Typography, Button } from '@mui/material';
import { Skatepark } from '@/services/map.service';

interface RichPopupProps {
  spot: Skatepark;
  onViewDetails: (spot: Skatepark) => void;
}

export default function RichPopup({ spot, onViewDetails }: RichPopupProps) {
  return (
    <div style={{ minWidth: '250px', maxWidth: '300px' }}>
      <Typography variant="h6" gutterBottom sx={{ color: 'var(--color-text-primary)' }}>
        {spot.title}
      </Typography>
      
      <Box display="flex" alignItems="center" gap={1} mb={1}>
        <Chip 
          label={spot.isPark ? 'Park' : 'Street'} 
          color={spot.isPark ? 'success' : 'warning'} 
          size="small" 
        />
        <Chip label={spot.size} size="small" />
        <Chip 
          label={
            spot.levels && spot.levels.length > 0 && spot.levels.some(level => level !== null && level !== undefined) 
              ? spot.levels.filter(level => level !== null && level !== undefined).join(', ') 
              : 'Unknown'
          } 
          size="small" 
        />
      </Box>
      
      {spot.avgRating > 0 && (
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <Rating value={spot.avgRating} readOnly size="small" />
          <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)' }}>
            ({spot.avgRating.toFixed(1)})
          </Typography>
        </Box>
      )}
      
      {spot.tags.length > 0 && (
        <Box mb={1}>
          {spot.tags.slice(0, 3).map((tag, index) => (
            <Chip key={index} label={tag} size="small" variant="outlined" sx={{ mr: 0.5, mb: 0.5 }} />
          ))}
        </Box>
      )}
      
      <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)', mb: 2 }}>
        {spot.description?.substring(0, 100)}
        {spot.description && spot.description.length > 100 && '...'}
      </Typography>
      
      <Button 
        variant="contained" 
        size="small" 
        fullWidth
        onClick={() => onViewDetails(spot)}
        sx={{
          backgroundColor: 'var(--color-accent-blue)',
          color: 'var(--color-surface-elevated)',
          '&:hover': {
            backgroundColor: 'var(--color-accent-blue)',
            transform: 'translateY(-1px)',
          }
        }}
      >
        View Details
      </Button>
    </div>
  );
}
