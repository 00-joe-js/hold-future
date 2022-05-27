class GameTimer {

    private terminateDt: number;
    private currentDt: number;

    constructor(startDt: number, time: number = 60) {
        this.terminateDt = startDt + (time * 1000);
        this.currentDt = startDt;
    }

    updateCurrentTime(currentDt: number) {
        this.currentDt = currentDt;
    }

    grantMoreTime(moreTime: number) {
        this.terminateDt += moreTime * 1000;
    }

    deductTime(deductedTime: number) {
        this.terminateDt -= deductedTime * 1000;
    }

    getTimeLeft() {
        return (this.terminateDt - this.currentDt) / 1000;
    }

}

export default GameTimer;