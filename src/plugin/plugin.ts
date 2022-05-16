import {
  storeToStorageItem,
  BindOptionsArray,
  BindOptionArrayItem,
  fullOptionDefinition,
  StorageDetailOptions
} from './types';
import {PiniaPluginContext, Store} from "pinia";
import {get, isObject, isArray, has} from 'lodash-es';

const _useBindStorage = (option: BindOptionArrayItem) => {
  // set storage key
  const storageKey = option.storageKey ?? option.stateKey
  return (newVal: any) => {
    // todo 需要用serializer替换
    const dataToSet = isObject(newVal) || isArray(newVal) ? JSON.stringify(newVal) : newVal
    if (localStorage.getItem(storageKey) === dataToSet) return
    localStorage.setItem(storageKey, dataToSet)
  }
}

const _parseOptions = (options: fullOptionDefinition, store: Store): [Array<BindOptionArrayItem>] => {
  if (typeof options === 'boolean') {
    if (options) {
      return [
        Object.keys(store.$state)
          .map(key => ({
            stateKey: key,
            storageKey: key
          }))
      ]
    }
  } else {
    // todo 解析storageOptions
  }
  return [[]]
}

export function bindStorage() {
  const localStorageList = []
  const sessionStorageList = []
  return (context: PiniaPluginContext) => {
    const rawStorageOptions = context.options.storage
    if (!rawStorageOptions) return

    const [storageOptions] = _parseOptions(rawStorageOptions, context.store)
    console.warn('storageOptions', storageOptions)

    // 存储stateKey和对应的更新方法，{stateKey, Fn}
    const storeList: Array<storeToStorageItem> = []
    storageOptions.forEach(i => {
      storeList.push({
        stateKey: i.stateKey,
        fn: _useBindStorage(i)
      })
    })

    context.store.$subscribe((mutation, state) => {
      // todo 利用has和get分发变化
      storeList.forEach(i => {
        if (has(state, i.stateKey)) {
          i.fn(get(state, i.stateKey))
        }
      })
    })

    // console.warn(context)
    // console.warn(context.store.$state)
    // console.warn(rawStorageOptions)
  }
}