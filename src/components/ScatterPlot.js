import React, { useRef, useEffect } from 'react';

const ScatterPlot = ({ history, currentRun }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const padLeft = 80;
    const padRight = 40;
    const padTop = 20;
    const padBottom = 40;

    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(padLeft, padTop);
    ctx.lineTo(padLeft, h - padBottom);
    ctx.lineTo(w - padRight, h - padBottom);
    ctx.stroke();

    const minX = 4, maxX = 20;
    const transX = bits => padLeft + ((bits - minX) / (maxX - minX)) * (w - padLeft - padRight);

    const minYLog = -1, maxYLog = 5;
    const transY = ms => {
      let l = Math.log10(Math.max(ms, 0.001));
      l = Math.max(minYLog, Math.min(maxYLog, l));
      return h - padBottom - ((l - minYLog) / (maxYLog - minYLog)) * (h - padTop - padBottom);
    };

    ctx.fillStyle = '#888';
    ctx.font = '10px Arial';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    [0.1, 1, 10, 100, 1000, 10000, 100000].forEach(val => {
      const y = transY(val);
      ctx.beginPath();
      ctx.moveTo(padLeft - 5, y);
      ctx.lineTo(w - padRight, y);
      ctx.strokeStyle = '#333';
      ctx.stroke();
      ctx.fillText(val + 'ms', padLeft - 8, y);
    });

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let b = minX; b <= maxX; b += 2) {
      const x = transX(b);
      ctx.beginPath();
      ctx.moveTo(x, h - padBottom + 5);
      ctx.lineTo(x, padTop);
      ctx.strokeStyle = '#333';
      ctx.stroke();
      ctx.fillText(b, x, h - padBottom + 8);
    }

    ctx.fillStyle = '#4dabf7';
    history.forEach(p => {
      const x = transX(p.bits);
      const y = transY(p.time);
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    if (currentRun) {
      const x = transX(currentRun.bits);
      const y = transY(currentRun.time);
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fillStyle = '#f03e3e';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.stroke();
    }

    ctx.fillStyle = '#ccc';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('p size (bits)', padLeft + (w - padLeft - padRight) / 2, h - 8);
    ctx.save();
    ctx.translate(20, padTop + (h - padTop - padBottom) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Time (ms) [Log]', 0, 0);
    ctx.restore();
  }, [history, currentRun]);

  return (
    <canvas
      ref={canvasRef}
      width={860}
      height={300}
      style={{ border: '1px solid #444', width: '100%', boxSizing: 'border-box' }}
    />
  );
};

export default ScatterPlot;
