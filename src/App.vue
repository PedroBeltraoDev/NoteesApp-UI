<template>
  <router-view />
  <PToast position="top-right" />
  <DemoExpiredDialog />
</template>

<script setup lang="ts">
import DemoExpiredDialog from '@/components/common/DemoExpiredDialog.vue'
</script>

<!-- O tema é aplicado em main.ts (composables/useTheme) antes de montar o app -->