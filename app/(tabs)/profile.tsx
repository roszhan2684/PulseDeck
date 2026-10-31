import { ProfileView } from '@/components/profile/ProfileView';
import { useAppStore } from '@/store/appStore';

export default function MyProfile() {
  const userId = useAppStore((s) => s.userId) ?? '';
  return <ProfileView userId={userId} isMe />;
}
