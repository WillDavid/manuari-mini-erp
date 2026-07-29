# Manuari ERP — Documentação Completa do Projeto

---

## 0. INSTRUCOES PARA IA — LEIA ANTES DE QUALQUER ALTERACAO

### Regras Obrigatorias

| Regra | Detalhe |
|-------|---------|
| **Options API sempre** | `data()`, `methods: {}`, `computed: {}`, `watch: {}`. NUNCA `<script setup>` ou Composition API (exceto `SalesEvolutionChart.vue` que ja existe) |
| **JavaScript puro** | Sem TypeScript. `props: ['foo']`, nao `defineProps<{...}>()` |
| **Portugues** | Metodos, variaveis, comentarios em pt-BR |
| **Nao usar composables existentes** | `src/composables/use*.js` — estao DEPRECIADOS e NAO devem ser importados. A logica esta inline no `DashboardView.vue`. Se for refatorar, migre tudo para Options API |
| **Nao usar Pinia / store** | Estado e local em cada view. Comunicacao cross-component via `window.dispatchEvent('estoque-atualizado')` |
| **Formato moeda** | Display: `Number(v).toFixed(2).replace('.', ',')` — virgula como decimal |
| **Formato data** | Display: `data.split('T')[0].split('-').reverse().join('/')` — DD/MM/YYYY |
| **preco_custo obrigatorio** | Todo INSERT em `itens_venda_erp` DEVE incluir `preco_custo` (buscar do `produtos_erp.preco_custo` no momento da venda) |
| **Fluxo de estoque** | Toda alteracao de estoque deve: (1) atualizar `produtos_erp.estoque`, (2) inserir `estoque_movimentacoes`, (3) disparar `window.dispatchEvent(new Event('estoque-atualizado'))` |
| **Validacao de estoque** | Antes de venda, verificar `estoque >= quantidade` para cada item. Se insuficiente, `alert('Estoque insuficiente para: ' + nome)` |
| **Sem paginacao server-side** | Todas queries usam `select('*')` sem `.range()`. Paginacao e client-side com `slice()` |
| **CSS scoped** | Todo `<style scoped>`. Usar variaveis CSS (`--primary`, `--border`, etc.), nao cores hardcoded |
| **Modal pattern** | overlay `z-index:2000` + card + header + body + footer. Fechar no `@click.self` do overlay e tecla Escape |
| **Nomes em portugues** | `modalAberto`, `carregando`, `buscarVendas()`, `salvarProduto()`, `itensPorPagina` |
| **Recarregar apos mutacao** | Sempre chamar `buscar*()` no fim de metodos que alteram dados |
| **Feedback com alert()** | Usar `alert()` para erros/sucesso, nao toast notifications |
| **ApexCharts para graficos** | Usar `vue3-apexcharts`. NAO usar `echarts`/`vue-echarts` (esta no package.json mas deprecated) |
| **jspdf-autotable** | Pode importar estatico (`import { autoTable }`) ou dinamico (`await import('jspdf-autotable')`). Ambos funcionam |

### Antes de Criar Novos Arquivos

- Sempre verificar se a logica ja existe (ex: `formatarMoeda` ja definido em varias views)
- Constantes como `TIPOS_PADRAO` e `CATEGORIAS_PADRAO` estao duplicadas em `VitrineView.vue` e `ModalProdutoVitrine.vue` — NAO duplicar novamente
- Seguir o estilo de componentes existentes como referencia

### Banco de Dados — Tabelas Principais

| Tabela | Funcao |
|--------|--------|
| `produtos_erp` | Catalogo de produtos (nome, codigo, preco_custo, preco_venda, estoque, ativo) |
| `vendas_erp` | Vendas (cliente, data_venda, total_bruto, desconto, total_final, forma_pagamento, parcelas) |
| `itens_venda_erp` | Itens da venda (venda_id, produto_id, quantidade, preco_unitario, **preco_custo**, subtotal) |
| `estoque_movimentacoes` | Auditoria de estoque (produto_id, tipo [entrada/saida], quantidade, observacao) |
| `vitrine` | Vitrine de produtos personalizados (name, tipo, categorias[], images[], acessos) |
| `vitrine_variacoes` | Variacoes do produto vitrine (vitrine_id, nome, tipo_variacao, ordem) |
| `vitrine_precos` | Precos por variacao (variacao_id, preco, ordem) |
| `vitrine_precos_faixas` | Faixas de preco por quantidade (variacao_id, quantidade_minima, quantidade_label, preco, destaque) |
| `vitrine_acessos` | Registro de acessos a vitrine (vitrine_id, data_acesso, hora_acesso, ip_hash, dispositivo, fonte) |
| `metas_mensais` | Metas de faturamento mensal (ano, mes, valor_meta) |
| `fluxo_caixa_saldo_inicial` | Saldo inicial do fluxo de caixa (valor_inicial, data_referencia) |
| `fluxo_caixa_lancamentos` | Lancamentos do fluxo de caixa (tipo, valor, data, categoria, forma_pagamento) |
| `fluxo_caixa_contas_receber` | Contas a receber de vendas parceladas (venda_id, valor, parcela, data_vencimento, status) |

### Servicos

- **Supabase:** importar de `'../services/supabase.js'` (cliente ja configurado)
- **Supabase Storage:** bucket `'products'`, path `{tipo}/{timestamp}-{sanitized_filename}`
- **Auth:** `localStorage.getItem('authExpires')` — senha `tuti@123`

---

## 1. VISÃO GERAL

Sistema ERP single-page para o negócio "Manuari", desenvolvido com Vue 3 (Options API), Vite 8, Supabase (PostgreSQL + Storage) e JavaScript puro. A aplicação gerencia produtos, vendas, estoque, fluxo de caixa (lancamentos + contas a receber), uma vitrine de produtos personalizados com variações, preços e faixas de preço, além de dashboard com KPIs e PDV mobile-first com PWA. A interface utiliza sidebar colapsavel para navegação.

**Repositório GitHub:** `https://github.com/WillDavid/manuari-mini-erp`
**URL Supabase:** `https://byriesholblgyysnmnpu.supabase.co`
**Senha de acesso:** `tuti@123`
**Idioma:** Português (pt-BR)

---

## 2. STACK TECNOLÓGICA

| Categoria | Tecnologia | Versão |
|-----------|-----------|--------|
| Framework | Vue 3 (Options API) | ^3.5.39 |
| Build | Vite | ^8.1.0 |
| Plugin Vue | @vitejs/plugin-vue | ^6.0.7 |
| Roteamento | vue-router (createWebHistory) | ^5.1.0 |
| Backend/DB | Supabase (PostgreSQL) | ^2.108.2 |
| Gráficos | ApexCharts + vue3-apexcharts | ^5.15.2 / ^1.11.1 |
| Excel | xlsx | ^0.18.5 |
| PDF | jspdf + jspdf-autotable | ^4.2.1 / ^5.0.8 |
| Crop Imagens | vue-advanced-cropper | ^2.8.9 |
| Fonte | Inter (Google Fonts) | — |
| Deploy | Vercel (SPA rewrite) | — |
| Lint | ESLint + Prettier | ^10.5.0 / ^3.8.4 |
| Unit Tests | Vitest + @vue/test-utils | ^4.1.9 / ^2.4.11 |
| E2E Tests | Playwright | ^1.61.1 |
| TypeScript | tsconfig (allowJs, checkJs: false) | ^5.x |

**NÃO utiliza:** Composition API, `<script setup>`, Pinia, REST API, Docker, env vars (.env), biblioteca de UI components.

---

## 3. ESTRUTURA DE ARQUIVOS (COMPLETA)

