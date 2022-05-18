import {
  storeToStorageItem,
  BindOptionsArray,
  BindOptionArrayItem,
  fullOptionDefinition,
  StorageDetailOptions,
  BindToStorageFunction,
  ExpireTime
} from './types';
import {PiniaPluginContext, Store} from "pinia";
import {get, isObject, isArray, has, set, isEqual} from 'lodash-es';
import {computed, ComputedRef, watch, WritableComputedRef} from "vue";

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

// const _useBindToStorage = (option: BindOptionArrayItem): BindToStorageFunction => {
//   // set storage key
//   const storageKey = option.storageKey ?? option.stateKey
//   const setter = option.setter ?? (() => {})
//   return (newVal: any, currentStorage: Object) => {
//     const setterRes = setter(newVal)
//     const dataToSet = setterRes !== undefined ? (typeof setterRes === 'boolean' ? (setterRes ? newVal : undefined) : setterRes) : newVal
//     const oldData = get(currentStorage, storageKey + '._v') || {}
//     if (dataToSet !== undefined) {
//       if (isObject(dataToSet) || isArray(dataToSet)) {
//         if (!isEqual(dataToSet, oldData)) {
//           set(currentStorage, storageKey, _setExpireTime(dataToSet, option.expire || 0))
//           return true
//         }
//       } else if (oldData !== dataToSet) {
//         set(currentStorage, storageKey, _setExpireTime(dataToSet, option.expire || 1000))
//         return true
//       }
//     }
//     return false
//   }
// }

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

const _useComputeToStorage = (option: BindOptionArrayItem, store: Store): WritableComputedRef<any> => {
  const setter = option.setter ?? (() => {})
  return computed({
    get: () => {
      const setterRes = setter(get(store, option.stateKey))
      if (setterRes === false) {
        return null
      }
      return _setExpireTime(
        setterRes === undefined || setterRes === true ? get(store, option.stateKey) : setterRes,
        option.expire || 0
      )
    },
    set: () => {}
  })
}

interface ComputedStorage {
  [key: string]: ComputedRef<any> | WritableComputedRef<any>
}

export function bindStorage() {
  const localStorageList = []
  const sessionStorageList = []
  return (context: PiniaPluginContext) => {
    const rawStorageOptions = context.options.storage
    if (!rawStorageOptions) return

    const [storageOptions, storageName] = _parseOptions(rawStorageOptions, context.store)
    console.warn('storageOptions', storageOptions)

    const computedList: Array<[string, WritableComputedRef<any>]> = []
    storageOptions.forEach(option => {
      computedList.push([option.storageKey || option.stateKey, _useComputeToStorage(option, context.store)])
    })
    const storeToStorage = computed(() => {
      const _o: ComputedStorage = {}
      computedList.forEach(i => {
        if (i[1].value) {
          _o[i[0]] = i[1].value
        }
      })
      return _o
    })
    console.warn('storeToStorage', storeToStorage)

    // test watcher
    watch(storeToStorage, newVal => {
      console.warn(newVal)
    })

    context.store._computedStorage = storeToStorage
    // @ts-ignore
    if (process.env.NODE_ENV === 'development') {
      context.store._customProperties.add('_computedStorage')
    }
  }
}