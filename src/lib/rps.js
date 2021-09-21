import { GPU } from "gpu.js";

const main = (canvas, countFrame) => {
  const N = 640;
  const radius = 20;
  const pipeline = true;
  const immutable = pipeline;

  const gpu = new GPU({
    mode: 'gpu'
  });
  
  const initAgents = function() {
    let agents = new Array(N).fill(0).map(() => new Array(N).fill(0));
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        agents[i][j] = Math.floor(Math.random() * 3);
      }
    }
    return agents;
  }

  const initScores = function() {
    let scores = new Array(N).fill(0).map(() => new Array(N).fill(0));
    return scores;
  }

  const gBuildScores = gpu.createKernel(function(agents, r) {
    var currentState = agents[this.thread.y][this.thread.x];
    var winState = (currentState + 1) % 3;
    var nextState = currentState;
    var score = 0;
    var radius = Math.floor(r);
      
    for (var i = -radius; i <= radius; i++) {
      var p = (this.thread.y + i + this.constants.N) % this.constants.N;
      for (var j = -radius; j <= radius; j++) {
        var q = (this.thread.x + j + this.constants.N) % this.constants.N;
    
        if (agents[p][q] === winState) {
          score +=0;
        } else if (agents[p][q] === currentState) {
          score +=1;
        } else {
          score +=2;
        }
      }
    }
    return score;
  }, {
    output: [N, N],
    constants: {N},
    pipeline,
    immutable,
  });

  const getNeighborSlots = () => {
    let slotList = [];
    slotList.push([-1,-1]);
    slotList.push([-1,0]);
    slotList.push([-1,1]);
    slotList.push([0,1]);
    slotList.push([1,1]);
    slotList.push([1,0]);
    slotList.push([1,-1]);
    slotList.push([0,-1]);  
    return slotList;
  }

  const neighborSlots = getNeighborSlots();
  
  const gPickWinners2 = gpu.createKernel(function(agents, scores, nSlots){  
    var maxScore = 0;
    var topMove = agents[this.thread.y][this.thread.x];
      
    let startIndex = Math.floor(Math.random() * 8);
    for (let i = 0; i < 8; i++) {
      let index = (startIndex + i) % 8;
      var p = (this.thread.y + nSlots[index][1] + this.constants.N) % this.constants.N;
      var q = (this.thread.x + nSlots[index][0] + this.constants.N) % this.constants.N;
    
      if (scores[p][q] > maxScore) {
        topMove = agents[p][q];
        maxScore = scores[p][q];
      }
    }
    return topMove;
  }, {
    output: [N, N],
    constants: {N},
    pipeline,
    immutable,
  });


  const gShow = gpu.createKernel(function(agents){
    this.color(
      agents[this.thread.y][this.thread.x] === 0 ? 1 : 0,
      agents[this.thread.y][this.thread.x] === 1 ? 1 : 0,
      agents[this.thread.y][this.thread.x] === 2 ? 1 : 0,
      1
    );    
  }, {
    output: [N, N],
    constants: {N},
    pipeline,
    graphical: true,
  });
  
  let agents = initAgents();
  let scores = initScores();
  
  canvas.setAttribute('width', N);
  canvas.setAttribute('height', N)
  canvas.style.width = `${N}px`;
  canvas.style.height = `${N}px`;
  let ctx = canvas.getContext("2d");
  let data = ctx.getImageData(0, 0, N, N);
  
  function doDraw() {
    countFrame();
  
    scores = gBuildScores(agents, radius);
    agents = gPickWinners2(agents, scores, neighborSlots);
    gShow(agents);
    // return gShow.getCanvas();

    data.data.set(gShow.getPixels());
    ctx.putImageData(data, 0, 0);
    window.requestAnimationFrame(doDraw);
  };
  window.requestAnimationFrame(doDraw);
}
  
export default main;
