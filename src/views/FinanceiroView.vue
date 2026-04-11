<template>
  <div class="page">
    <section class="construction-card">
      <span class="badge">Em construcao</span>
      <h1>Financeiro</h1>
      <p>
        Esta area esta sendo preparada para concentrar caixa, contas, custos e indicadores.
      </p>
    </section>
  </div>
</template>

<style scoped>
.page {
  padding: 40px 20px;
  max-width: 1520px;
  margin: 0 auto;
}

.construction-card {
  min-height: calc(100vh - 180px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 16px;
  padding: 32px;
  border-radius: 28px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.98));
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 8px 14px;
  border-radius: 999px;
  background: var(--primary-soft);
  color: var(--primary-hover);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

h1 {
  font-size: clamp(36px, 5vw, 64px);
  line-height: 1;
}

p {
  max-width: 520px;
  color: var(--text-muted);
  font-size: 16px;
}

@media (max-width: 768px) {
  .page {
    padding: 24px 12px 32px;
  }

  .construction-card {
    min-height: calc(100vh - 140px);
    padding: 24px;
    border-radius: 22px;
  }
}
</style>
