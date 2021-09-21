const initArray = (dA, dB) => {
  const arr = [];
  for (let y = 0; y < dB; y++) {
    arr.push([]);
    for (let x = 0; x < dA; x++) {
      arr[y].push(Math.random());
    }
  }
  return arr;
};

const initArray2 = (dA, dB) => {
  const arr = [];
  for (let y = 0; y < dB; y++) {
    arr.push([]);
  }
  for (let y = 0; y < dB; y++) {
    for (let x = 0; x < dA; x++) {
    // arr[y].push([Math.random(), Math.random()]);
      arr[y].push([
        (x + y) / (dA + dB),
        (x + y * 2 ) / (dA + dB * 2),
      ]);
    }
  }
  return arr;
};

function main(canvas, fpsDiv) {
  const fps = new FPS({ show: (fps) => fpsDiv.innerHTML = `<span>${Math.floor(fps)} FPS</span>`});
  const gpu = new GPU({
    mode: 'gpu'
  });

  const initAgents = function() {
    let agents = new Array(640).fill(0).map(() => new Array(640).fill(0));
    for (let i = 0; i < 640; i++) {
      for (let j = 0; j < 640; j++) {
        agents[i][j] = Math.floor(Math.random() * 3);
      }
    }
    return agents;
  }
  const initScores = function() {
    let scores = new Array(640).fill(0).map(() => new Array(640).fill(0));
    return scores;
  }
  const gBuildScores = gpu.createKernel(function(agents, r) {
    var currentState = agents[this.thread.y][this.thread.x];
    var winState = (currentState + 1) % 3;
    var nextState = currentState;
    var score = 0;
    var radius = Math.floor(r);
    
    for (var i = -radius; i <= radius; i++) {
      var p = (this.thread.y + i + 640) % 640;
      for (var j = -radius; j <= radius; j++) {
        var q = (this.thread.x + j + 640) % 640;
  
        if (agents[p][q] == winState) {
          score +=0;
        } else if (agents[p][q] == currentState) {
          score +=1;
        } else {
          score +=2;
        }
      }
    }
    return score;
  }).setOutput([640, 640]);
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
      var p = (this.thread.y + nSlots[index][1] + 640) % 640;
      var q = (this.thread.x + nSlots[index][0] + 640) % 640;
  
      if (scores[p][q] > maxScore) {
        topMove = agents[p][q];
        maxScore = scores[p][q];
      }
    }
    return topMove;
  }).setOutput([640, 640]);
  const gShow = gpu.createKernel(function(agents){
    this.color(
      agents[this.thread.y][agents.thread.x] == 0 ? 1 : 0,
      agents[this.thread.y][agents.thread.x] == 1 ? 1 : 0,
      agents[this.thread.y][agents.thread.x] == 2 ? 1 : 0,
      1
    );    
  }).setOutput([640, 640]).setGraphical(true);

  let agents = initAgents();
  let scores = initScores();

  const N = 640;
  canvas.style.width = `${N}px`;
  canvas.style.height = `${N}px`;
  let ctx = canvas.getContext("2d");
  let data = ctx.getImageData(0, 0, 640, 640);

  function doDraw() {
    fps.add();

    scores = gBuildScores(agents, 2);
    agents = gPickWinners2(agents, scores, neighborSlots);
    gShow(agents);
    // return gShow.getCanvas();

    data.data.set(gShow.getPixels());
    ctx.putImageData(data, 0, 0);
    window.requestAnimationFrame(doDraw);
  };
  fps.start();
  window.requestAnimationFrame(doDraw);
}


function main2() {
  const fpsDiv = document.getElementById('fps');
  const fps = new FPS({ show: (fps) => fpsDiv.innerHTML = `<span>${Math.floor(fps)} FPS</span>`});
  const canvas = document.getElementById('c');
  const N = 512;
  canvas.style.width = `${N}px`;
  canvas.style.height = `${N}px`;

  const gpu = new GPU({
    // canvas: canvas,
    mode: 'gpu'
  });
  /*
  // Apply the first 3 operators in Equation 12.
  u = advect(u);
  u = diffuse(u);
  u = addForces(u);
  // Now apply the projection operator to the result.
  p = computePressure(u);
  u = subtractPressureGradient(u, p);
  In practice, temporary storage is needed, because most of these operations cannot be performed in place. For example, the advection step in the pseudocode is more accurately written as:

  uTemp = advect(u);
  swap(u, uTemp);
  */

  const advect = gpu
    .createKernel(function (A) {
      // return 0.5; 
      return A[
        (this.thread.x + 1) % this.constants.N
      ][
        (this.thread.y + 1) % this.constants.N
      ][
        this.thread.z
      ];
      // return (A[this.thread.y][this.thread.x][this.thread.z] +
    //     A[this.thread.y + 1][this.thread.x][this.thread.z] +
    //     A[this.thread.y][this.thread.x + 1][this.thread.z] +
    //     A[this.thread.y - 1][this.thread.x][this.thread.z] +
    //     A[this.thread.y][this.thread.x - 1][this.thread.z]) /
    //     5.0
    }, {
      output: [N, N, 2],
      constants: {N},
      graphical: false,
      pipeline: true,
      immutable: true,
      // argumentTypes: { A: 'Array2D(2)' },
      // returnType: 'Array(2)',
    });

  const output = gpu
    .createKernel(function (A) {
      // this.color(0.3, 0.7, 0.2, 1.0);
      // this.color(
      //   this.thread.x / this.constants.N,
      //   this.thread.y / this.constants.N,
      //   this.thread.x * this.thread.y / (this.constants.N * this.constants.N)
      // );
      this.color(
        A[this.thread.y][this.thread.x][0],
        A[this.thread.y][this.thread.x][0], 
        0.5,
        1.0
      );
    }, {
      output: [N, N],
      constants: {N},
      // argumentTypes: { A: 'ArrayTexture(2)' },
      pipeline: true,
      graphical: true,
    });

  let A = initArray2(N, N);
  let B = initArray2(N, N);

  let ctx = canvas.getContext("2d");
  let data = ctx.getImageData(0, 0, N, N);

  const doDraw = () => {
    fps.add();
    advect(B)
    const newA = advect(A);
    A = newA;
    output(newA);
    // output(A);
    data.data.set(output.getPixels());
    ctx.putImageData(data, 0, 0);
    window.requestAnimationFrame(doDraw);
  };
  fps.start();
  window.requestAnimationFrame(doDraw);
}
