import { AppError } from '@/lib/errors';
import { demoBackend as api } from '@/services/demo/demoBackend';
import { useAppStore } from '@/store/appStore';

jest.setTimeout(15000);

describe('demo backend (server rules)', () => {
  afterEach(() => useAppStore.setState({ simulateFailures: false }));

  it('signs in and restores the session', async () => {
    const res = await api.auth.signIn('jordan@pulsedeck.app', 'tacos4life');
    expect(res.needsOnboarding).toBe(false);
    expect(await api.auth.restore()).toEqual(res);
  });

  it('rejects bad credentials with an auth error', async () => {
    await expect(api.auth.signIn('locked@pulsedeck.app', 'x')).rejects.toMatchObject({ kind: 'auth' });
  });

  it('only returns groups the user belongs to', async () => {
    const groups = await api.groups.mine();
    expect(groups.map((g) => g.name)).toEqual(['Apartment 4B', 'Lakeview Lunch Club', 'Sunday League']);
    expect(groups[0].memberCount).toBe(8);
  });

  it('rejects an invalid invite code', async () => {
    await expect(api.groups.join('ZZZZZZ')).rejects.toMatchObject({ kind: 'notFound' });
  });

  it('blocks reading a group after leaving it (permission)', async () => {
    await api.groups.leave('g_league');
    await expect(api.groups.get('g_league')).rejects.toMatchObject({ kind: 'permission' });
    await api.groups.join('GGWP42');
    expect((await api.groups.get('g_league')).name).toBe('Sunday League');
  });

  it('does not allow voting for your own submission', async () => {
    await expect(api.submissions.vote('c_pets', 's_p3')).rejects.toMatchObject({ kind: 'validation' });
  });

  it('reports every upload phase in order and adds the submission to the feed', async () => {
    const phases: string[] = [];
    const sub = await api.submissions.create({ challengeId: 'c_desk', mediaType: 'text', text: 'my desk is a couch', caption: '' }, (p) => {
      if (phases[phases.length - 1] !== p) phases.push(p);
    });
    expect(phases).toEqual(['preparing', 'uploading', 'processing']);
    expect((await api.submissions.list('c_desk')).some((s) => s.id === sub.id)).toBe(true);
  });

  it('fails uploads under a flaky network with a recoverable upload error', async () => {
    useAppStore.setState({ simulateFailures: true });
    jest.spyOn(Math, 'random').mockReturnValue(0);
    await expect(api.submissions.create({ challengeId: 'c_desk', mediaType: 'text', text: 'x', caption: '' }, () => undefined)).rejects.toBeInstanceOf(AppError);
    jest.spyOn(Math, 'random').mockRestore();
  });

  it('echoes sent messages over realtime with the clientId for de-duplication', async () => {
    const received: string[] = [];
    const off = api.chat.subscribe('g_4b', { onMessage: (m) => received.push(m.clientId ?? m.id), onTyping: () => undefined });
    const sent = await api.chat.send({ clientId: 'c_test', groupId: 'g_4b', body: 'tacos?' });
    await new Promise((r) => setTimeout(r, 120));
    off();
    await new Promise((r) => setTimeout(r, 2800)); // let the simulated friend reply timers drain
    expect(sent.clientId).toBe('c_test');
    expect(received).toContain('c_test');
  });
});
