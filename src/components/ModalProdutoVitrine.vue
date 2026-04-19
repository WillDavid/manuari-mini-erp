<template>
  <div class="overlay">
    <div class="modal">

      <!-- HEADER -->
      <div class="modal-header">
        <h3>{{ editando ? 'Editar Produto' : 'Novo Produto' }}</h3>
        <button class="close" @click="$emit('fechar')">✕</button>
      </div>

      <!-- BODY -->
      <div class="modal-body">

        <!-- COLUNA ESQUERDA: Formulário -->
        <div class="coluna-esquerda">
          <!-- NOME -->
          <div class="form-group">
            <label>Nome</label>
            <input v-model="local.name" placeholder="Ex: Caneca Naruto" />
          </div>

          <!-- TIPO -->
          <div class="form-group">
            <label>Tipo</label>
            <select v-model="local.tipo">
              <option disabled value="">Selecione</option>
              <option v-for="t in tipos" :key="t" :value="t">
                {{ t }}
              </option>
            </select>
          </div>

          <!-- CATEGORIAS -->
          <div class="form-group">
            <label>Categorias</label>

            <div class="categorias-box">
              <div
                v-for="cat in categoriasDisponiveis"
                :key="cat"
                :class="['categoria-item', isSelecionado(cat) ? 'ativo' : '']"
                @click="toggleCategoria(cat)"
              >
                {{ cat }}
              </div>
            </div>
          </div>

          <!-- TOGGLES -->
          <div class="toggles">
            

            
          </div>
        </div>

        <!-- COLUNA DIREITA: Imagens -->
        <div class="coluna-direita">
          <div class="form-group">
            <label>Imagens</label>
            <ImageManager v-model="local.images" />
          </div>
        </div>

      </div>

      <!-- FOOTER -->
      <div class="modal-footer">
        <button class="btn ghost" @click="$emit('fechar')">
          Cancelar
        </button>
        <button class="btn primary" @click="salvar">
          Salvar
        </button>
      </div>

    </div>
  </div>
</template>

<script>
import ImageManager from './ImageManager.vue'

export default {
  components: { ImageManager },

  props: ['produto', 'editando'],
  emits: ['salvar', 'fechar'],

  data() {
    return {
      local: this.getProdutoInicial(),

      tipos: [
        'canecas',
        'xicaras',
        'azulejos',
        'canecas 3d',
        'bottons'
      ],

      categoriasDisponiveis: [
        "Futebol",
        "Capivara",
        "Frases Engraçadas",
        "Anime",
        "Filmes & Séries",
        "Gatos",
        "Animais",
        "Norte",
        "Estados Brasileiros",
        "Profissões",
        "Arte",
        "Frases Motivacionais",
        "Fantasia",
        "São Paulo",
        "Doramas",
        "Aliens & Ufologia",
        "Desenhos",
        "Heróis",
        "Mapa",
        "Plantas",
        "Música"
      ]
    }
  },

  watch: {
    produto: {
      immediate: true,
      handler() {
        this.local = this.getProdutoInicial()
      }
    }
  },

  methods: {
getProdutoInicial() {
      return {
        name: this.produto?.name || '',
        tipo: this.produto?.tipo || '',
        categorias: Array.isArray(this.produto?.categorias)
          ? [...this.produto.categorias]
          : [],
        images: Array.isArray(this.produto?.images)
          ? [...this.produto.images]
          : []
      }
    },

    toggleCategoria(cat) {
      const existe = this.local.categorias.includes(cat)

      if (existe) {
        this.local.categorias = this.local.categorias.filter(c => c !== cat)
      } else {
        this.local.categorias.push(cat)
      }
    },

    isSelecionado(cat) {
      return this.local.categorias.includes(cat)
    },

    salvar() {
      this.$emit('salvar', this.local)
    }
  }
}
</script>

<style scoped>

/* OVERLAY */
.overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(15, 23, 42, 0.52);
  display: flex;
  justify-content: center;
  align-items: center;
  backdrop-filter: blur(6px);
  padding: 16px;
}

.modal {
  background: var(--surface);
  width: 90%;
  max-width: 900px;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  border: 1px solid rgba(255, 255, 255, 0.35);
  overflow: hidden;
  animation: fadeIn 0.2s ease;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 20px;
  border-bottom: 1px solid var(--border);
}

.modal-header h3 {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.close {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: var(--surface-soft);
  border: 1px solid var(--border);
  font-size: 18px;
  cursor: pointer;
  color: var(--text-muted);
}

.modal-body {
  padding: 20px;
  display: flex;
  gap: 24px;
}

.coluna-esquerda {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.coluna-direita {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

label {
  font-size: 13px;
  color: var(--text-muted);
  font-weight: 600;
}

input, select {
  background: var(--surface);
}

.categorias-box {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-height: 180px;
  overflow-y: auto;
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--surface-soft);
}

.categoria-item {
  padding: 7px 12px;
  background: var(--surface);
  border-radius: 999px;
  font-size: 12px;
  cursor: pointer;
  border: 1px solid var(--border);
  font-weight: 600;
}

.categoria-item.ativo {
  background: linear-gradient(135deg, var(--primary), var(--primary-hover));
  color: white;
  border-color: transparent;
}

.toggles {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.toggle-item {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: space-between;
  flex: 1;
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--surface-soft);
}

.switch {
  position: relative;
  width: 40px;
  height: 22px;
}

.switch input {
  display: none;
}

.slider {
  position: absolute;
  inset: 0;
  background: var(--border-strong);
  border-radius: 20px;
}

.slider::before {
  content: "";
  position: absolute;
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  top: 3px;
  left: 3px;
  transition: 0.3s;
}

input:checked + .slider {
  background: var(--primary);
}

input:checked + .slider::before {
  transform: translateX(18px);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid var(--border);
}

.btn {
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid transparent;
  cursor: pointer;
  font-weight: 600;
}

.btn.primary {
  background: linear-gradient(135deg, var(--primary), var(--primary-hover));
  color: white;
  box-shadow: 0 10px 24px rgba(249, 115, 22, 0.22);
}

.btn.ghost {
  background: var(--surface-soft);
  border-color: var(--border);
}

@media (max-width: 700px) {
  .modal {
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
  }

  .modal-body {
    flex-direction: column;
  }

  .toggles,
  .modal-footer {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
}
</style>
