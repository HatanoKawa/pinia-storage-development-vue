import {
  storeToStorageItem,
  StorageType,
  BindOptionsObject,
  BindOptionArrayItem,
  fullOptionDefinition,
  StorageDetailOptions,
  BindToStorageFunction,
  ExpireTime,
  BindOptionsArray,
  initDataObject,
} from './types';
import {PiniaPluginContext, StateTree, Store} from 'pinia';
import {get, isObject, isArray, has, set, isEqual, omit, uniq, cloneDeep} from 'lodash-es';

const _calculateExpireTime = (expire: ExpireTime) => {
  if (typeof expire === 'number') {
    if (expire > 0) {
      return expire + Date.now();
    }
  } else if (expire instanceof Date) {
    const expireTime = expire.getTime();
    if (expireTime > Date.now()) {
      return expire.getTime();
    }
  } else {
    const d = /(\d+)d/.exec(expire);
    const h = /(\d+)h/.exec(expire);
    const m = /(\d+)m/.exec(expire);
    const s = /(\d+)s/.exec(expire);
    const ms = /(\d+)ms/.exec(expire);
    if (d || h || m || s || ms) {
      return Date.now() +
        (d ? parseInt(d[1]) * 24 * 60 * 60 * 1000 : 0) +
        (h ? parseInt(h[1]) * 60 * 60 * 1000 : 0) +
        (m ? parseInt(m[1]) * 60 * 1000 : 0) +
        (s ? parseInt(s[1]) * 1000 : 0) +
        (ms ? parseInt(ms[1]) : 0);
    }
  }
  return 0;
};

const _setExpireTime = (item: any, expire: ExpireTime) => ({
  _v: item,
  _t: _calculateExpireTime(expire),
});

const _useBindToStorage = (option: BindOptionArrayItem): BindToStorageFunction => {
  // set storage key
  const storageKey = option.stateKey;
  const setter = option.setter ?? (() => {});

  // return false means skip setting, true means has been set
  return (newVal: any, currentStorage: Object) => {
    const setterRes = setter(newVal);
    const dataToSet = setterRes !== undefined ? (typeof setterRes === 'boolean' ? (setterRes ? newVal : undefined) : setterRes) : newVal;
    const oldData = get(currentStorage, storageKey + '._v') || {};
    if (dataToSet !== undefined) {
      if (isObject(dataToSet) || isArray(dataToSet)) {
        if (!isEqual(dataToSet, oldData)) {
          set(currentStorage, storageKey, _setExpireTime(dataToSet, option.expire || 0));
          return true;
        }
      } else if (oldData !== dataToSet) {
        set(currentStorage, storageKey, _setExpireTime(dataToSet, option.expire || 0));
        return true;
      }
    }
    return false;
  };
};

export const _parseOptions = (options: fullOptionDefinition, store: Store): Array<BindOptionArrayItem> => {
  console.warn('//////////////////////////////parse options start//////////////////////////////');
  console.warn('options input: ', options);
  let storageOptions: Array<BindOptionArrayItem> = [];
  let omitList: Array<string> = [];
  if (options === true || options === 'local' || options === 'session') {
    // simple type options
    storageOptions = Object.keys(store.$state).map((key) => ({
      stateKey: key,
      storageType: options === 'session' ? 'session' : 'local',
    }));
  } else {
    let useDefaultStorage: boolean = false;
    let defaultStorage: StorageType = 'local';
    let tempOptions = options;
    if (isObject(options) && has(options, 'storageOptions')) {
      // detail type options
      const detailTypeOptions = options as StorageDetailOptions;
      tempOptions = detailTypeOptions.storageOptions;
      omitList = detailTypeOptions.omit ?? [];
      if (has(options, 'defaultUse')) {
        useDefaultStorage = true;
        defaultStorage = detailTypeOptions.defaultUse === 'session' ? 'session' : 'local';
      }
    }
    if (isArray(tempOptions)) {
      // array type options
      const arrayTypeOptions = tempOptions as BindOptionsArray;
      if (useDefaultStorage) {
        // with defaultUse
        const arrayKeySet = new Set();
        const tempStorageOptions: Array<BindOptionArrayItem> = [];
        // manual set options
        arrayTypeOptions.forEach((option) => {
          arrayKeySet.add(typeof option === 'string' ? option : option.stateKey);
          tempStorageOptions.push(
            typeof option === 'string' ?
              {stateKey: option, storageType: defaultStorage} :
              {storageType: defaultStorage, ...option},
          );
        });
        // auto set options
        Object.keys(omit(store.$state, omitList)).forEach((key) => {
          if (!arrayKeySet.has(key)) {
            tempStorageOptions.push({stateKey: key, storageType: defaultStorage});
          }
        });
        storageOptions = tempStorageOptions;
      } else {
        // without defaultUse
        storageOptions = arrayTypeOptions.map((option) => (
          typeof option === 'string' ? {stateKey: option, storageType: 'local'} : {storageType: 'local', ...option}
        ));
      }
    } else if (isObject(tempOptions) && !has(tempOptions, 'storageOptions')) {
      // object type options
      const objectTypeOptions = tempOptions as BindOptionsObject;
      if (useDefaultStorage) {
        // with defaultUse
        uniq([
          ...Object.keys(objectTypeOptions),
          ...Object.keys(omit(store.$state, omitList)),
        ]).forEach((key) => {
          const option = objectTypeOptions[key];
          if (has(objectTypeOptions, key)) {
            // manual set storageType
            if (typeof option === 'string') {
              storageOptions.push({stateKey: key, storageType: option});
            } else {
              storageOptions.push({stateKey: key, storageType: defaultStorage, ...option});
            }
          } else {
            // auto set storageType
            storageOptions.push({stateKey: key, storageType: defaultStorage});
          }
        });
      } else {
        // without defaultUse
        storageOptions = Object.keys(objectTypeOptions)
          .map((key) => {
            const option = objectTypeOptions[key];
            if (typeof option === 'string') {
              return {stateKey: key, storageType: option};
            } else {
              return {stateKey: key, storageType: 'local', ...option};
            }
          });
      }
    }
  }
  console.warn('store id: ' + `_pinia_storage_${store.$id}`);
  console.warn('generated storage options: ', storageOptions);
  console.warn('//////////////////////////////parse options end//////////////////////////////');
  return storageOptions;
};