```
vue-manuari-erp/
├── .gitignore                          # Ignora node_modules, dist, logs, .vscode exceto extensions.json
├── .prettierrc                         # Configuração do Prettier
├── .vscode/
│   └── extensions.json                 # Recomenda Vue.volar
├── AGENTS.md                           # Este arquivo
├── PROMPT_AUDITORIA.md                 # Prompt para auditoria de código
├── README.md                           # Template padrão Vite (não específico)
├── eslint.config.js                    # ESLint flat config
├── index.html                          # Entry point HTML, lang=pt-BR, Inter font, noindex meta
├── package.json                        # Dependências e scripts (dev, build, preview)
├── tsconfig.json                       # TypeScript config (allowJs, checkJs: false)
├── vercel.json                         # Rewrite todas rotas para / (SPA)
├── vite.config.js                      # Mínimo — apenas plugin Vue
├── vitest.config.js                    # Configuração do Vitest
├── playwright.config.js                # Configuração do Playwright
├── favicon.svg                         # Ícone gradiente roxo
├── icons.svg                           # Ícones SVG
├── public/
│   ├── favicon.svg
│   ├── icons.svg
│   ├── sw.js                           # Service Worker para PWA offline
│   └── manifest.json                   # Manifesto PWA (instalação mobile)
├── supabase/
│   └── migrations/
│       ├── vitrine_acessos.sql          # Migration SQL para tabela de acessos + funções
│       ├── adicionar_custo_itens_venda.sql # Adiciona coluna preco_custo em itens_venda_erp
│       ├── metas_mensais.sql            # Cria tabela metas_mensais + trigger updated_at
│       └── fluxo_caixa.sql              # Cria tabelas fluxo_caixa_saldo_inicial, fluxo_caixa_lancamentos, fluxo_caixa_contas_receber
├── src/
│   ├── main.js                         # Cria app Vue, usa router, importa style.css, registra SW
│   ├── App.vue                         # Componente raiz: Sidebar + FloatingMeta + CommandPalette + <router-view>
│   ├── style.css                       # Reset CSS + design tokens + estilos globais
│   ├── assets/
│   │   └── manuari-logotipo-300dpi.png # Logo da marca
│   ├── router/
│   │   └── index.js                    # 9 rotas + guard de autenticação
│   ├── services/
│   │   └── supabase.js                 # Cliente Supabase com URL/key hardcoded
│   ├── utils/
│   │   ├── exportacao.js              # Geração de Excel para vendas
│   │   └── exportacao.test.js         # Testes unitarios do exportacao.js
│   ├── composables/
│   │   ├── useCharts.js               # (NAO USADO) Factory de opcoes de graficos ApexCharts
│   │   ├── useDashboard.js            # (NAO USADO) Composable de dados do dashboard
│   │   ├── useInsights.js             # (NAO USADO) Gerador de insights textuais
│   │   └── useStatistics.js           # (NAO USADO) Calculos estatisticos
│   ├── views/
│   │   ├── DashboardView.vue          # Dashboard com KPIs, rankings, exportação PDF/Excel
│   │   ├── ProdutosView.vue           # CRUD de produtos ERP
│   │   ├── VendasView.vue             # Gestão de vendas + exportação Excel
│   │   ├── EstoqueView.vue            # Controle de estoque (entrada/saída)
│   │   ├── VitrineView.vue            # Vitrine de produtos personalizados
│   │   ├── PdvView.vue                # PDV mobile-first com PWA
│   │   └── FluxoCaixaView.vue         # Fluxo de caixa (lancamentos, contas a receber, saldo)
│   └── components/
│       ├── UserIdentifier.vue          # Tela de login (senha fixa)
│       ├── Sidebar.vue                 # Sidebar colapsavel com navegacao + alertas + logout
│       ├── Navbar.vue                  # (DEPRECIADO) Antigo header horizontal — nao usado, substituido pelo Sidebar
│       ├── CommandPalette.vue          # Paleta de comando (Cmd+K) com busca e atalhos
│       ├── FloatingMeta.vue            # Widget flutuante de metas mensais
│       ├── ModalProduto.vue            # Form de criar/editar produto ERP
│       ├── ModalVenda.vue             # Form de criar/editar venda
│       ├── ModalMovimentacao.vue      # Form de entrada/saída de estoque
│       ├── ModalProdutoVitrine.vue    # Form COMPLEXO de produto vitrine (687 linhas)
│       ├── ImageManager.vue           # Gerenciador de upload de imagens
│       ├── ImageCropper.vue           # Modal de crop de imagem (quadrado 1:1, 800px min)
│       └── charts/
│           └── SalesEvolutionChart.vue # Grafico de area com ApexCharts (397 linhas, <script setup>)
```

---

## 4. AUTENTICAÇÃO

### Fluxo
1. **Login:** `UserIdentifier.vue` possui senha hardcoded: `const SENHA_CORRETA = 'tuti@123'`
2. Ao digitar senha correta → grava `localStorage.setItem('authExpires', Date.now() + 30 dias)`
3. Redireciona para `/pdv`
4. Senha incorreta → mostra erro, limpa campo

### Router Guard (`src/router/index.js:22-33`)
```js
router.beforeEach((to, from, next) => {
  const expiration = localStorage.getItem('authExpires')
  const isLogged = expiration && Date.now() < parseInt(expiration)
  if (to.meta.requiresAuth && !isLogged) next('/identificar')
  else if (to.path === '/identificar' && isLogged) next('/pdv')
  else next()
})
```

### Logout (`Sidebar.vue`)
```js
localStorage.removeItem('authExpires')
this.$router.push('/identificar')
```

### Notas de segurança
- Senha visível no source code
- Sem hashing, sem JWT do Supabase
- Sem proteção server-side
- Chave anon do Supabase exposta (por design, com RLS)
- Auth via localStorage é trivialmente bypassável via DevTools

---

## 5. ROTAS

| Caminho | Componente | Auth | Descrição |
|---------|-----------|------|-----------|
| `/` | — | Não | Redireciona → `/pdv` |
| `/identificar` | UserIdentifier | Não | Login / tela de senha |
| `/dashboard` | DashboardView | Sim | Dashboard com KPIs e rankings |
| `/produtos` | ProdutosView | Sim | CRUD de produtos do ERP |
| `/vendas` | VendasView | Sim | Vendas + exportação Excel |
| `/estoque` | EstoqueView | Sim | Controle de estoque (entrada/saída) |
| `/vitrine` | VitrineView | Sim | Vitrine de produtos personalizados |
| `/pdv` | PdvView | Sim | PDV mobile-first com PWA |
| `/fluxo-caixa` | FluxoCaixaView | Sim | Fluxo de caixa (lancamentos, contas a receber) |

---

## 6. BANCO DE DADOS (SUPABASE)

### 6.1 Tabelas

#### `produtos_erp`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | PK (auto) | Identificador |
| nome | text | Nome do produto |
| codigo | text | SKU/Código |
| preco_custo | numeric | Preço de custo |
| preco_venda | numeric | Preço de venda |
| estoque | integer | Quantidade em estoque |
| ativo | boolean | Status ativo/inativo |
| created_at | timestamptz | Data de criação |

#### `vendas_erp`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | PK (auto) | Identificador |
| cliente | text | Nome do cliente |
| data_venda | timestamptz | Data da venda |
| total_bruto | numeric | Total sem desconto |
| desconto | numeric | Percentual de desconto |
| total_final | numeric | Total com desconto |
| forma_pagamento | text | Pix / Dinheiro / Credito |
| parcelas | integer | Nº parcelas (crédito) |

#### `itens_venda_erp`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | PK (auto) | Identificador |
| venda_id | FK → vendas_erp.id | Venda pai |
| produto_id | FK → produtos_erp.id | Produto vendido |
| quantidade | integer | Quantidade |
| preco_unitario | numeric | Preço unitário na venda |
| preco_custo | numeric | Custo unitario no momento da venda (default 0) |
| subtotal | numeric | quantidade × preco_unitario |

#### `estoque_movimentacoes`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | PK (auto) | Identificador |
| produto_id | FK → produtos_erp.id | Produto |
| tipo | text | 'entrada' ou 'saida' |
| quantidade | integer | Quantidade movimentada |
| observacao | text | Motivo/observação |
| created_at | timestamptz | Data de criação |

#### `vitrine`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | bigint PK | Identificador |
| name | text | Nome do produto |
| tipo | text | Canecas, Xicaras, etc. |
| categorias | text[] | Array de categorias |
| images | text[] | Array de URLs de imagens |
| acessos | integer | Contador de visitas (default 0) |
| created_at | timestamptz | Data de criação |

#### `vitrine_variacoes`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | PK (auto) | Identificador |
| vitrine_id | FK → vitrine.id (CASCADE) | Produto pai |
| nome | text | Nome (ex: "Branca", "33mm") |
| tipo_variacao | text | cor / tamanho / modelo / material / acabamento / outro |
| ordem | integer | Ordem de exibição |

#### `vitrine_precos`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | PK (auto) | Identificador |
| variacao_id | FK → vitrine_variacoes.id | Variação pai |
| preco | numeric | Valor |
| ordem | integer | Ordem de exibição |

#### `vitrine_precos_faixas`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | PK (auto) | Identificador |
| variacao_id | FK → vitrine_variacoes.id | Variação pai |
| quantidade_minima | integer | Quantidade mínima para faixa |
| quantidade_label | text | Rótulo (ex: "10+ unidades") |
| preco | numeric | Preço da faixa |
| destaque | boolean | Destacar faixa |
| ordem | integer | Ordem de exibição |

#### `vitrine_acessos` (via migration)
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | bigint PK | Identificador |
| vitrine_id | FK → vitrine.id (CASCADE) | Produto acessado |
| data_acesso | date | Data (default CURRENT_DATE) |
| hora_acesso | time | Hora (default CURRENT_TIME) |
| ip_hash | text | Hash do IP |
| dispositivo | text | Info do dispositivo |
| fonte | text | Origem do tráfego |
| created_at | timestamptz | Registro |

#### `fluxo_caixa_saldo_inicial` (via migration)
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | serial PK | Identificador |
| valor_inicial | numeric(12,2) | Saldo inicial (default 0) |
| data_referencia | date | Data de referência (default CURRENT_DATE) |
| observacao | text | Observação opcional |
| created_at | timestamptz | Data de criação |
| updated_at | timestamptz | Data de atualização |

#### `fluxo_caixa_lancamentos` (via migration)
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | serial PK | Identificador |
| tipo | text (CHECK) | 'entrada', 'saida', 'ajuste_positivo', 'ajuste_negativo' |
| valor | numeric(12,2) | Valor do lançamento (> 0) |
| data | date | Data do lançamento |
| categoria | text | Categoria do lançamento |
| descricao | text | Descrição |
| forma_pagamento | text | Forma de pagamento |
| observacao | text | Observação opcional |
| venda_id | integer | FK opcional para vendas_erp |
| created_at | timestamptz | Data de criação |
| updated_at | timestamptz | Data de atualização |

#### `fluxo_caixa_contas_receber` (via migration)
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | serial PK | Identificador |
| venda_id | integer | FK para vendas_erp |
| descricao | text | Descrição da conta |
| valor | numeric(12,2) | Valor da parcela |
| parcela | integer | Número da parcela (default 1) |
| total_parcelas | integer | Total de parcelas (default 1) |
| data_vencimento | date | Data de vencimento |
| data_recebimento | date | Data de recebimento (nullable) |
| status | text (CHECK) | 'pendente' ou 'recebido' (default 'pendente') |
| forma_pagamento | text | Forma de pagamento |
| created_at | timestamptz | Data de criação |
| updated_at | timestamptz | Data de atualização |

### 6.2 Storage Bucket
- **Nome:** `products`
- **Path pattern:** `{tipo}/{timestamp}-{sanitized_filename}`
- **Exemplo:** `canecas/1711234567890-imagem_produto.jpg`

