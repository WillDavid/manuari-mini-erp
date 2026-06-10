<template>
  <div class="pdv">

    <!-- === HEADER === -->
    <header class="pdv-header">
      <div class="pdv-header-top">
        <h1 class="pdv-title">PDV</h1>
        <button v-if="carrinho.length" class="pdv-cart-badge" @click="abrirDrawer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          <span class="pdv-cart-count">{{ totalItens }}</span>
        </button>
      </div>
      <div class="search-box">
        <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input v-model="busca" placeholder="Buscar produto..." class="search-input" ref="searchInput" />
        <button v-if="busca" class="search-clear" @click="busca = ''; $refs.searchInput?.focus()">✕</button>
      </div>
    </header>

    <!-- === CONTEÚDO PRINCIPAL === -->
    <div class="pdv-body">

      <!-- === COLUNA ESQUERDA: PRODUTOS === -->
      <main class="products-column">
        <div v-if="carregando" class="state-msg">Carregando produtos...</div>
        <div v-else-if="!produtos.length" class="state-msg">Nenhum produto ativo encontrado</div>
        <div v-else-if="!produtosFiltrados.length" class="state-msg">Nenhum resultado para "{{ busca }}"</div>

        <TransitionGroup v-else name="grid" tag="div" class="product-grid">
          <button
            v-for="produto in produtosFiltrados"
            :key="produto.id"
            class="product-card"
            @click="adicionar(produto)"
          >
            <div class="product-info">
              <span class="product-nome">{{ produto.nome }}</span>
              <span v-if="produto.codigo" class="product-codigo">{{ produto.codigo }}</span>
              <span class="product-preco">R$ {{ formatar(produto.preco_venda) }}</span>
            </div>
            <div class="product-footer">
              <span class="product-estoque" :class="{ baixo: produto.estoque <= 3, zerado: produto.estoque === 0 }">
                {{ produto.estoque }} em estoque
              </span>
              <span class="product-add">+</span>
            </div>
          </button>
        </TransitionGroup>
      </main>

      <!-- === COLUNA DIREITA: CARRINHO / PRÉVIA (DESKTOP) === -->
      <aside v-if="carrinho.length || previaAberto" class="cart-sidebar">

        <!-- === MODO CARRINHO === -->
        <template v-if="!previaAberto">
          <div class="cart-sidebar-header">
            <h2>Carrinho</h2>
            <span class="cart-sidebar-count">{{ totalItens }} item(ns)</span>
          </div>

          <div class="cart-sidebar-items">
            <div v-for="(item, i) in carrinho" :key="item.produto_id" class="cart-item">
              <div class="cart-item-info">
                <span class="cart-item-nome">{{ item.nome }}</span>
                <span class="cart-item-preco-unit">R$ {{ formatar(item.preco) }}</span>
              </div>
              <div class="cart-item-actions">
                <button class="qty-btn" @click="diminuir(i)">−</button>
                <span class="qty-value">{{ item.quantidade }}</span>
                <button class="qty-btn" @click="aumentar(i)">+</button>
                <span class="cart-item-subtotal">R$ {{ formatar(item.subtotal) }}</span>
                <button class="cart-item-remove" @click="remover(i)" title="Remover">✕</button>
              </div>
            </div>
          </div>

          <div class="cart-sidebar-footer">
            <div class="cart-summary">
              <div class="cart-summary-row">
                <span>Subtotal</span>
                <span>R$ {{ formatar(total) }}</span>
              </div>
              <div class="cart-summary-row">
                <span>Desconto</span>
                <div class="cart-discount-input">
                  <input type="number" v-model.number="desconto" min="0" max="100" @input="recalcular" />
                  <span>%</span>
                </div>
              </div>
              <div class="cart-summary-row total">
                <span>Total</span>
                <span>R$ {{ formatar(totalFinal) }}</span>
              </div>
            </div>

            <div class="cart-field">
              <label>Cliente</label>
              <input v-model="cliente" placeholder="Nome do cliente" />
            </div>

            <div class="cart-field">
              <label>Pagamento</label>
              <select v-model="formaPagamento">
                <option value="">Selecione</option>
                <option>Pix</option>
                <option>Dinheiro</option>
                <option>Credito</option>
              </select>
            </div>

            <div v-if="formaPagamento === 'Credito'" class="cart-field">
              <label>Parcelas</label>
              <select v-model="parcelas">
                <option v-for="n in 12" :key="n" :value="n">{{ n }}x</option>
              </select>
            </div>

            <div class="cart-buttons">
              <button class="btn-limpar" @click="limparCarrinho">Limpar</button>
              <button class="btn-finalizar" :disabled="isLoading || !carrinho.length" @click="finalizar">
                {{ isLoading ? 'Processando...' : 'Concluir Orçamento' }}
              </button>
            </div>
          </div>
        </template>

        <!-- === MODO PRÉVIA (DESKTOP) === -->
        <template v-else>
          <div class="cart-sidebar-header">
            <h2>Prévia do Orçamento</h2>
            <button class="btn-voltar-previa-sm" @click="fecharPrevia">Voltar</button>
          </div>

          <div class="cart-sidebar-items previa-items">
            <div class="previa-summary-card">
              <div class="previa-row">
                <span>Cliente</span>
                <strong>{{ preview?.cliente || '—' }}</strong>
              </div>
              <div class="previa-row">
                <span>Itens</span>
                <strong>{{ preview?.itens || 0 }}</strong>
              </div>
            </div>

            <div v-for="(item, i) in preview?.itensDetalhados" :key="i" class="previa-item">
              <div class="previa-item-left">
                <span class="previa-item-qty">{{ item.quantidade }}x</span>
                <span class="previa-item-name">{{ item.nome }}</span>
              </div>
              <span class="previa-item-sub">R$ {{ formatar(item.subtotal) }}</span>
            </div>

            <div class="previa-totals">
              <div class="previa-row">
                <span>Subtotal</span>
                <span>R$ {{ formatar(preview?.total_bruto) }}</span>
              </div>
              <div v-if="preview?.desconto > 0" class="previa-row">
                <span>Desconto ({{ formatar(preview?.desconto) }}%)</span>
                <span class="previa-desconto">- R$ {{ formatar((preview?.total_bruto || 0) * (preview?.desconto || 0) / 100) }}</span>
              </div>
              <div class="previa-divider"></div>
              <div class="previa-row previa-total">
                <span>TOTAL</span>
                <span>R$ {{ formatar(preview?.total_final) }}</span>
              </div>
              <div class="previa-row">
                <span>Pagamento</span>
                <strong>{{ preview?.forma_pagamento || '—' }}</strong>
              </div>
            </div>
          </div>

          <div class="cart-sidebar-footer previa-footer">
            <button class="btn-whatsapp" @click="compartilharWhatsApp">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
              Compartilhar WhatsApp
            </button>
            <button class="btn-pdf-sm" @click="baixarPDF">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              Baixar PDF
            </button>
          </div>

          <div class="previa-actions-sidebar">
            <button class="btn-efetivar" :disabled="efetivando" @click="confirmarVenda">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              {{ efetivando ? 'Efetivando...' : 'Efetivar Venda' }}
            </button>
          </div>
        </template>

      </aside>

    </div>

    <!-- === MOBILE: CART BAR (FIXO INFERIOR) === -->
    <Transition name="bar">
      <div v-if="carrinho.length && !drawerAberto" class="cart-bar" @click="abrirDrawer">
        <div class="cart-bar-left">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          <span class="cart-bar-count">{{ totalItens }} item(ns)</span>
        </div>
        <div class="cart-bar-right">
          <span class="cart-bar-total">R$ {{ formatar(totalFinal) }}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
      </div>
    </Transition>

    <!-- === MOBILE: DRAWER CARRINHO === -->
    <Transition name="drawer">
      <div v-if="drawerAberto" class="drawer-overlay" @click.self="drawerAberto = false">
        <div class="drawer">
          <div class="drawer-header">
            <div class="drawer-header-left">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
              <h2>Carrinho</h2>
              <span class="drawer-count">{{ totalItens }}</span>
            </div>
            <button class="drawer-close" @click="drawerAberto = false">✕</button>
          </div>

          <div class="drawer-body">
            <div v-if="!carrinho.length" class="drawer-empty">
              <p>Carrinho vazio</p>
              <button class="btn-voltar" @click="drawerAberto = false">Adicionar produtos</button>
            </div>

            <TransitionGroup v-else name="item" tag="div" class="drawer-itens">
              <div v-for="(item, i) in carrinho" :key="item.produto_id" class="cart-item">
                <div class="cart-item-info">
                  <span class="cart-item-nome">{{ item.nome }}</span>
                  <span class="cart-item-preco-unit">R$ {{ formatar(item.preco) }}</span>
                </div>
                <div class="cart-item-actions">
                  <button class="qty-btn" @click="diminuir(i)">−</button>
                  <span class="qty-value">{{ item.quantidade }}</span>
                  <button class="qty-btn" @click="aumentar(i)">+</button>
                  <span class="cart-item-subtotal">R$ {{ formatar(item.subtotal) }}</span>
                  <button class="cart-item-remove" @click="remover(i)">✕</button>
                </div>
              </div>
            </TransitionGroup>

            <div v-if="carrinho.length" class="drawer-summary">
              <div class="cart-summary-row">
                <span>Subtotal</span>
                <span>R$ {{ formatar(total) }}</span>
              </div>
              <div class="cart-summary-row">
                <span>Desconto</span>
                <div class="cart-discount-input">
                  <input type="number" v-model.number="desconto" min="0" max="100" @input="recalcular" />
                  <span>%</span>
                </div>
              </div>
              <div class="cart-summary-row total">
                <span>Total</span>
                <span>R$ {{ formatar(totalFinal) }}</span>
              </div>
            </div>

            <div v-if="carrinho.length" class="drawer-fields">
              <div class="cart-field">
                <label>Cliente</label>
                <input v-model="cliente" placeholder="Nome do cliente" />
              </div>
              <div class="cart-field">
                <label>Pagamento</label>
                <select v-model="formaPagamento">
                  <option value="">Selecione</option>
                  <option>Pix</option>
                  <option>Dinheiro</option>
                  <option>Credito</option>
                </select>
              </div>
              <div v-if="formaPagamento === 'Credito'" class="cart-field">
                <label>Parcelas</label>
                <select v-model="parcelas">
                  <option v-for="n in 12" :key="n" :value="n">{{ n }}x</option>
                </select>
              </div>
            </div>
          </div>

          <div v-if="carrinho.length" class="drawer-footer">
            <button class="btn-limpar" @click="limparCarrinho">Limpar</button>
            <button class="btn-finalizar" :disabled="isLoading" @click="finalizar">
              {{ isLoading ? 'Processando...' : 'Concluir Orçamento' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- === MODAL PRÉVIA (antes de efetivar venda) === -->
    <Transition name="drawer">
      <div v-if="previaAberto" class="drawer-overlay previa-overlay" @click.self="fecharPrevia">
        <div class="drawer success-drawer">
          <div class="success-check" :class="{ confirmado: vendaConfirmada }">
            <svg v-if="!vendaConfirmada" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
            <svg v-else width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>

          <h2 class="success-title">{{ vendaConfirmada ? 'Venda finalizada!' : 'Prévia da Venda' }}</h2>
          <p class="success-sub">{{ vendaConfirmada ? 'Pedido #' + ultimaVenda?.id : 'Revise os dados antes de efetivar' }}</p>

          <div class="success-info">
            <div class="success-row">
              <span>Cliente</span>
              <strong>{{ preview?.cliente || '—' }}</strong>
            </div>
            <div class="success-row">
              <span>Itens</span>
              <strong>{{ preview?.itens || 0 }}</strong>
            </div>
            <div v-for="(item, i) in preview?.itensDetalhados" :key="i" class="success-item">
              <span>{{ item.quantidade }}x {{ item.nome }}</span>
              <span>R$ {{ formatar(item.subtotal) }}</span>
            </div>
            <div class="success-row">
              <span>Subtotal</span>
              <strong>R$ {{ formatar(preview?.total_bruto) }}</strong>
            </div>
            <div v-if="preview?.desconto > 0" class="success-row">
              <span>Desconto ({{ formatar(preview?.desconto) }}%)</span>
              <strong class="success-desconto">- R$ {{ formatar((preview?.total_bruto || 0) * (preview?.desconto || 0) / 100) }}</strong>
            </div>
            <div class="success-row success-divider">
              <span>Total</span>
              <strong class="success-total">R$ {{ formatar(preview?.total_final) }}</strong>
            </div>
            <div class="success-row">
              <span>Pagamento</span>
              <strong>{{ preview?.forma_pagamento || '—' }}</strong>
            </div>
            <div v-if="preview?.forma_pagamento === 'Credito'" class="success-row">
              <span>Parcelas</span>
              <strong>{{ preview?.parcelas }}x</strong>
            </div>
          </div>

          <div v-if="!vendaConfirmada" class="success-actions">
            <button class="btn-whatsapp" @click="compartilharWhatsApp">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
              Compartilhar no WhatsApp
            </button>
            <button class="btn-pdf" @click="baixarPDF">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              Baixar PDF
            </button>
          </div>

          <div v-if="!vendaConfirmada" class="previa-actions">
            <button class="btn-voltar-previa" @click="fecharPrevia">Voltar</button>
            <button class="btn-efetivar" :disabled="efetivando" @click="confirmarVenda">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
              {{ efetivando ? 'Efetivando...' : 'Efetivar Venda' }}
            </button>
          </div>

          <button v-else class="btn-nova-venda" @click="fecharPrevia">Nova Venda</button>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script>
import { supabase } from '../services/supabase.js'
import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'
import logoSrc from '../assets/manuari-logotipo-300dpi.png'

export default {
  name: 'PdvView',

  data() {
    return {
      produtos: [],
      busca: '',
      carregando: false,
      carrinho: [],
      desconto: 0,
      cliente: '',
      formaPagamento: '',
      parcelas: 1,
      drawerAberto: false,
      isLoading: false,
      previaAberto: false,
      preview: null,
      vendaConfirmada: false,
      efetivando: false,
    }
  },

  computed: {
    total() {
      return this.carrinho.reduce((acc, item) => acc + item.subtotal, 0)
    },
    totalFinal() {
      return Math.max(this.total - (this.total * (this.desconto || 0) / 100), 0)
    },
    totalItens() {
      return this.carrinho.reduce((acc, item) => acc + item.quantidade, 0)
    },
    produtosFiltrados() {
      const termo = this.busca.trim().toLowerCase()
      if (!termo) return this.produtos
      return this.produtos.filter((p) => {
        return (p.nome || '').toLowerCase().includes(termo)
          || (p.codigo || '').toLowerCase().includes(termo)
      })
    },
  },

  mounted() {
    this.buscarProdutos()
  },

  methods: {
    formatar(valor) {
      if (valor === null || valor === undefined) return '0,00'
      return Number(valor).toFixed(2).replace('.', ',')
    },

    async buscarProdutos() {
      this.carregando = true

      const { data: vendasData, error: vendasError } = await supabase
        .from('itens_venda_erp')
        .select('produto_id, quantidade')

      const mapaVendas = {}
      if (!vendasError && vendasData) {
        for (const item of vendasData) {
          mapaVendas[item.produto_id] = (mapaVendas[item.produto_id] || 0) + item.quantidade
        }
      }

      const { data, error } = await supabase
        .from('produtos_erp')
        .select('*')
        .eq('ativo', true)

      if (!error && data) {
        this.produtos = data
          .map((p) => ({
            ...p,
            totalVendido: mapaVendas[p.id] || 0,
          }))
          .sort((a, b) => b.totalVendido - a.totalVendido)
      } else {
        this.produtos = []
      }

      this.carregando = false
    },

    adicionar(produto) {
      const existente = this.carrinho.find((i) => i.produto_id === produto.id)
      if (existente) {
        existente.quantidade++
        existente.subtotal = existente.quantidade * existente.preco
      } else {
        this.carrinho.push({
          produto_id: produto.id,
          nome: produto.nome,
          preco: Number(produto.preco_venda),
          quantidade: 1,
          subtotal: Number(produto.preco_venda),
        })
      }
      // Feedback tátil sutil
      if (window.navigator?.vibrate) window.navigator.vibrate(10)
    },

    aumentar(i) {
      this.carrinho[i].quantidade++
      this.carrinho[i].subtotal = this.carrinho[i].quantidade * this.carrinho[i].preco
    },

    diminuir(i) {
      if (this.carrinho[i].quantidade <= 1) {
        this.remover(i)
        return
      }
      this.carrinho[i].quantidade--
      this.carrinho[i].subtotal = this.carrinho[i].quantidade * this.carrinho[i].preco
    },

    remover(i) {
      this.carrinho.splice(i, 1)
      if (!this.carrinho.length) {
        this.drawerAberto = false
        this.desconto = 0
      }
    },

    limparCarrinho() {
      this.carrinho = []
      this.desconto = 0
      this.cliente = ''
      this.formaPagamento = ''
      this.parcelas = 1
      this.drawerAberto = false
    },

    recalcular() {
      // força reatividade do computed
    },

    abrirDrawer() {
      this.drawerAberto = true
    },

    async finalizar() {
      if (!this.carrinho.length) return
      if (!this.formaPagamento) {
        alert('Selecione a forma de pagamento')
        return
      }

      this.isLoading = true

      try {
        const previewData = {
          cliente: this.cliente,
          total_bruto: this.total,
          desconto: this.desconto || 0,
          total_final: this.totalFinal,
          forma_pagamento: this.formaPagamento,
          parcelas: this.formaPagamento === 'Credito' ? this.parcelas : 1,
          itens: this.totalItens,
          data: new Date().toLocaleString('pt-BR'),
          itensDetalhados: this.carrinho.map((i) => ({ ...i })),
        }

        this.preview = previewData
        this.drawerAberto = false
        this.previaAberto = true
      } catch (error) {
        console.error(error)
        alert('Erro ao gerar prévia: ' + (error.message || 'Erro desconhecido'))
      } finally {
        this.isLoading = false
      }
    },

    fecharPrevia() {
      this.previaAberto = false
      this.preview = null
      this.vendaConfirmada = false
    },

    async confirmarVenda() {
      if (this.efetivando) return

      this.efetivando = true

      try {
        const payload = {
          cliente: this.preview?.cliente || null,
          data_venda: new Date().toISOString(),
          total_bruto: this.preview?.total_bruto || 0,
          desconto: this.preview?.desconto || 0,
          total_final: this.preview?.total_final || 0,
          forma_pagamento: this.preview?.forma_pagamento || '',
          parcelas: this.preview?.parcelas || 1,
        }

        const { data: vendaSalva, error: erroVenda } = await supabase
          .from('vendas_erp')
          .insert([payload])
          .select()
          .single()

        if (erroVenda) throw erroVenda

        const custosMap = {}
        for (const item of this.preview?.itensDetalhados || []) {
          const { data: produto } = await supabase
            .from('produtos_erp')
            .select('preco_custo')
            .eq('id', item.produto_id)
            .single()
          custosMap[item.produto_id] = produto?.preco_custo || 0
        }

        const itens = (this.preview?.itensDetalhados || []).map((item) => ({
          venda_id: vendaSalva.id,
          produto_id: item.produto_id,
          quantidade: item.quantidade,
          preco_unitario: item.preco,
          subtotal: item.subtotal,
          preco_custo: custosMap[item.produto_id] || 0,
        }))

        const { error: erroItens } = await supabase
          .from('itens_venda_erp')
          .insert(itens)

        if (erroItens) throw erroItens

        for (const item of this.preview?.itensDetalhados || []) {
          const { data: produto } = await supabase
            .from('produtos_erp')
            .select('estoque')
            .eq('id', item.produto_id)
            .single()

          const novoEstoque = (produto?.estoque || 0) - item.quantidade

          await supabase
            .from('produtos_erp')
            .update({ estoque: novoEstoque })
            .eq('id', item.produto_id)

          await supabase
            .from('estoque_movimentacoes')
            .insert([{
              produto_id: item.produto_id,
              tipo: 'saida',
              quantidade: item.quantidade,
              observacao: `PDV Venda ${vendaSalva.id}`,
            }])
        }

        window.dispatchEvent(new Event('estoque-atualizado'))

        this.vendaConfirmada = true

        this.carrinho = []
        this.desconto = 0
        this.cliente = ''
        this.formaPagamento = ''
        this.parcelas = 1
        this.buscarProdutos()

      } catch (error) {
        console.error(error)
        alert('Erro ao efetivar venda: ' + (error.message || 'Erro desconhecido'))
      } finally {
        this.efetivando = false
      }
    },

    async gerarPDF() {
      const v = this.preview
      if (!v) return null

      const doc = new jsPDF({ unit: 'mm', format: 'a4' })
      const pageWidth = 210
      const margin = 18

      const logoImg = new Image()
      logoImg.src = logoSrc
      await new Promise((resolve) => { logoImg.onload = resolve })

      const logoW = 40
      const logoH = (logoImg.naturalHeight / logoImg.naturalWidth) * logoW
      doc.addImage(logoImg, 'PNG', margin, 14, logoW, logoH)

      doc.setFontSize(16)
      doc.setFont(undefined, 'bold')
      doc.setTextColor(31, 41, 55)
      doc.text('MANUARI', pageWidth - margin, 18, { align: 'right' })

      doc.setFontSize(8)
      doc.setFont(undefined, 'normal')
      doc.setTextColor(102, 112, 133)
      doc.text('CNPJ: 61.175.754/0001-77', pageWidth - margin, 24, { align: 'right' })
      doc.text('RUA ITARUMAO, 30, CIDADE NOVA - MANAUS, AM', pageWidth - margin, 29, { align: 'right' })

      const headerBottom = Math.max(14 + logoH, 32) + 4
      doc.setDrawColor(232, 110, 26)
      doc.setLineWidth(0.8)
      doc.line(margin, headerBottom, pageWidth - margin, headerBottom)

      let y = headerBottom + 10
      doc.setFontSize(14)
      doc.setFont(undefined, 'bold')
      doc.setTextColor(232, 110, 26)
      doc.text('ORÇAMENTO', margin, y)

      y += 8
      doc.setFontSize(9)
      doc.setFont(undefined, 'normal')
      doc.setTextColor(102, 112, 133)
      doc.text('Data', margin, y)
      doc.setTextColor(31, 41, 55)
      doc.setFont(undefined, 'bold')
      doc.text(v.data || '-', margin + 20, y)

      doc.setTextColor(102, 112, 133)
      doc.setFont(undefined, 'normal')
      doc.text('Cliente', pageWidth / 2, y)
      doc.setTextColor(31, 41, 55)
      doc.setFont(undefined, 'bold')
      doc.text(v.cliente || '—', pageWidth / 2 + 22, y)

      y += 10
      const headers = [['Qtd', 'Produto', 'Valor Unit.', 'Subtotal']]
      const rows = (v.itensDetalhados || []).map((item) => [
        String(item.quantidade),
        item.nome,
        'R$ ' + this.formatar(item.preco),
        'R$ ' + this.formatar(item.subtotal),
      ])

      autoTable(doc, {
        head: headers,
        body: rows,
        startY: y,
        margin: { left: margin, right: margin },
        headStyles: {
          fillColor: [232, 110, 26],
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: 'bold',
          halign: 'center',
        },
        bodyStyles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 18, halign: 'center' },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 48, halign: 'right' },
          3: { cellWidth: 48, halign: 'right' },
        },
      })

      y = doc.lastAutoTable.finalY + 8
      const totalLabelX = margin
      const totalValueX = pageWidth - margin

      doc.setFontSize(9)
      doc.setFont(undefined, 'normal')
      doc.setTextColor(102, 112, 133)
      doc.text('Subtotal', totalLabelX, y)
      doc.setTextColor(31, 41, 55)
      doc.setFont(undefined, 'bold')
      doc.text('R$ ' + this.formatar(v.total_bruto), totalValueX, y, { align: 'right' })

      if (v.desconto > 0) {
        y += 6
        const valorDesconto = (v.total_bruto || 0) * (v.desconto || 0) / 100
        doc.setFont(undefined, 'normal')
        doc.setTextColor(217, 79, 79)
        doc.text('Desconto (' + this.formatar(v.desconto) + '%)', totalLabelX, y)
        doc.text('- R$ ' + this.formatar(valorDesconto), totalValueX, y, { align: 'right' })
      }

      y += 5
      doc.setDrawColor(217, 79, 79)
      doc.setLineWidth(0.3)
      doc.line(totalLabelX, y, totalValueX, y)
      y += 6

      doc.setFont(undefined, 'bold')
      doc.setFontSize(13)
      doc.setTextColor(232, 110, 26)
      doc.text('TOTAL', totalLabelX, y)
      doc.text('R$ ' + this.formatar(v.total_final), totalValueX, y, { align: 'right' })

      y += 10
      doc.setFontSize(9)
      doc.setFont(undefined, 'normal')
      doc.setTextColor(102, 112, 133)
      doc.text('Forma de pagamento:', margin, y)
      doc.setTextColor(31, 41, 55)
      doc.setFont(undefined, 'bold')
      doc.text(v.forma_pagamento || '—', margin + 44, y)

      if (v.forma_pagamento === 'Credito') {
        doc.setTextColor(102, 112, 133)
        doc.setFont(undefined, 'normal')
        doc.text('Parcelas:', pageWidth / 2, y)
        doc.setTextColor(31, 41, 55)
        doc.setFont(undefined, 'bold')
        doc.text((v.parcelas || 1) + 'x', pageWidth / 2 + 28, y)
      }

      y = 275
      doc.setDrawColor(232, 110, 26)
      doc.setLineWidth(0.5)
      doc.line(margin, y, pageWidth - margin, y)
      y += 6
      doc.setFontSize(8)
      doc.setFont(undefined, 'normal')
      doc.setTextColor(148, 163, 184)
      doc.text('Manuari — CNPJ: 61.175.754/0001-77', pageWidth / 2, y, { align: 'center' })
      y += 4
      doc.text('RUA ITARUMAO, 30, CIDADE NOVA - MANAUS, AM', pageWidth / 2, y, { align: 'center' })
      y += 4
      doc.text('(Endereço de retirada)', pageWidth / 2, y, { align: 'center' })
      y += 6
      doc.text('Obrigado pela preferência!', pageWidth / 2, y, { align: 'center' })

      return doc.output('blob')
    },

    async baixarPDF() {
      const pdfBlob = await this.gerarPDF()
      if (!pdfBlob) return

      const filename = 'orcamento_manuari_' + Date.now() + '.pdf'
      const url = URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    },

    async compartilharWhatsApp() {
      const v = this.preview
      if (!v) return

      const pdfBlob = await this.gerarPDF()
      if (!pdfBlob) return

      const filename = 'orcamento_manuari_' + Date.now() + '.pdf'

      if (navigator.share && navigator.canShare) {
        try {
          const file = new File([pdfBlob], filename, { type: 'application/pdf' })
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: 'Orçamento Manuari',
              text: 'Orçamento - Total: R$ ' + this.formatar(v.total_final),
              files: [file],
            })
            return
          }
        } catch (e) {
          if (e.name !== 'AbortError') console.error(e)
        }
      }

      const url = URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      let texto = '🛒 *Manuari — Orçamento*\n\n'
      texto += '📅 ' + (v.data || new Date().toLocaleString('pt-BR')) + '\n'
      if (v.cliente) texto += '👤 ' + v.cliente + '\n'
      texto += '\n*Itens:*\n'
      for (const item of v.itensDetalhados || []) {
        texto += '• ' + item.quantidade + 'x ' + item.nome + ' — R$ ' + this.formatar(item.subtotal) + '\n'
      }
      texto += '\n*Subtotal:* R$ ' + this.formatar(v.total_bruto)
      if (v.desconto > 0) {
        texto += '\n*Desconto:* ' + this.formatar(v.desconto) + '%'
      }
      texto += '\n*Total: R$ ' + this.formatar(v.total_final) + '*'
      texto += '\n💳 ' + (v.forma_pagamento || '—')

      window.open('https://wa.me/?text=' + encodeURIComponent(texto), '_blank')
    },

  },
}
</script>

