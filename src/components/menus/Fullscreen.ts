import { AbstractMenuButton } from "../AbstractMenuButton.ts";

export class Fullscreen extends AbstractMenuButton {
  fullscreenSvg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M8 3V5H4V9H2V3H8ZM2 21V15H4V19H8V21H2ZM22 21H16V19H20V15H22V21ZM22 9H20V5H16V3H22V9Z"></path></svg>';
  fullscreenExitSvg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M18 7H22V9H16V3H18V7ZM8 9H2V7H6V3H8V9ZM18 17V21H16V15H22V17H18ZM8 15V21H6V17H2V15H8Z"></path></svg>';
  isFullscreen: boolean = false;

  constructor() {
    super();
    const template = `
        <div>
        ${this.fullscreenSvg}
        </div>
        `;
    this.template = template;
    this.registerClickListener();
  }

  // @ts-ignore
  onClick(commands) {
    const container = this.closest(".aie-container") as HTMLDivElement;
    if (!this.isFullscreen) {
      container.style.height = "calc(100vh - 2px)";
      container.style.width = "calc(100% - 2px)";
      container.style.position = "fixed";
      container.style.top = "0";
      container.style.left = "0";
      container.style.zIndex = "9999";
    } else {
      container.style.height = "100%";
      container.style.width = "";
      container.style.background = "";
      container.style.position = "";
      container.style.top = "";
      container.style.left = "";
      container.style.zIndex = "";
    }
    this.isFullscreen = !this.isFullscreen;
    this.querySelector("div")!.innerHTML = this.isFullscreen
      ? this.fullscreenExitSvg
      : this.fullscreenSvg;
  }
}
