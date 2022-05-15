<script setup lang="ts">
import { useBaseStore } from "./store";

const base = useBaseStore()
</script>

<template>
  <div>
    pinia storage test
    {{ base.count }}
    <button @click="base.increment">plus</button>
    <button @click="base.decrement">minus</button>
  </div>
</template>

<style>
</style>