<style scoped>
/* ===== VARIÁVEIS LOCAIS ===== */
.pdv {
  --pdv-radius: 12px;
  --pdv-radius-sm: 8px;
  --pdv-gap: 10px;
  --header-h: 52px;
  --bar-h: 60px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg);
}

/* ===== HEADER ===== */
.pdv-header {
  position: sticky;
  top: 0;
  z-index: 20;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  padding: 8px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pdv-header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.pdv-title {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text);
}

.pdv-cart-badge {
  position: relative;
  display: none;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--text-muted);
  cursor: pointer;
}

.pdv-cart-count {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 999px;
  background: var(--primary);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 10px;
  color: var(--text-dim);
  pointer-events: none;
}

.search-input {
  width: 100%;
  height: 38px;
  padding: 0 34px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface-soft);
  color: var(--text);
  font-size: 14px;
  font-weight: 500;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(232, 110, 26, 0.1);
  background: var(--surface);
}

.search-clear {
  position: absolute;
  right: 6px;
  width: 26px;
  height: 26px;
  border: none;
  border-radius: 50%;
  background: var(--surface-muted);
  color: var(--text-muted);
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ===== BODY ===== */
.pdv-body {
  flex: 1;
  display: flex;
  gap: 0;
  padding: 0;
  max-width: 1520px;
  margin: 0 auto;
  width: 100%;
}

/* ===== PRODUTOS ===== */
.products-column {
  flex: 1;
  padding: 12px;
  min-width: 0;
}

.state-msg {
  text-align: center;
  padding: 48px 16px;
  color: var(--text-muted);
  font-size: 14px;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: var(--pdv-gap);
}

.product-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--pdv-radius);
  padding: 14px;
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
  width: 100%;
  font-family: inherit;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}

