import { defineStore } from "pinia";

export const useBaseStore = defineStore('test_store', {
  state: () => {
    return {
      count: 0,
      testObj: { count: 1 },
      testObj2: { count: 1 }
    };
  },

  actions: {
    increment() {
      this.count++;
    },
    decrement() {
      this.count--;
    },
  },
  storage: {
    defaultUse: 'local',
    storageOptions: {
      count: {
        expire: '24h'
      }
    }
  }
})