/**
 * @description set storage flag
 */
const _initStorageFlag = () => {
  // set storageType attribute to judge which storage is changed
  if (localStorage.getItem('__pinia_storage_store_flag') !== 'local') {
    localStorage.setItem('__pinia_storage_store_flag', 'local');
  }
  if (sessionStorage.getItem('__pinia_storage_store_flag') !== 'session') {
    sessionStorage.setItem('__pinia_storage_store_flag', 'session');
  }
};

const _initStorageData = (storageOptions: Array<BindOptionArrayItem>, store: Store, storageFullName: string): Array<storeToStorageItem> => {
  const storeList: Array<storeToStorageItem> = [];
  const initDataToSet: initDataObject = cloneDeep(store.$state);
  const localStorageData = JSON.parse(localStorage.getItem(storageFullName) || '{}');
  const sessionStorageData = JSON.parse(sessionStorage.getItem(storageFullName) || '{}');
  storageOptions.forEach((i) => {
    if (i.setFromStorage !== false) {
      // use data from storage
      const storageData = get(i.storageType === 'session' ? sessionStorageData : localStorageData, `${i.stateKey}._v`);
      if (storageData !== undefined) {
        // data get from storage is not undefined
        set(initDataToSet, i.stateKey, storageData);
        // todo 解决深层数据覆盖的问题
      }
    }
    storeList.push({
      stateKey: i.stateKey,
      fn: _useBindToStorage(i),
    });
  });
  store.$patch(initDataToSet);
  return storeList;
};

export function bindStorage() {
  const localStorageList = [];
  const sessionStorageList = [];

  // test storage event
  window.addEventListener('storage', (e: StorageEvent) => {
    console.warn('changed storage type: ' + e.storageArea!.getItem('__pinia_storage_store_flag'));
    console.warn('storage event: ', e);
  });
  return (context: PiniaPluginContext) => {
    console.warn('context', context);
    const rawStorageOptions = context.options.storage;
    if (!rawStorageOptions) return;

    _initStorageFlag();

    const storageFullName = `_pinia_storage_${context.store.$id}`;
    const storageOptions = _parseOptions(rawStorageOptions, context.store);
    console.warn('storageOptions', storageOptions);

    // store stateKey and update function，{stateKey, Fn}
    const storeList: Array<storeToStorageItem> = _initStorageData(storageOptions, context.store, storageFullName);

    context.store.$subscribe((mutation, state) => {
      // 利用has和get分发变化
      const currentStorage = JSON.parse(localStorage.getItem(storageFullName) || '{}');
      let changeFlag = false;
      storeList.forEach((i) => {
        if (has(state, i.stateKey)) {
          if (i.fn(get(state, i.stateKey), currentStorage)) {
            changeFlag = true;
          }
        }
      });
      if (changeFlag) {
        localStorage.setItem(storageFullName, JSON.stringify(currentStorage));
      }
    });

    // console.warn(context)
    // console.warn(context.store.$state)
    // console.warn(rawStorageOptions)
  };
}
