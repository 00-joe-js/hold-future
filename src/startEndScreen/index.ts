import clippyGif from "../../assets/blippy.png";

import winGif from "../../assets/kid-thumbs-up.gif";

import brokenLoader from "../../assets/badloader.gif";

import listenForInputEvents from "../hudControls";

import { stopBgMusic, playSelectMove, playScreenOpen, playClippy } from "../sound";
import giphyIds from "./giphyIds";
import { MathUtils } from "three";

class StartEndScreen {

    private container: HTMLDivElement;
    private selectionIndex: number = 0;
    private unsubInput: Function | null = null;
    private buttonAmount: number = 3;

    private onPlay: Function | null;

    constructor() {
        const { container } = this.setupAllDOMReferences();
        this.container = container;
        this.onPlay = null;
        this.highlightSelection();
        setTimeout(() => {
            this.loadWinGif();
        }, 20 * 1000);
    }

    showStartScreen() {
        const startContainer = this.container.querySelector<HTMLElement>("#start-screen");
        if (!startContainer) throw new Error("No start container");
        this.container.style.opacity = "1.0";
        startContainer.style.display = "flex";
        clippy.show();
        setTimeout(() => {
            this.unsubInput = listenForInputEvents((command) => {
                if (command === "down") {
                    playSelectMove();
                    this.selectionIndex = this.selectionIndex + 1;
                }
                if (command === "up") {
                    playSelectMove();
                    this.selectionIndex = this.selectionIndex - 1;
                }
                if (command === "select") {
                    const i = this.getNormalIndex();
                    playScreenOpen();
                    if (i === 0) {
                        if (this.onPlay) {
                            this.onPlay();
                            this.hide();
                        }
                    } else if (i === 1) {
                        this.showAbout();
                    } else if (i === 2) {
                        this.showHelp();
                    }
                }
                this.highlightSelection();
            });
        }, 200);

    }
    showAbout() {
        if (this.unsubInput) this.unsubInput();
        clippy.hide();
        const aboutContainer = document.querySelector<HTMLElement>("#about");
        if (!aboutContainer) throw new Error("#about?");
        aboutContainer.style.display = "block";
        setTimeout(() => {
            this.unsubInput = listenForInputEvents((command) => {
                if (command === "select") {
                    playScreenOpen();
                    if (this.unsubInput) this.unsubInput();
                    aboutContainer.style.display = "none";
                    this.showStartScreen();
                }
            });
        }, 500);
    }
    showHelp() {
        if (this.unsubInput) this.unsubInput();
        clippy.hide();
        const helpContainer = document.querySelector<HTMLElement>("#help");
        if (!helpContainer) throw new Error("#about?");
        helpContainer.style.display = "block";
        setTimeout(() => {
            this.unsubInput = listenForInputEvents((command) => {
                if (command === "select") {
                    playScreenOpen();
                    if (this.unsubInput) this.unsubInput();
                    helpContainer.style.display = "none";
                    this.showStartScreen();
                }
            });
        }, 500);
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
        return Math.abs(this.selectionIndex % this.buttonAmount);
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
        stopBgMusic();
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
    getRandomGiphy() {
        const ids = giphyIds;
        // return ids[ids.length - 1];
        return ids[Math.floor(Math.random() * ids.length)];
    }
    loadWinGif() {
        const giphyIframe = document.querySelector<HTMLIFrameElement>("#giphy-iframe");
        if (!giphyIframe) throw new Error("Giphy element?");
        // https://giphy.com/embed/121YQW1OQhqGLS
        const code = this.getRandomGiphy();
        giphyIframe.src = `https://giphy.com/embed/${code}`;
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

class Clippy {
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
        playClippy();
    }
    hide() {
        this.container.style.display = "none";
    }
    setText(textValue: string) {
        const clippySays = this.container.querySelector("#clippy-says");
        if (clippySays) {
            clippySays.innerHTML = textValue;
        }
    }
    private setClippy() {
        const clippyImg = document.querySelector<HTMLImageElement>("#clippy-img");
        if (!clippyImg) throw new Error("I see you're running into an error? :)");
        clippyImg.style.backgroundImage = `url(${clippyGif})`;
    }
}

export const clippy = new Clippy();

export default StartEndScreen;