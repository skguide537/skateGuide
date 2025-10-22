'use client';

import React, { useState } from 'react';
import { Avatar, Box } from '@mui/material';

interface CommentAvatarProps {
  photoUrl: string;
  userName: string;
  size?: number;
}

export default function CommentAvatar({ 
  photoUrl, 
  userName, 
  size = 32 
}: CommentAvatarProps) {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Avatar
        src={imageError ? '' : photoUrl}
        alt={`${userName}'s profile picture`}
        sx={{
          width: size,
          height: size,
          backgroundColor: 'var(--color-surface-elevated)',
          border: '1px solid var(--color-border)',
          fontSize: size * 0.4,
          fontWeight: 'bold',
          color: 'var(--color-text-primary)',
        }}
        onError={handleImageError}
      >
        {imageError && userName ? userName.charAt(0).toUpperCase() : '?'}
      </Avatar>
    </Box>
  );
}
