import { test, expect } from '@playwright/test'

test.describe('Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.evaluate(() => localStorage.removeItem('authExpires'))
  })

  test('redireciona para pagina de login', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/identificar/)
    await expect(page.locator('h1')).toContainText('Bem-vindo')
  })

  test('login com senha correta redireciona para PDV', async ({ page }) => {
    await page.goto('/')
    await page.fill('input[type="password"]', 'tuti@123')
    await page.click('button:has-text("Entrar")')
    await page.waitForURL(/pdv/, { timeout: 5000 })
    await expect(page).toHaveURL(/pdv/)
  })

  test('login com senha incorreta mostra erro', async ({ page }) => {
    await page.goto('/')
    await page.fill('input[type="password"]', 'senha_errada')
    await page.click('button:has-text("Entrar")')
    await expect(page.locator('.erro')).toBeVisible({ timeout: 2000 })
  })
})

test.describe('Navegação', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.fill('input[type="password"]', 'tuti@123')
    await page.click('button:has-text("Entrar")')
    await page.waitForURL(/pdv/, { timeout: 5000 })
  })

  test('navbar links estao visiveis', async ({ page }) => {
    const nav = page.locator('.link')
    const count = await nav.count()
    expect(count).toBeGreaterThanOrEqual(4)
    await expect(nav.getByText('PDV')).toBeVisible()
    await expect(nav.getByText('Vendas')).toBeVisible()
    await expect(nav.getByText('Estoque')).toBeVisible()
    await expect(nav.getByText('Produtos')).toBeVisible()
  })

  test('navega para vendas', async ({ page }) => {
    await page.click('.link:has-text("Vendas")')
    await page.waitForURL(/vendas/, { timeout: 5000 })
    await expect(page).toHaveURL(/vendas/)
  })

  test('logout redireciona para login', async ({ page }) => {
    await page.click('.logout-btn')
    await page.waitForURL(/identificar/, { timeout: 5000 })
    await expect(page).toHaveURL(/identificar/)
  })
})
