<template>
  <div class="page">
    <div class="header">
      <h3>Vitrine</h3>
      <div class="header-actions">
        <button class="primary" @click="abrirNovo">
          Novo Produto
        </button>
      </div>
    </div>

    <div class="filtros">
      <input
        v-model="busca"
        placeholder="Buscar por nome, tipo, categoria ou variacao..."
        class="input busca"
      />
      <select v-model="ordenacao" class="input ordenacao">
        <option value="novos">Mais novos</option>
        <option value="relevantes">Mais relevantes</option>
      </select>
    </div>

    <p v-if="erro" class="feedback erro">{{ erro }}</p>
    <p v-else-if="carregando" class="feedback">Carregando vitrine...</p>

    <div v-else class="table-card">
      <table>
        <thead>
          <tr>
            <th>Produto</th>
            <th>Categorias</th>
            <th>Variacoes</th>
            <th>Precos</th>
            <th>Acessos</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="p in produtosPaginados" :key="p.id">
            <td data-label="Produto">
              <div class="produto-cell">
                <div class="preview">
                  <img
                    v-if="p.images && p.images.length"
                    :src="p.images[0]"
                    :alt="p.name"
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

                <div class="info">
                  <span class="nome">{{ p.name }}</span>
                  <span class="tipo">{{ p.tipo }}</span>
                </div>
              </div>
            </td>

            <td data-label="Categorias">
              <div class="stacked-chips">
                <span v-for="c in p.categorias" :key="c" class="chip">
                  {{ c }}
                </span>
                <span v-if="!p.categorias.length" class="chip muted-chip">
                  Sem categoria
                </span>
              </div>
            </td>

            <td data-label="Variacoes">
              <div class="variacoes-cell">
                <span class="metric">{{ p.variacoes.length }}</span>
                <span class="variacoes-text">{{ resumoVariacoes(p.variacoes) }}</span>
              </div>
            </td>

            <td data-label="Precos">
              <div class="variacoes-cell compact">
                <span class="chip muted-chip">{{ contarPrecos(p) }} fixos</span>
                <span class="chip muted-chip">{{ contarFaixas(p) }} faixas</span>
              </div>
            </td>

            <td data-label="Acessos">
              <span class="access-count">{{ p.acessos || 0 }}</span>
            </td>

            <td class="actions-cell">
              <div class="actions-wrap">
                <button class="view" @click="verDetalhes(p)">Ver</button>
                <button class="edit" @click="editar(p)">Editar</button>
                <button class="duplicate" :disabled="salvando" @click="duplicar(p)">Duplicar</button>
                <button class="delete" :disabled="salvando" @click="deletar(p)">Excluir</button>
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

    <ModalProdutoVitrine
      v-if="modal"
      :produto="produto"
      :editando="editando"
      :salvando="salvando"
      :tipos-disponiveis="tiposDisponiveis"
      :categorias-disponiveis="categoriasDisponiveis"
      @fechar="fechar"
      @salvar="salvar"
    />
  </div>
</template>

<script>
import { supabase } from '../services/supabase'
import ModalProdutoVitrine from '../components/ModalProdutoVitrine.vue'

const TIPOS_PADRAO = [
  'canecas',
  'xicaras',
  'azulejos',
  'canecas 3d',
  'bottons',
]

const CATEGORIAS_PADRAO = [
  'Futebol',
  'Capivara',
  'Frases Engraçadas',
  'Anime',
  'Filmes & Series',
  'Gatos',
  'Animais',
  'Norte',
  'Estados Brasileiros',
  'Profissoes',
  'Arte',
  'Frases Motivacionais',
  'Fantasia',
  'Sao Paulo',
  'Doramas',
  'Aliens & Ufologia',
  'Desenhos',
  'Herois',
  'Mapa',
  'Plantas',
  'Musica',
  'Envie Sua Arte',
]

