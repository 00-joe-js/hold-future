export default class ProgressBarInterface {

    private totalLength: number;
    private distanceTraveled: number;
    private domContainer: HTMLDivElement;
    private movingBar: HTMLDivElement;
    private percentText: HTMLElement;

    constructor(totalMapLength: number, times: Array<number[]>) {
        this.totalLength = totalMapLength;
        this.distanceTraveled = 0;
        const container = document.querySelector<HTMLDivElement>("#progress-bar");
        if (!container) throw new Error("Progress bar?");
        const movingBar = container.querySelector<HTMLDivElement>("#progress-moving-bar");
        if (!movingBar) throw new Error("Moving progress?");
        const percentText = container.querySelector<HTMLElement>("#progress-percentage");
        if (!percentText) throw new Error("Progress text?");

        this.domContainer = container;
        this.movingBar = movingBar;
        this.percentText = percentText;

        this.setTimes(times);
    }

    addDistance(traveled: number) {
        this.distanceTraveled += traveled;
        this.setVisualProgress();
    }

    getProgress() {
        return (this.distanceTraveled / this.totalLength) * 100;
    }

    setVisualProgress() {
        const perc = `${this.getProgress().toFixed(2)}%`;
        this.movingBar.style.width = perc;
        this.percentText.innerText = perc;
    }

    setTimes(timesArray: Array<number[]>) {

        const createTimeElement = (perc: number, timeVal: number) => {
            const ele = document.createElement("span");
            ele.className = "progress-marker";
            ele.innerHTML = `<span>+${timeVal}s</span>`;
            ele.style.left = `${((perc * 100)).toFixed(1)}%`;
            return ele;
        };

        timesArray.forEach(([perc, timeVal]) => {
            const element = createTimeElement(perc, timeVal);
            this.domContainer.appendChild(element);
        });

    }

}