### 6.3 Funções PostgreSQL (via migration)
| Função | Descrição |
|--------|-----------|
| `registrar_acesso_vitrine(vitrine_id, ip, dispositivo, fonte)` | Registra acesso + incrementa contador |
| `get_vitrine_acessos_periodo(vitrine_id, dias)` | Acessos por dia no período |
| `get_vitrine_top_acessos(dias, limit)` | Top produtos por acessos |
| `get_vitrine_acessos_categoria(dias)` | Acessos agrupados por categoria |
| `get_vitrine_acessos_diarios(dias)` | Série temporal diária para gráficos |

---

## 6.4 Versionamento

A versão do sistema é definida em `package.json` no campo `version` (atualmente `"0.0.0"`).
- A versão é exibida no topo da Sidebar, ao lado do logo, no formato `v0.0.0`.
- O valor é importado dinamicamente do `package.json` via `Sidebar.vue`.

---

## 7. GERENCIAMENTO DE ESTADO

**Não existe store centralizada.** O estado é gerenciado por:

1. **Componente local (`data()`):** Principal abordagem. Cada view mantém seus próprios dados.
2. **Props down / Events up:** Comunicação pai-filho via `$emit()`.
3. **`window.dispatchEvent`:** Comunicação cross-component.
   - Evento `'estoque-atualizado'`: Disparado por ProdutosView, EstoqueView, VendasView, PdvView, DashboardView
   - Sidebar escuta e recarrega alertas de estoque baixo
   - Evento `'abrir-paleta'`: Disparado pelo Navbar para abrir CommandPalette
4. **`localStorage`:** Apenas `authExpires` (timestamp de expiração de login).

---

## 8. COMPONENTES — DETALHAMENTO COMPLETO

### 8.1 App.vue (51 linhas)
- **Template:** `<Sidebar />` + `<main class="app-content"><router-view /></main>` + `<FloatingMeta />` + `<CommandPalette v-if="$route.path !== '/identificar'" />`
- **Layout:** Sidebar fixa à esquerda com `--sidebar-width` CSS variable (240px ou 64px colapsado). Main content ocupa o espaço restante com `margin-left` dinâmico.
- **Mobile (≤768px):** Sidebar vira overlay (menu hamburger), content ocupa 100% com margem superior de 48px para a mobile bar.
- **Responsabilidades:** Apenas renderiza os componentes de layout. CommandPalette é omitido na tela de login.

### 8.2 Sidebar.vue (763 linhas) — COMPONENTE PRINCIPAL DE NAVEGAÇÃO

- **Template:** Mobile top bar (hamburger, logo, versão) + Sidebar fixa com overlay para mobile. Estrutura:
  - **Topo:** Logo + nome Manuari + versão + botão toggle colapsar (chevron)
  - **Navegação:** 7 itens — PDV, Dashboard, Vendas, Estoque, Produtos, Vitrine, Caixa (cada um com SVG inline e active-class)
  - **Espaçador flex:** Empurra bottom items para o rodapé
  - **Bottom:** Botão de notificações (sino) com badge numérico + dropdown de alertas + botão Sair

- **Funcionalidades:**
  - **Colapsar:** Toggle 240px ↔ 64px. Estado salvo em `localStorage('sidebar_collapsed')`. Ao colapsar, mostra tooltips nos itens com hover.
  - **Dropdown de alertas:** Exibe produtos com estoque ≤ 3. Botão "Ver estoque" linka para `/estoque`.
  - **Mobile (≤768px):** Sidebar fica oculta (transform translateX -100%), abre com botão hamburger na mobile-bar. Overlay escuro para fechar.
  - **Hover expand:** No modo colapsado, hover expande temporariamente (não implementado visualmente ainda — placeholder `_hoverExpand`)

- **Lógica:**
  - `buscarAlertasEstoque()`: Query Supabase `produtos_erp` where `ativo = true`, ordenado por estoque ascending. Filtra client-side `estoque <= 3`.
  - Escuta evento `'estoque-atualizado'` no window.
  - `fecharDropdownExterno`: Fecha alertas e menu mobile ao clicar fora (document click listener).
  - `watch '$route.fullPath'`: Fecha menus e recarrega alertas ao mudar rota.
  - `onKeydown`: Escape fecha menus.
  - `logout()`: Remove `authExpires` do localStorage, redireciona para `/identificar`.

- **Sidebar store (localStorage):**
  - Chave `'sidebar_collapsed'`: `'true'` ou `'false'`
  - Lido em `data()` via `lerEstadoSalvo()`, salvo em watch `colapsado`

- **CSS:** Sidebar fixed, height 100vh, z-index 55, transition width 0.25s. Border-right + shadow no mobile open. Tooltip posicionado à direita com opacity 0→1 no hover. Mobile bar fixed top 0, height 48px.

### 8.3 UserIdentifier.vue (165 linhas)
- **Template:** Overlay full-screen com card centralizado. Logo + título "Bem-vindo" + input password + botão "Entrar".
- **Lógica:** Compara senha digitada com `SENHA_CORRETA`. Delay artificial de 300ms. Salva `authExpires` no localStorage.
- **mounted():** Se já autenticado, redireciona para `/pdv`.
- **CSS:** Overlay fixo z-index 9999, card max-width 380px, gradiente laranja no botão.

### 8.4 Navbar.vue (529 linhas) — DEPRECIADO

**Não é mais importado por App.vue.** O arquivo existe apenas como referência histórica. Foi substituído pelo `Sidebar.vue`. Tinha:
- Header sticky (top 0, z-index 30, height 52px)
- Nav links: Dashboard, Vendas, Estoque, Produtos, Vitrine, PDV
- Botão de comando (Cmd+K), alerta de estoque (sino), logout
- CSS responsivo com dropdown mobile

### 8.5 CommandPalette.vue (319 linhas)

- **Template:** Overlay escuro com input de busca centralizado. Lista de comandos filtrados com ícones e descrições. Navegação por setas (↑↓) e Enter.
- **Atalho:** Cmd+K (macOS) / Ctrl+K (Windows) abre a paleta. Esc fecha.
- **Comandos:** Navegação entre todas as rotas, ações rápidas (Nova Venda, Novo Produto, etc.).
- **CSS:** Usa variáveis CSS personalizadas (`--sp-03`, `--text-secondary`, etc.) — atualmente não definidas globalmente, resultando em fallback para valores padrão.

### 8.6 FloatingMeta.vue (552 linhas)
- **Template:** Widget flutuante e arrastável (drag) que exibe metas mensais de faturamento.
- **Lógica:** Busca dados da tabela `metas_mensais` no Supabase (tabela NÃO existe no banco — feature quebrada).
- Exibe progresso com barra colorida, valor atual vs meta.
- **CSS:** Posicionamento fixo, drag via eventos de mouse/touch.

### 8.7 ModalProduto.vue (164 linhas)
- **Props:** `produto` (Object), `editando` (Boolean)
- **Emits:** `fechar`, `salvar`
- **Campos:** Nome, Código, Preço Custo, Preço Venda (formato moeda com vírgula), Estoque (number), Ativo (checkbox)
- **Lógica:** `parseMoney()` converte vírgula → ponto antes de emitir `salvar`. Validação: `preco_venda > 0`.
- **CSS:** Modal padrão (overlay + card 420px), grid 2 colunas para preços, responsivo (1 coluna mobile).

### 8.8 ModalVenda.vue (251 linhas)
- **Props:** `produtos` (Array), `editando` (Boolean), `vendaInicial` (Object)
- **Emits:** `fechar`, `salvar`
- **Campos:** Cliente (text), Data (date, default hoje), Select de produto, Lista de itens (nome, qtd, preço unit, subtotal, remover), Total, Desconto %, Total Final, Forma Pagamento (Pix/Dinheiro/Credito), Parcelas (1-12x, visível só em Credito)
- **Lógica de itens:**
  - Produto já adicionado → incrementa quantidade
  - Produto novo → adiciona à lista com `produto_id, nome, preco, quantidade, subtotal`
  - `recalcular()`: Soma subtotais → total_bruto, aplica desconto % → total_final
- **Submit:** Emite `salvar` com o objeto venda. O pai (VendasView/PdvView) faz toda a lógica de persistência.
- **CSS:** Grid 2 colunas para cliente/data, linha de item com 5 colunas (1fr 64px 80px 80px 32px), summary card com fundo soft.

### 8.9 ModalMovimentacao.vue (140 linhas)
- **Props:** `produto` (Object), `tipo` ('entrada' | 'saida')
- **Emits:** `fechar`, `salvar`
- **Campos:** Nome do produto (display), Quantidade (number, default 1), Observação (text)
- **Validação:** Quantidade deve ser > 0
- **CSS:** Modal 380px, sem complexidade.

### 8.10 ModalProdutoVitrine.vue (687 linhas) — COMPONENTE MAIS COMPLEXO

#### Template (coluna unica, refatorado):
```
┌──────────────────────────────────────────────────────────┐
│ Modal Header: "Novo Produto" / "Editar Produto"    [✕]   │
├──────────────────────────────────────────────────────────┤
│ Nome: [__________________________________]               │
│                                                          │
│ Tipo: [select▼] [novo tipo] [Adicionar]                  │
│                                                          │
│ Categorias:                                              │
│ [nova cat] [Incluir]                                     │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ [chip1] [chip2] [chip3] [chip4] [chip5] ...         │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                          │
│ ───────────────────────────────                          │
│                                                          │
│ Variações e Preços                      [+ Variação]     │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ Variação 1                          [Remover]        │ │
│ │ Nome: [_____]  Tipo: [select▼]  Preço: [0,00]       │ │
│ │                                                      │ │
│ │ [+ Faixas de preço por quantidade]                   │ │
│ │ (expandido → tabela de faixas)                       │ │
│ └──────────────────────────────────────────────────────┘ │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ Variação 2 ... (mesmo formato)                       │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                          │
│ ───────────────────────────────                          │
│                                                          │
│ ▶ Imagens (N)  [toggle collapsivel]                      │
│   └─ ImageManager (se expandido)                         │
├──────────────────────────────────────────────────────────┤
│ Modal Footer:                    [Cancelar]  [Salvar]     │
└──────────────────────────────────────────────────────────┘
```

