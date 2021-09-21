import { useCallback, useEffect, useRef } from "react";
import React, { useState } from "react";
import "./styles.css";
// import rpsMain from './lib/rps';
import fluidMain from './lib/fluid';

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
        setFps(1000 * fpsCountRef.current / ms);
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
    addFrame,
  };
};


export default function App() {
  const [time, setTime] = useState(0);
  const {fps, addFrame} = useFps();
  const canvasRef = useRef(null);

  useEffect(() => {
    // rpsMain(canvasRef.current, addFrame);
    fluidMain(canvasRef.current, addFrame);
  }, [addFrame]);

  return (
    <div className="App">
      <h1>Hello CodeSandbox</h1>
      <h2>Start editing to see some magic happen!</h2>
      <div>
        {time.toFixed(1)}s {fps.toFixed(1)} FPS
      </div>
      <canvas ref={canvasRef} />
    </div>
  );
}
