import clippyGif from "../../assets/testclippy.gif";

import winGif from "../../assets/kid-thumbs-up.gif";

import brokenLoader from "../../assets/badloader.gif";

import listenForInputEvents from "../hudControls";

class StartEndScreen {

    private container: HTMLDivElement;
    private selectionIndex: number = 0;
    private unsubInput: Function | null = null;
    private buttonAmount: number = 2;

    private onPlay: Function | null;

    constructor() {
        const { container } = this.setupAllDOMReferences();
        this.container = container;
        this.onPlay = null;
        this.highlightSelection();
    }

    showStartScreen() {
        const startContainer = this.container.querySelector<HTMLElement>("#start-screen");
        if (!startContainer) throw new Error("No start container");
        this.container.style.opacity = "1.0";
        startContainer.style.display = "flex";
        this.unsubInput = listenForInputEvents((command) => {
            if (command === "down") {
                this.selectionIndex = this.selectionIndex + 1;
            }
            if (command === "up") {
                this.selectionIndex = this.selectionIndex - 1;
            }
            if (command === "select") {
                const i = this.getNormalIndex();
                if (i === 0) {
                    if (this.onPlay) {
                        this.onPlay();
                        this.hide();
                    }
                } else {
                    console.log("About");
                }
            }
            this.highlightSelection();
        });
    }
    hide() {
        const startContainer = this.container.querySelector<HTMLElement>("#start-screen");
        const killContainer = this.container.querySelector<HTMLElement>("#death-screen");
        const winContainer = this.container.querySelector<HTMLElement>("#win-screen");
        if (!startContainer || !killContainer || !winContainer) throw new Error("Missing containers.");
        killContainer.style.display = "none";
        startContainer.style.display = "none";
        winContainer.style.display = "none";
        this.container.style.opacity = "0.0";
        if (this.unsubInput) {
            this.unsubInput();
            this.unsubInput = null;
        }
    }

    highlightButton(button: HTMLElement) {
        button.style.color = "white";
    }

    unhighlightAll(buttons: NodeListOf<HTMLElement>) {
        buttons.forEach((b) => {
            b.style.color = "black";
        });
    }

    getNormalIndex() {
        return Math.abs(this.selectionIndex % 2);
    }

    highlightSelection() {
        const buttons = this.container.querySelectorAll<HTMLElement>("#start-screen-buttons span");
        this.unhighlightAll(buttons);
        const normalIndex = Math.abs(this.selectionIndex % this.buttonAmount);
        const buttonToHighlight = buttons[normalIndex];
        this.highlightButton(buttonToHighlight);
    }
    showFailedScreen() {
        const killContainer = this.container.querySelector<HTMLElement>("#death-screen");
        if (!killContainer) throw new Error("Missing death screen.");
        const badLoaderImg = killContainer.querySelector("img");
        if (!badLoaderImg) throw new Error("No broken loader image");
        badLoaderImg.src = brokenLoader;
        killContainer.style.display = "flex";
        this.container.style.opacity = "1.0";
        setTimeout(() => {
            this.unsubInput = listenForInputEvents((command) => {
                if (command === "select") {
                    const toRefresh = this.container.querySelector<HTMLElement>("#death-screen h3");
                    if (toRefresh) {
                        toRefresh.style.transform = "scale(2)";
                    }
                    window.location.reload();
                }
            });
        }, 1000);
    }

    showWinScreen() {
        const winContainer = this.container.querySelector<HTMLElement>("#win-screen");
        if (!winContainer) throw new Error("Missing win screen.");
        const winImg = winContainer.querySelector("img");
        if (!winImg) throw new Error("No win image");
        winImg.src = winGif;
        winContainer.style.display = "flex";
        this.container.style.opacity = "1.0";
        setTimeout(() => {
            this.unsubInput = listenForInputEvents((command) => {
                if (command === "select") {
                    const toRefresh = this.container.querySelector<HTMLElement>("#win-screen h3");
                    if (toRefresh) {
                        toRefresh.style.transform = "scale(2)";
                    }
                    window.location.reload();
                }
            });
        }, 1000);
    }

    registerOnPlayListener(fn: Function) {
        this.onPlay = fn;
    }

    private setupAllDOMReferences() {
        const container = document.querySelector<HTMLDivElement>("#start-end-screen");
        if (!container) {
            throw new Error("Missing screen elements.");
        }
        return { container }
    }


}

export class Clippy {
    container: HTMLDivElement;
    constructor() {
        const container = document.querySelector<HTMLDivElement>("#clippy");
        if (!container) {
            throw new Error("Where is Blippy?");
        }
        this.container = container;
        this.setClippy();
    }
    show() {
        this.container.style.display = "flex";
    }
    hide() {
        this.container.style.display = "none";
    }
    private setClippy() {
        const clippyImg = document.querySelector<HTMLImageElement>("#clippy-img");
        if (!clippyImg) throw new Error("I see you're running into an error? :)");
        clippyImg.src = clippyGif;
    }
}

export default StartEndScreen;