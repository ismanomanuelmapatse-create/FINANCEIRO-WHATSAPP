# Contas (Next.js + Supabase)

1. Supabase → SQL Editor → cola e corre `supabase.sql` (cria `receitas` e `despesas`).
2. `cp .env.example .env.local` e preenche as 3 variáveis.
3. `npm install && npm run dev` → http://localhost:3000
4. Deploy: Vercel (define as mesmas variáveis em Settings → Environment Variables).

No n8n, o fluxo de recebimentos insere em `receitas` e o de despesas em `despesas`; as colunas têm os nomes do JSON.
