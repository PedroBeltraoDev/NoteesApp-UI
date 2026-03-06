<template>
  <div class="page">
    <Topbar />
    <div class="content">
      <h1>Todas as Notas</h1>
      <p>Em breve...</p>
    </div>
  </div>
</template>

<script setup>
import Topbar from '../components/layout/Topbar.vue'
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f7fa;
}

.content {
  padding: 32px;
}

.content h1 {
  font-size: 28px;
  margin-bottom: 16px;
}
</style>