.product-card:active {
  transform: scale(0.97);
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(232, 110, 26, 0.12);
}

.product-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.product-nome {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-codigo {
  font-size: 11px;
  color: var(--text-dim);
  font-weight: 500;
}

.product-preco {
  font-size: 16px;
  font-weight: 700;
  color: var(--primary);
  margin-top: 6px;
}

.product-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  gap: 6px;
}

.product-estoque {
  font-size: 11px;
  color: var(--success);
  font-weight: 600;
}

.product-estoque.baixo {
  color: var(--warning);
}

.product-estoque.zerado {
  color: var(--danger);
}

.product-add {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  background: var(--primary);
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  line-height: 1;
}

/* ===== CARRINHO SIDEBAR (DESKTOP) ===== */
.cart-sidebar {
  width: 300px;
  flex-shrink: 0;
  border-left: 1px solid var(--border);
  background: var(--surface);
  display: flex;
  flex-direction: column;
  height: auto;
  position: sticky;
  top: var(--header-h);
}

.cart-sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.cart-sidebar-header h2 {
  font-size: 15px;
  font-weight: 700;
}

.cart-sidebar-count {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 600;
}

.cart-sidebar-items {
  padding: 6px 10px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.cart-sidebar-footer {
  border-top: 1px solid var(--border);
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}

/* ===== PRÉVIA SIDEBAR ===== */
.previa-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.previa-summary-card {
  background: var(--surface-soft);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.previa-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--surface-soft);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 13px;
}

