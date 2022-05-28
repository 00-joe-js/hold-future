import KeyboardInterface, { gamepad } from "../firstPersonCharacter/inputHelper";

const kb = new KeyboardInterface();

const listenForInputEvents = (fn: (i: string) => void) => {

    let cancelListening = false;
    let rightTriggered = false;
    let leftTriggered = false;
    let upTriggered = false;
    let downTriggered = false;
    let selectedTriggered = false;

    const listening = () => {
        if (cancelListening) {
            return;
        }
        window.requestAnimationFrame(listening);

        const gs = gamepad.getState();

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
            }, 500);
        }
    };
    window.requestAnimationFrame(listening);

    return () => {
        cancelListening = true;
    };
}

export default listenForInputEvents;