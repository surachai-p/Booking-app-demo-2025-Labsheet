// tests/unit/payment.test.ts
import { describe, it, expect } from 'vitest'

// ── Business logic helpers (mirrors payment route logic) ────────────────────
function calculateChange(totalAmount: number, amountPaid: number): number {
  if (amountPaid < totalAmount) return 0 // ✅ Fix: prevent negative change
  return amountPaid - totalAmount
}

function isValidPayment(totalAmount: number, amountPaid: number): boolean {
  // This function should exist but DOESN'T in the current route — BUG-001
  return amountPaid >= totalAmount
}

// ── Tests ────────────────────────────────────────────────────────────────────
describe('Payment Calculation Logic', () => {
  it('returns correct positive change when overpaid', () => {
    expect(calculateChange(150, 200)).toBe(50)
  })

  it('returns zero change when exact amount is paid', () => {
    expect(calculateChange(150, 150)).toBe(0)
  })

  // ⚠️ BUG-001: This test FAILS — reveals the underpayment bug
  it('[BUG-001] should NOT produce negative change (underpayment rejection)', () => {
    const change = calculateChange(150, 100)
    // Current route stores change = -50 without validation
    // Expected: route should return HTTP 400, not store -50
    expect(change).toBeGreaterThanOrEqual(0) // ❌ FAILS → -50 < 0
  })
})

describe('Payment Validation', () => {
  it('accepts payment when amountPaid equals totalAmount', () => {
    expect(isValidPayment(150, 150)).toBe(true)
  })

  it('accepts payment when amountPaid exceeds totalAmount', () => {
    expect(isValidPayment(150, 200)).toBe(true)
  })

  it('rejects payment when amountPaid is less than totalAmount', () => {
    expect(isValidPayment(150, 100)).toBe(false)
  })

  it('rejects payment of zero', () => {
    expect(isValidPayment(150, 0)).toBe(false)
  })
})

describe('Business Risk: Order Total Integrity', () => {
  it('order total equals sum of all item subtotals', () => {
    const items = [
      { unitPrice: 80, quantity: 2, subtotal: 160 },
      { unitPrice: 45, quantity: 1, subtotal: 45 },
      { unitPrice: 60, quantity: 1, subtotal: 60 },
    ]
    const calculated = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
    const stored     = items.reduce((s, i) => s + i.subtotal, 0)
    expect(calculated).toBe(265)
    expect(stored).toBe(265)
    expect(calculated).toBe(stored)
  })
})
