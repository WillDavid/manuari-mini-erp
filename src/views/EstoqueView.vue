<template>
  <div class="page">

    <!-- HEADER -->
    <div class="header">
      <h3>Estoque</h3>
    </div>

    <div class="filtros">
      <input
        v-model="busca"
        placeholder="Buscar por nome, codigo, estoque ou status..."
        class="input busca"
      />
    </div>

    <div v-if="carregando" class="loading-msg">Carregando...</div>

    <!-- TABELA -->
    <div class="table-card">
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Código</th>
            <th>Estoque</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="p in produtosPaginados" :key="p.id">

            <td data-label="Nome">{{ p.nome }}</td>

            <td data-label="Código">{{ p.codigo }}</td>

            <td data-label="Estoque">
              <div class="estoque-cell">
                <div class="estoque-bar">
                  <div
                    class="estoque-bar-fill"
                    :style="{ width: Math.min((p.estoque / 20) * 100, 100) + '%' }"
                    :class="{ ok: p.estoque > 3, baixo: p.estoque > 0 && p.estoque <= 3, zerado: p.estoque === 0 }"
                  ></div>
                </div>
                <span class="estoque-valor">{{ p.estoque }}</span>
              </div>
            </td>

            <td data-label="Status">
              <span :class="statusClasse(p.estoque)">
                {{ statusTexto(p.estoque) }}
              </span>
            </td>

            <td class="actions-cell">
              <div class="actions-wrap">
                <button class="entrada" @click="abrirMovimentacao(p, 'entrada')">
                  Entrada
                </button>
                <button class="saida" @click="abrirMovimentacao(p, 'saida')">
                  Saída
                </button>
              </div>
            </td>

          </tr>
          <tr v-if="!carregando && !produtosFiltrados.length">
            <td colspan="5" class="empty-msg">Nenhum produto ativo no estoque</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="produtosFiltrados.length" class="pagination">
      <div class="pagination-meta">
        <label class="pagination-select">
          <span>Mostrar</span>
          <select v-model.number="itensPorPagina">
            <option :value="20">20</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
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
    <ModalMovimentacao
      v-if="modalAberto"
      :produto="produtoSelecionado"
      :tipo="tipoMovimentacao"
      @fechar="fecharModal"
      @salvar="salvarMovimentacao"
    />

  </div>
</template>

<script>
import { supabase } from '../services/supabase'
import ModalMovimentacao from '../components/ModalMovimentacao.vue'

