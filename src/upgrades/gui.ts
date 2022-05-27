
const container = document.querySelector<HTMLElement>("#upgrades-container");

import { gamepad } from "../firstPersonCharacter/inputHelper";

if (!container) {
    throw new Error("Loading issue? Couldn't find #upgrades-container.");
}

interface Upgrade {
    name: string;
    description: string;
    cost: number;
}


class UpgradesManager {

    private cancelListener: boolean = false;
    private hoveredUpgradeIndex: number = 0;
    private wantToSkip: boolean = false;
    private container: HTMLElement;
    constructor(domContainer: HTMLElement) {
        this.container = domContainer;
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

        this.setMoney(timeCoins);

        choices.forEach((c, i) => {
            const { name, description, cost } = upgradeDescriptions[i];
            const h1 = c.querySelector("h1");
            const p = c.querySelector("p");
            const costStrong = c.querySelector<HTMLElement>("h3 strong");

            if (!h1 || !p || !costStrong) {
                throw new Error("Upgrade choice missing elements.");
            }

            h1.innerText = name;
            p.innerHTML = description;
            costStrong.innerText = cost.toString();
        });

        this.container.style.opacity = "1.0";
        this.setCurrentSelection();

        this.listenForGamepadEvents((input: string) => {

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
                const upgrade = upgradeDescriptions[this.hoveredUpgradeIndex];
                if (upgrade.cost >= timeCoins) {
                    return;
                }

                if (this.wantToSkip) {
                    onSelection(-1);
                } else {
                    onSelection(this.hoveredUpgradeIndex);
                }

            }

        });
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
        skip.style.color = "white";
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

    listenForGamepadEvents(fn: (i: string) => void) {
        let rightTriggered = false;
        let leftTriggered = false;
        let upTriggered = false;
        let downTriggered = false;

        const listening = () => {
            if (this.cancelListener) {
                this.cancelListener = false;
                return;
            }
            window.requestAnimationFrame(listening);

            const gs = gamepad.getState();
            if (!gs) return;

            if (gs.moveVel.x > 0.7) {
                if (rightTriggered) return;
                fn("right");
                rightTriggered = true;
                setTimeout(() => {
                    rightTriggered = false;
                }, 200);
            } else if (gs.moveVel.x < -0.7) {
                if (leftTriggered) return;
                fn("left");
                leftTriggered = true;
                setTimeout(() => {
                    leftTriggered = false;
                }, 200);
            }

            if (gs.moveVel.y > 0.7) {
                if (upTriggered) return;
                fn("up");
                upTriggered = true;
                setTimeout(() => {
                    upTriggered = false;
                }, 200);
            } else if (gs.moveVel.y < -0.7) {
                if (downTriggered) return;
                fn("down");
                downTriggered = true;
                setTimeout(() => {
                    downTriggered = false;
                }, 200);
            }

            if (gs.xDown) {
                fn("select");
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