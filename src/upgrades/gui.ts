
const container = document.querySelector<HTMLElement>("#upgrades-container");

import KeyboardInterface, { gamepad } from "../firstPersonCharacter/inputHelper";

import icons from "../../assets/iconset.jpg";

if (!container) {
    throw new Error("Loading issue? Couldn't find #upgrades-container.");
}

interface Upgrade {
    name: string;
    description: string;
    cost: number;
    iconPos?: number[]
}


class UpgradesManager {

    private keyboard: KeyboardInterface;
    private cancelListener: boolean = false;
    private hoveredUpgradeIndex: number = 0;
    private runHueRotation: boolean = false;
    private wantToSkip: boolean = false;
    private container: HTMLElement;
    constructor(domContainer: HTMLElement) {
        this.keyboard = new KeyboardInterface();
        this.container = domContainer;

        const choices = this.getChoices();
        const icons = Array.from(choices).map(c => {
            return c.querySelector<HTMLImageElement>(".upgrade-icon");
        });
        icons.forEach((i) => {
            if (i) {
                setInterval(() => {
                    if (this.runHueRotation) {
                        i.style.filter = `hue-rotate(${Math.sin(Date.now() / 5000)}turn)`;
                    }
                }, 50);
            }
        });
    }

    getChoices() {
        const choices = this.container.querySelectorAll<HTMLElement>(".upgrade-choice");
        return choices;
    }

    setMoney(t: number) {
        const moneySlot = this.container.querySelector<HTMLElement>("#upgrade-heading span");
        if (!moneySlot) {
            throw new Error("Money slot??");
        }
        moneySlot.innerText = t.toString();
    }



    showContainer(timeCoins: number, upgradeDescriptions: Upgrade[], onSelection: Function) {

        const choices = this.getChoices();

        this.runHueRotation = true;

        this.setMoney(timeCoins);

        choices.forEach((c, i) => {
            const { name, description, cost, iconPos } = upgradeDescriptions[i];
            const h1 = c.querySelector("h1");
            const p = c.querySelector("p");
            const costStrong = c.querySelector<HTMLElement>("h3 strong");
            const icon = c.querySelector<HTMLImageElement>(".upgrade-icon");

            if (!h1 || !p || !costStrong || !icon) {
                throw new Error("Upgrade choice missing elements.");
            }

            h1.innerText = name;
            p.innerHTML = description;
            costStrong.innerText = cost.toString();
            icon.style.backgroundImage = `url(${icons})`;

            if (iconPos) {
                icon.style.backgroundPosition = `${iconPos[0]}px ${iconPos[1]}px`;
            }
        });

        this.container.style.opacity = "1.0";
        this.setCurrentSelection();

        setTimeout(() => {
            this.listenForInputEvents((input: string) => {

                if (!this.wantToSkip) {
                    if (input === "left") {
                        this.changeSelection(-1);
                    } else if (input === "right") {
                        this.changeSelection(1);
                    }
                }


                if (input === "up") {
                    this.unhighlightSkip();
                } else if (input === "down") {
                    this.highlightSkip();
                }

                if (input === "select") {

                    if (this.wantToSkip) {
                        onSelection(-1);
                        this.cleanup();
                    } else {
                        const upgrade = upgradeDescriptions[this.hoveredUpgradeIndex];
                        if (upgrade.cost >= timeCoins) {
                            return;
                        }
                        onSelection(this.hoveredUpgradeIndex);
                        this.cleanup();
                    }

                }

            });
        }, 400);


    }

    cleanup() {
        this.wantToSkip = false;
        this.hoveredUpgradeIndex = 0;
        this.runHueRotation = false;
    }

    changeSelection(dir: number) {

        if (dir === -1 && this.hoveredUpgradeIndex === 0) {
            this.hoveredUpgradeIndex = 2;
        } else {
            this.hoveredUpgradeIndex = (this.hoveredUpgradeIndex + dir) % 3;
        }

        this.setCurrentSelection();
    }

    unhighlightSkip() {
        this.wantToSkip = false;
        const skip = this.container.querySelector<HTMLElement>("#skip");
        if (!skip) {
            throw new Error("#skip element?");
        }
        skip.style.color = "gray";
        skip.style.transform = "scale(1.0)";
        this.setCurrentSelection();
    }

    highlightSkip() {
        this.wantToSkip = true;
        this.clearChoices();
        const skip = this.container.querySelector<HTMLElement>("#skip");
        if (!skip) {
            throw new Error("#skip element?");
        }
        skip.style.color = "black";
        skip.style.transform = "scale(1.2)";
    }

    clearChoices() {
        const choices = this.getChoices();
        choices.forEach(c => {
            c.style.opacity = "0.5";
        });
    }

    setCurrentSelection() {
        const choices = this.getChoices();

        const chosen = choices[this.hoveredUpgradeIndex];

        this.clearChoices();
        chosen.style.opacity = "1.0";
    }

    listenForInputEvents(fn: (i: string) => void) {

        let rightTriggered = false;
        let leftTriggered = false;
        let upTriggered = false;
        let downTriggered = false;
        let selectedTriggered = false;

        const listening = () => {
            if (this.cancelListener) {
                this.cancelListener = false;
                return;
            }
            window.requestAnimationFrame(listening);

            const gs = gamepad.getState();
            const kb = this.keyboard;
            if (!kb) return;

            let moveSens = 0.5;

            let right = kb.dDown;
            let left = kb.aDown;
            let up = kb.wDown;
            let down = kb.sDown;
            let submit = kb.spaceDown;

            if (gs) {
                right = gs.moveVel.x > moveSens;
                left = gs.moveVel.x < -moveSens;
                up = gs.moveVel.y > moveSens;
                down = gs.moveVel.y < -moveSens - 0.1;
                submit = gs.xDown;
            }

            if (right) {
                if (rightTriggered) return;
                fn("right");
                rightTriggered = true;
                setTimeout(() => {
                    rightTriggered = false;
                }, 200);
            } else if (left) {
                if (leftTriggered) return;
                fn("left");
                leftTriggered = true;
                setTimeout(() => {
                    leftTriggered = false;
                }, 200);
            }

            if (up) {
                if (upTriggered) return;
                fn("up");
                upTriggered = true;
                setTimeout(() => {
                    upTriggered = false;
                }, 200);
            } else if (down) {
                if (downTriggered) return;
                fn("down");
                downTriggered = true;
                setTimeout(() => {
                    downTriggered = false;
                }, 200);
            }

            if (submit) {
                if (selectedTriggered) return;
                fn("select");
                selectedTriggered = true;
                setTimeout(() => {
                    selectedTriggered = false;
                }, 1000);
            }
        };
        window.requestAnimationFrame(listening);
    }

    hideContainer() {
        this.container.style.opacity = "0.0";
        this.cancelListener = true;
    }

}

export default new UpgradesManager(container);