.previa-item-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.previa-item-qty {
  font-weight: 700;
  color: var(--primary);
  flex-shrink: 0;
}

.previa-item-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.previa-item-sub {
  font-weight: 600;
  color: var(--text);
  flex-shrink: 0;
  font-feature-settings: 'tnum' 1;
}

.previa-totals {
  background: var(--primary-soft);
  border: 1px solid var(--primary);
  border-radius: var(--radius-sm);
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.previa-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: var(--text-muted);
}

.previa-row strong {
  color: var(--text);
}

.previa-desconto {
  color: var(--danger) !important;
  font-weight: 600;
}

.previa-divider {
  height: 1px;
  background: var(--border);
  margin: 2px 0;
}

.previa-total {
  font-size: 16px;
  font-weight: 700;
  color: var(--primary) !important;
}

.previa-total span:last-child {
  color: var(--primary);
}

.previa-footer {
  display: flex;
  gap: 6px;
  flex-direction: row !important;
}

.previa-footer .btn-whatsapp,
.previa-footer .btn-pdf-sm {
  flex: 1;
  height: 36px;
  padding: 0 10px;
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: 12px;
  cursor: pointer;
  font-family: inherit;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.15s;
}

.previa-footer .btn-whatsapp {
  background: #25D366;
  border: 1px solid #25D366;
  color: #fff;
}

