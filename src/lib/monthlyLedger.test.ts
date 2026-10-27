import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeQuincenaBalance,
  copyRecurringToMonth,
  createEmptyMonthLedger,
  groupLedgerExpenses,
  groupAllMonthsExpenses,
  type QuincenaLedger,
} from './monthlyLedger.ts';

describe('Monthly Ledger - Libreta Quincenal de Gastos', () => {
  it('calculates running balance and ending balance matching user Excel sample exactly', () => {
    // Caso de uso extraído del Excel del usuario (Pago del 15)
    const q1Sample: QuincenaLedger = {
      items: [
        { id: '1', desc: 'Impresora', amount: 130.0, type: 'expense', day: 17 },
        { id: '2', desc: 'Luz', amount: 71.11, type: 'expense', day: 15 },
        { id: '3', desc: 'Internet', amount: 31.0, type: 'expense', day: 15 },
        { id: '4', desc: 'Tienda', amount: 25.0, type: 'expense', day: 15 },
        { id: '5', desc: 'Laptop', amount: 20.0, type: 'expense', day: 15 },
        { id: '6', desc: 'AGY', amount: 20.0, type: 'expense', day: 15 },
        { id: '7', desc: 'Q25', amount: 458.23, type: 'income', day: 17 },
        { id: '8', desc: 'Tarjeta', amount: 200.0, type: 'expense', day: 20 },
        { id: '9', desc: 'Tel Ari', amount: 105.0, type: 'expense', day: 22 },
      ],
    };

    const res = computeQuincenaBalance(388.81, q1Sample);

    assert.equal(res.startingBalance, 388.81);
    assert.equal(res.computedItems[0].runningBalance, 258.81);
    assert.equal(res.computedItems[1].runningBalance, 187.7);
    assert.equal(res.computedItems[2].runningBalance, 156.7);
    assert.equal(res.computedItems[3].runningBalance, 131.7);
    assert.equal(res.computedItems[4].runningBalance, 111.7);
    assert.equal(res.computedItems[5].runningBalance, 91.7);
    assert.equal(res.computedItems[6].runningBalance, 549.93);
    assert.equal(res.computedItems[7].runningBalance, 349.93);
    assert.equal(res.computedItems[8].runningBalance, 244.93);

    assert.equal(res.totalExpenses, 602.11);
    assert.equal(res.totalIncome, 458.23);
    assert.equal(res.endingBalance, 244.93);
  });

  it('allows custom starting balance overriding default net pay', () => {
    const q1: QuincenaLedger = {
      customStartingBalance: 500.0,
      items: [{ id: '1', desc: 'Comida', amount: 100.0, type: 'expense', day: 15 }],
    };

    const res = computeQuincenaBalance(400.0, q1);
    assert.equal(res.startingBalance, 500.0);
    assert.equal(res.isCustomBalance, true);
    assert.equal(res.endingBalance, 400.0);
  });

  it('copies recurring entries from one month to another without duplicates', () => {
    const source = createEmptyMonthLedger('usr-test-01', 2026, 1);
    source.q1.items = [
      { id: 's1', desc: 'Internet', amount: 31.0, type: 'expense', day: 15, isRecurring: true },
      { id: 's2', desc: 'Impresora (único)', amount: 130.0, type: 'expense', day: 17, isRecurring: false },
    ];
    source.q2.items = [
      { id: 's3', desc: 'Spotify', amount: 12.0, type: 'expense', day: 30, isRecurring: true },
    ];

    const target = createEmptyMonthLedger('usr-test-01', 2026, 2);
    const updated = copyRecurringToMonth(source, target);

    assert.equal(updated.q1.items.length, 1);
    assert.equal(updated.q1.items[0].desc, 'Internet');
    assert.equal(updated.q2.items.length, 1);
    assert.equal(updated.q2.items[0].desc, 'Spotify');

    // Al copiar de nuevo, no debe duplicar
    const copiedAgain = copyRecurringToMonth(source, updated);
    assert.equal(copiedAgain.q1.items.length, 1);
    assert.equal(copiedAgain.q2.items.length, 1);
  });

  it('groups expenses with the same description and sums amounts across quincenas', () => {
    const month = createEmptyMonthLedger('usr-test-01', 2026, 1);
    month.q1.items = [
      { id: '1', desc: 'Tarjeta', amount: 25.0, type: 'expense', day: 15, isRecurring: true, checked: true },
      { id: '2', desc: 'Super', amount: 60.0, type: 'expense', day: 15, checked: true },
      { id: '3', desc: 'Sueldo', amount: 500.0, type: 'income', day: 15, checked: true }, // no debe contarse en gastos
    ];
    month.q2.items = [
      { id: '4', desc: 'tarjeta', amount: 50.0, type: 'expense', day: 30, isRecurring: true, checked: true }, // mismo texto con diferente caja
      { id: '5', desc: 'Super', amount: 60.0, type: 'expense', day: 30, checked: true },
      { id: '6', desc: 'Internet', amount: 35.0, type: 'expense', day: 30 }, // default sin checkear, no se incluye
    ];

    const res = groupLedgerExpenses(month);

    // Debe tener 2 grupos: Super ($120) y Tarjeta ($75), Internet excluido por estar desmarcado
    assert.equal(res.groups.length, 2);

    const superGroup = res.groups.find((g) => g.desc.toLowerCase() === 'super')!;
    assert.ok(superGroup);
    assert.equal(superGroup.totalAmount, 120.0);
    assert.equal(superGroup.count, 2);
    assert.equal(superGroup.q1Amount, 60.0);
    assert.equal(superGroup.q2Amount, 60.0);

    const tarjetaGroup = res.groups.find((g) => g.desc.toLowerCase() === 'tarjeta')!;
    assert.ok(tarjetaGroup);
    assert.equal(tarjetaGroup.totalAmount, 75.0);
    assert.equal(tarjetaGroup.count, 2);
    assert.equal(tarjetaGroup.q1Amount, 25.0);
    assert.equal(tarjetaGroup.q2Amount, 50.0);
    assert.equal(tarjetaGroup.isRecurring, true);

    assert.equal(res.totalGroupedAmount, 195.0);
    assert.equal(res.totalGroupedCount, 4);
  });

  it('groups expenses across multiple months for all-months summary', () => {
    const m1 = createEmptyMonthLedger('usr-test-01', 2026, 10);
    m1.q1.items = [
      { id: '1', desc: 'Tarjeta Joven', amount: 42.05, type: 'expense', day: 15, isRecurring: true, checked: true },
      { id: '2', desc: 'Supermercado', amount: 50.0, type: 'expense', day: 15, checked: true },
    ];
    m1.q2.items = [
      { id: '3', desc: 'Gasolina', amount: 20.0, type: 'expense', day: 30, checked: false }, // unchecked
    ];

    const m2 = createEmptyMonthLedger('usr-test-01', 2026, 11);
    m2.q1.items = [
      { id: '4', desc: 'tarjeta joven', amount: 50.0, type: 'expense', day: 15, isRecurring: true, checked: true },
    ];
    m2.q2.items = [
      { id: '5', desc: 'Supermercado', amount: 65.0, type: 'expense', day: 30, checked: true },
    ];

    const m3 = createEmptyMonthLedger('usr-test-01', 2026, 12);
    m3.q1.items = [
      { id: '6', desc: 'TARJETA JOVEN', amount: 100.0, type: 'expense', day: 15, isRecurring: true, checked: true },
    ];

    const res = groupAllMonthsExpenses([m1, m2, m3], 2026);

    assert.equal(res.groups.length, 2);

    const tarjeta = res.groups.find((g) => g.desc.toLowerCase() === 'tarjeta joven')!;
    assert.ok(tarjeta);
    assert.equal(tarjeta.totalAmount, 192.05);
    assert.equal(tarjeta.count, 3);
    assert.equal(tarjeta.monthsCount, 3);
    assert.equal(tarjeta.monthsList.length, 3);
    assert.equal(tarjeta.monthsList[0].month, 10);
    assert.equal(tarjeta.monthsList[0].amount, 42.05);
    assert.equal(tarjeta.monthsList[1].month, 11);
    assert.equal(tarjeta.monthsList[1].amount, 50.0);
    assert.equal(tarjeta.monthsList[2].month, 12);
    assert.equal(tarjeta.monthsList[2].amount, 100.0);

    const superm = res.groups.find((g) => g.desc.toLowerCase() === 'supermercado')!;
    assert.ok(superm);
    assert.equal(superm.totalAmount, 115.0);
    assert.equal(superm.count, 2);
    assert.equal(superm.monthsCount, 2);

    assert.equal(res.totalGroupedAmount, 307.05);
    assert.equal(res.totalGroupedCount, 5);
    assert.deepEqual(res.monthsRepresented, [10, 11, 12]);
  });
});
