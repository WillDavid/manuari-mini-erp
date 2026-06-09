<template>
  <Navbar />
  <router-view />
  <FloatingMeta />
</template>

<script>
import Navbar from './components/Navbar.vue'
import FloatingMeta from './components/FloatingMeta.vue'

export default {
  components: {
    Navbar,
    FloatingMeta
  }
}
</script>