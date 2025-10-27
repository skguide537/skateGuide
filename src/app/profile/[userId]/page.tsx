'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Container, Typography, Box, CircularProgress, Avatar, Chip, Stack, Tooltip } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { useProfile } from '@/hooks/useProfile';
import { useUser } from '@/context/UserContext';
import { formatJoinedDate } from '@/utils/timeUtils';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import StarIcon from '@mui/icons-material/Star';
import CommentIcon from '@mui/icons-material/Comment';
import Skateboarding from '@mui/icons-material/Skateboarding';

// Import tab components
import ProfileTabs from '@/components/profile/ProfileTabs';
import OverviewTab from '@/components/profile/OverviewTab';
import SpotsTab from '@/components/profile/SpotsTab';
import FavoritesTab from '@/components/profile/FavoritesTab';
import CommentsTab from '@/components/profile/CommentsTab';
import SettingsTab from '@/components/profile/SettingsTab';

export default function ProfilePage() {
  const params = useParams();
  const userId = params.userId as string;
  const { user: currentUser } = useUser();
  const [activeTab, setActiveTab] = useState(0);
  
  const { profile, spots, comments, stats, isLoading, error, refetch } = useProfile(userId);

  // Check if current user is viewing their own profile or is admin
  const isOwner = currentUser?._id === userId;
  const isAdmin = currentUser?.role === 'admin';

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography variant="h4" color="error">
          Error loading profile: {error}
        </Typography>
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography variant="h4">User not found</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      {/* Profile Header */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={3}>
          {/* Profile Photo */}
          <Grid size={{ xs: 12, sm: 4, md: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Avatar
                src={profile.photoUrl}
                sx={{ width: 150, height: 150 }}
                alt={profile.name}
              >
                <Skateboarding sx={{ fontSize: 80 }} />
              </Avatar>
            </Box>
          </Grid>

          {/* Profile Info */}
          <Grid size={{ xs: 12, sm: 8, md: 9 }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="h3">
                  {profile.name}
                </Typography>
                <Tooltip title={profile.role === 'admin' ? 'This user is an admin' : 'This is a user'}>
                  <Skateboarding 
                    sx={{ 
                      color: profile.role === 'admin' ? 'var(--color-accent-blue)' : 'var(--color-text-secondary)',
                      fontSize: '28px'
                    }}
                  />
                </Tooltip>
              </Box>
              
              <Typography variant="body1" color="text.secondary" gutterBottom>
                Joined: {formatJoinedDate(profile.createdAt)}
              </Typography>

              {profile.bio && (
                <Typography variant="body1" sx={{ mt: 2, maxWidth: 600 }}>
                  {profile.bio}
                </Typography>
              )}

              {/* Social Links */}
              {(profile.instagram || profile.tiktok || profile.youtube || profile.website) && (
                <Stack direction="row" spacing={2} sx={{ mt: 2 }} flexWrap="wrap">
                  {profile.instagram && (
                    <Chip
                      icon={<span>📷</span>}
                      label="Instagram"
                      onClick={() => window.open(profile.instagram, '_blank')}
                      clickable
                      variant="outlined"
                    />
                  )}
                  {profile.tiktok && (
                    <Chip
                      icon={<span>🎵</span>}
                      label="TikTok"
                      onClick={() => window.open(profile.tiktok, '_blank')}
                      clickable
                      variant="outlined"
                    />
                  )}
                  {profile.youtube && (
                    <Chip
                      icon={<span>▶️</span>}
                      label="YouTube"
                      onClick={() => window.open(profile.youtube, '_blank')}
                      clickable
                      variant="outlined"
                    />
                  )}
                  {profile.website && (
                    <Chip
                      icon={<span>🌐</span>}
                      label="Website"
                      onClick={() => window.open(profile.website, '_blank')}
                      clickable
                      variant="outlined"
                    />
                  )}
                </Stack>
              )}
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Stats Cards */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Box sx={{ 
              p: 3, 
              bgcolor: 'background.paper', 
              borderRadius: 2,
              boxShadow: 1,
              textAlign: 'center'
            }}>
              <LocationOnIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {stats.totalSpots}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {stats.totalSpots === 1 ? 'Spot Added' : 'Spots Added'}
              </Typography>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <Box sx={{ 
              p: 3, 
              bgcolor: 'background.paper', 
              borderRadius: 2,
              boxShadow: 1,
              textAlign: 'center'
            }}>
              <StarIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '0'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Average Rating
              </Typography>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <Box sx={{ 
              p: 3, 
              bgcolor: 'background.paper', 
              borderRadius: 2,
              boxShadow: 1,
              textAlign: 'center'
            }}>
              <CommentIcon sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {stats.totalComments}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {stats.totalComments === 1 ? 'Comment' : 'Comments'}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      )}

      {/* Tabs */}
      <ProfileTabs 
        isOwner={isOwner}
        isAdmin={isAdmin}
        isProfileAdmin={profile.role === 'admin'}
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />

      {/* Tab Content */}
      {activeTab === 0 && <OverviewTab profile={profile} spots={spots} />}
      {activeTab === 1 && <SpotsTab spots={spots} isLoading={isLoading} />}
      {activeTab === 2 && isOwner && <FavoritesTab userId={userId} isOwner={isOwner} />}
      {activeTab === 3 && <CommentsTab comments={comments} currentUserId={currentUser?._id} />}
      {(activeTab === 4 && (isOwner || isAdmin)) && <SettingsTab userId={userId} profile={profile} onUpdate={refetch} />}
    </Container>
  );
}
