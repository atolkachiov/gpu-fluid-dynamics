import { useCallback, useEffect, useMemo, useRef } from "react";
import React, { useState } from "react";
import "./styles.css";
import main from "./lib/rps";
// import main from "./lib/test";
// import main from "./lib/fluid";

const useFps = () => {
  const [fps, setFps] = useState(0);
  const timerRef = useRef(null);
  const fpsCountRef = useRef(0);
  useEffect(() => {
    timerRef.current = performance.now();
    let timer = setInterval(() => {
      const now = performance.now();
      if (timerRef.current) {
        const ms = now - timerRef.current;
        setFps((1000 * fpsCountRef.current) / ms);
        fpsCountRef.current = 0;
      }
      timerRef.current = now;
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  const addFrame = useCallback(() => {
    fpsCountRef.current++;
  }, []);
  return {
    fps,
    addFrame
  };
};

export default function App() {
  const time = useMemo(() => new Date().valueOf(), []);
  const { fps, addFrame } = useFps();
  const canvasRef = useRef(null);

  const onClick = useCallback(() => {
    main(canvasRef.current, addFrame);
  }, [addFrame]);
  return (
    <div className="App">
      <h1>Hello CodeSandbox</h1>
      <h2>Start editing to see some magic happen!</h2>
      <button onClick={onClick}>Start</button>
      <div>
        {((new Date().valueOf() - time) / 1000).toFixed(1)}s {fps.toFixed(1)}{" "}
        FPS
      </div>
      <canvas ref={canvasRef} />
    </div>
  );
}
