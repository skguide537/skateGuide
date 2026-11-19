'use client';

import { Container, Typography, Box, Avatar } from '@mui/material';
import Skateboarding from '@mui/icons-material/Skateboarding';
import { useRouter } from 'next/navigation';

export default function DeletedUserProfile() {
  const router = useRouter();

  return (
    <Container maxWidth="lg" sx={{ mt: 8, mb: 8, textAlign: 'center' }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          py: 6,
        }}
      >
        {/* Deleted User Avatar */}
        <Avatar
          sx={{
            width: 120,
            height: 120,
            bgcolor: 'grey.300',
            mb: 2,
          }}
        >
          <Skateboarding sx={{ fontSize: 60, color: 'grey.600' }} />
        </Avatar>

        {/* Message */}
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          This User No Longer Exists
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500, mb: 3 }}>
          This profile has been deleted or the user doesn&apos;t exist.
        </Typography>

        {/* Action Button */}
        <Box sx={{ mt: 2 }}>
          <Typography
            variant="body2"
            color="primary.main"
            onClick={() => router.push('/')}
            sx={{
              cursor: 'pointer',
              textDecoration: 'underline',
              '&:hover': {
                textDecoration: 'none',
              },
            }}
          >
            Home
          </Typography>
        </Box>
      </Box>
    </Container>
  );
}

