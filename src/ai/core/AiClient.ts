
export interface AiClient {
    start: (message: string) => void;
    stop: () => void;
}
