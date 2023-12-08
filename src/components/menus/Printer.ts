import {AbstractMenuButton} from "../AbstractMenuButton.ts";

export class Printer extends AbstractMenuButton {
    constructor() {
        super();
        const template = `
        <div>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M17 2C17.5523 2 18 2.44772 18 3V7H21C21.5523 7 22 7.44772 22 8V18C22 18.5523 21.5523 19 21 19H18V21C18 21.5523 17.5523 22 17 22H7C6.44772 22 6 21.5523 6 21V19H3C2.44772 19 2 18.5523 2 18V8C2 7.44772 2.44772 7 3 7H6V3C6 2.44772 6.44772 2 7 2H17ZM16 17H8V20H16V17ZM20 9H4V17H6V16C6 15.4477 6.44772 15 7 15H17C17.5523 15 18 15.4477 18 16V17H20V9ZM8 10V12H5V10H8ZM16 4H8V7H16V4Z"></path></svg>
        </div>
        `;
        this.template = template;
        this.registerClickListener();
    }

    // @ts-ignore
    onClick(commands) {

        let html = this.closest(".aie-container")!.querySelector(".aie-content")!.innerHTML;
        html = `<div class="aie-container" style="border: none;padding: 0;margin: 0"><div class="aie-content" style="border: none;height: auto;overflow: visible">${html}</div></div>`

        const style :string = Array.from(document.querySelectorAll('style, link'))
            .map((el) => el.outerHTML).join('');

        const content: string = style + html;

        const iframe: HTMLIFrameElement = document.createElement('iframe');
        iframe.id = 'aie-print-iframe';
        iframe.setAttribute('style', 'position: absolute; width: 0; height: 0; top: -10px; left: -10px;');
        document.body.appendChild(iframe);

        const frameWindow = iframe.contentWindow;
        const frameDoc = iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document);

        if (frameDoc) {
            frameDoc.open();
            frameDoc.write(content);
            frameDoc.close();
        }

        if (frameWindow) {
            iframe.onload = function() {
                try {
                    setTimeout(() => {
                        frameWindow.focus();
                        try {
                            if (!frameWindow.document.execCommand('print', false)) {
                                frameWindow.print();
                            }
                        } catch (e) {
                            frameWindow.print();
                        }
                        frameWindow.close();
                    }, 10);
                } catch (err) {
                    console.error(err)
                }
                setTimeout(function() {
                    document.body.removeChild(iframe);
                }, 100);
            };
        }
    }

}


