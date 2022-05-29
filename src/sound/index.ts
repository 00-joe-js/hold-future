import clickWav from "../../assets/sounds/click.wav";
import bgMusicUrl from "../../assets/sounds/sonicwhat.wav";
import screenWav from "../../assets/sounds/goal.wav";
import rareFruitWav from "../../assets/sounds/rarefruit.wav";
import selectMoveWav from "../../assets/sounds/selectmove.wav";

const bgMusic = new Audio(bgMusicUrl);
const screenOpen = new Audio(screenWav);

const click = new Audio(clickWav);
const backupClick = new Audio(clickWav);
const rareFruit = new Audio(rareFruitWav);
const rareFruitBackup = new Audio(rareFruitWav);
const rareFruitThird = new Audio(rareFruitWav);
const rareFruitFourth = new Audio(rareFruitWav);
const selectMove = new Audio(selectMoveWav);
const selectMoveBackup = new Audio(selectMoveWav);

selectMove.volume = 0.2;

click.volume = 0.3;
backupClick.volume = 0.3;

rareFruit.volume = 0.1;
rareFruitBackup.volume = 0.1;
rareFruitThird.volume = 0.1;
rareFruitFourth.volume = 0.1;

bgMusic.volume = 0.15;
bgMusic.loop = true;

screenOpen.volume = 0.7;

let canPlay = false;
selectMove.addEventListener("canplaythrough", () => {
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
        bgMusic.play();
    }
};

export const stopBgMusic = () => {
    const fadingInterval = setInterval(() => {
        bgMusic.volume -= 0.05;
        if (bgMusic.volume <= 0) {
            bgMusic.pause();
            bgMusic.volume = 0.6;
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

let playedOnceSM = false;
export const playSelectMove = () => {
    if (canPlay) {
        if (!playedOnceSM) {
            selectMove.play();
        } else {
            if (!selectMove.ended) {
                selectMoveBackup.play();
            } else {
                selectMove.play();
            }
        }
    }
};