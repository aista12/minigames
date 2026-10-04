export const API_BASE_URL =
    'https://faxb76kxra.execute-api.eu-central-1.amazonaws.com/api';

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

export const fetchCollection = async <T>(
    path: string,
    isItem: (value: unknown) => value is T,
    signal: AbortSignal,
): Promise<T[]> => {
    const response = await fetch(`${API_BASE_URL}${path}`, { signal });
    if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
    }

    const payload: unknown = await response.json();
    if (
        !isRecord(payload) ||
        !Array.isArray(payload.data) ||
        !payload.data.every(isItem)
    ) {
        throw new Error('The server returned an invalid response.');
    }

    return payload.data;
};
