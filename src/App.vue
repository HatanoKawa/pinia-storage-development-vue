<script setup lang="ts">
import { useBaseStore } from "./store";

const base = useBaseStore()

const setLocalStorage = () => {
  window.localStorage.setItem('testCont', base.count + '')
  base.increment()
}

const setSessionStorage = () => {
  window.sessionStorage.setItem('testCont', base.count + '')
  base.increment()
}

</script>

<template>
  <div>
    pinia storage test
    {{ base.count }}
    <button @click="base.increment">plus</button>
    <button @click="base.decrement">minus</button>
    <button @click="setLocalStorage">set localStorage</button>
    <button @click="setSessionStorage">set sessionStorage</button>
    <!--<div><iframe src="http://localhost:3000" /></div>
    <div><iframe src="http://localhost:3000" /></div>-->
  </div>
</template>

<style>
</style>
