export class SmoothAppender {
    private delay: number;
    private appending: boolean = false;
    private textarea: HTMLTextAreaElement;
    private textQueue: string[] = [];


    constructor(delay: number, textarea: HTMLTextAreaElement) {
        this.delay = delay;
        this.textarea = textarea;
    }

    appendText(text: string) {
        this.textQueue.push(text);
        this.processQueue()
    }

    private processQueue() {
        if (this.appending || this.textQueue.length === 0) {
            return;
        }

        const currentText = this.textQueue.shift()!;
        this.appending = true;
        let index = 0;

        const intervalId = setInterval(() => {
            if (index < currentText.length) {
                this.textarea.value += currentText[index];
                this.textarea.style.height = `${this.textarea.scrollHeight}px`;
                this.textarea.scrollTop = this.textarea.scrollHeight;
                index++;
            } else {
                clearInterval(intervalId);
                this.appending = false;
                this.processQueue();
            }
        }, this.delay);
    }
}