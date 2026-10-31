import { router } from 'expo-router';
import { Bell, LogOut, Share2 } from 'lucide-react-native';
import { useState } from 'react';
import { Share, View } from 'react-native';
import { AnimatedModal } from '@/components/motion';
import { Button, Sheet, Text, TextField } from '@/components/ui';
import { validateGroupName } from '@/domain/validation';
import { haptics } from '@/lib/haptics';
import { toast } from '@/store/toastStore';
import { space } from '@/theme';
import type { Group } from '@/types/domain';
import { useLeaveGroup, useRenameGroup } from './useGroups';

export function GroupSettingsSheet({ group, visible, onClose }: { group: Group; visible: boolean; onClose: () => void }) {
  const [name, setName] = useState(group.name);
  const [confirm, setConfirm] = useState(false);
  const rename = useRenameGroup(group.id);
  const leave = useLeaveGroup();
  const check = validateGroupName(name);

  const invite = () =>
    Share.share({ message: `Join my PulseDeck group “${group.name}” 🎯 Use invite code ${group.inviteCode}` }).catch(() =>
      toast.error('Couldn’t open share sheet'),
    );

  return (
    <>
      <Sheet visible={visible} onClose={onClose} title="Group settings">
        <View style={{ gap: space.md }}>
          <TextField label="Group name" value={name} onChangeText={setName} error={check.ok ? null : check.message} maxLength={32} />
          <Button
            label="Save name"
            variant="secondary"
            disabled={!check.ok || name.trim() === group.name}
            onPress={() => {
              rename.mutate(name);
              haptics.success();
              onClose();
            }}
          />
          <Button label={`Invite friends · ${group.inviteCode}`} icon={Share2} variant="secondary" onPress={invite} />
          <Button
            label="Notification settings"
            icon={Bell}
            variant="secondary"
            onPress={() => {
              onClose();
              router.push('/settings');
            }}
          />
          <Button label="Leave group" icon={LogOut} variant="danger" onPress={() => setConfirm(true)} />
        </View>
      </Sheet>
      <AnimatedModal visible={confirm} onClose={() => setConfirm(false)} accessibilityLabel="Confirm leaving group">
        <View style={{ gap: space.md }}>
          <Text variant="h2">Leave {group.name}?</Text>
          <Text variant="body" color="textMuted">
            Your posts stay, but you’ll lose your streak in this group. You can rejoin with code {group.inviteCode}.
          </Text>
          <Button
            label="Leave group"
            variant="danger"
            loading={leave.isPending}
            onPress={() =>
              leave.mutate(group.id, {
                onSuccess: () => {
                  setConfirm(false);
                  onClose();
                  router.replace('/groups');
                },
                onError: () => toast.error('Couldn’t leave group', 'Check your connection and try again.'),
              })
            }
          />
          <Button label="Stay" variant="ghost" onPress={() => setConfirm(false)} />
        </View>
      </AnimatedModal>
    </>
  );
}
