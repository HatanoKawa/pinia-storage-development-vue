import { defineStore } from "pinia";

export const useBaseStore = defineStore('base', {
  state: () => {
    return {
      count: 0,
      testObj: { objCount: 1 }
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
  storage: true
})
