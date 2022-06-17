import {PiniaPluginContext, StateTree, Store} from 'pinia';
import {toRaw} from 'vue';

type StorageSerializer = <S extends StateTree>(storeVal: S) => string
type StorageParser = <S extends StateTree>(rawStorageValue: string) => S

export interface SyncStorageOptions {
  // sync use localStorage / sessionStorage, default as local
  storage?: 'local' | 'session'
  // storage item key will be `storageKey/store.$id`, default as pinia-storage
  storageKey?: string
  // storage serializer, default as JSON.stringify
  serializer?: StorageSerializer
  // parser serializer, default as JSON.parse
  parser?: StorageParser
  // expireTime, default as 24 * 60 * 60 * 1000
  expire?: number
}

interface WrappedStorage {
  t: number
  state: string
}

export function syncStorageImpl(opt: SyncStorageOptions) {
  function keyOf(store: Store) {
    return `${opt.storageKey}/${store.$id}`;
  }

  function _wrap(serializedState: string) {
    return JSON.stringify({
      t: Date.now(),
      state: serializedState,
    });
  }

  function _unwrap(rawStorageValue: string): WrappedStorage | null {
    const unwrappedValue = JSON.parse(rawStorageValue);
    if (!unwrappedValue?.t) return null;
    return unwrappedValue;
  }

  function setItem(store: Store, serializeFn?: StorageSerializer) {
    serializeFn = serializeFn ?? JSON.stringify;
    const windowStorage = opt.storage === 'session' ? window.sessionStorage : window.localStorage;
    windowStorage.setItem(
      keyOf(store),
      _wrap(serializeFn(toRaw(store.$state))),
    );
  }

  function getItem(store: Store, parserFn?: StorageParser) {
    parserFn = parserFn ?? JSON.parse;
    const windowStorage = opt.storage === 'session' ? window.sessionStorage : window.localStorage;
    const rawStorageValue = _unwrap(windowStorage.getItem(keyOf(store)) || '{}');
    // nothing in storage
    if (!rawStorageValue) return;
    if ((Date.now() - rawStorageValue.t) > opt.expire!) return;
    store.$patch(parserFn(rawStorageValue.state));
  }

  return {
    getItem,
    setItem,
  };
}

export function syncStorage(opt: SyncStorageOptions = {}) {
  opt = Object.assign({
    storageKey: 'pinia-storage',
    storage: 'local',
    expire: 24 * 60 * 60 * 1000,
  }, opt);

  const storageImpl = syncStorageImpl(opt);

  return (context: PiniaPluginContext) => {
    storageImpl.getItem(context.store, opt.parser);

    context.store.$subscribe(() => {
      storageImpl.setItem(context.store, opt.serializer);
    });
  };
}
