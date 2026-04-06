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

          <div class="toggle-item">
            <span>Destaque</span>
            <label class="switch">
              <input type="checkbox" v-model="local.destaque" />
              <span class="slider"></span>
            </label>
          </div>

          <div class="toggle-item">
            <span>Lançamento</span>
            <label class="switch">
              <input type="checkbox" v-model="local.lancamento" />
              <span class="slider"></span>
            </label>
          </div>

        </div>

        <!-- IMAGENS -->
        <div class="form-group">
          <label>Imagens</label>
          <ImageManager v-model="local.images" />
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
        'canecas 3d'
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
        destaque: this.produto?.destaque || false,
        lancamento: this.produto?.lancamento || false,
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
  background: rgba(0,0,0,0.55);
  display: flex;
  justify-content: center;
  align-items: center;
  backdrop-filter: blur(4px);
}

/* MODAL */
.modal {
  background: #fff;
  width: 520px;
  border-radius: 16px;
  box-shadow: 0 20px 50px rgba(0,0,0,0.25);
  overflow: hidden;
  animation: fadeIn 0.2s ease;
}

/* HEADER */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 20px;
  border-bottom: 1px solid #eee;
}

.close {
  background: transparent;
  border: none;
  font-size: 18px;
  cursor: pointer;
}

/* BODY */
.modal-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* FORM */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

label {
  font-size: 13px;
  color: #555;
}

input, select {
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #ddd;
}

/* CATEGORIAS */
.categorias-box {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-height: 180px;
  overflow-y: auto;
  padding: 6px;
  border: 1px solid #eee;
  border-radius: 8px;
}

.categoria-item {
  padding: 6px 10px;
  background: #f1f1f1;
  border-radius: 999px;
  font-size: 12px;
  cursor: pointer;
}

.categoria-item.ativo {
  background: #ff6a00;
  color: white;
}

/* TOGGLES */
.toggles {
  display: flex;
  justify-content: space-between;
}

.toggle-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* SWITCH */
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
  background: #ccc;
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
  background: #ff6a00;
}

input:checked + .slider::before {
  transform: translateX(18px);
}

/* FOOTER */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid #eee;
}

.btn {
  padding: 10px 14px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
}

.btn.primary {
  background: #ff6a00;
  color: white;
}

.btn.ghost {
  background: #eee;
}

/* ANIMAÇÃO */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
}
</style>