.previa-footer .btn-whatsapp:hover {
  background: #1ebe5d;
}

.previa-footer .btn-pdf-sm {
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--danger);
}

.previa-footer .btn-pdf-sm:hover {
  background: var(--danger-soft);
  border-color: var(--danger);
}

.btn-voltar-previa-sm {
  height: 30px;
  padding: 0 10px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}

.btn-voltar-previa-sm:hover {
  background: var(--surface-soft);
  color: var(--text);
}

.previa-actions-sidebar {
  padding: 0 16px 14px;
}

.previa-actions-sidebar .btn-efetivar {
  width: 100%;
  height: 40px;
  border-radius: var(--radius-sm);
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  font-family: inherit;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.15s;
  background: var(--success);
  border: 1px solid var(--success);
  color: #fff;
}

.previa-actions-sidebar .btn-efetivar:hover:not(:disabled) {
  background: var(--success-hover);
}

.previa-actions-sidebar .btn-efetivar:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ===== CART ITEM (compartilhado drawer/sidebar) ===== */
.cart-item {
  background: var(--surface-soft);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cart-item-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.cart-item-nome {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
}

.cart-item-preco-unit {
  font-size: 11px;
  color: var(--text-muted);
}

.cart-item-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qty-btn {
  width: 28px;
  height: 28px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--text);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.1s;
  font-family: inherit;
}

