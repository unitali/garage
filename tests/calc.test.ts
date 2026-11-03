import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSchedule, costSummary, currentOdometer, fuelStats, kmPerDay, reminderStatus, remindersByDue, serviceItems, sortEntriesByKm, sumItems } from '../src/lib/calc.ts';
import { addDays, addMonths, diffDays } from '../src/lib/dates.ts';
import { maskKm, maskMoney, parseDecimal, parseInteger, toInput } from '../src/lib/format.ts';
import { categoryOptions } from '../src/constants.ts';
import type { Entry, Reminder } from '../src/types.ts';

let n = 0;
const fuel = (odometer: number, liters: number, fullTank = true, date = '2026-10-01', amount = liters * 6): Entry => ({
  id: `f${++n}`, kind: 'fuel', date, odometer, amount, category: 'Combustível', description: '', notes: '', liters, fullTank, createdAt: n,
});

test('consumo pelo método do tanque cheio, com parcial no meio', () => {
  const a = fuel(1000, 40);
  const b = fuel(1200, 10, false); // parcial
  const c = fuel(1500, 30); // trecho 1000→1500 = 500 km / 40 L
  const d = fuel(1900, 25); // trecho 1500→1900 = 400 km / 25 L
  const s = fuelStats([d, b, c, a]); // ordem embaralhada de propósito
  assert.equal(s.byEntry[c.id], 500 / 40);
  assert.equal(s.byEntry[d.id], 400 / 25);
  assert.equal(s.last, 16);
  assert.equal(s.avg, 900 / 65);
  assert.equal(s.byEntry[a.id], undefined);
});

test('sem dois tanques cheios não há média', () => {
  assert.equal(fuelStats([fuel(1000, 40, false), fuel(1300, 30)]).avg, null);
});

test('km atual e custo por km', () => {
  const v = { initialOdometer: 1000 };
  const list = [fuel(1500, 40, true, '2026-11-02', 240), { ...fuel(1600, 1), kind: 'service' as const, amount: 360, date: '2026-01-10' }];
  const cur = currentOdometer(v, list);
  assert.equal(cur, 1600);
  const c = costSummary(list, v, cur, '2026-11-03');
  assert.equal(c.total, 600);
  assert.equal(c.month, 240);
  assert.equal(c.year, 600);
  assert.equal(c.costPerKm, 1);
  assert.equal(c.fuelCostPerKm, 0.4);
});

const rem = (p: Partial<Reminder>): Reminder => ({
  id: 'r', title: 'Óleo', intervalKm: 10000, intervalMonths: 12, lastKm: 50000, lastDate: '2026-01-15', createdAt: 0, ...p,
});

test('lembrete: em dia, perto, urgente por km, vencido por data', () => {
  const ok = reminderStatus(rem({}), 55000, '2026-06-01');
  assert.equal(ok.level, 'ok');
  assert.equal(ok.near, false);
  const near = reminderStatus(rem({}), 59200, '2026-06-01'); // faltam 800: aviso (≤ 1.000), ainda verde
  assert.equal(near.level, 'ok');
  assert.equal(near.near, true);
  assert.equal(near.kmLeft, 800);
  assert.equal(reminderStatus(rem({}), 59850, '2026-06-01').level, 'soon'); // faltam 150 ≤ 200: laranja
  const late = reminderStatus(rem({}), 52000, '2027-01-20');
  assert.equal(late.level, 'overdue');
  assert.equal(late.nextDate, '2027-01-15');
  assert.equal(late.daysLeft, -5);
});

test('janelas configuráveis: aviso (aparece) e urgente (laranja)', () => {
  const custom = { km: 2000, months: 3, urgentKm: 500, urgentDays: 15 };
  const r = rem({ intervalKm: 50000, intervalMonths: null, lastKm: 10000 }); // vence em 60.000 km
  assert.equal(reminderStatus(r, 58500, '2026-06-01').near, false); // faltam 1.500 > 1.000 (padrão)
  assert.equal(reminderStatus(r, 59100, '2026-06-01').near, true); // faltam 900
  assert.equal(reminderStatus(r, 58500, '2026-06-01', custom).near, true);
  assert.equal(reminderStatus(r, 59600, '2026-06-01', custom).level, 'soon'); // faltam 400 ≤ 500
  const d = rem({ intervalKm: null, intervalMonths: 12, lastDate: '2026-01-15' }); // vence 15/01/2027
  assert.equal(reminderStatus(d, 0, '2026-11-10').near, false); // 2 meses antes
  assert.equal(reminderStatus(d, 0, '2026-12-20').near, true); // menos de 1 mês
  assert.equal(reminderStatus(d, 0, '2026-12-20').level, 'ok'); // 26 dias: ainda verde
  assert.equal(reminderStatus(d, 0, '2027-01-10').level, 'soon'); // 5 dias ≤ 7: laranja
  assert.equal(reminderStatus(d, 0, '2027-01-02', custom).level, 'soon'); // 13 dias ≤ 15
  assert.equal(reminderStatus(d, 0, '2027-01-16').level, 'overdue');
});

test('lembrete só por tempo', () => {
  const s = reminderStatus(rem({ intervalKm: null, intervalMonths: 24 }), 999999, '2027-12-20');
  assert.equal(s.nextKm, null);
  assert.equal(s.near, true); // vence 15/01/2028
  assert.equal(s.level, 'ok');
});

test('histórico pelo km; sem km entra pelo km da data', () => {
  const a = fuel(10500, 30, true, '2026-02-01');
  const b = fuel(11200, 30, true, '2026-03-01');
  const ipva = { ...fuel(0, 0, true, '2026-02-15'), odometer: null, kind: 'expense' as const }; // entre a e b
  const antigo = { ...fuel(0, 0, true, '2026-01-05'), odometer: null, kind: 'expense' as const }; // antes de tudo
  assert.deepEqual(sortEntriesByKm([ipva, a, antigo, b], 10000).map((e) => e.id), [b.id, ipva.id, a.id, antigo.id]);
});

