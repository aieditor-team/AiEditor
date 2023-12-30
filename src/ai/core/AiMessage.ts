export interface AiMessage {
    role: string,
    content: string,
    index: number,

    //0 代表首个文本结果；1 代表中间文本结果；2 代表最后一个文本结果。
    status: 0|1|2,
}
