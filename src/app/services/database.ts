/** Operaciones resueltas al completar la transacción, nunca solo al emitir onsuccess. */
export abstract class LocalDatabase {
  protected constructor(private readonly name: string, private readonly stores: string[]) { }

  // Abre la base del proyecto, crea almacenes al instalar la versión 1 y controla bloqueos o esperas largas.
  abrirDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (!globalThis.indexedDB) { reject(new Error('IndexedDB no está disponible en este navegador.')); return; }
      const request = indexedDB.open(this.name, 1);
      let finished = false;
      const fail = (error: unknown) => { finished = true; clearTimeout(timer); reject(error); };
      const timer = setTimeout(() => fail(new Error('No se pudo abrir la base local. Cierra otras pestañas y reintenta.')), 8000);
      request.onupgradeneeded = () => {
        for (const name of this.stores) {
          if (!request.result.objectStoreNames.contains(name)) request.result.createObjectStore(name, { keyPath: 'id', autoIncrement: true });
        }
      };
      request.onblocked = () => fail(new Error('La base local está bloqueada por otra pestaña. Ciérrala y reintenta.'));
      request.onerror = () => fail(request.error ?? new Error('No se pudo abrir la base local.'));
      request.onsuccess = () => {
        clearTimeout(timer);
        if (finished) { request.result.close(); return; }
        request.result.onversionchange = () => request.result.close();
        resolve(request.result);
      };
    });
  }

  // Ejecuta una operación de IndexedDB y solo confirma el resultado tras completar la transacción completa.
  protected async execute<T>(storeName: string, mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    const db = await this.abrirDB();
    return new Promise<T>((resolve, reject) => {
      try {
        const transaction = db.transaction(storeName, mode);
        const request = action(transaction.objectStore(storeName));
        transaction.oncomplete = () => { db.close(); resolve(request.result); };
        const fail = () => { db.close(); reject(transaction.error ?? request.error ?? new Error('La operación local fue cancelada.')); };
        transaction.onerror = fail;
        transaction.onabort = fail;
      } catch (error) { db.close(); reject(error); }
    });
  }
}