test('média de km por dia', () => {
  const v = { initialOdometer: 10000, createdAt: new Date(2026, 0, 1).getTime() };
  // 3.000 km entre 01/01 e 31/03 (89 dias)
  assert.equal(kmPerDay(v, [fuel(11000, 30, true, '2026-02-01'), fuel(13000, 30, true, '2026-03-31')]), 3000 / 89);
  assert.equal(kmPerDay(v, [fuel(10100, 5, true, '2026-01-03')]), null); // menos de uma semana
  assert.equal(kmPerDay(v, []), null);
});

test('lembretes por data de vencimento, estimando os de km', () => {
  const ref = '2026-06-01';
  const oleo = rem({ id: 'oleo', title: 'Troca de óleo', intervalMonths: null, lastKm: 50000 }); // vence em 60.000 km
  const ipva = rem({ id: 'ipva', title: 'IPVA', intervalKm: null, intervalMonths: 12, lastDate: '2026-01-15' }); // 15/01/2027
  const pneu = rem({ id: 'pneu', title: 'Pneus', intervalMonths: null, intervalKm: 40000, lastKm: 25000 }); // 65.000 km
  // 58.000 km hoje, 50 km/dia: óleo em 40 dias, pneus em 140 dias (19/10/2026)
  const list = remindersByDue([ipva, pneu, oleo], 58000, 50, ref);
  assert.deepEqual(list.map((x) => x.r.id), ['oleo', 'pneu', 'ipva']);
  assert.equal(list[0].due, '2026-07-11');
  assert.equal(list[0].estimated, true);
  assert.equal(list[2].estimated, false);
  // sem histórico de km/dia, os só-por-km ficam sem data e vão para o fim (ambos em dia → ordem alfabética)
  assert.deepEqual(remindersByDue([oleo, ipva, pneu], 58000, null, ref).map((x) => x.r.id), ['ipva', 'pneu', 'oleo']);
});

test('datas', () => {
  assert.equal(addMonths('2026-01-31', 1), '2026-02-28');
  assert.equal(addMonths('2026-11-15', 14), '2028-01-15');
  assert.equal(diffDays('2026-11-03', '2026-12-03'), 30);
  assert.equal(addDays('2026-12-25', 10), '2027-01-04');
});

test('números em formato brasileiro', () => {
  assert.equal(parseDecimal('5,49'), 5.49);
  assert.equal(parseDecimal('1.234,56'), 1234.56);
  assert.equal(parseDecimal('6.19'), 6.19);
  assert.equal(parseDecimal(''), null);
  assert.equal(parseInteger('85.300 km'), 85300);
});

test('tipos de serviço: padrões + personalizados, "Outro" por último, sem repetidos', () => {
  const opts = categoryOptions(['Troca de óleo', 'Freios', 'Outro'], ['Lavagem a seco', ' troca  DE óleo ', 'Alarme', 'outro'], 'Polimento');
  assert.deepEqual(opts, ['Troca de óleo', 'Freios', 'Alarme', 'Lavagem a seco', 'Polimento', 'Outro']);
  assert.deepEqual(categoryOptions(['A', 'Outro']), ['A', 'Outro']);
});

test('serviço com vários itens: soma exata e compatível com serviços antigos', () => {
  const items = [
    { category: 'Correia', amount: 850.1 },
    { category: 'Embreagem', amount: 1200.2 },
    { category: "Bomba d'água", amount: 0.1 },
  ];
  assert.equal(sumItems(items), 2050.4); // sem 2050.3999999…
  assert.deepEqual(serviceItems({ items, category: 'Correia', amount: 2050.4 }), items);
  assert.deepEqual(serviceItems({ category: 'Freios', amount: 300 }), [{ category: 'Freios', amount: 300 }]);
});

test('despesa parcelada e recorrente: datas mês a mês e centavos exatos', () => {
  const p = buildSchedule('installments', '2026-01-31', 1000, 3);
  assert.deepEqual(p.map((x) => x.date), ['2026-01-31', '2026-02-28', '2026-03-31']);
  assert.deepEqual(p.map((x) => x.amount), [333.34, 333.33, 333.33]);
  assert.equal(sumItems(p), 1000);
  const r = buildSchedule('recurring', '2026-11-10', 89.9, 12);
  assert.equal(r.length, 12);
  assert.equal(r[11].date, '2027-10-10');
  assert.ok(r.every((x) => x.amount === 89.9));
});

test('máscaras: km com até 6 dígitos, valores com duas casas', () => {
  assert.equal(maskKm('1234567'), '123456');
  assert.equal(maskKm('12a.3-4'), '1234');
  // digitando 1, 2, 3, 4, 5, 6 um a um
  const typed: string[] = [];
  let v = '';
  for (const d of '123456') typed.push((v = maskMoney(v + d)));
  assert.deepEqual(typed, ['0,01', '0,12', '1,23', '12,34', '123,45', '1.234,56']);
  assert.equal(maskMoney('1.234,5'), '123,45'); // apagar o último dígito
  assert.equal(maskMoney('0,0'), ''); // apagou tudo
  assert.equal(maskMoney('R$ 5,4x9'), '5,49'); // letras e símbolos ignorados
  assert.equal(maskMoney('12345678901'), '1.234.567,89'); // limite de 9 dígitos
  assert.equal(parseDecimal(maskMoney('123456')), 1234.56);
  assert.equal(toInput(1234.5, 2), '1.234,50');
});
