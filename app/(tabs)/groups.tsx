import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, type Href } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { MotionCard } from '@/components/motion';
import { Badge, Button, EmptyState, ErrorState, RowSkeleton, Screen, Sheet, Text } from '@/components/ui';
import { GroupStep } from '@/features/onboarding/steps/GroupSteps';
import { useMyGroups } from '@/features/groups/useGroups';
import { useAppStore } from '@/store/appStore';
import { colors, gradients, layout, radii, space } from '@/theme';

export default function Groups() {
  const groups = useMyGroups();
  const selectedId = useAppStore((s) => s.selectedGroupId);
  const selectGroup = useAppStore((s) => s.selectGroup);
  const [sheet, setSheet] = useState(false);

  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="h1" accessibilityRole="header">
          Groups
        </Text>
        <Button label="Join or create" icon={Plus} size="sm" variant="secondary" onPress={() => setSheet(true)} />
      </View>
      {groups.error ? (
        <ErrorState error={groups.error} onRetry={() => groups.refetch()} />
      ) : groups.isLoading ? (
        <View style={styles.list}>
          <RowSkeleton count={3} />
        </View>
      ) : (
        <FlatList
          data={groups.data}
          keyExtractor={(g) => g.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyState emoji="🫂" title="No groups yet" message="Groups are where challenges happen. Join one with a code or start your own." actionLabel="Join or create" onAction={() => setSheet(true)} />}
          renderItem={({ item: g, index }) => (
            <MotionCard index={index} onPress={() => router.push(`/group/${g.id}` as Href)} accessibilityLabel={`${g.name}, ${g.memberCount} members`} style={styles.card}>
              <Image source={{ uri: g.avatarUrl }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
              <LinearGradient colors={gradients.mediaFade} style={StyleSheet.absoluteFill} />
              <View style={styles.cardTop}>
                {g.id === selectedId && <Badge label="Active" tone="lime" dot style={{ backgroundColor: 'rgba(9,9,15,0.6)' }} />}
              </View>
              <View style={styles.cardBody}>
                <Text style={{ fontSize: 28 }}>{g.emoji}</Text>
                <Text variant="h2">{g.name}</Text>
                <Text variant="bodySmall" color="textMuted" numberOfLines={1}>
                  {g.memberCount} members · {g.description}
                </Text>
              </View>
            </MotionCard>
          )}
        />
      )}
      <Sheet visible={sheet} onClose={() => setSheet(false)} title="Join or start a group">
        <GroupStep
          compact
          draft={useAppStore.getState().onboarding}
          update={({ groupId }) => {
            if (!groupId) return;
            selectGroup(groupId);
            setSheet(false);
            router.push(`/group/${groupId}` as Href);
          }}
        />
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: layout.screenPadding, paddingVertical: space.sm },
  list: { padding: layout.screenPadding, gap: space.md, paddingBottom: 140 },
  card: { height: 200, borderRadius: radii.xl, backgroundColor: colors.surface },
  cardTop: { flexDirection: 'row', justifyContent: 'flex-end', padding: space.md },
  cardBody: { marginTop: 'auto', padding: space.lg, gap: 2 },
});
