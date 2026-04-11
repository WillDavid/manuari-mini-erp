<template>
  <div class="identify-overlay">
    <div class="identify-card">
      <img :src="logo" alt="Manuari" class="logo" />

      <h1>Bem-vindo</h1>
      <p>Digite a senha para continuar</p>

      <form @submit.prevent="identifyUser">
        <input
          v-model="password"
          type="password"
          placeholder="Senha"
          class="input"
          required
        />

        <button type="submit" class="btn-primary">
          Entrar
        </button>
      </form>

      <p v-if="erro" class="erro">{{ erro }}</p>
    </div>
  </div>
</template>

<script>
import logo from '../assets/manuari-logotipo-300dpi.png'

const SENHA_CORRETA = 'tuti@123'
const DIAS_LOGADO = 30

export default {
  data() {
    return {
      password: '',
      logo,
      erro: ''
    }
  },

  mounted() {
    const expiration = localStorage.getItem('authExpires')
    if (expiration && Date.now() < parseInt(expiration)) {
      this.$router.push('/vendas')
    } else {
      localStorage.removeItem('authExpires')
    }
  },

  methods: {
    identifyUser() {
      if (this.password !== SENHA_CORRETA) {
        this.erro = 'Senha incorreta'
        this.password = ''
        return
      }

      const expiresAt = Date.now() + (DIAS_LOGADO * 24 * 60 * 60 * 1000)
      localStorage.setItem('authExpires', expiresAt.toString())
      this.$router.push('/vendas')
    }
  }
}
</script>

<style scoped>
.identify-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: var(--bg);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.identify-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 40px;
  max-width: 400px;
  width: 100%;
  text-align: center;
  box-shadow: var(--shadow-md);
}

.logo {
  height: 48px;
  object-fit: contain;
  margin-bottom: 24px;
}

h1 {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
}

p {
  color: var(--text-muted);
  font-size: 14px;
  margin-bottom: 24px;
}

form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.input {
  text-align: center;
  font-size: 16px;
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary), var(--primary-hover));
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  box-shadow: 0 10px 24px rgba(249, 115, 22, 0.22);
  transition: transform 0.2s;
}

.btn-primary:hover {
  transform: translateY(-1px);
}

.erro {
  color: var(--danger);
  font-size: 13px;
  margin-top: 10px;
}

@media (max-width: 480px) {
  .identify-card {
    padding: 28px 20px;
  }

  h1 {
    font-size: 24px;
  }
}
</style>