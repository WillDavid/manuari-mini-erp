<template>
  <header class="navbar">

    <div class="logo">
        <img :src="logo" alt="Manuari" />
    </div>

    <nav :class="['nav', { open: menuAberto }]">

      <router-link to="/vendas" class="link" active-class="active">
        Vendas
      </router-link>

      <router-link to="/estoque" class="link" active-class="active">
        Estoque
      </router-link>

      <router-link to="/produtos" class="link" active-class="active">
        Produtos
      </router-link>

      <router-link to="/vitrine" class="link" active-class="active">
        Vitrine
      </router-link>

      
    </nav>

    <!-- botão mobile -->
    <button class="menu-btn" @click="menuAberto = !menuAberto">
      ☰
    </button>

  </header>
</template>

<script>
import logo from '../assets/manuari-logotipo-300dpi.png'
export default {
  data() {
    return {
      menuAberto: false,
      logo
    }
  }
}
</script>

<style scoped>
.navbar {
  height: 60px;
  background: white;
  border-bottom: 1px solid #eee;

  display: flex;
  align-items: center;
  justify-content: space-between;

  padding: 0 20px;
}

.logo img {
  height: 32px;
  object-fit: contain;
}

/* NAV */
.nav {
  display: flex;
  gap: 20px;
}

/* LINKS */
.link {
  text-decoration: none;
  color: #555;
  font-size: 14px;
  padding: 6px 10px;
  border-radius: 6px;
  transition: 0.2s;
}

.link:hover {
  background: #f5f5f5;
}

/* ATIVO */
.active {
  background: transparent;
  color: #ff6a00;
  font-weight: 600;
}

/* BOTÃO MOBILE */
.menu-btn {
  display: none;
  font-size: 20px;
  background: none;
  border: none;
  cursor: pointer;
}

/* RESPONSIVO */
@media (max-width: 768px) {

  .menu-btn {
    display: block;
  }

  .nav {
    position: absolute;
    top: 60px;
    right: 0;

    background: white;
    flex-direction: column;
    width: 200px;

    border-left: 1px solid #eee;
    border-bottom: 1px solid #eee;

    padding: 10px;

    display: none;
  }

  .nav.open {
    display: flex;
  }

  .link {
    padding: 10px;
  }
}
</style>