.qty-btn:hover {
  background: var(--surface-muted);
}

.qty-btn:active {
  background: var(--border);
}

.qty-value {
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
  min-width: 20px;
  text-align: center;
  font-feature-settings: 'tnum' 1;
}

.cart-item-subtotal {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  margin-left: auto;
  font-feature-settings: 'tnum' 1;
}

.cart-item-remove {
  width: 26px;
  height: 26px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--text-dim);
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  flex-shrink: 0;
  font-family: inherit;
}

.cart-item-remove:hover {
  background: var(--danger-soft);
  color: var(--danger);
}

/* ===== SUMMARY ===== */
.cart-summary {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cart-summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: var(--text-muted);
}

.cart-summary-row.total {
  font-size: 16px;
  font-weight: 700;
  color: var(--primary);
  padding-top: 6px;
  border-top: 1px solid var(--border);
  margin-top: 2px;
}

.cart-discount-input {
  display: flex;
  align-items: center;
  gap: 4px;
}

.cart-discount-input input {
  width: 52px;
  height: 30px;
  padding: 0 6px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
}

.cart-discount-input input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(232, 110, 26, 0.1);
}

/* ===== CART FIELDS ===== */
.cart-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cart-field label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.cart-field input,
.cart-field select {
  width: 100%;
  height: 36px;
  padding: 0 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--text);
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
}

