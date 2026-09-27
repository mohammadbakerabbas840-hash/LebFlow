import { AccountSettings } from '../components/account/AccountSettings';
import type { Preferences } from '../types/preferences';
import { Registration } from '../features/auth/Registration';
import type { Profile } from '../types/user';
import { BackendAccount } from '../features/auth/BackendAccount';
import { apiMode } from '../services/backend';
import { LoadingState, ErrorState } from '../components/common/ResourceState';
export function AccountPage({
  profile,
  onProfileChange,
  preferences,
  onPreferences,
  onSelect,
  preferencesLoading = false,
  preferencesError = false,
}: {
  preferences: Preferences;
  onPreferences: (p: Preferences) => void;
  onSelect: (id: string) => void;
  profile: Profile | null;
  onProfileChange: (profile: Profile | null) => void;
  preferencesLoading?: boolean;
  preferencesError?: boolean;
}) {
  return (
    <>
      {apiMode ? (
        <BackendAccount />
      ) : (
        <Registration
          profile={profile}
          onCreate={onProfileChange}
          onSignOut={() => onProfileChange(null)}
        />
      )}
      {preferencesLoading ? (
        preferencesError ? (
          <ErrorState retry={() => window.location.reload()} />
        ) : (
          <LoadingState />
        )
      ) : (
        <AccountSettings
          profile={profile}
          onProfile={onProfileChange}
          preferences={preferences}
          onPreferences={onPreferences}
          onSelect={onSelect}
        />
      )}
    </>
  );
}
