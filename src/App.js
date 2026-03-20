/* global BigInt */
import React, { useState } from 'react';
import { isPrime, powmod, makeSafePrime, makePrime, findSubgroupGenerator } from './utils/cryptoUtils';
import ScatterPlot from './components/ScatterPlot';

function App() {
  const [qbits, setQbits] = useState(5);
  const [pbits, setPbits] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [globalRunHistory, setGlobalRunHistory] = useState([]);
  const [currentRun, setCurrentRun] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [safePrimeOnly, setSafePrimeOnly] = useState(true);

  const qBitOptions = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

  async function bruteForceDiscreteLog(target, g, p, q, update) {
    const P = BigInt(p);
    const G = BigInt(g);
    const Y = BigInt(target);
    const chunk = 500;
    let x = 1;
    const start = performance.now();

    return new Promise(resolve => {
      function step() {
        const end = Math.min(x + chunk, Number(q) + 1);
        for (; x < end; x++) {
          if (powmod(G, x, P) === Y) {
            const elapsed = performance.now() - start;
            update({ found: x, elapsed, currentX: x });
            return resolve(x);
          }
        }
        const elapsed = performance.now() - start;
        update({ found: null, elapsed, currentX: x - 1 });
        if (x <= q) {
          setTimeout(step, 0);
        } else {
          resolve(null);
        }
      }
      step();
    });
  }

  const runTrial = async (targetQBits, targetPBits) => {
    setCurrentRun(null);
    setStatusText('Generating primes...');

    let pObj;
    try {
      const targetSize = targetPBits > 0 ? targetPBits - 1 : targetQBits;
      pObj = safePrimeOnly ? makeSafePrime(targetSize) : makePrime(targetSize);
    } catch (err) {
      setStatusText('Prime generation failed: ' + err.message);
      return null;
    }

    const { p, q } = pObj;
    const g = findSubgroupGenerator(p, q);
    if (!g) {
      setStatusText('Could not find suitable generator for p=' + p);
      return null;
    }

    let a = 0;
    while (!isPrime(a) || a < Math.max(3, Math.floor(q / 4))) {
      a = Math.floor(Math.random() * (Number(q) - 3)) + 2;
    }
    let b = 0;
    while (!isPrime(b) || b < Math.max(3, Math.floor(q / 4))) {
      b = Math.floor(Math.random() * (Number(q) - 3)) + 2;
    }

    const A = Number(powmod(g, a, p));
    const B = Number(powmod(g, b, p));
    const s = Number(powmod(B, a, p));

    const pBitsLen = p.toString(2).length - 1;
    const baseStatus = `p=${p}${safePrimeOnly ? ' (safe prime)' : ''}, q=${q}, g=${g} (order q)\n` +
      `Bob: a=${a} (private), A=${A} (public)\n` +
      `Alice: b=${b} (private), B=${B} (public)\n` +
      `Shared Secret: s=${s}\n`;

    setStatusText(baseStatus + `\nAttacker captured A and is brute-forcing a...`);

    const updateCallback = ({ found, elapsed, currentX }) => {
      setStatusText(
        baseStatus +
        `progress: guessing a up to ${currentX} / ${q} in ${elapsed.toFixed(1)}ms\n` +
        (found ? `CRACKED private key a: ${found}` : 'not found yet')
      );
      setCurrentRun({ bits: pBitsLen, time: elapsed });
    };

    const startTrial = performance.now();
    const foundA = await bruteForceDiscreteLog(A, g, p, q, (updateData) => {
      updateCallback(updateData);
    });
    const finalElapsed = performance.now() - startTrial;

    if (foundA === null) {
      setStatusText(prev => prev + `\n\nFailed to crack key.`);
      setIsRunning(false);
      return null;
    }

    setGlobalRunHistory(prev => [...prev, { bits: pBitsLen, time: finalElapsed, isSafe: safePrimeOnly }]);
    setCurrentRun(null);
    return foundA;
  };

  const runSimulation = async () => {
    setIsRunning(true);
    await runTrial(qbits, pbits);
    setIsRunning(false);
  };

  const runAllTrials = async () => {
    setIsRunning(true);
    // Removed setGlobalRunHistory([]) so users can append multiple batches
    for (const bits of qBitOptions) {
      if (bits > qbits) break;
      await runTrial(bits, 0);
    }
    setIsRunning(false);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', background: '#121212', color: '#e0e0e0', padding: '16px', minHeight: '100vh', fontFamily: 'Segoe UI, Arial, sans-serif' }}>
      <h2>Interactive Diffie-Hellman + Brute-Force Toy</h2>

      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '16px', alignItems: 'center' }}>
        <label>
          Select q size: {' '}
          <select value={qbits} onChange={(e) => { setQbits(Number(e.target.value)); setPbits(0); }} disabled={isRunning} style={{ background: '#333', color: '#fff', border: '1px solid #555', borderRadius: '4px', padding: '4px 8px' }}>
            {qBitOptions.map(b => <option key={b} value={b}>{b} bits</option>)}
          </select>
        </label>

        <label>
          Select p size override: {' '}
          <select value={pbits} onChange={(e) => setPbits(Number(e.target.value))} disabled={isRunning} style={{ background: '#333', color: '#fff', border: '1px solid #555', borderRadius: '4px', padding: '4px 8px' }}>
            {[0, 8, 10, 12, 14, 16, 18, 20].map(b => (
              <option key={b} value={b}>{b === 0 ? 'Default' : b + ' bits'}</option>
            ))}
          </select>
        </label>

        <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <input
            type="checkbox"
            checked={safePrimeOnly}
            onChange={(e) => setSafePrimeOnly(e.target.checked)}
            disabled={isRunning}
          />
          Ensure safe prime?
        </label>

        <button
          onClick={runSimulation}
          disabled={isRunning}
          style={{ padding: '6px 12px', background: isRunning ? '#222' : '#333', color: '#fff', border: '1px solid #555', cursor: isRunning ? 'not-allowed' : 'pointer', borderRadius: '4px' }}
        >
          {isRunning ? 'Running...' : 'Generate and run'}
        </button>

        <button
          onClick={runAllTrials}
          disabled={isRunning}
          style={{ padding: '6px 12px', background: isRunning ? '#222' : '#0056b3', color: '#fff', border: 'none', cursor: isRunning ? 'not-allowed' : 'pointer', borderRadius: '4px' }}
        >
          {isRunning ? 'Running Batch...' : `Run All (to ${qbits})`}
        </button>

        <button
          onClick={() => setGlobalRunHistory([])}
          disabled={isRunning}
          style={{ padding: '6px 12px', background: '#c92a2a', color: '#fff', border: 'none', cursor: isRunning ? 'not-allowed' : 'pointer', borderRadius: '4px' }}
        >
          Clear History
        </button>
      </div>

      <pre style={{ whiteSpace: 'pre-wrap', background: '#1e1e1e', color: '#d4d4d4', border: '1px solid #333', padding: '12px', minHeight: '130px', margin: '16px 0' }}>
        {statusText}
      </pre>

      <ScatterPlot history={globalRunHistory} currentRun={currentRun} />
    </div>
  );
}

export default App;
