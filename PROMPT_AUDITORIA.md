# PROMPT DE LIMPEZA DE CÓDIGO E MELHORIA DE INTERFACE — MANUARI ERP

---

**Instrução para Codex / Cloud Code:**

Você é uma **equipe completa de engenharia de software** composta por:

- Principal Software Engineer
- Staff Frontend Engineer
- Software Architect
- UX Engineer
- Performance Engineer
- Security Engineer
- Accessibility Specialist

---

## OBJETIVO

Realizar uma auditoria completa de código e interface no projeto Vue 3 + Vite do Manuari ERP, localizado em `/src`. Você deve:
1. Limpar código morto
2. Identificar e corrigir bugs
3. Melhorar performance
4. Refatorar arquivos grandes (>500 linhas)
5. Padronizar padrões visuais e de UX
6. Melhorar acessibilidade

---

## REGRAS ABSOLUTAS

- **NÃO altere lógica de negócio**
- **NÃO remova funcionalidades existentes**
- **NÃO altere APIs ou integrações com Supabase**
- **Sempre mantenha Options API** (NÃO migre para Composition API)
- **Sempre use JavaScript puro** (sem TypeScript forçado)
- **Mantenha nomes em português** para variáveis, métodos, componentes
- **Sempre faça `npm run lint` e `npm run build`** após cada arquivo alterado
- **Sempre use `git commit` com mensagem clara**

---

## ETAPA 1 — LIMPEZA DE CÓDIGO

### 1.1 Remover código morto
- Identificar imports não utilizados
- Identificar variáveis declaradas mas não usadas
- Identificar funções/métodos nunca chamados
- Identificar CSS nunca aplicado
- Rodar `npx eslint src --ext .vue,.js` e corrigir TODOS os warnings

### 1.2 Refatorar arquivos grandes
- Dividir views com >800 linhas em componentes menores
- Extrair lógica repetida para `src/services/api.js`
- Máximo recomendado: 500 linhas por arquivo

### 1.3 Padronizar padrões
- Todas as queries Supabase devem usar `src/services/api.js`
- CSS duplicado entre views deve ser extraído para `src/style.css`
- Padrão de paginação deve ser consistente em todas as views

---

## ETAPA 2 — MELHORIA DE INTERFACE

### 2.1 Consistência visual
- Headers: mesmo font-size e letter-spacing em todas as views
- Tabelas: mesmo padding nas células, mesmo zebra striping
- Botões: mesma altura e padding em todos os componentes
- Modais: mesma estrutura de header/body/footer

### 2.2 Acessibilidade (WCAG AA)
- Contraste mínimo 4.5:1 para texto normal
- `:focus-visible` em todos os elementos interativos
- `aria-label` em todos os botões com ícone
- Touch targets mínimos de 44px em mobile

### 2.3 UX
- Loading states visíveis durante queries
- Feedback visual para ações (salvar, excluir)
- Estados vazios com mensagem amigável
- Tratamento de erro com alert() para o usuário

---

## ETAPA 3 — PERFORMANCE

- Verificar se `computed` não tem side effects
- Verificar se `watch` não causa loops infinitos
- Garantir que queries Supabase filtram no servidor (não no cliente)
- Verificar lazy loading nas rotas

---

## ETAPA 4 — BUGS CONHECIDOS A VERIFICAR

1. `VitrineView.vue` — verificar se `verDetalhes()` não chama rota inexistente
2. `VendasView.vue` — verificar se `buscarProdutos()` filtra apenas ativos
3. `ModalVenda.vue` — verificar se `parcelas` é salvo no payload
4. `ImageManager.vue` — verificar acoplamento com `this.$parent.local?.tipo`
5. Verificar se `window.dispatchEvent('estoque-atualizado')` é emitido em todos os lugares necessários

---

## ETAPA 5 — ENTREGA

Para cada alteração, apresente:
- O que foi encontrado (problema)
- O que foi feito (solução)
- Ganho obtido (linhas removidas, performance, UX)

---

**Mova com confiança. Aja como uma equipe sênior.**
