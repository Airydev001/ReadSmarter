import { get, set, del, keys, createStore } from "idb-keyval";
export const pdfStore = createStore("pb-pdfs", "s");
export const songStore = createStore("pb-songs", "s");
export const lib = {
  async list(st) {
    try {
      const ks = await keys(st);
      const all = await Promise.all(ks.map(async (k) => ({ id: k, ...(await get(k, st)) })));
      return all.sort((a, b) => a.added - b.added);
    } catch { return []; }
  },
  put: (st, id, v) => set(id, { ...v, added: Date.now() }, st).catch(() => {}),
  del: (st, id) => del(id, st).catch(() => {}),
};
