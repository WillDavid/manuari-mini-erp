<template>
  <div class="app-layout">
    <Sidebar />
    <main class="app-content">
      <router-view />
    </main>
    <FloatingMeta />
    <CommandPalette v-if="$route.path !== '/identificar'" />
  </div>
</template>

<script>
import Sidebar from './components/Sidebar.vue'
import FloatingMeta from './components/FloatingMeta.vue'
import CommandPalette from './components/CommandPalette.vue'

export default {
  components: {
    Sidebar,
    FloatingMeta,
    CommandPalette,
  },
}
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
}

.app-content {
  flex: 1;
  min-width: 0;
  margin-left: var(--sidebar-width, 240px);
  transition: margin-left 0.25s ease;
  display: flex;
  flex-direction: column;
}

@media (max-width: 768px) {
  .app-content {
    margin-left: 0;
    margin-top: 48px;
  }

  .app-content :deep(.pdv-header) {
    top: 48px;
  }
}
</style>