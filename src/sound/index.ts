import clickWav from "../../assets/sounds/click.wav";
import moanUrl from "../../assets/sounds/moan.mp3";
import screenWav from "../../assets/sounds/goal.wav";

const moan = new Audio(moanUrl);
const click = new Audio(clickWav);
const screenOpen = new Audio(screenWav);
click.volume = 0.3;

moan.volume = 0.6;
moan.loop = true;

screenOpen.volume = 0.7;

let canPlay = false;
click.addEventListener("canplaythrough", () => {
    /* the audio is now playable; play it if permissions allow */
    canPlay = true;
});

export const playClick = () => {
    if (canPlay) {
        click.play();
    }
};

export const playBgMusic = () => {
    if (canPlay) {
        moan.play();
    }
};

export const playScreenOpen = () => {
    if (canPlay) {
        screenOpen.play();
    }
};
