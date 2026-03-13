<template>
  <router-view />
  <PToast position="top-right" />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

onMounted(() => {
  const savedTheme = localStorage.getItem('noteesapp-theme')
  if (savedTheme === 'light') {
    document.body.classList.add('light-mode')
    document.body.classList.remove('dark-mode')
  } else {
    document.body.classList.add('dark-mode')
    document.body.classList.remove('light-mode')
  }
})
</script>