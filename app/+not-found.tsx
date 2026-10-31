import { Redirect, router, usePathname } from 'expo-router';
import { EmptyState, Screen } from '@/components/ui';

export default function NotFound() {
  const pathname = usePathname();
  // On web, an auth-guard redirect can land on a bare group URL like "/(auth)" or "/(tabs)".
  if (/^\/\(auth\)/.test(pathname)) return <Redirect href="/welcome" />;
  if (/^\/\(tabs\)/.test(pathname)) return <Redirect href="/" />;
  return (
    <Screen style={{ justifyContent: 'center' }}>
      <EmptyState emoji="🧭" title="Lost the plot" message="That screen doesn’t exist. Let’s get you back to the crew." actionLabel="Go home" onAction={() => router.replace('/')} />
    </Screen>
  );
}