#### Constantes (duplicadas de VitrineView.vue):
- **TIPOS_PADRAO:** `['canecas', 'xicaras', 'azulejos', 'bottons', 'acessorios']`
- **CATEGORIAS_PADRAO:** 22 categorias (Futebol, Capivara, Frases Engraçadas, Anime, Filmes & Series, Gatos, Animais, Norte, Estados Brasileiros, Profissoes, Arte, Frases Motivacionais, Fantasia, Sao Paulo, Doramas, Aliens & Ufologia, Desenhos, Herois, Mapa, Plantas, Musica, Envie Sua Arte)
- **tiposVariacao:** `['cor', 'tamanho', 'modelo', 'material', 'acabamento', 'outro']`

#### Props:
- `produto` (Object) — produto completo com variacoes aninhadas
- `editando` (Boolean)
- `salvando` (Boolean)
- `tiposDisponiveis` (Array) — tipos existentes no banco
- `categoriasDisponiveis` (Array) — categorias existentes no banco

#### Estrutura de dados do produto (local simplificada):
```js
{
  id: null | number,
  name: '',
  tipo: '',
  categorias: [],
  images: [],
  variacoes: [
    {
      _key: 'k1',
      id: null | number,
      nome: '',
      tipo_variacao: 'cor',
      ordem: 1,
      preco: '',           // Preco unico por variacao (string com virgula)
      mostrarFaixas: false,
      faixas: [
        {
          _key: 'kN',
          id: null | number,
          quantidade_minima: 1,
          quantidade_label: '',
          preco: '',       // string com virgula
          destaque: false,
          ordem: 1
        }
      ]
    }
  ]
}
```

#### Watch:
- `produto` (deep, immediate): Reconstrói `this.local` sempre que a prop mudar.

#### Metodos principais:
- `buildLocal()`: Constrói estrutura local a partir da prop `produto`, normalizando nested arrays. Extrai primeiro preço das `vitrine_precos` para o campo `preco` principal da variação.
- `formatMoneyDisplay(value)` / `parseMoney(value)`: Conversão entre número e string com vírgula.
- `toggleCategoria(cat)`: Adiciona/remove categoria do array.
- `adicionarTipo()`: Pega `novoTipo`, seta em `local.tipo`, limpa input.
- `adicionarCategoria()`: Adiciona ao array se não existir.
- `adicionarVariacao()`: Adiciona variação vazia com `_key` único (contador global).
- `adicionarFaixa(v)` / `removerFaixa(v, i)`: Manipula faixas dentro de uma variação.
- `salvar()`: Normaliza payload — extrai `preco` da variação para `vitrine_precos` array (com 1 elemento se > 0), mapeia faixas para `vitrine_precos_faixas`, trims, Number(), Boolean() — e emite `salvar`.

#### Fluxo de persistencia (via VitrineView.salvar):
1. Modal emite `salvar(payload)`
2. VitrineView cria/atualiza registro `vitrine`
3. `sincronizarVariacoes()` detecta removidos, cria/atualiza variações
4. Para cada variação: `sincronizarPrecos()` e `sincronizarFaixas()` fazem insert/update/delete

### 8.11 ImageManager.vue (195 linhas)
- **Props:** `modelValue` (Array de URLs)
- **Emits:** `update:modelValue`
- **Template:** Grid de cards de imagem (100×100px) cada um com botões ✕ ↑ ↓. Input file. Modal de crop.
- **Upload flow:**
  1. Seleciona arquivo → FileReader → `cropperSrc` (data URL)
  2. Abre ImageCropper
  3. Crop confirmado → blob JPEG qualidade 0.9
  4. Sanitiza nome (NFD normalize, remove acentos, substitui espaços por `_`, remove caracteres não-ASCII)
  5. Lê `this.$parent.local?.tipo` para definir pasta (⚠️ frágil — acoplamento com componente pai)
  6. Path: `{tipo}/{Date.now()}-{cleanName}`
  7. Upload para Supabase Storage bucket `products`
  8. Pega URL pública e adiciona ao array
- **Reorder:** `subir(i)` / `descer(i)` trocam posições no array.

### 8.12 ImageCropper.vue (149 linhas)
- **Props:** `src` (String — data URL da imagem)
- **Emits:** `cancel`, `crop`
- **Template:** Overlay dark (rgba 0.85) + modal 900px max. Header com título "Cortar Imagem" + ✕. Corpo com Cropper. Footer com Cancelar + Salvar Corte.
- **Configuração do Cropper:**
  - aspectRatio: 1 (quadrado)
  - stencil movable, NOT resizable
  - minimumCropCanvasWidth/Height: 800px
  - imageRestriction: 'stencil'
- **Save:** `getResult()` → `canvas.toBlob('image/jpeg', 0.9)` → emite `crop` com o blob.

### 8.13 SalesEvolutionChart.vue (397 linhas) — COMPONENTE EXCECIONAL com `<script setup>`

Unico componente que usa Composition API (`<script setup>`) em vez de Options API.

**Props:** `data` (Array de {date, revenue, cost}), `loading` (Boolean), `growth` (Number)
**Exposes:** `getChartDataURI` (usado pelo DashboardView para exportar PDF)

**Template:**
- Card com titulo "Evolucao do Faturamento"
- Loading spinner / estado vazio (icone de grafico de barras + mensagem)
- Summary bar: Melhor dia, Maior faturamento, Media diaria, Vs. periodo anterior (crescimento %)
- Componente `VueApexCharts` (grafico de area com 280px de altura)

**Computed:**
- `hasCost`: Se existe custo nos dados para mostrar segunda serie
- `peak`: Melhor dia (maior revenue) com data, valor, indice
- `dailyAverage`: Revenue total / numero de dias
- `visibleLabels`: Set de indices para mostrar data labels (primeiro, ultimo, peak, intervalos)
- `chartSeries`: [{name: 'Faturamento', type:'area'}] + opcional [{name: 'Custo', type:'line'}]
- `chartOptions`: Configuracao completa do ApexCharts com:
  - Gradient fill para area
  - Linha tracejada de anotacao para media diaria
  - Marcadores apenas no ultimo ponto e no peak
  - Sem toolbar, sem zoom
  - Eixo X datetime com formato dd/MM
  - Data labels nos indices visiveis
  - Formatar eixo Y: R$ X mi / R$ X k / R$ X,XX
  - Legend condicional (mostrada apenas quando tem custo)

### 8.14 Composables (NAO USADOS) — `src/composables/`

Quatro arquivos em Composition API que **nenhuma view importa atualmente**. Contem logica duplicada inline no `DashboardView.vue`.

| Arquivo | Linhas | Descricao |
|---------|--------|-----------|
| `useCharts.js` | 326 | Factory de opcoes de graficos ApexCharts (receita, pedidos, ticket, ranking, pareto, donut, etc.) + exportarPNG/CSV |
| `useDashboard.js` | 116 | Composable de dados do dashboard (vendas, produtos, periodo, KPIs) |
| `useInsights.js` | 90 | Gerador de insights textuais a partir de KPIs (alertas, tendencias, concentracao) |
| `useStatistics.js` | 206 | Calculos estatisticos avancados (KPIs, rankings, evolucao diaria, dia da semana, margem) |

---

## 9. VIEWS — DETALHAMENTO COMPLETO

### 9.1 DashboardView.vue (1027 linhas)

#### Visão Geral
Dashboard central com indicadores de performance (KPIs), rankings de produtos/clientes e exportação de relatórios. Utiliza o componente `SalesEvolutionChart` para o gráfico de evolução do faturamento.

#### KPIs calculados:
- **Faturamento:** Soma de `total_final` de vendas do mês atual
- **Custo Total:** Soma de `preco_custo * quantidade` de todos os itens
- **Lucro:** Faturamento - Custo Total
- **Margem de lucro:** (Lucro / Faturamento) * 100
- **Quantidade vendida:** Soma de quantidades dos itens vendidos no mês
- **Nº de pedidos:** Total de vendas no mês
- **Ticket Medio:** Faturamento / Numero de pedidos
- **Vendas por Dia:** Faturamento / Dias decorridos
- **Crescimento:** Comparação faturamento mês atual vs período anterior e vs mês anterior

#### Rankings:
- **Top 10 Produtos:** Por receita total gerada
- **Top 5 Clientes:** Por frequência de compras
- Produtos sem venda (estoque parado)

#### Exportação:
- **PDF:** Relatório com logo, KPIs, rankings e tabela de vendas
- **Excel:** Planilha com dados brutos de vendas do período

#### Queries Supabase:
```js
// Vendas do mês (para KPIs)
supabase.from('vendas_erp').select('*, itens_venda_erp(*, produtos_erp(nome, preco_custo))')
  .gte('data_venda', inicioMes)
  .lte('data_venda', fimMes)
  .order('data_venda', { ascending: true })

// Produtos (para margem)
supabase.from('produtos_erp').select('*').eq('ativo', true)

// Todas as vendas (para rankings completos)
supabase.from('vendas_erp').select('*, itens_venda_erp(*, produtos_erp(nome))')
```

### 9.2 ProdutosView.vue (594 linhas)

