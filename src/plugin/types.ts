import 'pinia';

type StorageType = 'local' | 'session'
type StorageSerializer = <T>(storeVal: T) => boolean | string | void
type StorageParser = <T>(rawStorageValue: string) => T
type ExpireCallback = <T>(oldVal: T, expireTime: number) => void

// base type definition
interface BindOptionBase {
  // sync use localStorage / sessionStorage, default as local
  storageType?: StorageType
  // storage item key will be `storageKey/store.$id`, default as pinia-storage
  storageKey?: string
  // is overwritten by data from storage, default as true
  setFromStorage?: boolean
  // expireTime like 1000|'1d2m3s4ms'|new Date(), default as 0, means never expire
  expire?: number | string | Date
  // callback function, triggered when data is expired
  expireCallback?: ExpireCallback
  // storage serializer, default as JSON.stringify
  serializer?: StorageSerializer
  // parser serializer, default as JSON.parse
  parser?: StorageParser
}

// type definition for Object
interface BindOptionsObject {
  [key: string]: BindOptionBase | StorageType
}

// type definition for Array
interface BindOptionArray extends BindOptionBase {
  stateKey: string;
}

// complete type definition
interface StorageDetailOptions {
  // default setting, true is an alias for 'local'
  defaultUse?: boolean | StorageType
  // skip keys, only works when defaultUse option isn't false
  omit?: string[]
  // option to enable the storage watcher to sync data between tabs, default as false
  isShared?: boolean
  storageOptions?: BindOptionsObject | Array<BindOptionArray | string>
}

declare module 'pinia' {
  export interface DefineStoreOptionsBase<S, Store> {
    storage?: boolean | BindOptionsObject | Array<BindOptionArray | string> | StorageDetailOptions
  }
}