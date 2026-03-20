/* global BigInt */

export function isPrime(n) {
  if (n < 2) return false;
  if (n % 2 === 0) return n === 2;
  for (let i = 3; i * i <= n; i += 2) {
    if (n % i === 0) return false;
  }
  return true;
}

export function powmod(base, exp, mod) {
  let result = BigInt(1);
  let b = BigInt(base) % BigInt(mod);
  let e = BigInt(exp);
  const m = BigInt(mod);
  while (e > BigInt(0)) {
    if (e & BigInt(1)) result = (result * b) % m;
    b = (b * b) % m;
    e >>= BigInt(1);
  }
  return result;
}

export function findGenerator(p) {
  const phi = p - 1;
  const factors = [];
  let x = phi;
  for (let i = 2; i * i <= x; i++) {
    if (x % i === 0) {
      factors.push(i);
      while (x % i === 0) x /= i;
    }
  }
  if (x > 1) factors.push(x);

  for (let g = 2; g < p; g++) {
    let ok = true;
    for (const f of factors) {
      if (powmod(g, phi / f, p) === BigInt(1)) {
        ok = false;
        break;
      }
    }
    if (ok) return g;
  }
  return null;
}

/**
 * Generates an element g of order q in the group (Z/pZ)*
 * where p = 2q + 1 is a safe prime.
 */
export function findSubgroupGenerator(p, q) {
  for (let i = 2; i < p; i++) {
    const g = Number(powmod(i, 2, p));
    if (g !== 1 && g !== p - 1) {
      // For p = 2q + 1, any x^2 mod p (x != 0, 1) has order q or 1.
      return g;
    }
  }
  return null;
}

export function pickPrimeBits(bits) {
  const low = 1 << (bits - 1);
  const high = (1 << bits) - 1;
  const candidates = [];
  for (let p = Math.max(3, low | 1); p <= high; p += 2) {
    if (isPrime(p)) candidates.push(p);
    if (candidates.length >= 150) break;
  }
  if (candidates.length === 0) throw new Error('No prime in range for bits=' + bits);
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export function makeSafePrime(qbits) {
  for (let trials = 0; trials < 500; trials++) {
    const q = pickPrimeBits(qbits);
    const p = q * 2 + 1;
    if (isPrime(p)) return { p, q };
  }
  throw new Error('Could not find safe prime for qbits=' + qbits);
}