#### Queries Supabase:
```js
// Buscar todos (sem paginação server-side)
supabase.from('produtos_erp').select('*').order('created_at', { ascending: false })

// Criar
supabase.from('produtos_erp').insert([produto])

// Atualizar
supabase.from('produtos_erp').update(produto).eq('id', produtoId)

// Deletar
supabase.from('produtos_erp').delete().eq('id', id)
```

#### Funcionalidades:
- Tabela com colunas: Nome, Código, Preço Custo, Preço Venda, Estoque, Status (Ativo/Inativo)
- Busca textual em todos os campos (inclui "ativo"/"inativo" como texto)
- **Formatação de moeda:**
  - Display: `Number(valor).toFixed(2).replace('.', ',')`
  - Input (edição): `Number(valor).toString().replace('.', ',')` — converte ponto para vírgula no campo
  - Parse (salvar): `parseFloat(value.toString().replace(',', '.'))` — converte vírgula para ponto
- Botões: Editar (azul), Excluir (vermelho) por linha
- **Pagination:** 20/50/100 itens por página, navegação Anterior/Próxima
- **Events:** Dispara `window.dispatchEvent(new Event('estoque-atualizado'))` após qualquer mutação

#### Fluxo de edição:
1. Clique "Editar" → `editarProduto(p)`
2. Converte preços para formato input (vírgula)
3. Abre ModalProduto com `editando=true`
4. Modal emite `salvar` → valida `preco_venda > 0`, chama Supabase update
5. Fecha modal, recarrega produtos, notifica estoque

#### Watchers:
- `busca`: reseta página para 1
- `itensPorPagina`: reseta página para 1
- `produtos`: ajusta página se atual > total

### 9.3 VendasView.vue (1050 linhas) — VIEW MAIS COMPLEXA

#### Queries Supabase:

**Buscar vendas:**
```js
supabase.from('vendas_erp').select(`
  *,
  itens_venda_erp (
    id, produto_id, quantidade, preco_unitario, preco_custo, subtotal,
    produtos_erp (nome)
  )
`).order('data_venda', { ascending: false })
```

**Buscar produtos (para select no modal):**
```js
supabase.from('produtos_erp').select('*').eq('ativo', true)
```

**Exportar Excel (query separada com filtro de data):**
```js
supabase.from('vendas_erp').select(`
  id, data_venda, cliente, total_bruto, desconto, total_final, forma_pagamento,
  itens_venda_erp (
    id, produto_id, quantidade, preco_unitario, preco_custo, subtotal,
    produtos_erp (nome)
  )
`).gte('data_venda', inicio + 'T00:00:00')
 .lte('data_venda', fim + 'T23:59:59')
 .order('data_venda', { ascending: true })
```

#### Criação de venda (nova):
1. Modal monta payload com itens
2. **Validação de estoque:** Para cada item, busca estoque atual do produto. Se insuficiente, alerta com lista de produtos faltantes.
3. Insere em `vendas_erp` → pega ID
4. Insere itens em `itens_venda_erp` (batch)
5. Para cada item: atualiza estoque (`estoque - quantidade`), insere movimentação tipo `'saida'`
6. Recarrega vendas e produtos

#### Edição de venda:
1. **Reversão de estoque antigo:** Busca itens antigos → para cada um, devolve ao estoque (`estoque + quantidade`) e registra `'entrada'` com obs `"Edição venda {id}"`
2. Atualiza registro em `vendas_erp`
3. Deleta itens antigos
4. Insere novos itens (com `preco_custo` obtido do produto no momento da edição)
5. Baixa estoque dos novos itens (`estoque - quantidade`), registra `'saida'`

#### Exclusão de venda:
1. Confirm (`confirm('Excluir venda?')`)
2. Busca itens da venda
3. Para cada item: devolve estoque (`estoque + quantidade`), registra `'entrada'` com obs `"Exclusão venda {id}"`
4. Deleta itens
5. Deleta venda
6. Recarrega

#### Exportação Excel:
1. Modal inline (não componente separado) com date inputs (início/fim)
2. Valida que ambas datas foram selecionadas
3. Busca vendas no período (com join de itens e produtos)
4. Import dinâmico: `await import('../utils/exportacao')`
5. `transformarVendasEmLinhas()`: achata estrutura hierárquica, rateia desconto entre itens
6. `gerarExcel()`: cria XLSX com cabeçalhos (Data, Cliente, Produto, Qtd, Valor Unit., Subtotal, Desc. %, Valor Desc., Total Item, Pagamento, Pedido ID), aplica autofilter, download via blob URL

#### Rateio de desconto (`exportacao.js:12-43`):
- Distribui desconto proporcionalmente entre itens baseado no subtotal
- Último item recebe o ajuste de arredondamento para fechar o total
- Retorna itens com `valorDesconto` e `valorFinal` calculados

#### Filtros:
- **Busca textual:** Cliente OU nome do produto (case insensitive)
- **Data:** Filtra por `dataInicio` e `dataFim`
- **Ordenação:** Sempre por data descending, depois por ID descending

#### Pagination: 100/200/500/1000 itens

#### Watchers: busca, dataInicio, dataFim, itensPorPagina → resetam página para 1. vendas → ajusta página.

### 9.4 EstoqueView.vue (603 linhas)

#### Query Supabase:
```js
supabase.from('produtos_erp').select('*').eq('ativo', true).order('nome')
```
(NOTA: Só mostra produtos ativos, ordenado alfabeticamente)

#### Funcionalidades:
- Tabela: Nome, Código, Estoque, Status (OK/Baixo/Zerado), Ações (Entrada/Saída)
- **Status:** OK (>3, verde), Baixo (1-3, laranja), Zerado (0, vermelho)
- Busca textual por nome, código, estoque, status
- Botão "Entrada" (verde) / "Saída" (vermelho) → abre `ModalMovimentacao`

#### Fluxo de movimentação:
1. `salvarMovimentacao({ quantidade, observacao })`
2. Calcula novo estoque: `entrada → +qtd`, `saida → -qtd`
3. **Validação:** Se novo estoque < 0 → alerta e retorna
4. Atualiza `produtos_erp.estoque`
5. Insere em `estoque_movimentacoes` com tipo e observação
6. Recarrega produtos, notifica evento `estoque-atualizado`

#### Pagination: 20/50/100 itens

#### Watchers: Igual ProdutosView (busca, itensPorPagina → reset página 1; produtos → ajusta página)

### 9.5 VitrineView.vue (1237 linhas) — SEGUNDA VIEW MAIS COMPLEXA

#### Query Supabase:
```js
supabase.from('vitrine').select(
  '*, vitrine_variacoes(*, vitrine_precos(*), vitrine_precos_faixas(*))'
).order(campoOrdenacao, { ascending: false })
```
Ordena por `created_at` (Mais novos) ou `acessos` (Mais relevantes).

#### Funcionalidades:
- Tabela: Produto (thumb + nome + tipo), Categorias (chips), Variações (contagem + nomes), Preços (N fixos + N faixas), Acessos, Ações
- **Ações:** Editar, Duplicar, Excluir
- Busca: nome, tipo, categorias, variações
- Load/error states: `carregando`, `erro`

#### CRUD:

**Criar:**
1. `abrirNovo()` → produto vazio, modal aberto
2. Modal emite `salvar(produto)` → valida nome + tipo
3. Insere em `vitrine` → pega ID
4. `sincronizarVariacoes(vitrineId, variacoes)` — para cada variação: cria ou atualiza, sincroniza preços e faixas

**Editar:**
1. `editar(produto)` → normaliza produto com todas as nested relations
2. Mesmo fluxo do criar, mas com `update` em vez de `insert`

**Duplicar:**
1. `duplicar(produto)` → sugere nome "X (copia)" (incrementa se já existir)
2. Cria novo registro em `vitrine` com `acessos: 0`
3. `criarVariacoesDuplicadas()` → para cada variação: insere variação, depois preços, depois faixas
4. Recarrega o produto duplicado e abre em modo edição

**Excluir:**
1. `confirm('Excluir {nome}?')`
2. `excluirVariacoes(ids)` → deleta faixas (by variacao_id) → deleta preços (by variacao_id) → deleta variações (by id)
3. Deleta produto em `vitrine`

#### Sincronização de variações (lógica complexa):
- `sincronizarVariacoes(vitrineId, variacoes)`: Detecta variações removidas (ids existentes que não estão nos recebidos) → chama `excluirVariacoes()`. Para cada variação: insert ou update. Depois sincroniza preços e faixas.
- `sincronizarPrecos(variacaoId, precos, precosExistentes)`: Detecta preços removidos → deleta. Para cada preço: insert ou update.
- `sincronizarFaixas(variacaoId, faixas, faixasExistentes)`: Detecta faixas removidas → deleta. Para cada faixa: insert ou update.
- Filtros: preços com valor > 0, faixas com label preenchido e preço > 0.

#### Normalização de dados:
- `normalizarProduto()`: Garante estrutura consistente (arrays, números, defaults)
- `ordenarVariacoes()`: Ordena por `ordem`, normaliza nested arrays
- `ordenarItens()`: Ordena preços/faixas por `ordem`
- `normalizarInteiro()`: `parseInt` com fallback
- `normalizarNumero()`: `parseFloat` com replace de vírgula e fallback

#### Pagination: 100/200/500/1000 itens

#### Watchers: busca, itensPorPagina → reset página 1; produtos → ajusta página; ordenacao → recarrega dados.

### 9.6 PdvView.vue — PDV Mobile-first com PWA

#### Visão Geral
Tela de Ponto de Venda (PDV) projetada mobile-first, com foco em UX rápida para celular. Permite buscar produtos, adicionar ao carrinho e finalizar a venda em poucos toques. Também funciona como PWA (instalável no celular).

