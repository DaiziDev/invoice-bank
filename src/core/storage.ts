/** Persistance : localStorage si disponible, mémoire sinon. */
const mem: Record<string, string> = {};
let usable = true;
try {
  localStorage.setItem('__probe', '1');
  localStorage.removeItem('__probe');
} catch {
  usable = false;
}

export const storage = {
  get(k: string): string | null {
    try { return usable ? localStorage.getItem(k) : (mem[k] ?? null); } catch { return mem[k] ?? null; }
  },
  set(k: string, v: string): void {
    try { if (usable) localStorage.setItem(k, v); else mem[k] = v; } catch { mem[k] = v; }
  },
  del(k: string): void {
    try { if (usable) localStorage.removeItem(k); else delete mem[k]; } catch { delete mem[k]; }
  },
};