.cart-field input:focus,
.cart-field select:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(232, 110, 26, 0.1);
}

/* ===== BUTTONS ===== */
.cart-buttons {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.btn-limpar,
.btn-finalizar {
  flex: 1;
  height: 40px;
  padding: 0 16px;
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
  white-space: nowrap;
}

.btn-limpar {
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text-muted);
}

.btn-limpar:hover {
  background: var(--surface-soft);
  color: var(--text);
}

.btn-finalizar {
  background: var(--primary);
  border: 1px solid var(--primary);
  color: #fff;
}

.btn-finalizar:hover:not(:disabled) {
  background: var(--primary-hover);
}

.btn-finalizar:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ===== MOBILE: CART BAR ===== */
.cart-bar {
  position: fixed;
  bottom: 16px;
  left: 16px;
  right: 16px;
  height: 56px;
  background: var(--text);
  color: #fff;
  border-radius: var(--pdv-radius);
  padding: 0 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 8px 32px rgba(15, 23, 42, 0.35);
  cursor: pointer;
  z-index: 40;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}

.cart-bar:active {
  transform: scale(0.98);
}

.cart-bar-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.cart-bar-count {
  font-size: 14px;
  font-weight: 600;
}

.cart-bar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cart-bar-total {
  font-size: 16px;
  font-weight: 700;
}

/* ===== MOBILE: DRAWER ===== */
.drawer-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: rgba(15, 23, 42, 0.4);
  display: flex;
  align-items: flex-end;
}

.drawer {
  width: 100%;
  max-height: 85vh;
  background: var(--surface);
  border-radius: var(--pdv-radius) var(--pdv-radius) 0 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 10px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.drawer-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.drawer-header-left svg {
  color: var(--text-muted);
}

.drawer-header-left h2 {
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
}

.drawer-count {
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--primary-soft);
  color: var(--primary);
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.drawer-close {
  width: 32px;
  height: 32px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface-soft);
  color: var(--text-muted);
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: inherit;
}

.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.drawer-empty {
  text-align: center;
  padding: 32px 16px;
  color: var(--text-muted);
}

.drawer-empty p {
  font-size: 14px;
  margin-bottom: 12px;
}

