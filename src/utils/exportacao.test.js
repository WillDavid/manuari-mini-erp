import { describe, it, expect } from 'vitest'
import { formatarMoeda, formatarData, ratearDesconto } from './exportacao.js'

describe('formatarMoeda', () => {
  it('formata numero com virgula', () => {
    expect(formatarMoeda(19.9)).toBe('19,90')
    expect(formatarMoeda(0)).toBe('0,00')
    expect(formatarMoeda(1500)).toBe('1500,00')
  })

  it('trata null/undefined como 0', () => {
    expect(formatarMoeda(null)).toBe('0,00')
    expect(formatarMoeda(undefined)).toBe('0,00')
  })
})

describe('formatarData', () => {
  it('converte ISO para DD/MM/YYYY', () => {
    expect(formatarData('2025-12-25T10:00:00')).toBe('25/12/2025')
  })

  it('retorna - para data vazia', () => {
    expect(formatarData(null)).toBe('-')
    expect(formatarData('')).toBe('-')
  })
})

describe('ratearDesconto', () => {
  it('rateia desconto proporcionalmente', () => {
    const itens = [
      { produto: 'A', subtotal: 100 },
      { produto: 'B', subtotal: 200 },
    ]
    const resultado = ratearDesconto(itens, 10, 300)
    expect(resultado[0].valorDesconto).toBe(10)
    expect(resultado[1].valorDesconto).toBe(20)
    expect(resultado[0].valorFinal).toBe(90)
    expect(resultado[1].valorFinal).toBe(180)
  })

  it('ultimo item recebe ajuste de arredondamento', () => {
    const itens = [
      { produto: 'A', subtotal: 33.33 },
      { produto: 'B', subtotal: 33.33 },
      { produto: 'C', subtotal: 33.34 },
    ]
    const resultado = ratearDesconto(itens, 10, 100)
    const somaDesconto = resultado.reduce((s, i) => s + i.valorDesconto, 0)
    expect(somaDesconto).toBe(10)
  })

  it('retorna array vazio para lista vazia', () => {
    expect(ratearDesconto([], 10, 0)).toEqual([])
  })

  it('trata desconto zero', () => {
    const itens = [{ produto: 'A', subtotal: 100 }]
    const resultado = ratearDesconto(itens, 0, 100)
    expect(resultado[0].valorDesconto).toBe(0)
    expect(resultado[0].valorFinal).toBe(100)
  })
})
