/* ELWIS – lokalna baza tabletu (IndexedDB). Działa offline. */
const DB = (() => {
  let dbp = null;
  function open() {
    if (dbp) return dbp;
    dbp = new Promise((res, rej) => {
      const r = indexedDB.open('elwis', 1);
      r.onupgradeneeded = () => {
        const d = r.result;
        d.createObjectStore('kv');
        const ev = d.createObjectStore('events', { keyPath: 'id' });
        ev.createIndex('kod', 'kod');
        ev.createIndex('synced', 'synced');
        d.createObjectStore('files');           // pliki do wglądu i rzuty: id -> {blob, mime, name}
        const ph = d.createObjectStore('photos', { keyPath: 'id' }); // zdjęcia z tabletu
        ph.createIndex('sent', 'sent');
      };
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    return dbp;
  }
  function tx(store, mode, fn) {
    return open().then(d => new Promise((res, rej) => {
      const t = d.transaction(store, mode);
      const s = t.objectStore(store);
      let out;
      Promise.resolve(fn(s)).then(v => { out = v; });
      t.oncomplete = () => res(out);
      t.onerror = () => rej(t.error);
      t.onabort = () => rej(t.error);
    }));
  }
  const req = r => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  return {
    get: (k) => tx('kv', 'readonly', s => req(s.get(k))),
    set: (k, v) => tx('kv', 'readwrite', s => { s.put(v, k); }),
    del: (k) => tx('kv', 'readwrite', s => { s.delete(k); }),
    putEvent: (e) => tx('events', 'readwrite', s => { s.put(e); }),
    putEvents: (arr) => tx('events', 'readwrite', s => { arr.forEach(e => s.put(e)); }),
    eventsFor: (kod) => tx('events', 'readonly', s => req(s.index('kod').getAll(kod))),
    unsynced: () => tx('events', 'readonly', s => req(s.getAll())).then(a => a.filter(e => !e.synced)),
    getEvent: (id) => tx('events', 'readonly', s => req(s.get(id))),
    putFile: (id, v) => tx('files', 'readwrite', s => { s.put(v, id); }),
    getFile: (id) => tx('files', 'readonly', s => req(s.get(id))),
    putPhoto: (p) => tx('photos', 'readwrite', s => { s.put(p); }),
    getPhoto: (id) => tx('photos', 'readonly', s => req(s.get(id))),
    unsentPhotos: () => tx('photos', 'readonly', s => req(s.getAll())).then(a => a.filter(p => !p.sent)),
    clearAll: () => open().then(d => Promise.all(['kv', 'events', 'files', 'photos'].map(n => new Promise(res => {
      const t = d.transaction(n, 'readwrite'); t.objectStore(n).clear(); t.oncomplete = res;
    }))))
  };
})();
