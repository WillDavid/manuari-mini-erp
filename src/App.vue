<template>
  <Navbar />
  <router-view />
  <FloatingMeta />
  <CommandPalette v-if="$route.path !== '/identificar'" />
</template>

<script>
import Navbar from './components/Navbar.vue'
import FloatingMeta from './components/FloatingMeta.vue'
import CommandPalette from './components/CommandPalette.vue'

export default {
  components: {
    Navbar,
    FloatingMeta,
    CommandPalette,
  },
}
</script>