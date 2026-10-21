import { createClient } from '@supabase/supabase-js';

// Forma comum usada pelo painel (as duas tabelas são convertidas para isto)
export type Movimento = {
  id: string;
  created_at: string;
  tipo_movimento: 'receita' | 'despesa';
  valor: number | null;
  moeda: string;
  descricao: string | null;
  categoria: string | null;
  fonte: string | null;
  destino: string | null;
  conta_movimento: string | null;
  valor_pago: number | null;
  troco_recebido: number | null;
  data_movimento: string | null;
  informacoes_em_falta: string[] | null;
  registo_completo: boolean;
  pergunta_ao_usuario: string | null;
};

type Linha = Record<string, any>;
const num = (v: unknown) => (v == null ? null : Number(v));

const deReceita = (r: Linha): Movimento => ({
  id: `r-${r.id}`,
  created_at: r.created_at,
  tipo_movimento: 'receita',
  valor: num(r.valor),
  moeda: r.moeda ?? 'MZN',
  descricao: r.descricao,
  categoria: r.categoria,
  fonte: r.fonte,
  destino: r.destino,
  conta_movimento: r.conta_movimento,
  valor_pago: num(r.valor_pago),
  troco_recebido: num(r.troco_recebido),
  data_movimento: r.data_movimento,
  informacoes_em_falta: r.informacoes_em_falta,
  registo_completo: !!r.registo_completo,
  pergunta_ao_usuario: r.resposta_usuario,
});

const deDespesa = (r: Linha): Movimento => ({
  id: `d-${r.id}`,
  created_at: r.created_at,
  tipo_movimento: 'despesa',
  valor: num(r.valor_gasto),
  moeda: r.moeda ?? 'MZN',
  descricao: r.descricao_despesa,
  categoria: r.categoria,
  fonte: null,
  destino: r.local_compra,
  conta_movimento: null,
  valor_pago: num(r.valor_pago),
  troco_recebido: num(r.troco_recebido),
  data_movimento: r.data_despesa,
  informacoes_em_falta: r.informacoes_em_falta,
  registo_completo: !!r.registo_completo,
  pergunta_ao_usuario: r.pergunta_ao_usuario,
});

export async function carregarMovimentos(): Promise<Movimento[]> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Faltam SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ficheiro .env.local.');

  const db = createClient(url, key, { auth: { persistSession: false } });
  const [rec, des] = await Promise.all([
    db.from('receitas').select('*').order('created_at', { ascending: false }).limit(1000),
    db.from('despesas').select('*').order('created_at', { ascending: false }).limit(1000),
  ]);
  if (rec.error) throw new Error(`receitas: ${rec.error.message}`);
  if (des.error) throw new Error(`despesas: ${des.error.message}`);

  return [...(rec.data ?? []).map(deReceita), ...(des.data ?? []).map(deDespesa)];
}
