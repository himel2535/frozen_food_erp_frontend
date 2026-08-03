import type { ProfileView } from '@/lib/services/settings-service';
import type { Lang } from '@/lib/state/types';
import type { ProfileFormState } from '@/components/modules/settings/profile/ProfileSettingsForm';

export function profileToForm(profile: ProfileView, lang: Lang): ProfileFormState {
  return {
    name: profile.name ?? '',
    phone: profile.phone ?? '',
    email: profile.email ?? '',
    branch: profile.branch ?? '',
    territory: profile.territory ?? '',
    timezone: profile.timezone ?? 'Asia/Dhaka',
    dateFormat: profile.dateFormat ?? 'DD/MM/YYYY',
    lang: lang ?? 'en',
    bio: profile.bio ?? '',
    emergencyContact: profile.emergencyContact ?? '',
    emergencyPhone: profile.emergencyPhone ?? '',
    notifyEmail: profile.notifyEmail ?? true,
    notifyPush: profile.notifyPush ?? true,
  };
}
