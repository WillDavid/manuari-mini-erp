<template>
  <div class="page">

    <!-- HEADER -->
    <div class="header">
      <h3>Vitrine</h3>
      <button class="primary" @click="abrirNovo">
        Novo Produto
      </button>
    </div>

    <div class="filtros">
      <input
        v-model="busca"
        placeholder="Buscar por nome, tipo, categoria, destaque ou lancamento..."
        class="input busca"
      />
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
          <tr v-for="p in produtosPaginados" :key="p.id">

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
            <td data-label="Ações">
              <div class="actions">
                <button class="edit" @click="editar(p)">Editar</button>
                <button class="delete" @click="deletar(p.id)">Excluir</button>
              </div>
            </td>

          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="produtosFiltrados.length" class="pagination">
      <div class="pagination-meta">
        <label class="pagination-select">
          <span>Mostrar</span>
          <select v-model.number="itensPorPagina">
            <option :value="100">100</option>
            <option :value="200">200</option>
            <option :value="500">500</option>
            <option :value="1000">1000</option>
          </select>
        </label>

        <span class="pagination-info">
          {{ produtosFiltrados.length }} resultado(s) • Pagina {{ paginaAtual }} de {{ totalPaginas }}
        </span>
      </div>

      <div class="pagination-actions">
        <button :disabled="paginaAtual === 1" @click="irParaPagina(paginaAtual - 1)">
          Anterior
        </button>
        <button :disabled="paginaAtual === totalPaginas" @click="irParaPagina(paginaAtual + 1)">
          Proxima
        </button>
      </div>
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
      busca: '',
      paginaAtual: 1,
      itensPorPagina: 100,
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
      this.ajustarPagina()
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
    },

    irParaPagina(pagina) {
      this.paginaAtual = pagina
    },

    ajustarPagina() {
      if (this.paginaAtual > this.totalPaginas) {
        this.paginaAtual = this.totalPaginas
      }
    }
  },

  computed: {
    totalPaginas() {
      return Math.max(1, Math.ceil(this.produtosFiltrados.length / this.itensPorPagina))
    },

    produtosFiltrados() {
      const termo = this.busca.trim().toLowerCase()

      if (!termo) return this.produtos

      return this.produtos.filter((produto) => {
        const categorias = Array.isArray(produto.categorias) ? produto.categorias.join(' ') : ''
        const destaque = produto.destaque ? 'sim destaque' : 'nao sem destaque'
        const lancamento = produto.lancamento ? 'sim lancamento' : 'nao sem lancamento'
        const conteudo = [
          produto.name,
          produto.tipo,
          categorias,
          destaque,
          lancamento,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        return conteudo.includes(termo)
      })
    },

    produtosPaginados() {
      const inicio = (this.paginaAtual - 1) * this.itensPorPagina
      return this.produtosFiltrados.slice(inicio, inicio + this.itensPorPagina)
    }
  },

  watch: {
    produtos() {
      this.ajustarPagina()
    },

    busca() {
      this.paginaAtual = 1
    },

    itensPorPagina() {
      this.paginaAtual = 1
    }
  }
}
</script>

<style scoped>
.page {
  padding: 32px 20px 40px;
  max-width: 1520px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.header h3 {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.filtros {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  margin-bottom: 20px;
}

.busca {
  width: 100%;
}

.table-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow-x: auto;
  box-shadow: var(--shadow-sm);
  margin-bottom: 18px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  background: var(--surface-soft);
  padding: 14px 16px;
  text-align: left;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

td {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
}

.produto-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.preview {
  position: relative;
  width: 52px;
  height: 52px;
  border-radius: 14px;
  overflow: hidden;
  background: var(--surface-muted);
  border: 1px solid var(--border);
}

.preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-image {
  font-size: 10px;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.badge {
  position: absolute;
  bottom: 4px;
  right: 4px;
  background: rgba(15, 23, 42, 0.78);
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
  color: var(--text-muted);
}

.chip {
  display: inline-flex;
  align-items: center;
  background: var(--surface-muted);
  padding: 5px 10px;
  border-radius: 999px;
  margin-right: 4px;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 600;
}

.ativo {
  display: inline-flex;
  align-items: center;
  padding: 5px 10px;
  border-radius: 999px;
  color: var(--success);
  background: var(--success-soft);
  font-weight: 700;
  font-size: 12px;
}

.inativo {
  display: inline-flex;
  align-items: center;
  padding: 5px 10px;
  border-radius: 999px;
  color: var(--danger);
  background: var(--danger-soft);
  font-size: 12px;
  font-weight: 700;
}

button {
  border: 1px solid transparent;
  padding: 9px 14px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
}

.primary {
  background: linear-gradient(135deg, var(--primary), var(--primary-hover));
  color: white;
  box-shadow: 0 10px 24px rgba(249, 115, 22, 0.22);
}

.edit {
  background: #eff6ff;
  color: var(--info);
  border-color: #bfdbfe;
}

.delete {
  background: var(--danger-soft);
  color: var(--danger);
  border-color: #fecaca;
}

.edit:hover {
  background: #dbeafe;
}

.delete:hover {
  background: #fee2e2;
}

.primary:hover {
  transform: translateY(-1px);
}

.actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.pagination-meta {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.pagination-select {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 600;
}

.pagination-select select {
  width: auto;
  min-width: 86px;
}

.pagination-info {
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 600;
}

.pagination-actions {
  display: flex;
  gap: 8px;
}

.pagination-actions button {
  background: var(--surface);
  border-color: var(--border);
  color: var(--text);
}

.pagination-actions button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

tr:hover {
  background: rgba(248, 250, 252, 0.9);
}

@media (max-width: 768px) {
  .page {
    padding: 24px 12px 32px;
  }

  .header {
    flex-direction: column;
    align-items: stretch;
  }

  .header h3 {
    font-size: 24px;
  }

  .primary {
    width: 100%;
  }

  table,
  thead,
  tbody,
  th,
  td,
  tr {
    display: block;
  }

  thead {
    display: none;
  }

  tr {
    margin-bottom: 12px;
    background: var(--surface);
    border-radius: 18px;
    padding: 12px;
    border: 1px solid var(--border);
  }

  td {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    padding: 10px 4px;
    border: none;
  }

  td::before {
    content: attr(data-label);
    font-weight: 700;
    color: var(--text-muted);
  }

  .actions {
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .pagination {
    flex-direction: column;
    align-items: stretch;
  }

  .pagination-meta {
    flex-direction: column;
    align-items: stretch;
  }

  .pagination-select {
    justify-content: space-between;
  }

  .pagination-select select {
    width: 100%;
  }

  .pagination-actions {
    width: 100%;
  }

  .pagination-actions button {
    flex: 1;
  }
}
</style>
