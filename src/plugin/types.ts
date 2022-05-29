import 'pinia';

export type StorageType = 'local' | 'session'
type StorageSetter = <T>(storeVal: T) => any | void
type StorageGetter = <T>(rawStorageValue: string) => boolean | T | void
type ExpireCallback = <T>(oldVal: T, expireTime: number) => void
export type ExpireTime = Date | number | string
type BindOptionsArray = Array<BindOptionArrayItem | string>
export type BindToStorageFunction = (newVal: any, currentStorage: Object) => boolean

// base type definition
export interface BindOptionBase {
  // sync use localStorage / sessionStorage, default as local
  storageType?: StorageType
  // is overwritten by data from storage, default as true
  setFromStorage?: boolean
  // expireTime like 1000|'1d2m3s4ms'|new Date(), default as 0, means never expire
  expire?: ExpireTime
  // callback function, triggered when data is expired
  expireCallback?: ExpireCallback
  // storage serializer, default as () =>{}
  // return true or void will use source data, return false will stop setting, other situation will use return value
  setter?: StorageSetter
  // parser serializer, default as JSON.parse
  getter?: StorageGetter
}

// type definition for Object
export interface BindOptionsObject {
  [key: string]: BindOptionBase | StorageType | true
}

// type definition for Array
export interface BindOptionArrayItem extends BindOptionBase {
  stateKey: string;
}

// complete type definition
export interface StorageDetailOptions {
  // default setting, true is an alias for 'local'
  defaultUse?: boolean | StorageType
  // skip keys, only works when defaultUse option isn't false
  omit?: string[]
  // option to enable the storage watcher to sync data between tabs, default as false
  isShared?: boolean
  storageOptions: BindOptionsObject | Array<BindOptionArrayItem | string>
}

export type fullOptionDefinition = StorageDetailOptions | BindOptionsObject | BindOptionsArray | 'local' | 'session' | true

declare module 'pinia' {
  export interface DefineStoreOptionsBase<S, Store> {
    storage?: fullOptionDefinition
  }
}

export interface storeToStorageItem {
  stateKey: string
  fn: BindToStorageFunction
}
