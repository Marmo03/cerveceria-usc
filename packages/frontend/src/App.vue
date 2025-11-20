<template>
  <div id="app">
    <RouterView />
    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
import { RouterView } from "vue-router";
import ToastContainer from "./components/ToastContainer.vue";
</script>

<style>
#app {
  min-height: 100vh;
  background: #f8fafc;
}
</style>
