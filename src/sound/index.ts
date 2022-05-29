import clickWav from "../../assets/sounds/click.wav";
import moanUrl from "../../assets/sounds/moan.mp3";
import screenWav from "../../assets/sounds/goal.wav";
import rareFruitWav from "../../assets/sounds/rarefruit.wav";

const moan = new Audio(moanUrl);
const screenOpen = new Audio(screenWav);

const click = new Audio(clickWav);
const backupClick = new Audio(clickWav);
const rareFruit = new Audio(rareFruitWav);
const rareFruitBackup = new Audio(rareFruitWav);
const rareFruitThird = new Audio(rareFruitWav);
const rareFruitFourth = new Audio(rareFruitWav);

click.volume = 0.3;
backupClick.volume = 0.3;

rareFruit.volume = 0.1;
rareFruitBackup.volume = 0.1;
rareFruitThird.volume = 0.1;
rareFruitFourth.volume = 0.1;

moan.volume = 0.0;
screenOpen.volume = 0.7;

moan.loop = true;


let canPlay = false;
click.addEventListener("canplaythrough", () => {
    /* the audio is now playable; play it if permissions allow */
    canPlay = true;
});

let clickPlayedOnce = false;
export const playClick = () => {
    if (canPlay) {
        if (!clickPlayedOnce) {
            clickPlayedOnce = true;
            click.play();
            return;
        }
        if (!click.ended) {
            backupClick.play();
        }
        click.play();
    }
};

export const playBgMusic = () => {
    if (canPlay) {
        moan.play();
    }
};

export const stopBgMusic = () => {
    const fadingInterval = setInterval(() => {
        moan.volume -= 0.05;
        if (moan.volume <= 0) {
            moan.pause();
            moan.volume = 0.6;
            clearInterval(fadingInterval);
        }
    }, 20);
};

export const playScreenOpen = () => {
    if (canPlay) {
        screenOpen.play();
    }
};

let rareFruitPlayedOnce = false;
export const playRareFruit = () => {
    if (canPlay) {
        if (!rareFruitPlayedOnce) {
            rareFruitPlayedOnce = true;
            rareFruit.play();
            return;
        }
        if (!rareFruit.ended) {
            if (!rareFruitBackup.ended) {
                if (!rareFruitThird.ended) {
                    rareFruitFourth.play();
                }
                rareFruitThird.play();
            }
            rareFruitBackup.play();
        }
        rareFruit.play();
    }
};