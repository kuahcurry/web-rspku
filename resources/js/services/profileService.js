import { authenticatedFetch } from '../utils/auth';

/**
 * Fetch the current user's profile picture
 * @returns {Promise<{success: boolean, data: {foto_profil: string, foto_profil_url: string}}>}
 */
export const getProfilePicture = async () => {
  try {
    const response = await authenticatedFetch('/api/profile/foto-profil');
    return response;
  } catch (error) {
    console.error('Error fetching profile picture:', error);
    throw error;
  }
};

/**
 * Upload a profile picture
 * @param {File} file - The image file to upload
 * @returns {Promise<{success: boolean, data: {foto_profil: string, foto_profil_url: string}}>}
 */
export const uploadProfilePicture = async (file) => {
  try {
    const formData = new FormData();
    formData.append('foto_profil', file);

    const response = await fetch('/api/profile/foto-profil', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: formData,
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to upload profile picture');
    }

    return data;
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    throw error;
  }
};

/**
 * Delete the current user's profile picture
 * @returns {Promise<{success: boolean}>}
 */
export const deleteProfilePicture = async () => {
  try {
    const response = await authenticatedFetch('/api/profile/foto-profil', {
      method: 'DELETE',
    });
    return response;
  } catch (error) {
    console.error('Error deleting profile picture:', error);
    throw error;
  }
};
