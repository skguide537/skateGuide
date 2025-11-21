'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { useProfileSettings, BioSocialsData, PasswordChangeData } from '@/hooks/useProfileSettings';
import { authClient } from '@/services/authClient';
import { useToast } from '@/hooks/useToast';

interface SettingsTabProps {
  userId: string;
  profile: any;
  onUpdate?: () => void;
}

export default function SettingsTab({ userId, profile, onUpdate }: SettingsTabProps) {
  const { isOwner, isAdmin, isUpdating, updateBio, changePassword, uploadPhoto, deletePhoto, deleteAccount } = useProfileSettings(userId);
  const { showToast } = useToast();
  
  // Check if the profile being viewed belongs to an admin
  const isProfileAdmin = profile?.role === 'admin';
  // Admin can edit bio/social links and delete accounts for non-admin users
  const canAdminEditUser = isAdmin && !isOwner && !isProfileAdmin;
  
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPhotoDeleteConfirm, setShowPhotoDeleteConfirm] = useState(false);
  const [showPromoteConfirm, setShowPromoteConfirm] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);
  const [isDeletingAsAdmin, setIsDeletingAsAdmin] = useState(false);
  
  // Bio/Socials form state
  const [bioForm, setBioForm] = useState<BioSocialsData>({
    bio: profile.bio ?? '',
    instagram: profile.instagram ?? '',
    tiktok: profile.tiktok ?? '',
    youtube: profile.youtube ?? '',
    website: profile.website ?? '',
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState<PasswordChangeData>({
    currentPassword: '',
    newPassword: '',
  });

  // If not owner and not admin, show restriction message
  const canEdit = isOwner || isAdmin;
  
  if (!canEdit) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          You can only edit your own profile settings.
        </Typography>
      </Box>
    );
  }

  const handleSaveBio = async () => {
    const result = await updateBio(bioForm, profile.role);
    if (result) {
      setIsEditing(false);
      onUpdate?.();
    }
  };

  const handleSavePassword = async () => {
    const result = await changePassword(passwordForm);
    if (result) {
      setPasswordForm({ currentPassword: '', newPassword: '' });
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    await deleteAccount(profile.role);
  };

  const handlePromoteToAdmin = async () => {
    try {
      setIsPromoting(true);
      await authClient.promoteToAdmin(userId);
      showToast('User promoted to admin successfully', 'success');
      setShowPromoteConfirm(false);
      onUpdate?.(); // Refresh the profile to show updated role
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to promote user to admin';
      showToast(errorMessage, 'error');
    } finally {
      setIsPromoting(false);
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadPhoto(file);
      onUpdate?.();
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Profile Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage your profile information and account settings.
      </Typography>

      {/* Bio & Socials Section - Owner or Admin editing non-admin */}
      {(isOwner || canAdminEditUser) && (
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Bio & Social Links</Typography>
            {!isEditing ? (
              <Button
                startIcon={<EditIcon />}
                onClick={() => setIsEditing(true)}
                size="small"
              >
                Edit
              </Button>
            ) : (
            <Stack direction="row" spacing={1}>
              <Button
                startIcon={<SaveIcon />}
                onClick={handleSaveBio}
                disabled={isUpdating}
                size="small"
                variant="contained"
              >
                Save
              </Button>
              <Button
                startIcon={<CancelIcon />}
                onClick={() => setIsEditing(false)}
                disabled={isUpdating}
                size="small"
              >
                Cancel
              </Button>
            </Stack>
          )}
        </Box>

        {isEditing ? (
          <Stack spacing={2}>
            <TextField
              label="Bio"
              multiline
              rows={4}
              value={bioForm.bio ?? ''}
              onChange={(e) => setBioForm({ ...bioForm, bio: e.target.value })}
              fullWidth
              inputProps={{ maxLength: 500 }}
              helperText={`${(bioForm.bio ?? '').length}/500 characters`}
            />
            <TextField
              label="Instagram URL"
              value={bioForm.instagram}
              onChange={(e) => setBioForm({ ...bioForm, instagram: e.target.value })}
              fullWidth
            />
            <TextField
              label="TikTok URL"
              value={bioForm.tiktok}
              onChange={(e) => setBioForm({ ...bioForm, tiktok: e.target.value })}
              fullWidth
            />
            <TextField
              label="YouTube URL"
              value={bioForm.youtube}
              onChange={(e) => setBioForm({ ...bioForm, youtube: e.target.value })}
              fullWidth
            />
            <TextField
              label="Website URL"
              value={bioForm.website}
              onChange={(e) => setBioForm({ ...bioForm, website: e.target.value })}
              fullWidth
            />
          </Stack>
        ) : (
          <Box>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {profile.bio || 'No bio yet'}
            </Typography>
            {profile.instagram && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Instagram: {profile.instagram}
              </Typography>
            )}
            {profile.tiktok && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                TikTok: {profile.tiktok}
              </Typography>
            )}
            {profile.youtube && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                YouTube: {profile.youtube}
              </Typography>
            )}
            {profile.website && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Website: {profile.website}
              </Typography>
            )}
          </Box>
        )}
        </Box>
      )}

      <Divider sx={{ my: 3 }} />

      {/* Profile Photo Section */}
      {isOwner && (
        <>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Profile Photo
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Update your profile picture
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="upload-photo"
                type="file"
                onChange={handlePhotoChange}
              />
              <label htmlFor="upload-photo">
                <Button
                  variant="contained"
                  component="span"
                  disabled={isUpdating}
                >
                  Upload Photo
                </Button>
              </label>
              {profile.photoUrl && profile.photoUrl !== '/default-user.png' && (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => setShowPhotoDeleteConfirm(true)}
                  disabled={isUpdating}
                >
                  Delete Photo
                </Button>
              )}
            </Stack>
          </Box>

          <Dialog open={showPhotoDeleteConfirm} onClose={() => setShowPhotoDeleteConfirm(false)}>
            <DialogTitle>Delete Photo?</DialogTitle>
            <DialogContent>
              <Typography>
                Are you sure you want to delete your profile photo? This will restore the default image.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowPhotoDeleteConfirm(false)}>Cancel</Button>
              <Button
                onClick={async () => {
                  const result = await deletePhoto();
                  if (result) {
                    setShowPhotoDeleteConfirm(false);
                    onUpdate?.();
                  }
                }}
                color="error"
                variant="contained"
              >
                Delete Photo
              </Button>
            </DialogActions>
          </Dialog>

          <Divider sx={{ my: 3 }} />
        </>
      )}

      {/* Change Password Section - only for owner */}
      {isOwner && (
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Change Password</Typography>
            <Button
              onClick={() => setIsChangingPassword(!isChangingPassword)}
              size="small"
              variant={isChangingPassword ? "outlined" : "contained"}
            >
              {isChangingPassword ? 'Cancel' : 'Change'}
            </Button>
          </Box>

        {isChangingPassword && (
          <Stack spacing={2}>
            <TextField
              label="Current Password"
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              fullWidth
            />
            <TextField
              label="New Password"
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              fullWidth
              helperText="Must be at least 6 characters"
            />
            <Button
              onClick={handleSavePassword}
              disabled={isUpdating || passwordForm.newPassword.length < 6}
              variant="contained"
              sx={{ alignSelf: 'flex-start' }}
            >
              Update Password
            </Button>
          </Stack>
        )}
        </Box>
      )}

      <Divider sx={{ my: 3 }} />

      {/* Admin Photo Management (only for admins viewing non-admin profiles) */}
      {isAdmin && !isOwner && !isProfileAdmin ? (
        <>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Manage User Photo (Admin)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              As an admin, you can delete inappropriate profile pictures.
            </Typography>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setShowPhotoDeleteConfirm(true)}
              disabled={isUpdating}
            >
              Delete User Photo
            </Button>
          </Box>

          <Dialog open={showPhotoDeleteConfirm} onClose={() => setShowPhotoDeleteConfirm(false)}>
            <DialogTitle>Delete User Photo?</DialogTitle>
            <DialogContent>
              <Typography>
                Are you sure you want to delete this user&apos;s profile photo? This will restore the default image.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowPhotoDeleteConfirm(false)}>Cancel</Button>
              <Button
                onClick={async () => {
                  const result = await deletePhoto();
                  if (result) {
                    setShowPhotoDeleteConfirm(false);
                    onUpdate?.();
                  }
                }}
                color="error"
                variant="contained"
              >
                Delete Photo
              </Button>
            </DialogActions>
          </Dialog>

          <Divider sx={{ my: 3 }} />
        </>
      ) : null}

      {/* Danger Zone (owner only) */}
      {isOwner && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" color="error" gutterBottom>
            Danger Zone
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Delete your account permanently. This action cannot be undone.
          </Typography>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete Account
          </Button>
        </Box>
      )}

      {/* Admin Actions (admin viewing non-admin user) */}
      {canAdminEditUser && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" color="error" gutterBottom>
            Admin Actions
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            As an admin, you can promote this user to admin or delete their account.
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<EditIcon />}
              onClick={() => setShowPromoteConfirm(true)}
              disabled={isPromoting}
            >
              Promote to Admin
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => {
                setIsDeletingAsAdmin(true);
                setShowDeleteConfirm(true);
              }}
            >
              Delete User Account
            </Button>
          </Stack>
        </Box>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onClose={() => {
        setShowDeleteConfirm(false);
        setIsDeletingAsAdmin(false);
      }}>
        <DialogTitle>{isDeletingAsAdmin ? 'Delete User Account?' : 'Delete Account?'}</DialogTitle>
        <DialogContent>
          <Typography>
            {isDeletingAsAdmin 
              ? `Are you sure you want to delete ${profile.name}'s account? This will permanently delete their profile, spots, and comments. This action cannot be undone.`
              : 'Are you sure you want to delete your account? This will permanently delete your profile, spots, and comments. This action cannot be undone.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShowDeleteConfirm(false);
            setIsDeletingAsAdmin(false);
          }}>Cancel</Button>
          <Button onClick={() => {
            handleDeleteAccount();
            setIsDeletingAsAdmin(false);
          }} color="error" variant="contained">
            Delete Account
          </Button>
        </DialogActions>
      </Dialog>

      {/* Promote to Admin Confirmation Dialog */}
      <Dialog open={showPromoteConfirm} onClose={() => setShowPromoteConfirm(false)}>
        <DialogTitle>Promote User to Admin?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to promote this user to admin? They will gain full administrative privileges.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPromoteConfirm(false)} disabled={isPromoting}>
            Cancel
          </Button>
          <Button onClick={handlePromoteToAdmin} color="primary" variant="contained" disabled={isPromoting}>
            {isPromoting ? 'Promoting...' : 'Promote to Admin'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

