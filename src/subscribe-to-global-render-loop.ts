

const subscribers: Function[] = [];
let canonicalTime = 0;
export default {
    getTime() {
        return canonicalTime;
    },
    subscribe(fn: Function) {
        subscribers.push(fn);
    },
    provideTime(t: number) {
        canonicalTime = t;
        subscribers.forEach(sub => sub(t));
    },
};