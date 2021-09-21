class FPS {
    fpsCounter = 0;
    fpsShowTime = 0;
    fpsTimer = 0;
    fpsInterval = null;
    opts = {
      show: null
    };
  
    constructor(opts) {
      this.opts.show = (opts && opts.show) || null;
    }
  
    show = () => {
      const t = window.performance.now();
      if (!this.fpsShowTime) {
        this.fpsShowTime = t;
      } else {
        const deltaT = t - this.fpsShowTime;
        const fps = deltaT ? (1000 * this.fpsCounter) / deltaT : 0.0;
        if (this.opts.show) {
          this.opts.show(fps);
        }
        this.fpsShowTime = t;
        this.fpsCounter = 0;
      }
    };
  
    start = () => {
      this.stop();
      this.fpsInterval = window.setInterval(this.show, 300);
    };
  
    stop = () => {
      if (this.fpsInterval) {
        window.clearInterval(this.fpsInterval);
        this.fpsInterval = null;
      }
      this.fpsCounter = 0;
      this.fpsShowTime = 0;
    };
  
    add = () => ++this.fpsCounter;
}
