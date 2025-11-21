import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/useToast';
import { useUser } from '@/hooks/useUser';
import { userClient } from '@/services/userClient';
import { logger } from '@/lib/logger';

export interface BioSocialsData {
  bio?: string;
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  website?: string;
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
}

/**
 * Custom hook for managing profile settings (updates, password change, photo management, account deletion)
 */
export function useProfileSettings(userId: string) {
  const { showToast } = useToast();
  const { user } = useUser();
  const [isUpdating, setIsUpdating] = useState(false);

  // Check if current user is the owner or admin
  const isOwner = user?._id === userId;
  const isAdmin = user?.role === 'admin';

  // Update bio and social links - Owner or Admin editing non-admin user
  const updateBio = useCallback(async (data: BioSocialsData, profileRole?: string) => {
    // Allow if owner, or if admin editing non-admin user
    if (!isOwner && !(isAdmin && profileRole !== 'admin')) {
      showToast('You can only edit your own profile or admin can edit user profiles', 'error');
      return null;
    }

    try {
      setIsUpdating(true);
      const updated = await userClient.updateBio(userId, data);
      showToast('Profile updated successfully', 'success');
      return updated;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      logger.error('Failed to update bio', error, 'useProfileSettings');
      showToast(errorMessage, 'error');
      return null;
    } finally {
      setIsUpdating(false);
    }
  }, [userId, isOwner, isAdmin, showToast]);

  // Change password
  const changePassword = useCallback(async (data: PasswordChangeData) => {
    if (!isOwner) {
      showToast('You can only change your own password', 'error');
      return false;
    }

    try {
      setIsUpdating(true);
      await userClient.updatePassword(userId, data.currentPassword, data.newPassword);
      showToast('Password changed successfully', 'success');
      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to change password';
      logger.error('Failed to change password', error, 'useProfileSettings');
      showToast(errorMessage, 'error');
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [userId, isOwner, showToast]);

  // Upload profile photo
  const uploadPhoto = useCallback(async (file: File) => {
    if (!isOwner) {
      showToast('You can only change your own photo', 'error');
      return null;
    }

    try {
      setIsUpdating(true);
      const result = await userClient.uploadPhoto(userId, file);
      showToast('Photo updated successfully', 'success');
      return result;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload photo';
      logger.error('Failed to upload photo', error, 'useProfileSettings');
      showToast(errorMessage, 'error');
      return null;
    } finally {
      setIsUpdating(false);
    }
  }, [userId, isOwner, showToast]);

  // Delete profile photo
  const deletePhoto = useCallback(async () => {
    if (!isOwner && !isAdmin) {
      showToast('You can only delete your own photo or be an admin', 'error');
      return false;
    }

    try {
      setIsUpdating(true);
      await userClient.deletePhoto(userId);
      showToast('Photo deleted successfully', 'success');
      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete photo';
      logger.error('Failed to delete photo', error, 'useProfileSettings');
      showToast(errorMessage, 'error');
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [userId, isOwner, isAdmin, showToast]);

  // Delete account - Owner or Admin deleting non-admin user
  const deleteAccount = useCallback(async (profileRole?: string) => {
    // Allow if owner, or if admin deleting non-admin user
    const isDeletingOwnAccount = isOwner;
    const isAdminDeletingUser = isAdmin && profileRole !== 'admin';
    
    if (!isDeletingOwnAccount && !isAdminDeletingUser) {
      showToast('You can only delete your own account or admin can delete user accounts', 'error');
      return false;
    }

    try {
      setIsUpdating(true);
      await userClient.deleteAccount(userId);
      const message = isAdminDeletingUser ? 'User account deleted successfully' : 'Account deleted successfully';
      showToast(message, 'success');
      // Redirect to home only if deleting own account
      if (isDeletingOwnAccount && typeof window !== 'undefined') {
        window.location.href = '/';
      }
      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete account';
      logger.error('Failed to delete account', error, 'useProfileSettings');
      showToast(errorMessage, 'error');
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [userId, isOwner, isAdmin, showToast]);

  return {
    isOwner,
    isAdmin,
    isUpdating,
    updateBio,
    changePassword,
    uploadPhoto,
    deletePhoto,
    deleteAccount,
  };
}

