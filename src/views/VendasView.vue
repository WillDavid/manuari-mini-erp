<template>
  <div class="page">

    <!-- HEADER -->
    <div class="header">
      <h3>Vendas</h3>
      <button class="primary" @click="abrirNovaVenda">
        Nova Venda
      </button>
    </div>

    <!-- FILTROS -->
    <div class="filtros">

      <input
        v-model="busca"
        placeholder="Buscar cliente ou produto..."
        class="input busca"
      />

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
          <tr v-for="v in vendasFiltradas" :key="v.id">
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

            <td data-label="Ações" class="actions">
              <button class="edit" @click="editarVenda(v)">
                Editar
              </button>

              <button class="delete" @click="excluirVenda(v.id)">
                Excluir
              </button>
            </td>
          </tr>
        </tbody>
      </table>
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

  </div>
</template>

<script>
import { supabase } from '../services/supabase'
import ModalVenda from '../components/ModalVenda.vue'

export default {
  components: { ModalVenda},

  data() {
    return {
      vendas: [],
      produtos: [],
      modalAberto: false,
      vendaEditando: null,

      busca: '',
      dataInicio: '',
      dataFim: ''
    }
  },

  mounted() {
    this.buscarVendas()
    this.buscarProdutos()
  },

  methods: {

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
            subtotal,
            produtos_erp (nome)
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
          subtotal: i.subtotal
        }))
      }

      this.modalAberto = true
    },

    fecharModal() {
      this.modalAberto = false
      this.vendaEditando = null
    },

    async salvarVenda(venda) {

  try {

    // 🧠 VALIDAÇÃO INTELIGENTE (considera edição)
    for (const item of venda.itens) {

      const { data: produto } = await supabase
        .from('produtos_erp')
        .select('estoque, nome')
        .eq('id', item.produto_id)
        .single()

      let estoqueDisponivel = produto.estoque || 0

      // 👉 se estiver editando, soma estoque antigo
      if (this.vendaEditando) {
        const itemAntigo = this.vendaEditando.itens.find(
          i => i.produto_id === item.produto_id
        )

        if (itemAntigo) {
          estoqueDisponivel += itemAntigo.quantidade
        }
      }

      if (estoqueDisponivel < item.quantidade) {
        alert(`Sem estoque para ${produto.nome}`)
        return
      }
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
      subtotal: item.subtotal
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
    }
  },

  computed: {
  vendasFiltradas() {
    return this.vendas.filter(v => {

      // 🔎 FILTRO TEXTO
      const termo = this.busca.toLowerCase()

      const clienteMatch = (v.cliente || '')
        .toLowerCase()
        .includes(termo)

      const produtoMatch = v.itens_venda_erp.some(i =>
        i.produtos_erp.nome.toLowerCase().includes(termo)
      )

      const matchBusca = clienteMatch || produtoMatch

      // 📅 FILTRO DATA
      const dataVenda = v.data_venda?.split('T')[0]

      const matchInicio = !this.dataInicio || dataVenda >= this.dataInicio
      const matchFim = !this.dataFim || dataVenda <= this.dataFim

      return matchBusca && matchInicio && matchFim
    })
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
  align-items: center;
  margin-bottom: 16px;
}

/* TABELA */
.table-card {
  background: white;
  border-radius: 10px;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

th {
  background: #f1f1f1;
  text-align: left;
  padding: 12px;
}

td {
  padding: 12px;
  border-bottom: 1px solid #eee;
}

/* BOTÕES */
button {
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
}

.primary {
  background: #ff6a00;
  color: white;
}

.edit {
  background: #1976d2;
  color: white;
  margin-right: 6px;
}

.delete {
  background: #d32f2f;
  color: white;
}


/* MOBILE (IGUAL PRODUTOS) */
@media (max-width: 768px) {

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
    background: white;
    margin-bottom: 12px;
    border-radius: 8px;
    padding: 10px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.05);
  }

  td {
    display: flex;
    justify-content: space-between;
    padding: 8px 6px;
    border: none;
    font-size: 13px;
  }

  td::before {
    content: attr(data-label);
    font-weight: 600;
    color: #666;
  }

  .actions {
    justify-content: flex-end;
    gap: 6px;
  }

  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .primary {
    width: 100%;
  }


   td[data-label="Produtos"] {
    flex-direction: column;
    align-items: flex-start; /* mantém o label na esquerda */
    gap: 4px;
  }

  td[data-label="Produtos"] > div {
    width: 100%;
    text-align: right; /* 👈 só os produtos vão pra direita */
  }

  td[data-label="Produtos"] > div {
  background: #f9f9f9;
  padding: 6px 8px;
  border-radius: 6px;
  font-size: 12px;
}

}

.filtros {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

.busca {
  width: 100%;
}

.filtro-data {
  display: flex;
  gap: 8px;
}

.filtro-data input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
}

/* mobile */
@media (max-width: 768px) {
  .filtros {
    grid-template-columns: 1fr;
  }
}

.input {
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  flex: 1;
  min-width: 150px;
}
</style>