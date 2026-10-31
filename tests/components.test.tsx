import { fireEvent, render, screen } from '@testing-library/react-native';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/StateView';
import { AppError } from '@/lib/errors';

describe('UI primitives', () => {
  it('Button exposes an accessible name and fires onPress', async () => {
    const onPress = jest.fn();
    await render(<Button label="Post response" onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Post response' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('Button blocks presses while loading', async () => {
    const onPress = jest.fn();
    await render(<Button label="Saving" onPress={onPress} loading />);
    await fireEvent.press(screen.getByRole('button', { name: 'Saving' }));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('ErrorState shows category copy and a recovery action', async () => {
    const retry = jest.fn();
    await render(<ErrorState error={new AppError('network', 'fetch failed')} onRetry={retry} />);
    expect(screen.getByText('You’re offline')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalled();
  });
});
