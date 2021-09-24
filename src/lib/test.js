import { GPU } from "gpu.js";

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
    for (let x = 0; x < dA; x++) {
      // arr[y].push([Math.random(), Math.random()]);
      arr[y].push([(x + y) / (dA + dB), (x + y) / (dA + dB * 2)]);
    }
  }
  return arr;
};

const N = 75,
  M = 100;

const initTextures = () => {};

function main(canvas, countFrame) {
  const gpu = new GPU({ mode: "gpu" });
  const pipeline = true;
  const immutable = pipeline;

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
  const advect = gpu.createKernel(
    function (A) {
      const delta = 1;
      return A[this.thread.z][this.thread.y][this.thread.x + delta * 3];

      //   return A[
      //     (this.thread.x + delta) % this.constants.N
      //   ][
      //     (this.thread.y + delta) % this.constants.N
      //   ][
      //     0
      //   ];
      // return (A[this.thread.y][this.thread.x][this.thread.z] +
      //     A[this.thread.y + 1][this.thread.x][this.thread.z] +
      //     A[this.thread.y][this.thread.x + 1][this.thread.z] +
      //     A[this.thread.y - 1][this.thread.x][this.thread.z] +
      //     A[this.thread.y][this.thread.x - 1][this.thread.z]) /
      //     5.0
    },
    {
      output: [2, N, M],
      constants: { N, M },
      pipeline,
      immutable
      // argumentTypes: { A: 'Array2D(2)' },
      // returnType: 'Array(2)',
    }
  );

  const output = gpu.createKernel(
    function (A) {
      this.color(
        A[this.thread.y][this.thread.x] * 5,
        A[this.thread.y][this.thread.x],
        0.5,
        1.0
      );
    },
    {
      output: [N, M],
      constants: { N, M },
      // argumentTypes: { A: 'ArrayTexture(2)' },
      pipeline,
      graphical: true
    }
  );

  canvas.setAttribute("width", N);
  canvas.setAttribute("height", M);
  canvas.style.width = `${N}px`;
  canvas.style.height = `${M}px`;
  const ctx = canvas.getContext("2d");
  const data = ctx.getImageData(0, 0, N, M);

  let A = initArray2(N, M);
  const time0 = new Date().valueOf();
  const time = time0;
  initTextures();
  function doDraw() {
    const t = new Date().valueOf();
    const dt = new Date().valueOf() - time;
    countFrame();
    const newA = advect(A);
    if (pipeline) {
      A = newA.clone();
    } else {
      A = newA;
    }
    output(newA);
    if (pipeline) {
      newA.delete();
    }
    data.data.set(output.getPixels());
    ctx.putImageData(data, 0, 0);
    window.requestAnimationFrame(doDraw);
  }
  window.requestAnimationFrame(doDraw);
}

export default main;
