# Império do Gás ERP

Um sistema ERP (Enterprise Resource Planning) completo para gestão de estoque, vasilhames, entradas, pedidos, clientes, usuários, relatórios e faturamento da **Império do Gás**. O sistema tem foco absoluto em simplicidade, segurança e usabilidade.

## 🚀 Tecnologias e Stack

- **Backend:** Python 3.13, Django 5.2 LTS, Django REST Framework 3.17
- **Frontend:** React 18 (Vite), Tailwind CSS, Shadcn/UI
- **Banco de Dados:** PostgreSQL (via Supabase)
- **Infraestrutura Local:** Docker Compose
- **Qualidade de Código (Backend):** pytest, Ruff

## 📋 Pré-requisitos

Para rodar este projeto na sua máquina, você vai precisar das seguintes ferramentas instaladas:

- [Git](https://git-scm.com/)
- [Docker](https://www.docker.com/) e [Docker Compose](https://docs.docker.com/compose/)

## 🛠️ Instalação e Execução (Passo a Passo)

Siga os passos abaixo para preparar e rodar o projeto localmente.

1. **Clone o repositório:**
   ```bash
   git clone <url-do-repositorio>
   cd sistema-gestao-gas
   ```

2. **Inicie os containers com o Docker Compose (via Makefile):**
   O projeto vem com um `Makefile` configurado para facilitar a execução de comandos comuns. Para subir os serviços (frontend, backend e banco de dados se houver):
   ```bash
   make up
   ```
   *Este comando fará o build das imagens Docker e rodará os containers em background.*

3. **Verifique se tudo está rodando (Health Check):**
   Você pode verificar o status dos serviços com:
   ```bash
   make health
   ```

4. **Acesse a Aplicação:**
   - **Frontend:** http://localhost:5173
   - **Backend (API):** http://localhost:8000

## 🏗️ Comandos Úteis (Makefile)

Durante o desenvolvimento, utilize os seguintes comandos do `Makefile` na raiz do projeto:

| Comando | Descrição |
| --- | --- |
| `make up` | Constrói (se necessário) e sobe os containers em segundo plano. |
| `make down` | Para e remove os containers. |
| `make rebuild` | Reconstrói as imagens sem usar o cache do Docker. |
| `make logs` | Exibe os logs dos containers em tempo real (tail=200). |
| `make shell` | Abre o terminal interativo (shell) do Django dentro do container. |
| `make makemigrations` | Cria novas migrações do banco de dados baseadas nas alterações nos models. |
| `make migrate` | Aplica as migrações no banco de dados. |
| `make lint` | Roda o `Ruff` para verificação de lint no backend. |
| `make format` | Formata o código do backend utilizando o `Ruff`. |

## 📚 Documentação Adicional e Regras de Negócio

Para compreender melhor a arquitetura do projeto e as regras do negócio que guiam o desenvolvimento, leia atentamente as seguintes documentações:

- **[AGENTS.md](./AGENTS.md):** Contém as invariantes de negócio e os limites de arquitetura (ex: Frontend "burro", empréstimos vs ativos, regras de estoque).
- **[ARCHITECTURE.md](./ARCHITECTURE.md):** Descreve a visão geral e os padrões internos adotados no backend Django.
- **[Modelagem de Banco](./modelagem-de-banco.pdf):** Documento PDF contendo os detalhes do esquema do banco de dados.

## 🛡️ Invariantes do Sistema (Destaque)
Apenas para reforçar as regras vitais do sistema:
1. Empréstimo de vasilhame nunca reduz o ativo da empresa.
2. Venda de recarga é atômica (sai cheio, entra/devolve vazio).
3. O estoque **não pode** ficar negativo em hipótese alguma.
4. O frontend não executa regras de negócio; a API Django é o único orquestrador com acesso via `service_role` ao banco.

---
Desenvolvido para Império do Gás.
