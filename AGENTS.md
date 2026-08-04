# AGENTS.md — mapa operacional do repositório

Este arquivo é um índice. Leia somente o contexto necessário para a tarefa.

## Objetivo do produto
ERP para gestão de estoque, vasilhames, entradas, pedidos, clientes, usuários, relatórios e faturamento da Império do Gás. Foco absoluto em simplicidade, segurança e usabilidade.

## Stack alvo
- Backend: Python 3.13, Django 5.2 LTS, Django REST Framework 3.17, PostgreSQL.
- Frontend: React 18 (Vite) + Tailwind CSS + Shadcn/UI.
- Execução local: Docker Compose.
- Qualidade backend: pytest, Ruff.

## Invariantes de negócio
1. Empréstimo de vasilhame nunca reduz o ativo da empresa; altera custódia/localização.
2. Venda de recarga deve ser atômica: sai um vasilhame cheio e entra/devolve um vazio.
3. Estoque não pode ficar negativo.
4. Movimentações concluídas são auditáveis e não devem ser apagadas fisicamente.

## Limites arquiteturais
- Views/ViewSets não contêm regra de negócio.
- O Frontend é 100% burro em relação a regras de negócio. Ele apenas exibe dados e consome a API.
- A API do backend (Django) detém acesso exclusivo ao Supabase (PostgreSQL) usando a `service_role`.
- Nenhuma rota pública do frontend toca o banco de dados diretamente.