import Link from 'next/link';
import { carregarMovimentos, type Movimento } from '@/lib/data';
import { dataCurta, diaDe, filtrar, hoje, mzn, resumir, ROTULO_CAMPO, type Periodo } from '@/lib/resumo';

export const dynamic = 'force-dynamic';

const PERIODOS: { id: Periodo; nome: string }[] = [
  { id: 'mes', nome: 'Este mês' },
  { id: '30d', nome: '30 dias' },
  { id: 'tudo', nome: 'Tudo' },
];

export default async function Page({ searchParams }: { searchParams: Promise<{ periodo?: string }> }) {
  const { periodo: p } = await searchParams;
  const periodo: Periodo = p === '30d' || p === 'tudo' ? p : 'mes';

  let todos: Movimento[];
  try {
    todos = await carregarMovimentos();
  } catch (e) {
    return (
      <main className="wrap">
        <div className="erro">
          <strong>Não foi possível ler os dados.</strong>
          <p>{(e as Error).message}</p>
        </div>
      </main>
    );
  }

  const movs = filtrar(todos, periodo).sort((a, b) => (diaDe(b) + b.created_at).localeCompare(diaDe(a) + a.created_at));
  const r = resumir(movs);
  const total = r.receitas + r.despesas;
  const pctRec = total ? (r.receitas / total) * 100 : 50;
  const maxCat = Math.max(1, ...r.categorias.map((c) => c.total));
  const maxDia = Math.max(1, ...r.dias.map((d) => d.total));
  const mes = new Date().toLocaleDateString('pt-PT', { month: 'long', timeZone: 'Africa/Maputo' });
  const titulo = periodo === 'mes' ? `Saldo de ${mes}` : periodo === '30d' ? 'Saldo dos últimos 30 dias' : 'Saldo total';

  return (
    <main className="wrap">
      <header className="topo">
        <h1 className="marca">Contas</h1>
        <nav className="abas" aria-label="Período">
          {PERIODOS.map((x) => (
            <Link key={x.id} href={x.id === 'mes' ? '/' : `/?periodo=${x.id}`} aria-current={x.id === periodo ? 'page' : undefined}>
              {x.nome}
            </Link>
          ))}
        </nav>
      </header>

      <section className="hero" aria-labelledby="saldo-t">
        <p id="saldo-t" className="hero-rotulo">{titulo}</p>
        <p className={`saldo ${r.saldo < 0 ? 'neg' : ''}`}>{mzn(r.saldo)}</p>

        <div className="balanca" role="img" aria-label={`Receitas ${mzn(r.receitas)}, despesas ${mzn(r.despesas)}`}>
          <div className="b-rec" style={{ width: `${pctRec}%` }} />
          <div className="b-des" style={{ width: `${100 - pctRec}%` }} />
        </div>
        <div className="balanca-leg">
          <span><i className="dot rec" />Recebido <b>{mzn(r.receitas)}</b></span>
          <span>Gasto <b>{mzn(r.despesas)}</b><i className="dot des" /></span>
        </div>
        {r.outrasMoedas && <p className="nota">Há registos noutras moedas; só os valores em MZN entram nestes totais.</p>}
      </section>

      <div className="duas">
        <section aria-labelledby="cat-t">
          <h2 id="cat-t">Onde foi o dinheiro</h2>
          {r.categorias.length === 0 ? (
            <p className="vazio">Ainda não há gastos neste período. Envia um gasto no WhatsApp e ele aparece aqui.</p>
          ) : (
            <ul className="cats">
              {r.categorias.map((c) => (
                <li key={c.nome}>
                  <div className="cat-linha">
                    <span>{c.nome}</span>
                    <b>{mzn(c.total)}</b>
                  </div>
                  <div className="cat-barra"><div style={{ width: `${(c.total / maxCat) * 100}%` }} /></div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="dia-t">
          <h2 id="dia-t">Gasto por dia, últimos 30 dias</h2>
          <div className="dias" role="img" aria-label="Gráfico de gasto diário">
            {r.dias.map((d) => (
              <div key={d.dia} className={`dia ${d.dia === hoje() ? 'hoje' : ''}`} title={`${dataCurta(d.dia)}: ${mzn(d.total)}`}>
                <div style={{ height: `${Math.max(d.total ? 4 : 1, (d.total / maxDia) * 100)}%` }} />
              </div>
            ))}
          </div>
          <div className="dias-eixo"><span>{dataCurta(r.dias[0].dia)}</span><span>hoje</span></div>
        </section>
      </div>

      {r.pendentes.length > 0 && (
        <section className="pendentes" aria-labelledby="pend-t">
          <h2 id="pend-t">Por completar ({r.pendentes.length})</h2>
          <p className="sub">Registos que o bot ainda está à espera de fechar. Responde no WhatsApp.</p>
          <ul>
            {r.pendentes.map((m) => (
              <li key={m.id}>
                <div className="pend-topo">
                  <b>{m.valor != null ? mzn(m.valor, m.moeda) : 'Valor por indicar'}</b>
                  <span>{m.tipo_movimento === 'receita' ? 'Recebimento' : 'Gasto'} · {dataCurta(diaDe(m))}</span>
                </div>
                {m.informacoes_em_falta && m.informacoes_em_falta.length > 0 && (
                  <p className="falta">
                    Falta: {m.informacoes_em_falta.map((c) => ROTULO_CAMPO[c] ?? c).join(', ')}
                  </p>
                )}
                {m.pergunta_ao_usuario && <p className="pergunta">“{m.pergunta_ao_usuario}”</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="mov-t">
        <h2 id="mov-t">Movimentos</h2>
        {movs.length === 0 ? (
          <p className="vazio">Nada registado neste período.</p>
        ) : (
          <ul className="mov">
            {movs.map((m) => {
              const rec = m.tipo_movimento === 'receita';
              const quem = rec ? m.fonte : m.destino;
              return (
                <li key={m.id} className="linha">
                  <span className="l-data">{dataCurta(diaDe(m))}</span>
                  <span className="l-desc">
                    <b>{m.descricao ?? (rec ? 'Recebimento' : 'Gasto')}</b>
                    <small>
                      {[m.categoria, quem ? (rec ? `de ${quem}` : `em ${quem}`) : null].filter(Boolean).join(' · ') ||
                        'sem detalhes'}
                    </small>
                  </span>
                  <span className="l-conta">
                    {m.conta_movimento ?? '—'}
                    {m.troco_recebido ? <small>troco {mzn(m.troco_recebido, m.moeda)}</small> : null}
                  </span>
                  <span className={`l-valor ${rec ? 'rec' : 'des'}`}>
                    {m.valor == null ? '—' : `${rec ? '+' : '−'}${mzn(m.valor, m.moeda)}`}
                    {!m.registo_completo && <em>incompleto</em>}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
