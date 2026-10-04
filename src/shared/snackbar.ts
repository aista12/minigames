import './snackbar.scss';

export type SnackbarVariant = 'success' | 'error';
export type Snackbar = {
    element: HTMLElement;
    show: (message: string, variant: SnackbarVariant) => void;
};

export const createSnackbar = (): Snackbar => {
    const element = document.createElement('div');
    element.className = 'snackbar';
    element.setAttribute('role', 'status');
    element.setAttribute('aria-live', 'polite');
    element.hidden = true;

    const message = document.createElement('span');
    message.className = 'snackbar__message';

    const closeButton = document.createElement('button');
    closeButton.className = 'snackbar__close';
    closeButton.type = 'button';
    closeButton.setAttribute('aria-label', 'Dismiss notification');
    closeButton.textContent = '×';
    element.append(message, closeButton);

    let timer: number | undefined;
    const dismiss = (): void => {
        if (timer !== undefined) {
            globalThis.clearTimeout(timer);
            timer = undefined;
        }
        element.hidden = true;
    };

    closeButton.addEventListener('click', dismiss);

    return {
        element,
        show: (text, variant): void => {
            if (timer !== undefined) {
                globalThis.clearTimeout(timer);
            }

            message.textContent = text;
            element.className = `snackbar snackbar--${variant}`;
            element.hidden = false;
            timer = globalThis.setTimeout(dismiss, 5000);
        },
    };
};
