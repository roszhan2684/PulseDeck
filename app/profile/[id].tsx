import { useLocalSearchParams } from 'expo-router';
import { ProfileView } from '@/components/profile/ProfileView';
import { useAppStore } from '@/store/appStore';

export default function UserProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const myId = useAppStore((s) => s.userId);
  return <ProfileView userId={id} isMe={id === myId} />;
}
