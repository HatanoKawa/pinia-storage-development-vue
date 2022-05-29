import {
  storeToStorageItem,
  StorageType,
  BindOptionsObject,
  BindOptionArrayItem,
  fullOptionDefinition,
  StorageDetailOptions,
  BindToStorageFunction, ExpireTime, BindOptionBase
} from './types';
import {PiniaPluginContext, Store} from "pinia";
import {get, isObject, isArray, has, set, isEqual} from 'lodash-es';

const _calculateExpireTime = (expire: ExpireTime) => {
  if (typeof expire === 'number') {
    return expire;
  } else {
    return 0;
  }
}

const _setExpireTime = (item: any, expire: ExpireTime) => ({
  _v: item,
  _t: expire && Date.now() + _calculateExpireTime(expire)
})

const _useBindToStorage = (option: BindOptionArrayItem): BindToStorageFunction => {
  // set storage key
  const storageKey = option.stateKey
  const setter = option.setter ?? (() => {})
  return (newVal: any, currentStorage: Object) => {
    // todo 需要用setter替换
    const setterRes = setter(newVal)
    const dataToSet = setterRes !== undefined ? (typeof setterRes === 'boolean' ? (setterRes ? newVal : undefined) : setterRes) : newVal
    const oldData = get(currentStorage, storageKey + '._v') || {}
    if (dataToSet !== undefined) {
      if (isObject(dataToSet) || isArray(dataToSet)) {
        if (!isEqual(dataToSet, oldData)) {
          set(currentStorage, storageKey, _setExpireTime(dataToSet, option.expire || 0))
          return true
        }
      } else if (oldData !== dataToSet) {
        set(currentStorage, storageKey, _setExpireTime(dataToSet, option.expire || 0))
        return true
      }
    }
    return false
  }
}

export const _parseOptions = (options: fullOptionDefinition, store: Store): [Array<BindOptionArrayItem>, string, boolean | StorageType] => {
  console.warn('//////////////////////////////parse options start//////////////////////////////')
  console.warn('options input: ', options)
  let storageOptions: Array<BindOptionArrayItem> = []
  let defaultStorageType: boolean | StorageType = false
  let storageName = store.$id
  if (options === true || options === 'local' || options === 'session') {
    storageOptions = Object.keys(store.$state).map(key => ({ stateKey: key }))
    options === 'session' && (defaultStorageType = 'session')
  } else {
    let sourceOptions = options
    if (isObject(options) && has(options, 'storageOptions')) {
      // full options
      sourceOptions = (options as StorageDetailOptions).storageOptions
      if (has(options, 'defaultUse')) {
        defaultStorageType = (options as StorageDetailOptions).defaultUse === true
          ? 'local'
          : ((options as StorageDetailOptions).defaultUse as StorageType | false)
      }
    } else if (isArray(sourceOptions)) {
      // array type options
      storageOptions = sourceOptions.map(i => (
        typeof i === 'string' ? { stateKey: i } : i
      ))
    } else if (isObject(sourceOptions) && !sourceOptions.storageOptions) {
      // object type options
      storageOptions = Object.keys(sourceOptions)
        .map(key => (
          (sourceOptions as BindOptionsObject)[key] === true
            ? { stateKey: key }
            : { stateKey: key, ...((sourceOptions as BindOptionsObject)[key] as BindOptionBase) }
        ))
    }
  }
  console.warn('store id: ' + `_pinia_storage_${storageName}`)
  console.warn('generated storage options: ', storageOptions)
  console.warn('//////////////////////////////parse options end//////////////////////////////')
  return [storageOptions, `_pinia_storage_${storageName}`, defaultStorageType]
}

const initStorageFlag = () => {
  // set storageType attribute to judge which storage is changed
  if (localStorage.getItem('__pinia_storage_store_flag') !== 'local') {
    localStorage.setItem('__pinia_storage_store_flag', 'local')
  }
  if (sessionStorage.getItem('__pinia_storage_store_flag') !== 'session') {
    sessionStorage.setItem('__pinia_storage_store_flag', 'session')
  }
}

export function bindStorage() {
  const localStorageList = []
  const sessionStorageList = []

  // test storage event
  window.addEventListener('storage', (e: StorageEvent) => {
    console.warn('changed storage type: ' + e.storageArea!.getItem('__pinia_storage_store_flag'))
    console.warn('storage event: ', e)
  })
  return (context: PiniaPluginContext) => {
    initStorageFlag()
    
    console.warn('context', context)
    const rawStorageOptions = context.options.storage
    if (!rawStorageOptions) return

    const [storageOptions, storageFullName] = _parseOptions(rawStorageOptions, context.store)
    console.warn('storageOptions', storageOptions)

    // 存储stateKey和对应的更新方法，{stateKey, Fn}
    const storeList: Array<storeToStorageItem> = []
    storageOptions.forEach(i => {
      storeList.push({
        stateKey: i.stateKey,
        fn: _useBindToStorage(i)
      })
    })

    context.store.$subscribe((mutation, state) => {
      // 利用has和get分发变化
      const currentStorage = JSON.parse(localStorage.getItem(storageFullName) || '{}')
      let changeFlag = false
      storeList.forEach(i => {
        if (has(state, i.stateKey)) {
          if (i.fn(get(state, i.stateKey), currentStorage)) {
            changeFlag =true
          }
        }
      })
      if (changeFlag) {
        localStorage.setItem(storageFullName, JSON.stringify(currentStorage))
      }
    })

    // console.warn(context)
    // console.warn(context.store.$state)
    // console.warn(rawStorageOptions)
  }
}