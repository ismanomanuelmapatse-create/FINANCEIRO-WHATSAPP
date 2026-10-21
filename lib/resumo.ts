import type { Movimento } from './data';

export type Periodo = 'mes' | '30d' | 'tudo';

// Maputo = UTC+2 o ano todo (sem hora de verão)
const isoMaputo = (d: Date) => new Date(d.getTime() + 2 * 3600e3).toISOString().slice(0, 10);

export const hoje = () => isoMaputo(new Date());
export const diaDe = (m: Movimento) => m.data_movimento ?? isoMaputo(new Date(m.created_at));

function somarDias(iso: string, n: number) {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function filtrar(todos: Movimento[], periodo: Periodo) {
  const h = hoje();
  const desde = periodo === 'mes' ? h.slice(0, 7) + '-01' : periodo === '30d' ? somarDias(h, -29) : '0000-00-00';
  return todos.filter((m) => diaDe(m) >= desde);
}

export function resumir(movs: Movimento[]) {
  const emMzn = movs.filter((m) => m.moeda === 'MZN' && m.valor != null);
  const receitas = emMzn.filter((m) => m.tipo_movimento === 'receita').reduce((s, m) => s + m.valor!, 0);
  const despesas = emMzn.filter((m) => m.tipo_movimento === 'despesa').reduce((s, m) => s + m.valor!, 0);

  const porCat = new Map<string, number>();
  for (const m of emMzn.filter((m) => m.tipo_movimento === 'despesa')) {
    const c = m.categoria?.trim() || 'Sem categoria';
    porCat.set(c, (porCat.get(c) ?? 0) + m.valor!);
  }
  const categorias = [...porCat.entries()].map(([nome, total]) => ({ nome, total })).sort((a, b) => b.total - a.total);

  const h = hoje();
  const dias = Array.from({ length: 30 }, (_, i) => {
    const dia = somarDias(h, i - 29);
    const total = emMzn
      .filter((m) => m.tipo_movimento === 'despesa' && diaDe(m) === dia)
      .reduce((s, m) => s + m.valor!, 0);
    return { dia, total };
  });

  const pendentes = movs.filter((m) => !m.registo_completo);
  const outrasMoedas = movs.some((m) => m.moeda !== 'MZN');

  return { receitas, despesas, saldo: receitas - despesas, categorias, dias, pendentes, outrasMoedas };
}

export const mzn = (n: number, moeda = 'MZN') =>
  n.toLocaleString('pt-PT', {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  }) + ' ' + moeda;

export const dataCurta = (iso: string) =>
  new Date(iso + 'T12:00:00Z').toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' }).replace('.', '');

export const ROTULO_CAMPO: Record<string, string> = {
  fonte: 'de quem veio',
  destino: 'onde entrou',
  conta_movimento: 'conta',
  data_movimento: 'data',
  descricao: 'descrição',
  categoria: 'categoria',
  valor: 'valor',
  valor_pago: 'valor pago',
  troco_recebido: 'troco',
  local_compra: 'local',
  descricao_despesa: 'descrição',
  data_despesa: 'data',
  valor_gasto: 'valor',
};
