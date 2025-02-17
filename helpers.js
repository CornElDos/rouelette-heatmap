// helpers.js - Gemensamma hjälpfunktioner

export function roundBetSize(value, roundingFactor) {
  return Math.ceil(value / roundingFactor) * roundingFactor;
}

export function getNextBetMartingale(losses, base) {
  return base * 2 ** losses;
}

export function getNextBetFibonacci(losses, base) {
  function fib(n) {
    if (n <= 1) return 1;
    let a = 1, b = 1;
    for (let i = 2; i <= n; i++) {
      const temp = a + b;
      a = b;
      b = temp;
    }
    return b;
  }
  return base * fib(losses);
}

export function getNextBetPadovan(losses, base) {
  function padovan(n) {
    if (n < 3) return 1;
    let p0 = 1, p1 = 1, p2 = 1;
    let p;
    for (let i = 3; i <= n; i++) {
      p = p0 + p1;
      p0 = p1;
      p1 = p2;
      p2 = p;
    }
    return p;
  }
  return base * padovan(losses);
}
