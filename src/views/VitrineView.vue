<template>
  <div class="page">

    <!-- HEADER -->
    <div class="header">
      <h3>Vitrine</h3>
      <button class="primary" @click="abrirNovo">
        Novo Produto
      </button>
    </div>

    <!-- TABELA -->
    <div class="table-card">
      <table>
        <thead>
          <tr>
            <th>Produto</th>
            <th>Categorias</th>
            <th>Destaque</th>
            <th>Lançamento</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="p in produtos" :key="p.id">

            <!-- PRODUTO COM IMAGEM -->
            <td data-label="Produto">
              <div class="produto-cell">

                <!-- IMAGEM -->
                <div class="preview">
                  <img
                    v-if="p.images && p.images.length"
                    :src="p.images[0]"
                  />
                  <div v-else class="no-image">
                    Sem imagem
                  </div>

                  <span
                    v-if="p.images && p.images.length > 1"
                    class="badge"
                  >
                    +{{ p.images.length - 1 }}
                  </span>
                </div>

                <!-- TEXTO -->
                <div class="info">
                  <span class="nome">{{ p.name }}</span>
                  <span class="tipo">{{ p.tipo }}</span>
                </div>

              </div>
            </td>

            <!-- CATEGORIAS -->
            <td data-label="Categorias">
              <span v-for="c in p.categorias" :key="c" class="chip">
                {{ c }}
              </span>
            </td>

            <!-- FLAGS -->
            <td data-label="Destaque">
              <span :class="p.destaque ? 'ativo' : 'inativo'">
                {{ p.destaque ? 'Sim' : 'Não' }}
              </span>
            </td>

            <td data-label="Lançamento">
              <span :class="p.lancamento ? 'ativo' : 'inativo'">
                {{ p.lancamento ? 'Sim' : 'Não' }}
              </span>
            </td>

            <!-- AÇÕES -->
            <td class="actions">
              <button class="edit" @click="editar(p)">Editar</button>
              <button class="delete" @click="deletar(p.id)">Excluir</button>
            </td>

          </tr>
        </tbody>
      </table>
    </div>

    <!-- MODAL -->
    <ModalProdutoVitrine
      v-if="modal"
      :produto="produto"
      :editando="editando"
      @fechar="fechar"
      @salvar="salvar"
    />

  </div>
</template>

<script>
import { supabase } from '../services/supabase'
import ModalProdutoVitrine from '../components/ModalProdutoVitrine.vue'

export default {
  components: { ModalProdutoVitrine },

  data() {
    return {
      produtos: [],
      modal: false,
      editando: false,
      produtoId: null,

      produto: {
        name: '',
        tipo: '',
        categorias: [],
        destaque: false,
        lancamento: false,
        images: []
      }
    }
  },

  mounted() {
    this.buscar()
  },

  methods: {
    async buscar() {
      const { data } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      this.produtos = data || []
    },

    abrirNovo() {
      this.reset()
      this.modal = true
    },

    editar(p) {
      this.produto = { ...p }
      this.produtoId = p.id
      this.editando = true
      this.modal = true
    },

    fechar() {
      this.modal = false
      this.reset()
    },

    async salvar(produto) {
      if (this.editando) {
        await supabase
          .from('products')
          .update(produto)
          .eq('id', this.produtoId)
      } else {
        await supabase
          .from('products')
          .insert([produto])
      }

      this.fechar()
      this.buscar()
    },

    async deletar(id) {
      if (!confirm('Excluir produto?')) return

      await supabase
        .from('products')
        .delete()
        .eq('id', id)

      this.buscar()
    },

    reset() {
      this.editando = false
      this.produtoId = null

      this.produto = {
        name: '',
        tipo: '',
        categorias: [],
        destaque: false,
        lancamento: false,
        images: []
      }
    }
  }
}
</script>

<style scoped>
.page {
  padding: 24px;
}

/* HEADER */
.header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}

/* CARD */
.table-card {
  background: white;
  border-radius: 12px;
  overflow-x: auto;
}

/* TABELA */
table {
  width: 100%;
  border-collapse: collapse;
}

th {
  background: #f5f5f5;
  padding: 12px;
  text-align: left;
  font-size: 13px;
}

td {
  padding: 12px;
  border-bottom: 1px solid #eee;
}

/* PRODUTO */
.produto-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.preview {
  position: relative;
  width: 52px;
  height: 52px;
  border-radius: 10px;
  overflow: hidden;
  background: #f5f5f5;
  border: 1px solid #eee;
}

.preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-image {
  font-size: 10px;
  color: #999;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.badge {
  position: absolute;
  bottom: 4px;
  right: 4px;
  background: rgba(0,0,0,0.7);
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 6px;
}

.info {
  display: flex;
  flex-direction: column;
}

.nome {
  font-weight: 600;
}

.tipo {
  font-size: 12px;
  color: #777;
}

/* CHIPS */
.chip {
  background: #eee;
  padding: 4px 8px;
  border-radius: 6px;
  margin-right: 4px;
}

/* STATUS */
.ativo {
  color: green;
  font-weight: 500;
}

.inativo {
  color: red;
}

/* BOTÕES */
button {
  border: none;
  padding: 6px 10px;
  border-radius: 8px;
  cursor: pointer;
}

.primary {
  background: #ff6a00;
  color: white;
}

.edit {
  background: #1976d2;
  color: white;
}

.delete {
  background: #d32f2f;
  color: white;
}

.actions {
  display: flex;
  gap: 6px;
}

/* HOVER */
tr:hover {
  background: #fafafa;
}

/* MOBILE */
@media (max-width: 768px) {
  table, thead, tbody, th, td, tr {
    display: block;
  }

  thead {
    display: none;
  }

  tr {
    margin-bottom: 12px;
    background: white;
    border-radius: 10px;
    padding: 10px;
  }

  td {
    display: flex;
    justify-content: space-between;
  }

  td::before {
    content: attr(data-label);
    font-weight: bold;
  }
}
</style>