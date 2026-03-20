import React, { useRef, useEffect, useState } from 'react';

const ScatterPlot = ({ history, currentRun }) => {
  const canvasRef = useRef(null);
  const [hoverData, setHoverData] = useState(null);

  const padLeft = 80;
  const padRight = 40;
  const padTop = 20;
  const padBottom = 40;
  const minX = 5;
  const maxX = 20;

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const x = (e.clientX - rect.left) * scaleX;
    const w = canvas.width;

    const chartWidth = w - padLeft - padRight;
    const bitRange = maxX - minX;
    const pixelPerBit = chartWidth / bitRange;
    const bitsFloat = (x - padLeft) / pixelPerBit;
    const bits = Math.round(bitsFloat) + minX;

    if (bits >= minX && bits <= maxX) {
      const trials = history.filter((p) => p.bits === bits);
      if (trials.length === 0) {
        setHoverData(null);
        return;
      }

      const safe = trials.filter((p) => p.isSafe !== false);
      const nonSafe = trials.filter((p) => p.isSafe === false);

      const avgSafe = safe.length > 0 ? safe.reduce((acc, p) => acc + p.time, 0) / safe.length : null;
      const avgNonSafe = nonSafe.length > 0 ? nonSafe.reduce((acc, p) => acc + p.time, 0) / nonSafe.length : null;

      let securityDecrease = null;
      if (avgSafe && avgNonSafe) {
        securityDecrease = ((avgSafe - avgNonSafe) / avgSafe) * 100;
      }

      setHoverData({ bits, avgSafe, avgNonSafe, securityDecrease });
    } else {
      setHoverData(null);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

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
    for (let b = minX; b <= maxX; b++) {
      const x = transX(b);
      ctx.beginPath();
      ctx.moveTo(x, h - padBottom + 5);
      ctx.lineTo(x, padTop);
      ctx.strokeStyle = '#333';
      ctx.stroke();
      ctx.fillText(b, x, h - padBottom + 8);
    }

    history.forEach(p => {
      const x = transX(p.bits);
      const y = transY(p.time);
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fillStyle = p.isSafe === false ? '#165993ff' : '#4dabf7';
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
    ctx.fillText('p size (bits)', padLeft + (w - padLeft - padRight) / 2, h - 15);
    ctx.save();
    ctx.translate(20, padTop + (h - padTop - padBottom) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Time (ms) [Log]', 0, 0);
    ctx.restore();
  }, [history, currentRun]);

  return (
    <div onMouseLeave={() => setHoverData(null)}>
      <canvas
        ref={canvasRef}
        width={860}
        height={300}
        onMouseMove={handleMouseMove}
        style={{ border: '1px solid #444', width: '100%', boxSizing: 'border-box', cursor: 'crosshair' }}
      />
      {hoverData && (
        <div style={{ marginTop: '12px', display: 'flex', gap: '24px', fontSize: '14px', background: '#1e1e1e', padding: '12px', borderRadius: '4px', border: '1px solid #333' }}>
          <div style={{ color: '#ccc' }}>
            <strong>{hoverData.bits} bits</strong>
          </div>
          {hoverData.avgSafe !== null && (
            <div style={{ color: '#4dabf7' }}>
              Avg Safe: {hoverData.avgSafe.toFixed(2)}ms
            </div>
          )}
          {hoverData.avgNonSafe !== null && (
            <div style={{ color: '#165993ff' }}>
              Avg Normal: {hoverData.avgNonSafe.toFixed(2)}ms
            </div>
          )}
          {hoverData.securityDecrease !== null && (
            <div style={{ color: '#ff6b6b' }}>
              Security Decrease: {hoverData.securityDecrease.toFixed(1)}%
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ScatterPlot;
