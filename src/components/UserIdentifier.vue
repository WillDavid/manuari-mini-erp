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
          aria-label="Senha de acesso"
          required
        />

        <button type="submit" class="btn-primary" :disabled="isLoading">
          {{ isLoading ? 'Entrando...' : 'Entrar' }}
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
      isLoading: false,
      logo,
      erro: ''
    }
  },

  mounted() {
    const expiration = localStorage.getItem('authExpires')
    if (expiration && Date.now() < parseInt(expiration)) {
      this.$router.push('/pdv')
    } else {
      localStorage.removeItem('authExpires')
    }
  },

  methods: {
    async identifyUser() {
      if (this.isLoading) return

      if (this.password !== SENHA_CORRETA) {
        this.erro = 'Senha incorreta'
        this.password = ''
        return
      }

      this.isLoading = true
      this.erro = ''

      try {
        await new Promise(resolve => setTimeout(resolve, 300))

        const expiresAt = Date.now() + (DIAS_LOGADO * 24 * 60 * 60 * 1000)
        localStorage.setItem('authExpires', expiresAt.toString())
        this.$router.push('/pdv')
      } catch {
        this.erro = 'Erro ao entrar. Tente novamente.'
      } finally {
        this.isLoading = false
      }
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
  border-radius: var(--radius-md);
  padding: 32px;
  max-width: 380px;
  width: 100%;
  text-align: center;
  box-shadow: var(--shadow-md);
}

.logo {
  height: 42px;
  object-fit: contain;
  margin-bottom: 20px;
}

h1 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 6px;
  color: var(--text);
}

p {
  color: var(--text-muted);
  font-size: 13px;
  margin-bottom: 20px;
}

form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.input {
  text-align: center;
  font-size: 14px;
  height: 42px;
}

.btn-primary {
  background: var(--primary);
  color: white;
  border: 1px solid var(--primary);
  padding: 0 20px;
  height: 42px;
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-hover);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.erro {
  color: var(--danger);
  font-size: 12px;
  margin-top: 8px;
}

@media (max-width: 480px) {
  .identify-card {
    padding: 24px 20px;
  }
}
</style>