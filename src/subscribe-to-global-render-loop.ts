

const subscribers: Function[] = [];
export default {
    subscribe(fn: Function) {
        subscribers.push(fn);
    },
    provideTime(t: number) {
        subscribers.forEach(sub => sub(t));
    }
};