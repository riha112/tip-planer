const EVENTS = {
    onMenuChange: 'onMenuChange',
    onPlanChange: 'onPlanChange',
    onHome: 'onHome',
    onMenuLoaded: 'onMenuLoaded',
    onToBuyUpdate: 'onToBuyUpdate',
    onToDoUpdate: 'onToDoUpdate',
};

const PIPE = {
    pipes: {},
    subscribe: function(name, callback) {
        if (!this.pipes[name]) {
            this.pipes[name] = [];
        }

        this.pipes[name].push(callback);
    },
    invoke: function(name, args = []) {
        if (this.pipes[name]) {
            this.pipes[name].forEach((fn) => fn(...args));
        }
    }
}