import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aVencer, gastoPagoNoAno, gastoPrevistoNoAno, isPaid, proximaAcao, resumoDaSerie, seriesDe, variacaoConsumo } from '../src/lib/summary.ts';
import { buildSchedule, remindersByDue } from '../src/lib/calc.ts';
import type { Entry, Reminder } from '../src/types.ts';

const ref = '2026-11-03';
let n = 0;
const entry = (p: Partial<Entry>): Entry => ({
  id: `e${++n}`, kind: 'expense', date: ref, odometer: null, amount: 100, category: 'Seguro', description: '', notes: '', createdAt: n, ...p,
});

/** série 24× R$ 146,35 a partir de 19/08/2026: 3 pagas (ago, set, out), as outras a vencer */
const serie = buildSchedule('recurring', '2026-08-19', 146.35, 24).map((r, i) =>
  entry({ date: r.date, amount: r.amount, series: { id: 's1', type: 'installments', index: i + 1, count: 24 } }),
);

test('isPaid: "Pago" manda; sem ele, data até hoje', () => {
  assert.equal(isPaid({ date: '2026-12-01', paid: true }, ref), true);
  assert.equal(isPaid({ date: '2026-10-01', paid: false }, ref), false);
  assert.equal(isPaid({ date: '2026-10-01' }, ref), true);
  assert.equal(isPaid({ date: '2026-12-01' }, ref), false);
});

test('parcelas futuras ficam fora do gasto pago e entram no previsto', () => {
  const list = [...serie, entry({ kind: 'fuel', amount: 200, date: '2026-10-05' })];
  assert.equal(gastoPagoNoAno(list, ref), 200 + 3 * 146.35); // ago, set, out + combustível
  assert.equal(gastoPrevistoNoAno(list, ref), 2 * 146.35); // nov e dez deste ano
});

test('resumo da série: 3 de 24 pagas', () => {
  const r = resumoDaSerie(seriesDe(serie)[0], ref);
  assert.equal(r.total, 24);
  assert.equal(r.pagas, 3);
  assert.equal(r.valorPago, 439.05);
  assert.equal(r.restante, 3073.35);
  assert.equal(r.proxima?.date, '2026-11-19');
});

const rem = (p: Partial<Reminder>): Reminder => ({
  id: p.title ?? 'r', title: 'r', intervalKm: null, intervalMonths: null, lastKm: null, lastDate: null, createdAt: 0, ...p,
});

test('próxima ação: vencido por data antes de vencido por km', () => {
  const porKm = rem({ title: 'Óleo', intervalKm: 10000, lastKm: 180000 }); // venceu em 190.000
  const porData = rem({ title: 'IPVA', intervalMonths: 12, lastDate: '2025-10-01' }); // venceu 01/10/2026
  const emBreve = rem({ title: 'Revisão', intervalKm: 20000, lastKm: 175000 }); // faltam 500 km
  assert.equal(proximaAcao([porKm, emBreve, porData], 194500, ref)?.r.title, 'IPVA');
  assert.equal(proximaAcao([porKm, emBreve], 194500, ref)?.r.title, 'Óleo');
  assert.equal(proximaAcao([emBreve], 194500, ref)?.r.title, 'Revisão');
  assert.equal(proximaAcao([], 194500, ref), null);
});

test('a vencer: contas e lembretes pela data mais próxima, até 3', () => {
  const r = rem({ title: 'Licenciamento', intervalMonths: 12, lastDate: '2025-11-10' }); // 10/11/2026
  const due = remindersByDue([r], 0, null, ref);
  const list = aVencer(serie, due, ref);
  assert.deepEqual(list.map((x) => x.date), ['2026-11-10', '2026-11-19', '2026-12-19']);
  assert.equal(list[0].type, 'reminder');
});

test('consumo: variação em relação ao mês anterior', () => {
  const f = (km: number, liters: number, date: string): Entry => entry({ kind: 'fuel', odometer: km, liters, fullTank: true, date, amount: 0 });
  // outubro: 400 km / 40 L = 10 km/l · novembro: 412 km / 40 L = 10,3 km/l → +3%
  const list = [f(1000, 40, '2026-10-01'), f(1400, 40, '2026-10-20'), f(1812, 40, '2026-11-02')];
  assert.equal(Math.round(variacaoConsumo(list, ref)! * 100), 3);
  assert.equal(variacaoConsumo(list.slice(0, 2), ref), null); // sem dados em novembro
});