#### Layout
- **Desktop (≥1024px):** 2 colunas — grid de produtos à esquerda, carrinho como sidebar fixa à direita
- **Mobile (<1024px):** Produtos em grid, barra flutuante no rodapé com total + contagem, carrinho abre como bottom sheet (drawer animado)
- **Mobile pequeno (≤420px):** Cards de produto em linha única (layout horizontal)

#### Fluxo de uso
1. Busca produto por nome ou código (campo de busca com botão limpar)
2. Tapa no card do produto → adiciona ao carrinho (feedback tátil com `navigator.vibrate`)
3. Card anima com escala (active state) e TransitionGroup
4. Carrinho: aumenta/diminui quantidade, remove item, subtotais atualizam em tempo real
5. Define desconto percentual
6. Preenche cliente (opcional)
7. Seleciona forma de pagamento (Pix/Dinheiro/Credito)
8. Credito → seleciona parcelas (1-12x)
9. Finalizar → valida estoque → insere venda + itens → baixa estoque → registra movimentação
10. Abre modal de sucesso com resumo da venda
11. Opções: "Compartilhar no WhatsApp" ou "Baixar PDF"

#### PDF Gerado
- Layout A4 com cabeçalho "Manuari — Comprovante de Venda"
- Tabela de itens com qtd, produto, valor unitário, subtotal
- Linha laranja divisória, cores alternadas nas linhas
- Subtotal, desconto (se houver), total em destaque
- Forma de pagamento e parcelas
- Rodapé com data/hora
- Biblioteca `jspdf` + `jspdf-autotable`

#### Compartilhamento WhatsApp
1. **Tenta Web Share API** (`navigator.share`) com o PDF anexo — abre nativamente a sheet do celular com WhatsApp, Telegram, etc.
2. **Fallback 1:** faz download do PDF automaticamente
3. **Fallback 2 (WhatsApp direto):** abre `wa.me` com texto formatado da venda (itens, totais, pagamento)

#### Queries Supabase
```js
// Buscar produtos ativos
supabase.from('produtos_erp').select('*').eq('ativo', true).order('nome')

// Inserir venda
supabase.from('vendas_erp').insert([payload]).select().single()

// Inserir itens (batch)
supabase.from('itens_venda_erp').insert(itens)

// Buscar estoque + atualizar + movimentar (por item)
supabase.from('produtos_erp').select('estoque').eq('id', id).single()
supabase.from('produtos_erp').update({ estoque }).eq('id', id)
supabase.from('estoque_movimentacoes').insert([mov])

// Buscar total vendido por produto (para ordenação por popularidade)
supabase.from('itens_venda_erp').select('produto_id, quantidade') // ⚠️ sem filtro — baixa TODOS os registros
```

#### Eventos
- Dispara `window.dispatchEvent(new Event('estoque-atualizado'))` após finalizar venda (Navbar recarrega alertas)
- `navigator.vibrate(10)` ao adicionar produto ao carrinho

#### Service Worker (PWA)
- Registrado em `src/main.js` com auto-update
- Cache de assets para funcionamento offline
- Estratégia: network-first com fallback para cache

### 9.7 FluxoCaixaView.vue (1453 linhas)

#### Visão Geral
View de fluxo de caixa com lançamentos (entradas/saídas/ajustes), contas a receber (de vendas parceladas), saldo inicial configurável e gráfico de barras diário.

#### Layout
- **Header:** Título "Fluxo de Caixa" + botões "Definir valor inicial" e "Novo lançamento"
- **Filtros:** Período (hoje/7d/mês atual/mês anterior/personalizado), tipo, categoria, forma pagamento, busca textual
- **Resumo:** 4 cards — Saldo atual, Entradas, Saídas, Nº de lançamentos
- **Contas a Receber:** Seção com cards (Pendente, Recebido no período, Total a receber), tabela paginada de parcelas com botão "Receber"
- **Gráfico:** Barras agrupadas (entradas verdes, saídas vermelhas) via ApexCharts
- **Tabela:** Lançamentos com data, tipo, categoria, descrição, forma pagamento, valor. Ações: Editar, Excluir

#### Dados
- `lancamentos`: Array de `fluxo_caixa_lancamentos`
- `saldoInicial`: Objeto `fluxo_caixa_saldo_inicial` (busca o último registro)
- `contasReceber`: Array de `fluxo_caixa_contas_receber`

#### Computed principais
- `saldoAtual`: `saldoInicial + entradas - saídas`
- `lancamentosFiltrados`: Filtra por data, tipo, categoria, forma pagamento, busca
- `contasPendentes` / `totalPendente` / `totalRecebidoNoMes` / `totalReceberGeral`
- `dadosGrafico`: Agrega entradas/saídas por dia no período

#### Fluxo de recebimento de conta
1. Clica "Receber" em uma conta pendente
2. `confirm()` valida
3. Atualiza `fluxo_caixa_contas_receber` (status='recebido', data_recebimento=hoje)
4. Insere lançamento tipo 'entrada' em `fluxo_caixa_lancamentos`
5. Recarrega contas e lançamentos

#### Queries Supabase
```js
// Buscar lançamentos
supabase.from('fluxo_caixa_lancamentos').select('*').order('data', { ascending: false })

// Buscar contas a receber
supabase.from('fluxo_caixa_contas_receber').select('*').order('data_vencimento', { ascending: true })

// Buscar saldo inicial (último)
supabase.from('fluxo_caixa_saldo_inicial').select('*').order('id', { ascending: false }).limit(1)

// Criar/Atualizar saldo inicial
supabase.from('fluxo_caixa_saldo_inicial').insert([payload])
supabase.from('fluxo_caixa_saldo_inicial').update(payload).eq('id', id)

// CRUD lançamentos
supabase.from('fluxo_caixa_lancamentos').insert([payload])
supabase.from('fluxo_caixa_lancamentos').update(payload).eq('id', id)
supabase.from('fluxo_caixa_lancamentos').delete().eq('id', id)

// Receber conta (update + insert lançamento)
supabase.from('fluxo_caixa_contas_receber').update({ status: 'recebido', data_recebimento: hoje }).eq('id', conta.id)
supabase.from('fluxo_caixa_lancamentos').insert([{ tipo: 'entrada', valor, data, categoria: 'Vendas', ... }])
```

#### Constantes
- `FORMAS_PAGAMENTO`: Dinheiro, Pix, Cartão de débito, Cartão de crédito, Transferência, Outro
- `CATEGORIAS_ENTRADA`: Vendas, Recebimentos, Aportes, Reembolsos, Outros
- `CATEGORIAS_SAIDA`: Matéria-prima, Embalagens, Frete e transporte, Marketing, Manutenção, Contas, Impostos e taxas, Outros

#### Tipos de lançamento
- `entrada` / `saida`: Movimentações normais
- `ajuste_positivo` / `ajuste_negativo`: Ajustes manuais (exigem descrição obrigatória)

#### Pagination: 20/50/100 itens

#### Watchers: busca, filtroTipo, filtroCategoria, filtroFormaPagamento, itensPorPagina, periodo, dataInicio, dataFim → reset página. lancamentos → ajusta página.

---

## 10. PADRÕES DE CÓDIGO

### 10.1 Formatação de moeda
```js
// Display (exibe "19,90")
formatarPreco(valor) {
  if (!valor) return '0,00'
  return Number(valor).toFixed(2).replace('.', ',')
}

// Input (campo editável mostra "19,90")
formatarInput(valor) {
  if (!valor) return ''
  return Number(valor).toString().replace('.', ',')
}

// Parse (salvar: converte "19,90" → 19.90)
parseMoney(value) {
  if (!value) return 0
  return parseFloat(value.toString().replace(',', '.')) || 0
}
```
NOTA: `ModalVenda.formatar()` usa só `toFixed(2).replace('.', ',')`.
NOTA: `exportacao.formatarMoeda()` usa o mesmo padrão.

### 10.2 Formatação de data
```js
// ISO → DD/MM/YYYY
formatarData(data) {
  if (!data) return '-'
  return data.split('T')[0].split('-').reverse().join('/')
}
```

### 10.3 Modal pattern
Todos os modais seguem a mesma estrutura:
```html
<div class="modal-overlay" @click.self="$emit('fechar')">
  <div class="modal" role="dialog" aria-modal="true">
    <div class="modal-header">
      <h2 class="modal-title">Título</h2>
      <button class="close-btn" @click="$emit('fechar')">✕</button>
    </div>
    <div class="modal-body">...</div>
    <div class="modal-footer">
      <button class="btn btn-primary" @click="submit">Salvar</button>
      <button class="btn btn-ghost" @click="$emit('fechar')">Cancelar</button>
    </div>
  </div>
</div>
```

### 10.4 Pagination pattern
Todas as views com tabela usam o mesmo padrão:
```js
computed: {
  totalPaginas() { return Math.max(1, Math.ceil(this.produtosFiltrados.length / this.itensPorPagina)) },
  produtosFiltrados() { /* filter by busca */ },
  produtosPaginados() { return this.produtosFiltrados.slice(inicio, inicio + this.itensPorPagina) }
},
watch: {
  busca() { this.paginaAtual = 1 },
  itensPorPagina() { this.paginaAtual = 1 },
  produtos() { this.ajustarPagina() }
}
```

### 10.5 Supabase query pattern
```js
const { data, error } = await supabase.from('tabela').select('*')
if (error) throw error // ou console.error + return
this.dados = data || []
```

### 10.6 Event dispatch pattern
```js
// Emitir (em qualquer view que modifica estoque)
window.dispatchEvent(new Event('estoque-atualizado'))

// Escutar (Sidebar.vue)
mounted() { window.addEventListener('estoque-atualizado', this.buscarAlertasEstoque) }
beforeUnmount() { window.removeEventListener('estoque-atualizado', this.buscarAlertasEstoque) }
```

