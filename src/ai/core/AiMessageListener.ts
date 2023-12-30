import {AiMessage} from "./AiMessage.ts";
import {AiClient} from "./AiClient.ts";

export interface AiMessageListener {
    onStart: (aiClient: AiClient) => void,
    onStop: () => void,
    onMessage: (message: AiMessage) => void,
}
