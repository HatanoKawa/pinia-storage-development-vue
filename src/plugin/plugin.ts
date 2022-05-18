import {
  storeToStorageItem,
  BindOptionsArray,
  BindOptionArrayItem,
  fullOptionDefinition,
  StorageDetailOptions,
  BindToStorageFunction, ExpireTime
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
  const storageKey = option.storageKey ?? option.stateKey
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
        // todo test data 1000ms here
        set(currentStorage, storageKey, _setExpireTime(dataToSet, option.expire || 1000))
        return true
      }
    }
    return false
  }
}

const _parseOptions = (options: fullOptionDefinition, store: Store): [Array<BindOptionArrayItem>, string] => {
  if (typeof options === 'boolean') {
    if (options) {
      return [
        Object.keys(store.$state)
          .map(key => ({
            stateKey: key,
            storageKey: key
          })),
        '_pinia_storage_base'
      ]
    }
  } else {
    // todo 解析storageOptions
  }
  return [[], '_pinia_storage_base']
}

export function bindStorage() {
  const localStorageList = []
  const sessionStorageList = []
  return (context: PiniaPluginContext) => {
    const rawStorageOptions = context.options.storage
    if (!rawStorageOptions) return

    const [storageOptions, storageName] = _parseOptions(rawStorageOptions, context.store)
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
      const currentStorage = JSON.parse(localStorage.getItem(storageName) || '{}')
      let changeFlag = false
      storeList.forEach(i => {
        if (has(state, i.stateKey)) {
          if (i.fn(get(state, i.stateKey), currentStorage)) {
            changeFlag =true
          }
        }
      })
      if (changeFlag) {
        localStorage.setItem(storageName, JSON.stringify(currentStorage))
      }
    })

    // console.warn(context)
    // console.warn(context.store.$state)
    // console.warn(rawStorageOptions)
  }
}