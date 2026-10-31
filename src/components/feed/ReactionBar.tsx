import { ScrollView, StyleSheet } from 'react-native';
import { space } from '@/theme';
import { REACTION_TYPES, type ReactionType, type Submission } from '@/types/domain';
import { Chip } from '../ui';

export interface ReactionBarProps {
  submission: Submission;
  onToggle: (r: ReactionType) => void;
}

/** Tap-to-react row. The accessible, non-gesture path to every reaction. */
export function ReactionBar({ submission, onToggle }: ReactionBarProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row} accessibilityLabel="Reactions">
      {REACTION_TYPES.map((r) => (
        <Chip key={r} label={r} count={submission.reactions[r] ?? 0} selected={submission.myReactions.includes(r)} onPress={() => onToggle(r)} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({ row: { gap: space.xs, paddingHorizontal: space.lg } });
