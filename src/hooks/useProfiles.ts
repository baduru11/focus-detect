import { useState, useEffect, useCallback } from "react";
import type { Profile } from "@/types/profile";
import {
  getAllProfiles,
  getProfile as fetchProfile,
  createProfile as insertProfile,
  updateProfile as patchProfile,
  deleteProfile as removeProfile,
  getSettingValue,
  setSettingValue,
} from "@/services/profileService";

const ACTIVE_PROFILE_KEY = "activeProfileId";

interface UseProfilesReturn {
  profiles: Profile[];
  activeProfile: Profile | null;
  loading: boolean;
  error: string | null;
  loadProfiles: () => Promise<void>;
  setActiveProfile: (profileId: string) => Promise<void>;
  createProfile: (profile: Omit<Profile, "id">) => Promise<Profile>;
  updateProfile: (
    id: string,
    updates: Partial<Omit<Profile, "id">>
  ) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
}

export function useProfiles(): UseProfilesReturn {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfile, setActiveProfileState] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const allProfiles = await getAllProfiles();
      setProfiles(allProfiles);

      // Restore active profile from settings
      const savedActiveId = await getSettingValue(ACTIVE_PROFILE_KEY);
      if (savedActiveId) {
        const active = allProfiles.find((p) => p.id === savedActiveId) ?? null;
        setActiveProfileState(active);
      } else if (allProfiles.length > 0) {
        // Default to first profile if none saved
        setActiveProfileState(allProfiles[0]);
        await setSettingValue(ACTIVE_PROFILE_KEY, allProfiles[0].id);
      } else {
        setActiveProfileState(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      console.error("Failed to load profiles:", message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const setActiveProfile = useCallback(
    async (profileId: string) => {
      try {
        const profile = await fetchProfile(profileId);
        if (!profile) {
          throw new Error(`Profile not found: ${profileId}`);
        }
        setActiveProfileState(profile);
        await setSettingValue(ACTIVE_PROFILE_KEY, profileId);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        console.error("Failed to set active profile:", message);
      }
    },
    []
  );

  const createProfile = useCallback(
    async (profile: Omit<Profile, "id">): Promise<Profile> => {
      try {
        setError(null);
        const created = await insertProfile(profile);
        setProfiles((prev) => [...prev, created]);
        return created;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        throw err;
      }
    },
    []
  );

  const updateProfile = useCallback(
    async (id: string, updates: Partial<Omit<Profile, "id">>) => {
      try {
        setError(null);
        await patchProfile(id, updates);

        setProfiles((prev) =>
          prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
        );

        // If the updated profile is the active one, refresh it
        setActiveProfileState((prev) => {
          if (prev && prev.id === id) {
            return { ...prev, ...updates };
          }
          return prev;
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        throw err;
      }
    },
    []
  );

  const deleteProfile = useCallback(
    async (id: string) => {
      try {
        setError(null);
        await removeProfile(id);

        setProfiles((prev) => prev.filter((p) => p.id !== id));

        // If we deleted the active profile, clear it
        setActiveProfileState((prev) => {
          if (prev && prev.id === id) {
            return null;
          }
          return prev;
        });

        // Clean up setting if it was the active profile
        const savedActiveId = await getSettingValue(ACTIVE_PROFILE_KEY);
        if (savedActiveId === id) {
          await setSettingValue(ACTIVE_PROFILE_KEY, "");
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        throw err;
      }
    },
    []
  );

  return {
    profiles,
    activeProfile,
    loading,
    error,
    loadProfiles,
    setActiveProfile,
    createProfile,
    updateProfile,
    deleteProfile,
  };
}