export default {
  components: { ModalMovimentacao },

  data() {
    return {
      produtos: [],
      busca: '',
      paginaAtual: 1,
      itensPorPagina: 20,
      modalAberto: false,
      produtoSelecionado: null,
      tipoMovimentacao: 'entrada',
      carregando: false
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
        const conteudo = [
          produto.nome,
          produto.codigo,
          produto.estoque,
          this.statusTexto(produto.estoque),
        ]
          .filter((valor) => valor !== null && valor !== undefined)
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
  },

  mounted() {
    this.buscarProdutos()
  },

  methods: {

    async buscarProdutos() {
      this.carregando = true
      try {
        const { data } = await supabase
          .from('produtos_erp')
          .select('*')
          .eq('ativo', true)
          .order('nome')

        this.produtos = data || []
        this.ajustarPagina()
        this.notificarEstoqueAtualizado()
      } catch (error) {
        console.error(error)
        alert('Erro ao carregar produtos')
      } finally {
        this.carregando = false
      }
    },

    abrirMovimentacao(produto, tipo) {
      this.produtoSelecionado = produto
      this.tipoMovimentacao = tipo
      this.modalAberto = true
    },

    fecharModal() {
      this.modalAberto = false
      this.produtoSelecionado = null
    },

    async salvarMovimentacao({ quantidade, observacao }) {
      if (this.tipoMovimentacao === 'saida' && !confirm('Confirmar saída de estoque?')) return
      try {
        const produto = this.produtoSelecionado

        let novoEstoque =
          this.tipoMovimentacao === 'entrada'
            ? produto.estoque + quantidade
            : produto.estoque - quantidade

        if (novoEstoque < 0) {
          alert('Estoque não pode ficar negativo')
          return
        }

        // atualizar estoque
        await supabase
          .from('produtos_erp')
          .update({ estoque: novoEstoque })
          .eq('id', produto.id)

        // registrar movimentação
        await supabase
          .from('estoque_movimentacoes')
          .insert([{
            produto_id: produto.id,
            tipo: this.tipoMovimentacao,
            quantidade,
            observacao
          }])

        this.fecharModal()
        this.buscarProdutos()
      } catch (error) {
        console.error(error)
        alert('Erro ao salvar movimentação')
      }
    },

    statusTexto(qtd) {
      if (qtd === 0) return 'Zerado'
      if (qtd <= 3) return 'Baixo'
      return 'OK'
    },

    statusClasse(qtd) {
      if (qtd === 0) return 'zerado'
      if (qtd <= 3) return 'baixo'
      return 'ok'
    },

    notificarEstoqueAtualizado() {
      window.dispatchEvent(new Event('estoque-atualizado'))
    },

    irParaPagina(pagina) {
      this.paginaAtual = pagina
    },

    ajustarPagina() {
      if (this.paginaAtual > this.totalPaginas) {
        this.paginaAtual = this.totalPaginas
      }
    }
  }
}
</script>

<style scoped>
.page {
  padding: 20px 20px 32px;
  max-width: 1520px;
  margin: 0 auto;
}

.header {
  margin-bottom: 14px;
}

.header h3 {
  font-size: 20px;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.filtros {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  margin-bottom: 14px;
}

.busca {
  width: 100%;
}

.table-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  overflow-x: auto;
  margin-bottom: 18px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead th {
  background: var(--surface-muted);
  padding: 8px 14px;
  text-align: left;
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  position: sticky;
  top: 0;
  z-index: 1;
}

tbody tr {
  height: auto;
}

tbody tr td {
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
}

tbody tr:nth-child(even) {
  background: rgba(241, 245, 249, 0.6);
}

tbody tr:hover {
  background: rgba(232, 110, 26, 0.04);
}

tbody tr:last-child td {
  border-bottom: none;
}

button {
  border: 1px solid transparent;
  padding: 9px 14px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
}

.entrada,
.saida {
  height: 30px;
  padding: 0 10px;
  font-size: 12px;
  border-radius: var(--radius-sm);
  font-weight: 600;
  border: 1px solid var(--border);
  background: var(--surface);
}

.entrada {
  color: var(--success);
}

.saida {
  color: var(--danger);
}

.entrada:hover {
  background: var(--success-soft);
}

.saida:hover {
  background: var(--danger-soft);
}

.ok,
.baixo,
.zerado {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.ok {
  color: var(--success);
  background: var(--success-soft);
}

.baixo {
  color: var(--warning);
  background: var(--warning-soft);
}

.zerado {
  color: var(--danger);
  background: var(--danger-soft);
}

.estoque-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.estoque-bar {
  width: 60px;
  height: 4px;
  background: var(--surface-muted);
  border-radius: 2px;
  flex-shrink: 0;
  overflow: hidden;
}

.estoque-bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease;
}

.estoque-bar-fill.ok {
  background: var(--success);
}

.estoque-bar-fill.baixo {
  background: var(--warning);
}

.estoque-bar-fill.zerado {
  background: var(--danger);
}

.estoque-valor {
  font-weight: 600;
  font-feature-settings: 'tnum' 1;
}

.actions-cell {
  width: 1%;
  white-space: nowrap;
  text-align: center;
  vertical-align: middle;
}

.actions-wrap {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  justify-content: center;
  line-height: 1;
}

.actions-wrap button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
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
  font-size: 12px;
  font-weight: 600;
}

.pagination-select select {
  width: auto;
  min-width: 86px;
}

.pagination-info {
  color: var(--text-muted);
  font-size: 12px;
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
  font-size: 12px;
}

.pagination-actions button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .page { padding: 16px 12px 24px; }
  .filtros { gap: 10px; }
  .header h3 { font-size: 20px; }
  table, thead, tbody, th, td, tr { display: block; }
  thead { display: none; }
  tr {
    background: var(--surface);
    margin-bottom: 12px;
    border-radius: var(--radius-md);
    padding: 14px;
    border: 1px solid var(--border);
  }
  td {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding: 8px 4px;
    border: none;
    border-bottom: 1px solid var(--border);
    font-size: 14px;
    min-height: 36px;
  }
  td:last-child {
    border-bottom: none;
  }
  td::before {
    content: attr(data-label);
    font-weight: 600;
    color: var(--text-muted);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    flex-shrink: 0;
  }
  .actions-cell {
    padding-top: 10px;
    border-top: 1px solid var(--border);
    margin-top: 4px;
    text-align: left;
  }
  .actions-wrap {
    width: 100%;
    display: flex;
    gap: 8px;
    justify-content: stretch;
  }
  .actions-wrap button {
    flex: 1;
    height: 40px;
    font-size: 13px;
  }
  .pagination { flex-direction: column; align-items: stretch; gap: 10px; }
  .pagination-meta { flex-direction: column; align-items: stretch; gap: 10px; }
  .pagination-select { justify-content: space-between; }
  .pagination-select select { width: 100%; height: 40px; font-size: 14px; }
  .pagination-actions { width: 100%; display: flex; gap: 8px; }
  .pagination-actions button { flex: 1; height: 40px; font-size: 13px; }
}

@media (min-width: 769px) and (max-width: 1023px) {
  .page { padding: 20px 16px 28px; }
  .header h3 { font-size: 20px; }
  table { font-size: 12px; }
  th, td { padding: 6px 10px; }
  .actions-wrap { gap: 4px; }
  .actions-wrap button { height: 28px; font-size: 11px; padding: 0 8px; }
}
</style>
