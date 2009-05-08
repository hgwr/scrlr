var Polling = function(func, interval) {
    this.func = func;
    this.running = false;
    this.interval = interval || 50; // 50ms = 20fps
    this.id = null;
};
Polling.prototype = {
    run : function() {
        this.running = true;
        var start = new Date();
        this.func();
        // this.func() 中に外部から this.stop(); された場合
        if (this.running === false) { return; }
        var end = new Date();
        var w = max(this.interval - (end.getTime() - start.getTime()), 1);
        this.id = setTimeout(this.run.bind(this), w);
    },

    stop : function() {
        this.running = false;
        if (this.id !== null) { clearTimeout(this.id); }
        this.id = null;
    }
};
