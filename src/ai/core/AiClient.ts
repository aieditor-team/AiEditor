
export interface AiClient {
    start: (payload: string) => void;
    stop: () => void;
}