export default {
  components: { ModalProdutoVitrine },

  data() {
    return {
      produtos: [],
      busca: '',
      ordenacao: 'novos',
      paginaAtual: 1,
      itensPorPagina: 100,
      modal: false,
      editando: false,
      produtoId: null,
      carregando: false,
      salvando: false,
      erro: '',
      produto: this.getProdutoVazio(),
    }
  },

  mounted() {
    this.buscar()
  },

  methods: {
    getProdutoVazio() {
      return {
        name: '',
        tipo: '',
        categorias: [],
        images: [],
        acessos: 0,
        variacoes: [],
      }
    },

    getVariacaoVazia() {
      return {
        nome: '',
        tipo_variacao: 'cor',
        ordem: 1,
        vitrine_precos: [],
        vitrine_precos_faixas: [],
      }
    },

    normalizarProduto(produto = {}) {
      return {
        ...this.getProdutoVazio(),
        id: produto.id || null,
        name: produto.name || '',
        tipo: produto.tipo || '',
        categorias: Array.isArray(produto.categorias) ? [...produto.categorias] : [],
        images: Array.isArray(produto.images) ? [...produto.images] : [],
        acessos: Number(produto.acessos) || 0,
        created_at: produto.created_at || null,
        variacoes: this.ordenarVariacoes(produto.vitrine_variacoes || produto.variacoes || []),
      }
    },

    ordenarVariacoes(variacoes = []) {
      return [...variacoes]
        .map((variacao, index) => ({
          ...this.getVariacaoVazia(),
          ...variacao,
          ordem: this.normalizarInteiro(variacao.ordem, index + 1),
          vitrine_precos: this.ordenarItens(variacao.vitrine_precos, 'preco'),
          vitrine_precos_faixas: this.ordenarItens(variacao.vitrine_precos_faixas, 'faixa'),
        }))
        .sort((a, b) => a.ordem - b.ordem)
    },

    ordenarItens(itens = [], tipo) {
      return [...(Array.isArray(itens) ? itens : [])]
        .map((item, index) => {
          if (tipo === 'preco') {
            return {
              id: item.id || null,
              preco: this.normalizarNumero(item.preco),
              ordem: this.normalizarInteiro(item.ordem, index + 1),
            }
          }

          return {
            id: item.id || null,
            quantidade_minima: this.normalizarInteiro(item.quantidade_minima, 1),
            quantidade_label: item.quantidade_label || '',
            preco: this.normalizarNumero(item.preco),
            destaque: Boolean(item.destaque),
            ordem: this.normalizarInteiro(item.ordem, index + 1),
          }
        })
        .sort((a, b) => a.ordem - b.ordem)
    },

    normalizarInteiro(valor, fallback = 0) {
      const numero = Number.parseInt(valor, 10)
      return Number.isFinite(numero) ? numero : fallback
    },

    normalizarNumero(valor, fallback = 0) {
      const numero = Number.parseFloat(String(valor ?? fallback).replace(',', '.'))
      return Number.isFinite(numero) ? numero : fallback
    },

    async buscar() {
      this.carregando = true
      this.erro = ''

      try {
        const campoOrdenacao = this.ordenacao === 'relevantes' ? 'acessos' : 'created_at'
        const { data, error } = await supabase
          .from('vitrine')
          .select('*, vitrine_variacoes(*, vitrine_precos(*), vitrine_precos_faixas(*))')
          .order(campoOrdenacao, { ascending: false })

        if (error) throw error

        this.produtos = (data || []).map((produto) => this.normalizarProduto(produto))
        this.ajustarPagina()
      } catch (error) {
        console.error(error)
        this.erro = error.message || 'Nao foi possivel carregar a vitrine.'
      } finally {
        this.carregando = false
      }
    },

    abrirNovo() {
      this.reset()
      this.modal = true
    },

    editar(produto) {
      this.produto = this.normalizarProduto(produto)
      this.produtoId = produto.id
      this.editando = true
      this.modal = true
    },

    verDetalhes(produto) {
      this.$router.push(`/vitrine/detalhes/${produto.id}`)
    },

    fechar() {
      if (this.salvando) return

      this.modal = false
      this.reset()
    },

    async salvar(produto) {
      this.salvando = true

      try {
        const payload = {
          name: (produto.name || '').trim(),
          tipo: (produto.tipo || '').trim(),
          categorias: Array.isArray(produto.categorias)
            ? produto.categorias.map((categoria) => categoria.trim()).filter(Boolean)
            : [],
          images: Array.isArray(produto.images) ? produto.images.filter(Boolean) : [],
        }

        if (!payload.name || !payload.tipo) {
          throw new Error('Preencha nome e tipo do produto.')
        }

        let vitrineId = this.produtoId

        if (this.editando) {
          const { error } = await supabase
            .from('vitrine')
            .update(payload)
            .eq('id', vitrineId)

          if (error) throw error
        } else {
          const { data, error } = await supabase
            .from('vitrine')
            .insert([payload])
            .select('id')
            .single()

          if (error) throw error
          vitrineId = data.id
        }

        await this.sincronizarVariacoes(vitrineId, produto.variacoes || [])

        this.fechar()
        await this.buscar()
      } catch (error) {
        console.error(error)
        alert(error.message || 'Nao foi possivel salvar o produto da vitrine.')
      } finally {
        this.salvando = false
      }
    },

    async duplicar(produto) {
      if (this.salvando) return

      this.salvando = true

      try {
        const original = this.normalizarProduto(produto)
        const nomeDuplicado = this.sugerirNomeDuplicado(original.name)

        const payload = {
          name: nomeDuplicado,
          tipo: original.tipo,
          categorias: [...original.categorias],
          images: [...original.images],
          acessos: 0,
        }

        const { data: novoProduto, error } = await supabase
          .from('vitrine')
          .insert([payload])
          .select('id')
          .single()

        if (error) throw error

        await this.criarVariacoesDuplicadas(novoProduto.id, original.variacoes)

        const { data: recarregado, error: erroFetch } = await supabase
          .from('vitrine')
          .select('*, vitrine_variacoes(*, vitrine_precos(*), vitrine_precos_faixas(*))')
          .eq('id', novoProduto.id)
          .single()

        if (erroFetch) throw erroFetch

        this.produto = this.normalizarProduto({ ...recarregado, name: nomeDuplicado })
        this.produtoId = novoProduto.id
        this.editando = true
        this.modal = true
      } catch (error) {
        console.error(error)
        alert(error.message || 'Nao foi possivel duplicar o produto.')
      } finally {
        this.salvando = false
      }
    },

    async sincronizarVariacoes(vitrineId, variacoes) {
      const variacoesExistentes = Array.isArray(this.produto.variacoes) ? this.produto.variacoes : []
      const idsExistentes = variacoesExistentes.map((variacao) => variacao.id).filter(Boolean)

      const variacoesNormalizadas = this.ordenarVariacoes(variacoes)
        .filter((variacao) => variacao.nome?.trim())
        .map((variacao, index) => ({
          ...variacao,
          nome: variacao.nome.trim(),
          tipo_variacao: (variacao.tipo_variacao || 'cor').trim(),
          ordem: this.normalizarInteiro(variacao.ordem, index + 1),
        }))

      const idsRecebidos = variacoesNormalizadas.map((variacao) => variacao.id).filter(Boolean)
      const idsRemovidos = idsExistentes.filter((id) => !idsRecebidos.includes(id))

      if (idsRemovidos.length) {
        await this.excluirVariacoes(idsRemovidos)
      }

      for (const variacao of variacoesNormalizadas) {
        const payload = {
          vitrine_id: vitrineId,
          nome: variacao.nome,
          tipo_variacao: variacao.tipo_variacao,
          ordem: variacao.ordem,
        }

        let variacaoId = variacao.id

        if (variacaoId) {
          const { error } = await supabase
            .from('vitrine_variacoes')
            .update(payload)
            .eq('id', variacaoId)

          if (error) throw error
        } else {
          const { data, error } = await supabase
            .from('vitrine_variacoes')
            .insert([payload])
            .select('id')
            .single()

          if (error) throw error
          variacaoId = data.id
        }

        const variacaoOriginal = variacoesExistentes.find((item) => item.id === variacao.id) || this.getVariacaoVazia()

        await this.sincronizarPrecos(variacaoId, variacao.vitrine_precos || [], variacaoOriginal.vitrine_precos || [])
        await this.sincronizarFaixas(variacaoId, variacao.vitrine_precos_faixas || [], variacaoOriginal.vitrine_precos_faixas || [])
      }
    },

    async criarVariacoesDuplicadas(vitrineId, variacoes = []) {
      for (const variacao of this.ordenarVariacoes(variacoes)) {
        const payloadVariacao = {
          vitrine_id: vitrineId,
          nome: variacao.nome,
          tipo_variacao: variacao.tipo_variacao,
          ordem: variacao.ordem,
        }

        const { data: novaVariacao, error } = await supabase
          .from('vitrine_variacoes')
          .insert([payloadVariacao])
          .select('id')
          .single()

        if (error) throw error

        const variacaoId = novaVariacao.id

        const precosPayload = this.ordenarItens(variacao.vitrine_precos, 'preco')
          .filter((preco) => preco.preco > 0)
          .map((preco, index) => ({
            variacao_id: variacaoId,
            preco: this.normalizarNumero(preco.preco),
            ordem: this.normalizarInteiro(preco.ordem, index + 1),
          }))

        if (precosPayload.length) {
          const { error: erroPrecos } = await supabase
            .from('vitrine_precos')
            .insert(precosPayload)

          if (erroPrecos) throw erroPrecos
        }

        const faixasPayload = this.ordenarItens(variacao.vitrine_precos_faixas, 'faixa')
          .filter((faixa) => faixa.quantidade_label?.trim() && faixa.preco > 0)
          .map((faixa, index) => ({
            variacao_id: variacaoId,
            quantidade_minima: this.normalizarInteiro(faixa.quantidade_minima, 1),
            quantidade_label: faixa.quantidade_label.trim(),
            preco: this.normalizarNumero(faixa.preco),
            destaque: Boolean(faixa.destaque),
            ordem: this.normalizarInteiro(faixa.ordem, index + 1),
          }))

        if (faixasPayload.length) {
          const { error: erroFaixas } = await supabase
            .from('vitrine_precos_faixas')
            .insert(faixasPayload)

          if (erroFaixas) throw erroFaixas
        }
      }
    },

    async sincronizarPrecos(variacaoId, precos, precosExistentes) {
      const idsExistentes = precosExistentes.map((preco) => preco.id).filter(Boolean)
      const precosNormalizados = this.ordenarItens(precos, 'preco')
        .filter((preco) => preco.preco > 0)
      const idsRecebidos = precosNormalizados.map((preco) => preco.id).filter(Boolean)
      const idsRemovidos = idsExistentes.filter((id) => !idsRecebidos.includes(id))

      if (idsRemovidos.length) {
        const { error } = await supabase
          .from('vitrine_precos')
          .delete()
          .in('id', idsRemovidos)

        if (error) throw error
      }

      for (const [index, preco] of precosNormalizados.entries()) {
        const payload = {
          variacao_id: variacaoId,
          preco: this.normalizarNumero(preco.preco),
          ordem: this.normalizarInteiro(preco.ordem, index + 1),
        }

        if (preco.id) {
          const { error } = await supabase
            .from('vitrine_precos')
            .update(payload)
            .eq('id', preco.id)

          if (error) throw error
        } else {
          const { error } = await supabase
            .from('vitrine_precos')
            .insert([payload])

          if (error) throw error
        }
      }
    },

    async sincronizarFaixas(variacaoId, faixas, faixasExistentes) {
      const idsExistentes = faixasExistentes.map((faixa) => faixa.id).filter(Boolean)
      const faixasNormalizadas = this.ordenarItens(faixas, 'faixa')
        .filter((faixa) => faixa.quantidade_label?.trim() && faixa.preco > 0)
        .map((faixa, index) => ({
          ...faixa,
          quantidade_label: faixa.quantidade_label.trim(),
          quantidade_minima: this.normalizarInteiro(faixa.quantidade_minima, 1),
          ordem: this.normalizarInteiro(faixa.ordem, index + 1),
        }))
      const idsRecebidos = faixasNormalizadas.map((faixa) => faixa.id).filter(Boolean)
      const idsRemovidos = idsExistentes.filter((id) => !idsRecebidos.includes(id))

      if (idsRemovidos.length) {
        const { error } = await supabase
          .from('vitrine_precos_faixas')
          .delete()
          .in('id', idsRemovidos)

        if (error) throw error
      }

      for (const faixa of faixasNormalizadas) {
        const payload = {
          variacao_id: variacaoId,
          quantidade_minima: faixa.quantidade_minima,
          quantidade_label: faixa.quantidade_label,
          preco: this.normalizarNumero(faixa.preco),
          destaque: Boolean(faixa.destaque),
          ordem: faixa.ordem,
        }

        if (faixa.id) {
          const { error } = await supabase
            .from('vitrine_precos_faixas')
            .update(payload)
            .eq('id', faixa.id)

          if (error) throw error
        } else {
          const { error } = await supabase
            .from('vitrine_precos_faixas')
            .insert([payload])

          if (error) throw error
        }
      }
    },

    async deletar(produto) {
      if (this.salvando || !confirm(`Excluir ${produto.name}?`)) return

      this.salvando = true

      try {
        const idsVariacoes = (produto.variacoes || []).map((variacao) => variacao.id).filter(Boolean)

        if (idsVariacoes.length) {
          await this.excluirVariacoes(idsVariacoes)
        }

        const { error } = await supabase
          .from('vitrine')
          .delete()
          .eq('id', produto.id)

        if (error) throw error

        await this.buscar()
      } catch (error) {
        console.error(error)
        alert(error.message || 'Nao foi possivel excluir o produto da vitrine.')
      } finally {
        this.salvando = false
      }
    },

    async excluirVariacoes(idsVariacoes) {
      const { error: erroFaixas } = await supabase
        .from('vitrine_precos_faixas')
        .delete()
        .in('variacao_id', idsVariacoes)

      if (erroFaixas) throw erroFaixas

      const { error: erroPrecos } = await supabase
        .from('vitrine_precos')
        .delete()
        .in('variacao_id', idsVariacoes)

      if (erroPrecos) throw erroPrecos

      const { error: erroVariacoes } = await supabase
        .from('vitrine_variacoes')
        .delete()
        .in('id', idsVariacoes)

      if (erroVariacoes) throw erroVariacoes
    },

    reset() {
      this.editando = false
      this.produtoId = null
      this.produto = this.getProdutoVazio()
    },

    contarPrecos(produto) {
      return (produto.variacoes || []).reduce((total, variacao) => total + (variacao.vitrine_precos?.length || 0), 0)
    },

    contarFaixas(produto) {
      return (produto.variacoes || []).reduce((total, variacao) => total + (variacao.vitrine_precos_faixas?.length || 0), 0)
    },

    resumoVariacoes(variacoes) {
      if (!variacoes.length) return 'Sem variacoes cadastradas'
      return variacoes.slice(0, 3).map((variacao) => variacao.nome).join(', ')
    },

    sugerirNomeDuplicado(nome) {
      const base = (nome || 'Produto').trim()
      const suffix = ' (copia)'
      let candidato = `${base}${suffix}`
      let contador = 2

      while (this.produtos.some((produto) => produto.name === candidato)) {
        candidato = `${base}${suffix} ${contador}`
        contador += 1
      }

      return candidato
    },

    irParaPagina(pagina) {
      this.paginaAtual = pagina
    },

    ajustarPagina() {
      if (this.paginaAtual > this.totalPaginas) {
        this.paginaAtual = this.totalPaginas
      }
    },
  },

  computed: {
    totalPaginas() {
      return Math.max(1, Math.ceil(this.produtosFiltrados.length / this.itensPorPagina))
    },

    tiposDisponiveis() {
      const dinamicos = this.produtos.map((produto) => produto.tipo).filter(Boolean)
      return [...new Set([...TIPOS_PADRAO, ...dinamicos])].sort((a, b) => a.localeCompare(b))
    },

    categoriasDisponiveis() {
      const dinamicas = this.produtos.flatMap((produto) => produto.categorias || []).filter(Boolean)
      return [...new Set([...CATEGORIAS_PADRAO, ...dinamicas])].sort((a, b) => a.localeCompare(b))
    },

    produtosFiltrados() {
      const termo = this.busca.trim().toLowerCase()

      if (!termo) return this.produtos

      return this.produtos.filter((produto) => {
        const categorias = Array.isArray(produto.categorias) ? produto.categorias.join(' ') : ''
        const variacoes = Array.isArray(produto.variacoes)
          ? produto.variacoes.map((variacao) => `${variacao.nome} ${variacao.tipo_variacao}`).join(' ')
          : ''

        const conteudo = [
          produto.name,
          produto.tipo,
          categorias,
          variacoes,
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
    },
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
    },

    ordenacao() {
      this.buscar()
    },
  },
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
  gap: 16px;
  margin-bottom: 14px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.btn-secondary {
  height: 32px;
  padding: 0 12px;
  border-radius: var(--radius-sm);
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text-muted);
  text-decoration: none;
  font-weight: 600;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
}

.header h3 {
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.filtros {
  display: grid;
  grid-template-columns: 1fr 180px;
  gap: 10px;
  margin-bottom: 14px;
}

.feedback {
  margin: 0 0 16px;
  padding: 12px 14px;
  border-radius: 14px;
  background: var(--surface-soft);
  border: 1px solid var(--border);
  color: var(--text-muted);
}

.feedback.erro {
  color: var(--danger);
  background: var(--danger-soft);
  border-color: #fecaca;
}

.busca,
.ordenacao {
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

thead {
  position: sticky;
  top: 0;
  z-index: 1;
}

th {
  background: #F1F5F9;
  padding: 8px 14px;
  text-align: left;
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

td {
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
}

tbody tr {
  height: 42px;
}

tbody tr:nth-child(even) {
  background: rgba(241, 245, 249, 0.55);
}

tbody tr:hover {
  background: rgba(232, 110, 26, 0.04);
}

tbody tr:last-child td {
  border-bottom: none;
}

.produto-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.preview {
  position: relative;
  width: 44px;
  height: 44px;
  border-radius: 6px;
  overflow: hidden;
  background: var(--surface-muted);
  border: 1px solid var(--border);
  flex-shrink: 0;
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
  min-width: 0;
}

.nome {
  font-weight: 600;
}

.tipo {
  font-size: 12px;
  color: var(--text-muted);
}

.stacked-chips,
.variacoes-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.variacoes-cell {
  flex-direction: column;
  align-items: flex-start;
}

.variacoes-cell.compact {
  gap: 8px;
}

.variacoes-text {
  font-size: 12px;
  color: var(--text-muted);
}

.metric,
.chip,
.access-count {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.metric {
  background: var(--surface-soft);
  color: var(--text);
}

.chip {
  background: var(--surface-muted);
  color: var(--text-muted);
}

.muted-chip {
  background: var(--surface-soft);
}

.access-count {
  background: var(--info-soft);
  color: var(--info);
}

button {
  border: 1px solid transparent;
  cursor: pointer;
  font-weight: 600;
}

button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.primary {
  height: 32px;
  padding: 0 12px;
  border-radius: var(--radius-sm);
  background: #E86E1A;
  color: white;
  font-size: 12px;
}

.edit {
  height: 30px;
  padding: 0 10px;
  border-radius: var(--radius-sm);
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--info);
  font-size: 12px;
}

.view {
  height: 30px;
  padding: 0 10px;
  border-radius: var(--radius-sm);
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--success);
  font-size: 12px;
}

.duplicate {
  height: 30px;
  padding: 0 10px;
  border-radius: var(--radius-sm);
  background: var(--surface);
  border: 1px solid var(--border);
  color: #b45309;
  font-size: 12px;
}

.delete {
  height: 30px;
  padding: 0 10px;
  border-radius: var(--radius-sm);
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--danger);
  font-size: 12px;
}

.edit:hover {
  background: #dbeafe;
}

.view:hover {
  background: #dcfce7;
}

.duplicate:hover {
  background: #fef3c7;
}

.delete:hover {
  background: #fee2e2;
}

.actions {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
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
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  font-size: 12px;
}

@media (max-width: 768px) {
  .page { padding: 16px 12px 24px; }
  .header { flex-direction: column; align-items: stretch; }
  .header-actions { width: 100%; justify-content: stretch; gap: 8px; }
  .header h3 { font-size: 20px; }
  .primary { width: 100%; height: 44px; font-size: 14px; }
  .filtros { grid-template-columns: 1fr; }
  table, thead, tbody, th, td, tr { display: block; }
  thead { display: none; }
  tr {
    margin-bottom: 12px;
    background: var(--surface);
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
    gap: 6px;
    justify-content: stretch;
    flex-wrap: wrap;
  }
  .actions-wrap button {
    flex: 1;
    min-width: 70px;
    height: 40px;
    font-size: 12px;
  }
  .pagination { flex-direction: column; align-items: stretch; }
  .pagination-meta { flex-direction: column; align-items: stretch; }
  .pagination-select { justify-content: space-between; }
  .pagination-select select { width: 100%; height: 40px; font-size: 14px; }
  .pagination-actions { width: 100%; display: flex; gap: 8px; }
  .pagination-actions button { flex: 1; height: 40px; font-size: 13px; }
}

@media (min-width: 769px) and (max-width: 1023px) {
  .page { padding: 20px 16px 28px; }
  .filtros { grid-template-columns: 1fr 160px; }
  .header h3 { font-size: 20px; }
  table { font-size: 12px; }
  th, td { padding: 6px 10px; }
  .actions-wrap { gap: 4px; }
  .actions-wrap button { height: 28px; font-size: 11px; padding: 0 8px; }
  .produto-cell { gap: 8px; }
  .preview { width: 36px; height: 36px; }
}
</style>