### 10.7 v-model com componente filho
```html
<!-- ImageManager usa v-model padrão Vue 3 -->
<ImageManager v-model="local.images" />

<!-- No ImageManager: -->
props: ['modelValue'],
emits: ['update:modelValue'],
methods: { atualizar(v) { this.$emit('update:modelValue', v) } }
```

---

## 11. CSS — ARQUITETURA E DESIGN TOKENS

### 11.1 Design Tokens (`style.css:7-35`)
```css
:root {
  --bg: #F4F5F7;
  --surface: #FFFFFF;
  --surface-soft: #F8FAFC;
  --surface-muted: #F1F5F9;
  --border: #D9DEE5;
  --border-strong: #A8B3C4;
  --text: #1F2937;
  --text-muted: #667085;
  --text-dim: #6F6F6F;
  --primary: #E86E1A;          /* Laranja Manuari */
  --primary-hover: #CC5F15;
  --primary-soft: #FEF0E7;
  --danger: #D94F4F;
  --danger-hover: #C44040;
  --danger-soft: #FEF2F2;
  --success: #2E7D32;
  --success-hover: #256429;
  --success-soft: #F0FBF0;
  --warning: #B45309;
  --warning-soft: #FFFBEB;
  --info: #1D4ED8;
  --info-soft: #EFF6FF;
  --shadow-sm: 0 2px 8px rgba(15, 23, 42, 0.08);
  --shadow-md: 0 6px 24px rgba(15, 23, 42, 0.14);
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
}
```

### 11.2 Estilos globais (`style.css`)
- Reset: `* { margin:0; padding:0; box-sizing:border-box }`
- Body: Inter font, 13px, antialiased, tabular-nums (`font-feature-settings: 'tnum' 1`)
- Inputs/selects globais: height 36px, border-radius 6px, focus com ring laranja (3px, rgba opacity 0.1)
- Select: custom arrow SVG, padding-right 28px
- Mobile (≤768px): font-size 13px

### 11.3 Padrões CSS scoped
- Tabelas: `.table-card` wrapper com border-radius, scroll horizontal
- Header das tabelas: `#F1F5F9` background, uppercase, 11px, letter-spacing 0.04em
- Linhas alternadas: `rgba(241,245,249,0.55)` ou `0.6`
- Hover: `rgba(232,110,26,0.04)` (laranja muito sutil)
- Células de ação: `width:1%; white-space:nowrap; text-align:center`
- Paginação: flex space-between, select inline para itens/página
- Modais: overlay fixo com backdrop semi-transparente, card centralizado com max-height
- Responsivo (≤768px): tabelas viram cards (display:block, labels via `::before { content: attr(data-label) }`), modals full-width, grids viram 1 coluna

### 11.4 Inconsistências de CSS
- CommandPalette usa variáveis CSS que não existem no `:root` (`--sp-03`, `--text-secondary`, `--layer-hover`, `--fs-body`, `--fs-label`, `--text-placeholder`, `--transition-fast`) — componente visualmente quebrado
- Alguns componentes não usam variáveis CSS para cores (ex: `#F1F5F9` hardcoded para header de tabela)
- Alguns usam `border-radius: 12px` ou `14px` em vez dos tokens `--radius-sm/md/lg`
- Z-index inconsistente: modais usam 2000, overlay de login usa 9999

---

## 12. UTILITÁRIOS

### 12.1 exportacao.js (170 linhas) — USADO POR VendasView E DashboardView
- `formatarMoeda(value)`: `Number(v).toFixed(2).replace('.', ',')`
- `formatarData(data)`: ISO → DD/MM/YYYY
- `ratearDesconto(itens, descontoPercentual, totalBruto)`: Distribui desconto proporcionalmente, último item recebe ajuste de arredondamento
- `transformarVendasEmLinhas(vendas)`: Achata estrutura `venda → itens` em linhas planas, aplica rateio de desconto
- `gerarExcel(dados, nomeArquivo)`: Cria workbook XLSX com:
  - Cabeçalhos: Data, Cliente, Produto, Qtd, Valor Unit., Subtotal, Desc. %, Valor Desc., Total Item, Pagamento, Pedido ID
  - Autofilter na linha 1
  - Larguras de coluna predefinidas
  - Altura de linha 28px header, 22px dados
  - Download via blob URL + link.click()

---

## 13. FLUXOS DE NEGÓCIO DETALHADOS

### 13.1 Fluxo completo de venda (criação)
```
1. Usuário clica "Nova Venda" → modal abre com data hoje
2. Seleciona produto no dropdown → clica "Adicionar"
   - Produto já na lista? Incrementa qtd
   - Produto novo? Adiciona com qtd=1
3. Ajusta quantidades → subtotais recalculados automaticamente
4. Define desconto % → total_final = total_bruto - (total_bruto * desconto / 100)
5. Seleciona forma de pagamento → se Credito, escolhe parcelas (1-12x)
6. Clica "Finalizar Venda"
7. Validação de estoque:
   - Para cada item, busca estoque atual do produto
   - Se estoque < quantidade → alerta com lista de produtos faltantes
8. INSERT em vendas_erp (cliente, data_venda+T00:00:00, total_bruto, desconto, total_final, forma_pagamento)
9. Pega vendaSalva.id
10. INSERT batch em itens_venda_erp (venda_id, produto_id, quantidade, preco_unitario, subtotal)
11. Para cada item:
    - Busca estoque atual do produto
    - novoEstoque = estoque - quantidade
    - UPDATE produtos_erp SET estoque = novoEstoque
    - INSERT estoque_movimentacoes (tipo='saida', quantidade, obs="Venda {id}")
12. Fecha modal, recarrega lista, notifica estoque-atualizado
```

### 13.2 Fluxo completo de edição de venda
```
1. Usuário clica "Editar" em uma venda
2. vendaEditando é populado: dados da venda + itens mapeados (produto_id, nome, preco, qtd, subtotal)
3. Modal abre com dados preenchidos → usuário modifica
4. Clica "Atualizar"
5. Validação de estoque (considera itens antigos):
   - estoqueDisponivel = estoque_atual + quantidade_antiga (se mesmo produto)
6. ESTORNO DE ESTOQUE ANTIGO:
   - Busca itens antigos da venda
   - Para cada item antigo:
     a. Busca estoque atual
     b. UPDATE produtos_erp SET estoque = estoque + quantidade (devolve)
     c. INSERT estoque_movimentacoes (tipo='entrada', obs="Edição venda {id}")
7. UPDATE vendas_erp SET ... WHERE id = vendaEditando.id
8. DELETE itens_venda_erp WHERE venda_id = id
9. INSERT novos itens
10. BAIXA NOVO ESTOQUE (igual criação)
11. Recarrega
```

### 13.3 Fluxo completo de exclusão de venda
```
1. confirm('Excluir venda?')
2. Busca itens da venda
3. Para cada item:
   a. Busca produto
   b. UPDATE produtos_erp SET estoque = estoque + quantidade
   c. INSERT estoque_movimentacoes (tipo='entrada', obs="Exclusão venda {id}")
4. DELETE itens_venda_erp WHERE venda_id = id
5. DELETE vendas_erp WHERE id = id
6. Recarrega
```

### 13.4 Fluxo de produto vitrine (criação/edição)
```
1. ModalProdutoVitrine monta estrutura completa (produto + variacoes + precos + faixas)
2. Emite 'salvar' com payload normalizado
3. VitrineView.salvar():
   a. Valida nome e tipo obrigatórios
   b. Se editando: UPDATE vitrine
   c. Se novo: INSERT vitrine → pega ID
   d. sincronizarVariacoes(vitrineId, variacoes):
      - Detecta variações removidas → excluirVariacoes(ids) → deleta faixas, preços, variações
      - Para cada variação:
        * Se tem ID: UPDATE vitrine_variacoes
        * Se não: INSERT vitrine_variacoes → pega ID
        * sincronizarPrecos(variacaoId, precos, precosExistentes)
        * sincronizarFaixas(variacaoId, faixas, faixasExistentes)
4. Recarrega lista
```

### 13.5 Fluxo de upload de imagem (vitrine)
```
1. Usuário seleciona arquivo no input file do ImageManager
2. FileReader lê como data URL → abre ImageCropper
3. Usuário ajusta crop (quadrado 1:1, mínimo 800px)
4. Confirma crop → ImageCropper emite blob JPEG (qualidade 0.9)
5. ImageManager.onCrop():
   a. Sanitiza nome do arquivo (NFD normalize, remove acentos, _ por espaços, ASCII only)
   b. Lê this.$parent.local?.tipo para determinar pasta (ex: "canecas")
   c. Path: "canecas/1711234567890-imagem.jpg"
   d. supabase.storage.from('products').upload(path, blob, { upsert: true })
   e. Pega URL pública: supabase.storage.from('products').getPublicUrl(path)
   f. Adiciona URL ao array modelValue
```

---

## 14. BUGS E ISSUES CONHECIDOS

