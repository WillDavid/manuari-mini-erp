<template>
  <div class="page">

    <!-- HEADER -->
    <div class="header">
      <h3>Vendas</h3>
      <div class="header-actions">
        <button class="btn-export" @click="modalExportarAberto = true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Exportar Excel
        </button>
        <button class="primary" @click="abrirNovaVenda">Nova Venda</button>
      </div>
    </div>

    <!-- FILTROS -->
<div class="filtros">
      <input v-model="busca" placeholder="Buscar cliente ou produto..." class="input busca" />
      <div class="filtro-data">
        <input type="date" v-model="dataInicio" />
        <input type="date" v-model="dataFim" />
      </div>
    </div>

    <!-- TABELA -->
    <div class="table-card">
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Cliente</th>
            <th>Produtos</th>
            <th>Total</th>
            <th>Desconto</th>
            <th>Total Final</th>
            <th>Pagamento</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="v in vendasPaginadas" :key="v.id">
            <td data-label="Data">{{ formatarData(v.data_venda) }}</td>

            <td data-label="Cliente">
              {{ v.cliente || '-' }}
            </td>

            <td data-label="Produtos">
              <div v-for="item in v.itens_venda_erp" :key="item.id">
                {{ item.quantidade }} x {{ item.produtos_erp.nome }}
              </div>
            </td>

            <td data-label="Total">
              R$ {{ formatarPreco(v.total_bruto) }}
            </td>

            <td data-label="Desconto">
              {{ formatarPreco(v.desconto) }}%
            </td>

            <td data-label="Total Final">
              R$ {{ formatarPreco(v.total_final) }}
            </td>

            <td data-label="Pagamento">
              {{ v.forma_pagamento || '-' }}
            </td>

            <td class="actions-cell">
              <div class="actions-wrap">
                <button class="edit" @click="editarVenda(v)">
                  Editar
                </button>
                <button class="delete" @click="excluirVenda(v.id)">
                  Excluir
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="vendasFiltradas.length" class="pagination">
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
          {{ vendasFiltradas.length }} resultado(s) • Pagina {{ paginaAtual }} de {{ totalPaginas }}
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
    <ModalVenda
      v-if="modalAberto"
      :produtos="produtos"
      :editando="!!vendaEditando"
      :vendaInicial="vendaEditando"
      @fechar="fecharModal"
      @salvar="salvarVenda"
    />

    <!-- MODAL EXPORTAR -->
    <div v-if="modalExportarAberto" class="modal-overlay" @click.self="modalExportarAberto = false">
      <div class="modal" role="dialog" aria-modal="true">
        <div class="modal-header">
          <h2 class="modal-title">Exportar Vendas</h2>
          <button class="close-btn" @click="modalExportarAberto = false" aria-label="Fechar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <p class="export-desc">Selecione o período para exportar as vendas em formato Excel.</p>
          <div class="export-fields">
            <div class="field">
              <label>Data Início</label>
              <input type="date" v-model="exportDataInicio" />
            </div>
            <div class="field">
              <label>Data Fim</label>
              <input type="date" v-model="exportDataFim" />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="export-btn-cancel" @click="modalExportarAberto = false">Cancelar</button>
          <button class="export-btn-confirm" @click="exportarExcel" :disabled="exportando || !exportDataInicio || !exportDataFim">
            {{ exportando ? 'Exportando...' : 'Exportar' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import { supabase } from '../services/supabase'
import ModalVenda from '../components/ModalVenda.vue'

export default {
  components: { ModalVenda },

  data() {
    return {
      vendas: [],
      produtos: [],
      paginaAtual: 1,
      itensPorPagina: 100,
      modalAberto: false,
      vendaEditando: null,
      isLoading: false,
      modalExportarAberto: false,
      exportando: false,

      busca: '',
      dataInicio: '',
      dataFim: '',
      exportDataInicio: '',
      exportDataFim: ''
    }
  },

  mounted() {
    this.buscarVendas()
    this.buscarProdutos()
  },

  methods: {

    async exportarExcel() {
      if (this.exportando) return
      if (!this.exportDataInicio || !this.exportDataFim) {
        alert('Selecione o período para exportar')
        return
      }

      this.exportando = true

      try {
        const { data: vendas, error } = await supabase
          .from('vendas_erp')
          .select(`
            id, data_venda, cliente, total_bruto, desconto, total_final, forma_pagamento,
            itens_venda_erp (
              id, produto_id, quantidade, preco_unitario, preco_custo, subtotal,
              produtos_erp (nome, preco_custo)
            )
          `)
          .gte('data_venda', this.exportDataInicio + 'T00:00:00')
          .lte('data_venda', this.exportDataFim + 'T23:59:59')
          .order('data_venda', { ascending: true })

        if (error) throw error

        if (!vendas || vendas.length === 0) {
          alert('Nenhuma venda encontrada no período')
          return
        }

        const { gerarExcel, transformarVendasEmLinhas } = await import('../utils/exportacao')
        const linhas = transformarVendasEmLinhas(vendas)

        const dataInicioFormatada = this.exportDataInicio.split('-').reverse().join('/')
        const dataFimFormatada = this.exportDataFim.split('-').reverse().join('/')
        const nomeArquivo = `relatorio_vendas_${dataInicioFormatada}_ate_${dataFimFormatada}.xlsx`

        gerarExcel(linhas, nomeArquivo)
        this.modalExportarAberto = false
        this.exportDataInicio = ''
        this.exportDataFim = ''
      } catch (error) {
        console.error(error)
        alert('Erro ao exportar relatório')
      } finally {
        this.exportando = false
      }
    },

    async buscarVendas() {
      const { data } = await supabase
        .from('vendas_erp')
        .select(`
          *,
          itens_venda_erp (
            id,
            produto_id,
            quantidade,
            preco_unitario,
            preco_custo,
            subtotal,
            produtos_erp (nome, preco_custo)
          )
        `)
        .order('data_venda', { ascending: false })

      this.vendas = data || []
    },

    async buscarProdutos() {
      const { data } = await supabase
        .from('produtos_erp')
        .select('*')

      this.produtos = data || []
      window.dispatchEvent(new Event('estoque-atualizado'))
    },

    abrirNovaVenda() {
      this.vendaEditando = null
      this.modalAberto = true
    },

    editarVenda(v) {
      this.vendaEditando = {
        ...v,
        data_venda: v.data_venda?.split('T')[0],
        itens: v.itens_venda_erp.map(i => ({
          produto_id: i.produto_id,
          nome: i.produtos_erp.nome,
          preco: i.preco_unitario,
          quantidade: i.quantidade,
          subtotal: i.subtotal,
          preco_custo: i.preco_custo || i.produtos_erp?.preco_custo || 0
        }))
      }

      this.modalAberto = true
    },

    fecharModal() {
      this.modalAberto = false
      this.vendaEditando = null
      this.isLoading = false
    },

    async salvarVenda(venda) {
  if (this.isLoading) return
  this.isLoading = true

  try {

    // VALIDAÇÃO DE ESTOQUE
    const errosEstoque = []
    const custosMap = {}
    
    for (const item of venda.itens) {
      const { data: produto } = await supabase
        .from('produtos_erp')
        .select('estoque, nome, preco_custo')
        .eq('id', item.produto_id)
        .single()

      custosMap[item.produto_id] = produto.preco_custo || 0

      let estoqueDisponivel = produto.estoque || 0

      if (this.vendaEditando) {
        const itemAntigo = this.vendaEditando.itens.find(
          i => i.produto_id === item.produto_id
        )
        if (itemAntigo) {
          estoqueDisponivel += itemAntigo.quantidade
        }
      }

      if (estoqueDisponivel < item.quantidade) {
        errosEstoque.push(`${produto.nome} (disponível: ${estoqueDisponivel})`)
      }
    }

    if (errosEstoque.length > 0) {
      alert(`Estoque insuficiente:\n${errosEstoque.join('\n')}\n\nAjuste as quantidades e tente novamente.`)
      return
    }

    const payload = {
      cliente: venda.cliente || null,
      data_venda: venda.data_venda
        ? venda.data_venda + 'T00:00:00'
        : null,
      total_bruto: venda.total_bruto,
      desconto: venda.desconto,
      total_final: venda.total_final,
      forma_pagamento: venda.forma_pagamento
    }

    let vendaSalva

    // =========================
    // 🔥 EDIÇÃO (CORRETO)
    // =========================
    if (this.vendaEditando) {

      // 1. ESTORNAR ESTOQUE ANTIGO
      const { data: itensAntigos } = await supabase
        .from('itens_venda_erp')
        .select('produto_id, quantidade')
        .eq('venda_id', this.vendaEditando.id)

      for (const item of itensAntigos) {

        const { data: produto } = await supabase
          .from('produtos_erp')
          .select('estoque')
          .eq('id', item.produto_id)
          .single()

        await supabase
          .from('produtos_erp')
          .update({
            estoque: (produto.estoque || 0) + item.quantidade
          })
          .eq('id', item.produto_id)

        await supabase
          .from('estoque_movimentacoes')
          .insert([{
            produto_id: item.produto_id,
            tipo: 'entrada',
            quantidade: item.quantidade,
            observacao: `Edição venda ${this.vendaEditando.id}`
          }])
      }

      // 2. ATUALIZA VENDA
      const { data } = await supabase
        .from('vendas_erp')
        .update(payload)
        .eq('id', this.vendaEditando.id)
        .select()
        .single()

      vendaSalva = data

      // 3. DELETA ITENS ANTIGOS
      await supabase
        .from('itens_venda_erp')
        .delete()
        .eq('venda_id', vendaSalva.id)

    } else {

      // =========================
      // 🆕 NOVA VENDA
      // =========================
      const { data } = await supabase
        .from('vendas_erp')
        .insert([payload])
        .select()
        .single()

      vendaSalva = data
    }

    // =========================
    // 📦 INSERIR NOVOS ITENS
    // =========================
    const itens = venda.itens.map(item => ({
      venda_id: vendaSalva.id,
      produto_id: item.produto_id,
      quantidade: item.quantidade,
      preco_unitario: item.preco,
      subtotal: item.subtotal,
      preco_custo: custosMap[item.produto_id] || 0
    }))

    await supabase.from('itens_venda_erp').insert(itens)

    // =========================
    // 📉 BAIXAR ESTOQUE
    // =========================
    for (const item of venda.itens) {

      const { data: produto } = await supabase
        .from('produtos_erp')
        .select('estoque')
        .eq('id', item.produto_id)
        .single()

      const novoEstoque = (produto.estoque || 0) - item.quantidade

      await supabase
        .from('estoque_movimentacoes')
        .insert([{
          produto_id: item.produto_id,
          tipo: 'saida',
          quantidade: item.quantidade,
          observacao: this.vendaEditando
            ? `Edição venda ${vendaSalva.id}`
            : `Venda ${vendaSalva.id}`
        }])

      await supabase
        .from('produtos_erp')
        .update({ estoque: novoEstoque })
        .eq('id', item.produto_id)
    }

    this.fecharModal()
    this.buscarVendas()

  } catch (error) {
    console.error(error)
    alert('Erro ao salvar venda')
  } finally {
    this.isLoading = false
  }
},

    async excluirVenda(id) {
  if (!confirm('Excluir venda?')) return

  try {

    // 1. Buscar itens da venda
    const { data: itens, error: erroItens } = await supabase
      .from('itens_venda_erp')
      .select('produto_id, quantidade')
      .eq('venda_id', id)

    if (erroItens) throw erroItens

    // 2. Para cada item → devolver estoque + registrar entrada
    for (const item of itens) {

      const { data: produto, error: erroProduto } = await supabase
        .from('produtos_erp')
        .select('estoque')
        .eq('id', item.produto_id)
        .single()

      if (erroProduto) throw erroProduto

      const novoEstoque = (produto.estoque || 0) + item.quantidade

      // atualizar estoque
      const { error: erroUpdate } = await supabase
        .from('produtos_erp')
        .update({ estoque: novoEstoque })
        .eq('id', item.produto_id)

      if (erroUpdate) throw erroUpdate

      // registrar movimentação (entrada)
      const { error: erroMov } = await supabase
        .from('estoque_movimentacoes')
        .insert([{
          produto_id: item.produto_id,
          tipo: 'entrada',
          quantidade: item.quantidade,
          observacao: `Exclusão venda ${id}`
        }])

      if (erroMov) throw erroMov
    }

    // 3. Deletar itens
    await supabase
      .from('itens_venda_erp')
      .delete()
      .eq('venda_id', id)

    // 4. Deletar venda
    await supabase
      .from('vendas_erp')
      .delete()
      .eq('id', id)

    // 5. Atualizar tela
    this.buscarVendas()

  } catch (error) {
    console.error(error)
    alert('Erro ao excluir venda')
  }
},

    formatarPreco(valor) {
      if (!valor) return '0,00'
      return Number(valor).toFixed(2).replace('.', ',')
    },

    formatarData(data) {
      if (!data) return '-'
      return data.split('T')[0].split('-').reverse().join('/')
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
  vendasFiltradas() {
    return [...this.vendas]
      .sort((a, b) => {
        const dataA = new Date(a.data_venda || 0).getTime()
        const dataB = new Date(b.data_venda || 0).getTime()

        if (dataA !== dataB) return dataB - dataA
        return (b.id || 0) - (a.id || 0)
      })
      .filter(v => {

        const termo = this.busca.toLowerCase()

        const clienteMatch = (v.cliente || '')
          .toLowerCase()
          .includes(termo)

        const produtoMatch = v.itens_venda_erp.some(i =>
          i.produtos_erp.nome.toLowerCase().includes(termo)
        )

        const matchBusca = clienteMatch || produtoMatch

        const dataVenda = v.data_venda?.split('T')[0]

        const matchInicio = !this.dataInicio || dataVenda >= this.dataInicio
        const matchFim = !this.dataFim || dataVenda <= this.dataFim

        return matchBusca && matchInicio && matchFim
      })
  },

  totalPaginas() {
    return Math.max(1, Math.ceil(this.vendasFiltradas.length / this.itensPorPagina))
  },

  vendasPaginadas() {
    const inicio = (this.paginaAtual - 1) * this.itensPorPagina
    return this.vendasFiltradas.slice(inicio, inicio + this.itensPorPagina)
  }
  },

  watch: {
    busca() {
      this.paginaAtual = 1
    },

    dataInicio() {
      this.paginaAtual = 1
    },

    dataFim() {
      this.paginaAtual = 1
    },

    itensPorPagina() {
      this.paginaAtual = 1
    },

    vendas() {
      this.ajustarPagina()
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.header h3 {
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.01em;
  flex-shrink: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-export {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.btn-export:hover:not(:disabled) {
  background: var(--success-soft);
  border-color: var(--success);
  color: var(--success);
}

.table-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  overflow-x: auto;
  margin-bottom: 14px;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

thead th {
  background: #F1F5F9;
  text-align: left;
  padding: 8px 14px;
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

tbody tr:nth-child(even) {
  background: rgba(241,245,249,0.55);
}

tbody tr:hover {
  background: rgba(232,110,26,0.04);
}

tbody tr:last-child td {
  border-bottom: none;
}

td {
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
}

button {
  border: 1px solid var(--border);
  height: 30px;
  padding: 0 10px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-weight: 600;
  font-size: 12px;
  background: var(--surface);
  color: var(--text);
  transition: all 0.15s;
}

button:hover {
  background: var(--surface-soft);
}

.primary {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.primary:hover {
  background: var(--primary-hover);
}

.edit { color: var(--info); }
.edit:hover { background: var(--info-soft); }

.delete { color: var(--danger); }
.delete:hover { background: var(--danger-soft); }

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

.filtros {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 10px;
  margin-bottom: 14px;
  align-items: end;
}

.busca { width: 100%; }

.filtro-data {
  display: flex;
  gap: 8px;
}

.filtro-data input { width: 100%; }

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
  gap: 8px;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 500;
}

.pagination-select select {
  width: auto;
  min-width: 80px;
  height: 32px;
}

.pagination-info {
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 500;
}

.pagination-actions {
  display: flex;
  gap: 6px;
}

.pagination-actions button {
  height: 32px;
  padding: 0 12px;
}

.pagination-actions button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .page { padding: 16px 12px 24px; }
  .filtros { grid-template-columns: 1fr; }
  .header { flex-direction: column; align-items: stretch; }
  .header h3 { font-size: 20px; }
  .header-actions { width: 100%; flex-direction: column; gap: 8px; }
  .btn-export { width: 100%; justify-content: center; height: 44px; font-size: 14px; }
  .primary { width: 100%; height: 44px; font-size: 14px; }
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
    width: auto;
    white-space: normal;
    text-align: left;
    vertical-align: middle;
    padding-top: 10px;
    border-top: 1px solid var(--border);
    margin-top: 4px;
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
  .pagination { flex-direction: column; align-items: stretch; gap: 12px; }
  .pagination-meta { flex-direction: column; align-items: stretch; gap: 10px; }
  .pagination-select { justify-content: space-between; }
  .pagination-select select { width: 100%; height: 40px; font-size: 14px; }
  .pagination-actions { width: 100%; display: flex; gap: 8px; }
  .pagination-actions button { flex: 1; height: 40px; font-size: 13px; }
}

@media (min-width: 769px) and (max-width: 1023px) {
  .page { padding: 20px 16px 28px; }
  .header h3 { font-size: 20px; }
  .filtros { gap: 8px; }
  table { font-size: 12px; }
  th, td { padding: 6px 10px; }
  .actions-wrap { gap: 4px; }
  .actions-wrap button { height: 28px; font-size: 11px; padding: 0 8px; }
}

.export-desc {
  color: var(--text-muted);
  font-size: 13px;
  margin: 0;
}

.export-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

:deep(.modal-overlay) {
  position: fixed; inset: 0; z-index: 2000;
  background: rgba(15, 23, 42, 0.48);
  display: flex; align-items: center; justify-content: center;
  padding: 16px;
}

:deep(.modal) {
  background: var(--surface);
  width: 100%; max-width: 420px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-md);
  max-height: calc(100vh - 32px);
  display: flex; flex-direction: column;
  overflow: hidden;
}

:deep(.modal-header) {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-bottom: 1px solid var(--border);
  flex-shrink: 0; gap: 12px;
}

:deep(.modal-title) { font-size: 18px; font-weight: 600; margin: 0; }

:deep(.close-btn) {
  display: inline-flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; flex-shrink: 0;
  border: 1px solid var(--border); border-radius: var(--radius-sm);
  background: var(--surface-soft); color: var(--text-muted);
  cursor: pointer; transition: all 0.15s;
}
:deep(.close-btn:hover) { background: var(--danger-soft); border-color: var(--danger); color: var(--danger); }

:deep(.modal-body) { padding: 20px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 16px; }

:deep(.field) { display: flex; flex-direction: column; gap: 4px; }
:deep(.field label) { font-size: 11px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }

:deep(.modal-footer) { display: flex; gap: 8px; padding: 16px 20px; border-top: 1px solid var(--border); flex-shrink: 0; justify-content: flex-end; }

:deep(.export-btn-cancel) {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 0 16px; height: 36px;
  border-radius: var(--radius-sm); border: 1px solid var(--border);
  background: var(--surface); color: var(--text);
  cursor: pointer; font-weight: 600; font-size: 13px;
  transition: all 0.15s; white-space: nowrap;
}
:deep(.export-btn-cancel:hover) { background: var(--surface-soft); }

:deep(.export-btn-confirm) {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 0 16px; height: 36px;
  border-radius: var(--radius-sm); border: 1px solid var(--primary);
  background: var(--primary); color: white;
  cursor: pointer; font-weight: 600; font-size: 13px;
  transition: all 0.15s; white-space: nowrap;
}
:deep(.export-btn-confirm:hover) { filter: brightness(1.1); }
:deep(.export-btn-confirm[disabled]) { opacity: 0.5; cursor: not-allowed; }
</style>
