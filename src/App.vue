<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
})
</script>

<style>
:root {
  /* TEMA CLARO */
  --bg-primary: #f8f7f4;
  --bg-secondary: #ffffff;
  --bg-tertiary: #f0ede9;
  --text-primary: #1a1a1a;
  --text-secondary: #4a4a4a;
  --text-tertiary: #8a8a8a;
  --border-color: #e8e6e3;
  --accent-color: #3b82f6;
  --accent-hover: #2563eb;
  --card-bg: #ffffff;
  --card-border: #d4d4d4;
  --sidebar-bg: #ffffff;
  --sidebar-text: #1a1a1a;
  --sidebar-active: #3b82f6;
  --topbar-bg: #ffffff;
  --topbar-text: #1a1a1a;
  --input-bg: #ffffff;
  --hover-bg: #f0ede9;
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.03);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.08);
  --hover-sidebar-item: #d1d1d1;
  --hover-topbar-item: #d1d1d1;
}

html.dark {
  /* TEMA ESCURO */
  --bg-primary: #0f0f0f;
  --bg-secondary: #1a1a1a;
  --bg-tertiary: #2d2d2d;
  --text-primary: #e5e7eb;
  --text-secondary: #9ca3af;
  --text-tertiary: #6b7280;
  --border-color: #2d2d2d;
  --accent-color: #667eea;
  --accent-hover: #5568d3;
  --card-bg: #1a1a1a;
  --card-border: #2d2d2d;
  --sidebar-bg: #1a1a1a;
  --sidebar-text: #ffffff;
  --sidebar-active: #667eea;
  --topbar-bg: #1a1a1a;
  --topbar-text: #e5e7eb;
  --input-bg: #2d2d2d;
  --hover-bg: #2d2d2d;
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
  --hover-sidebar-item: #2d2d2d;
  --hover-topbar-item: #2d2d2d;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: background 0.3s ease, color 0.3s ease;
  line-height: 1.6;
}

#app {
  min-height: 100vh;
}

/* Scrollbar global */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--bg-secondary);
}

::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--text-tertiary);
}
</style>