1. **FloatingMeta consulta tabela `metas_mensais`:** A migration `metas_mensais.sql` cria a tabela, porem o FloatingMeta.configAberto lê do Supabase e escreve com `onConflict: 'ano,mes'`. Se o banco nao rodou a migration, o recurso falha silenciosamente.
2. **PdvView baixa TODOS os `itens_venda_erp` sem filtro:** Na inicialização, a view carrega todo o histórico de itens vendidos para calcular popularidade. Sem paginação ou filtro de data, é extremamente ineficiente com muitos registros.
3. **CommandPalette usa CSS variables indefinidas:** `--sp-03`, `--text-secondary`, `--layer-hover`, `--fs-body`, `--fs-label`, `--text-placeholder`, `--transition-fast` não estão definidas em `style.css` — componente renderiza incorretamente.
4. **Sem rollback transacional em vendas:** Se a inserção de itens ou atualização de estoque falha parcialmente, não há mecanismo de rollback. O estoque pode ficar inconsistente.
5. **Senha hardcoded no source code:** `const SENHA_CORRETA = 'tuti@123'` em `UserIdentifier.vue:34`. Auth via localStorage é trivialmente bypassável.
6. **Sem paginação server-side:** Todas as queries usam `select('*')` sem `range()` ou `limit()`, carregando todos os registros do banco.
7. **ImageManager.$parent.local?.tipo:** Acoplamento frágil — depende da estrutura interna do componente pai (ModalProdutoVitrine). Se usado em outro contexto, quebra.
8. **VendasView `temDesconto` verifica array inteiro em vez da linha atual:** Coluna de desconto aparece/esconde baseada em qualquer venda com desconto, não na linha atual.
9. **Sem tratamento de erro em várias queries:** `ProdutosView.salvarProduto()` e `deletarProduto()` não verificam erros do Supabase antes de fechar modal.
10. **Método vazio `recalcular()` em PdvView:** `recalcular() { // força reatividade do computed }` — computed properties já são reativas, método desnecessário.
11. **Constantes duplicadas:** `TIPOS_PADRAO` e `CATEGORIAS_PADRAO` definidas identicamente em `VitrineView.vue` e `ModalProdutoVitrine.vue` — deveriam ser compartilhadas.
12. **`formatarMoeda`/`formatarPreco`/`formatarData` duplicados:** Quase toda view e componente define seus próprios métodos de formatação.
13. **Falta `parcelas` no payload em alguns fluxos:** O campo `parcelas` da venda pode não ser enviado em insert/update.
14. **Import inconsistente do jspdf-autotable:** Estático (`import { autoTable }`) no PdvView vs dinâmico (`await import('jspdf-autotable')`) no DashboardView.
15. **Navbar.vue órfão:** Arquivo ainda existe em `src/components/Navbar.vue` mas não é importado por App.vue (substituído por Sidebar.vue). Código morto.
16. **FluxoCaixaView não dispara evento de atualização de dados:** Não há evento cross-component para notificar quando lançamentos são criados/editados/excluídos. Se outras views precisarem reagir a mudanças no fluxo de caixa, não há mecanismo.
17. **FluxoCaixaView não tem integração automática com VendasView:** Contas a receber de vendas parceladas precisam ser criadas manualmente ou via migration — não há trigger automático na criação de venda.

---

## 15. CONVENÇÕES DE NOMENCLATURA

| Contexto | Convenção | Exemplos |
|----------|-----------|----------|
| Componentes | PascalCase | `ModalVenda.vue`, `UserIdentifier.vue` |
| Views | PascalCase + sufixo "View" | `ProdutosView.vue`, `VendasView.vue` |
| Utilitários | camelCase | `exportacao.js` |
| Serviços | camelCase | `supabase.js` |
| Métodos | camelCase (português) | `buscarVendas()`, `salvarProduto()`, `fecharModal()` |
| Variáveis | camelCase (português) | `modalAberto`, `vendaEditando`, `itensPorPagina` |
| Eventos (emit) | kebab-case | `'estoque-atualizado'` |
| Tabelas BD | snake_case com `_erp` ou prefixo `fluxo_caixa_` | `produtos_erp`, `vendas_erp`, `fluxo_caixa_lancamentos` |
| Colunas BD | snake_case | `preco_venda`, `forma_pagamento`, `created_at` |
| CSS classes | kebab-case | `modal-overlay`, `table-card`, `btn-primary` |

---

## 16. SCRIPTS

```json
{
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "lint": "eslint src --ext .vue,.js --fix",
  "format": "prettier --write src",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui"
}
```

---

## 17. DEPLOY (VERCEL)

`vercel.json`:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```
Todas as rotas são reescritas para `/` para suportar SPA client-side routing.

---

## 18. RESUMO DE TODAS AS QUERIES SUPABASE

| View/Componente | Tabela | Operação | Join/Filtro |
|-----------------|--------|----------|-------------|
| Sidebar | produtos_erp | select | ativo=true, order=estoque asc |
| DashboardView | vendas_erp | select * | join itens + produtos, gte/lte data, mês atual |
| DashboardView | produtos_erp | select * | ativo=true |
| ProdutosView | produtos_erp | select * | order=created_at desc |
| ProdutosView | produtos_erp | insert | — |
| ProdutosView | produtos_erp | update | eq id |
| ProdutosView | produtos_erp | delete | eq id |
| VendasView (lista) | vendas_erp | select * | join itens_venda_erp→produtos_erp(nome, preco_custo) |
| VendasView (export) | vendas_erp | select | join itens + produtos, gte/lte data |
| VendasView (produtos) | produtos_erp | select * | eq ativo=true |
| VendasView (salvar) | vendas_erp | insert | — |
| VendasView (salvar) | itens_venda_erp | insert (batch) | inclui preco_custo |
| VendasView (salvar) | produtos_erp | select (single) | eq id (estoque + preco_custo) |
| VendasView (salvar) | produtos_erp | update | eq id (estoque) |
| VendasView (salvar) | estoque_movimentacoes | insert | — |
| VendasView (editar) | itens_venda_erp | select | eq venda_id |
| VendasView (editar) | vendas_erp | update | eq id |
| VendasView (editar) | itens_venda_erp | delete | eq venda_id |
| VendasView (excluir) | itens_venda_erp | select | eq venda_id |
| VendasView (excluir) | itens_venda_erp | delete | eq venda_id |
| VendasView (excluir) | vendas_erp | delete | eq id |
| EstoqueView | produtos_erp | select * | ativo=true, order=nome |
| EstoqueView | produtos_erp | update | eq id (estoque) |
| EstoqueView | estoque_movimentacoes | insert | — |
| VitrineView | vitrine | select * | join variacoes→precos+faixas |
| VitrineView | vitrine | insert | — |
| VitrineView | vitrine | update | eq id |
| VitrineView | vitrine | delete | eq id |
| VitrineView | vitrine_variacoes | insert/update | — |
| VitrineView | vitrine_variacoes | delete | in ids |
| VitrineView | vitrine_precos | insert/update/delete | — |
| VitrineView | vitrine_precos_faixas | insert/update/delete | — |
| ImageManager | storage products | upload | upsert |
| ImageManager | storage products | getPublicUrl | — |
| PdvView | produtos_erp | select * | ativo=true, order=nome |
| PdvView | itens_venda_erp | select | sem filtro ⚠️ (popularidade) |
| PdvView | vendas_erp | insert | — |
| PdvView | itens_venda_erp | insert (batch) | inclui preco_custo |
| PdvView | produtos_erp | select (single) | eq id (estoque + preco_custo) |
| PdvView | produtos_erp | update | eq id (estoque) |
| PdvView | estoque_movimentacoes | insert | — |
| FloatingMeta | metas_mensais | select * | ⚠️ tabela pode nao existir (migration nao executada) |
| FluxoCaixaView | fluxo_caixa_lancamentos | select * | order=data desc, order=id desc |
| FluxoCaixaView | fluxo_caixa_contas_receber | select * | order=data_vencimento asc |
| FluxoCaixaView | fluxo_caixa_saldo_inicial | select * | order=id desc, limit 1 |
| FluxoCaixaView | fluxo_caixa_saldo_inicial | insert/update | — |
| FluxoCaixaView | fluxo_caixa_lancamentos | insert/update/delete | — |
| FluxoCaixaView | fluxo_caixa_contas_receber | update | eq id (status + data_recebimento) |

---

## 19. LISTA DE TODOS OS EVENTOS

| Evento | Disparado por | Escutado por | Propósito |
|--------|--------------|-------------|-----------|
| `estoque-atualizado` (window) | ProdutosView, EstoqueView, VendasView, PdvView, DashboardView | Sidebar | Atualizar alertas de estoque baixo |
| `abrir-paleta` (window) | Navbar (Cmd+K) | App.vue | Abrir CommandPalette |
| `fechar` (emit) | Todos os modais | Views pai | Fechar modal |
| `salvar` (emit) | Todos os modais | Views pai | Persistir dados |
| `update:modelValue` (emit) | ImageManager | ModalProdutoVitrine | v-model sync |
| `crop` (emit) | ImageCropper | ImageManager | Imagem cortada |
| `cancel` (emit) | ImageCropper | ImageManager | Cancelar crop |

---

## 20. CHECKLIST PARA NOVAS FEATURES / CORREÇÕES

Ao modificar este projeto, lembre-se:
- [ ] Usar Options API (`data()`, `methods: {}`, `computed: {}`, etc.) — NUNCA Composition API / `<script setup>`
- [ ] JavaScript puro, sem TypeScript
- [ ] Props como array (`props: ['foo']`), não como objeto tipado
- [ ] Nomes de métodos e variáveis em português
- [ ] Formatação de moeda: vírgula como decimal
- [ ] Formatação de data: DD/MM/YYYY
- [ ] Comunicação cross-component via `window.dispatchEvent('estoque-atualizado')` quando alterar estoque
- [ ] CSS scoped em todos os componentes
- [ ] Usar variáveis CSS (--primary, --border, etc.) em vez de cores hardcoded
- [ ] Seguir o pattern de modal existente (overlay + card + header + body + footer)
- [ ] Adicionar `alert()` para feedback de erro/sucesso
- [ ] Sempre recarregar dados após mutações (chamar `buscar*()` no fim do método)
- [ ] Sempre checar `this.isLoading` no início de operações assíncronas
- [ ] Paginação client-side (slice em computed)
