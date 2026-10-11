// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSnackbar } from './snackbar';

afterEach(() => {
    vi.useRealTimers();
});

describe('snackbar', () => {
    it('shows the selected message and variant, then auto-dismisses', () => {
        vi.useFakeTimers();
        const snackbar = createSnackbar();

        snackbar.show('Saved successfully.', 'success');
        expect(snackbar.element.hidden).toBe(false);
        expect(snackbar.element.getAttribute('role')).toBe('status');
        expect(snackbar.element.getAttribute('aria-live')).toBe('polite');
        expect(snackbar.element.className).toBe('snackbar snackbar--success');
        expect(
            snackbar.element.querySelector('.snackbar__message')?.textContent,
        ).toBe('Saved successfully.');

        snackbar.show('Request failed.', 'error');
        expect(snackbar.element.className).toBe('snackbar snackbar--error');
        expect(
            snackbar.element.querySelector('.snackbar__message')?.textContent,
        ).toBe('Request failed.');
        vi.advanceTimersByTime(4999);
        expect(snackbar.element.hidden).toBe(false);
        vi.advanceTimersByTime(1);
        expect(snackbar.element.hidden).toBe(true);
    });

    it('lets users dismiss a visible snackbar and resets the previous timer', () => {
        vi.useFakeTimers();
        const snackbar = createSnackbar();
        snackbar.show('First', 'error');
        vi.advanceTimersByTime(3000);
        snackbar.show('Second', 'success');
        vi.advanceTimersByTime(3000);
        expect(snackbar.element.hidden).toBe(false);
        snackbar.element
            .querySelector<HTMLButtonElement>('.snackbar__close')
            ?.click();
        expect(snackbar.element.hidden).toBe(true);
        vi.advanceTimersByTime(5000);
        expect(snackbar.element.hidden).toBe(true);
    });
});
