'use client';

/**
 * Profile Page
 * 
 * Route: /profile
 * Shows user profile information with edit functionality.
 * Requires authentication.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthLayout from '@/layouts/AuthLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import ProfileSidebar from '@/components/common/ProfileSidebar';
import { api } from '@/lib/api';
import './page.css';

interface UserProfile {
  id: string;
  username: string | null;
  email: string;
  profilePicture: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const { sidebarOpen } = useSidebar();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');

  // Redirect unauthenticated users
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!isAuthenticated) return;

      try {
        setLoading(true);
        setError('');
        const response = await api.getProfile();
        const userData = response.user || response;
        setProfile({
          id: userData.id,
          username: userData.username,
          email: userData.email,
          profilePicture: userData.profilePicture || user?.profilePicture || null,
        });
        setEditedName(userData.username || '');
      } catch (err: any) {
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchProfile();
    }
  }, [isAuthenticated, user]);

  const handleEditName = () => {
    setIsEditingName(true);
  };

  const handleSaveName = async () => {
    // TODO: Implement name update API
    setIsEditingName(false);
    // For now, just update local state
    if (profile) {
      setProfile({ ...profile, username: editedName });
    }
  };

  const handleCancelEdit = () => {
    setIsEditingName(false);
    setEditedName(profile?.username || '');
  };

  if (authLoading || !isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <AuthLayout>
        <div className="profile-page">
          <div className="loading">Loading profile...</div>
        </div>
      </AuthLayout>
    );
  }

  if (error || !profile) {
    return (
      <AuthLayout>
        <div className="profile-page">
          <div className="error">{error || 'Failed to load profile'}</div>
        </div>
      </AuthLayout>
    );
  }

  const displayName = profile.username || profile.email.split('@')[0];
  const profileInitial = displayName.charAt(0).toUpperCase();

  return (
    <AuthLayout>
      <div className="profile-page">
        <div className="profile-page-content">
          <ProfileSidebar />
          <main className={`profile-main ${sidebarOpen ? 'sidebar-open' : ''}`}>
            <h1 className="profile-title">My Profile</h1>
            <div className="profile-container">
              {/* My Profile Card */}
              <div className="profile-card">
                <div className="profile-header-row">
                  <div className="profile-header-left">
                    {/* Profile Picture */}
                    <div className="profile-picture-section">
                      {profile.profilePicture ? (
                        <img
                          src={profile.profilePicture}
                          alt={`${displayName}'s profile`}
                          className="profile-picture-large"
                        />
                      ) : (
                        <div className="profile-picture-large profile-picture-placeholder">
                          <span className="profile-picture-initial-large">
                            {profileInitial}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Name Section */}
                    <div className="profile-name-section">
                      {isEditingName ? (
                        <div className="profile-name-edit">
                          <input
                            type="text"
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            className="profile-name-input"
                            autoFocus
                          />
                          <div className="profile-name-actions">
                            <button
                              className="profile-save-button"
                              onClick={handleSaveName}
                            >
                              Save
                            </button>
                            <button
                              className="profile-cancel-button"
                              onClick={handleCancelEdit}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="profile-name-display">
                          <h2 className="profile-name">{displayName}</h2>
                        </div>
                      )}
                    </div>
                  </div>

                  {!isEditingName && (
                    <button
                      className="profile-edit-button profile-edit-button-right"
                      onClick={handleEditName}
                      aria-label="Edit name"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </button>
                  )}
                </div>

                {/* Divider */}
                <div className="profile-divider"></div>

                {/* Contact Details */}
                <div className="profile-details">
                  <div className="profile-detail-item">
                    <span className="profile-detail-label">Email</span>
                    <span className="profile-detail-value">{profile.email}</span>
                  </div>
                  <div className="profile-detail-item">
                    <span className="profile-detail-label">Password</span>
                    <span className="profile-detail-value profile-password-masked">
                      ***********************
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </AuthLayout>
  );
}