.btn-voltar {
  padding: 0 16px;
  height: 36px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--text);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}

.drawer-itens {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.drawer-summary {
  background: var(--surface-soft);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.drawer-fields {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.drawer-footer {
  display: flex;
  gap: 8px;
  padding: 12px 16px 16px;
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}

.drawer-footer .btn-limpar,
.drawer-footer .btn-finalizar {
  height: 44px;
  font-size: 14px;
}

/* ===== MODAL SUCESSO ===== */
.success-drawer {
  max-height: 90vh;
  padding: 0;
}

.success-check {
  display: flex;
  justify-content: center;
  padding: 24px 16px 0;
  color: var(--primary);
}

.success-check.confirmado {
  color: var(--success);
}

.success-title {
  text-align: center;
  font-size: 22px;
  font-weight: 700;
  margin: 10px 0 2px;
  color: var(--text);
}

.success-sub {
  text-align: center;
  font-size: 15px;
  color: var(--text-muted);
  margin-bottom: 18px;
}

.success-info {
  margin: 0 16px;
  padding: 14px 16px;
  background: var(--surface-soft);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.success-row {
  display: flex;
  justify-content: space-between;
  font-size: 15px;
  color: var(--text-muted);
}

.success-row strong {
  color: var(--text);
  font-weight: 600;
  font-size: 15px;
}

.success-desconto {
  color: var(--danger) !important;
  font-weight: 600 !important;
  font-size: 14px !important;
}

.success-divider {
  padding-top: 6px;
  border-top: 1px solid var(--border);
  margin-top: 4px;
}

.success-item {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: var(--text-muted);
  padding-left: 8px;
  border-left: 2px solid var(--border);
}

.success-item span:last-child {
  color: var(--text);
  font-weight: 500;
}

.success-total {
  color: var(--primary) !important;
  font-size: 18px !important;
  font-weight: 700 !important;
}

.success-actions {
  padding: 16px 16px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn-whatsapp,
.btn-pdf {
  height: 48px;
  padding: 0 16px;
  border-radius: var(--radius-sm);
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
  font-family: inherit;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.15s;
}

.btn-whatsapp {
  background: #25D366;
  border: 1px solid #25D366;
  color: #fff;
}

.btn-whatsapp:hover {
  background: #1ebe5d;
}

.btn-pdf {
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text);
}

.btn-pdf:hover {
  background: var(--surface-soft);
  color: var(--danger);
  border-color: var(--danger);
}

.previa-actions {
  padding: 8px 16px 0;
  display: flex;
  gap: 8px;
}

.btn-voltar-previa,
.btn-efetivar {
  flex: 1;
  height: 48px;
  padding: 0 16px;
  border-radius: var(--radius-sm);
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
  font-family: inherit;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.15s;
}

.btn-voltar-previa {
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text-muted);
}

.btn-voltar-previa:hover {
  background: var(--surface-soft);
  color: var(--text);
}

.btn-efetivar {
  background: var(--success);
  border: 1px solid var(--success);
  color: #fff;
}

.btn-efetivar:hover:not(:disabled) {
  background: var(--success-hover);
}

.btn-efetivar:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-nova-venda {
  margin: 8px 16px 16px;
  height: 48px;
  padding: 0 16px;
  border-radius: var(--radius-sm);
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
  font-family: inherit;
  background: var(--primary);
  border: 1px solid var(--primary);
  color: #fff;
  transition: all 0.15s;
}

.btn-nova-venda:hover {
  background: var(--primary-hover);
}

/* ===== TRANSITIONS ===== */
.grid-enter-active,
.grid-leave-active {
  transition: all 0.2s ease;
}
.grid-enter-from {
  opacity: 0;
  transform: scale(0.95);
}
.grid-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.item-enter-active,
.item-leave-active {
  transition: all 0.2s ease;
}
.item-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}
.item-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.bar-enter-active {
  transition: all 0.3s ease;
}
.bar-leave-active {
  transition: all 0.2s ease;
}
.bar-enter-from,
.bar-leave-to {
  transform: translateY(100px);
  opacity: 0;
}

/* ===== RESPONSIVO ===== */

/* Desktop (>= 1024px) — sidebar visible */
@media (min-width: 1024px) {
  .pdv-header {
    padding: 8px 24px;
  }

  .pdv-title {
    font-size: 22px;
  }

  .pdv-cart-badge {
    display: none;
  }

  .products-column {
    padding: 16px 20px;
  }

  .product-grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 12px;
  }

  .cart-bar {
    display: none !important;
  }

  .drawer-overlay {
    display: none !important;
  }
}

/* Tablet / mobile landscape */
@media (max-width: 1023px) {
  .cart-sidebar {
    display: none !important;
  }

  .pdv-cart-badge {
    display: flex;
  }

  .pdv-body {
    padding-bottom: 80px;
  }

  .product-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Mobile small */
@media (max-width: 420px) {
  .product-grid {
    grid-template-columns: 1fr;
  }

  .product-card {
    flex-direction: row;
    align-items: center;
    padding: 12px 14px;
  }

  .product-info {
    flex: 1;
  }

  .product-nome {
    font-size: 14px;
  }

  .product-preco {
    margin-top: 2px;
    font-size: 15px;
  }

  .product-footer {
    flex-direction: column;
    align-items: flex-end;
    margin-top: 0;
    gap: 4px;
  }

  .product-estoque {
    font-size: 10px;
  }

  .product-add {
    width: 32px;
    height: 32px;
    font-size: 20px;
  }
}
</style>
