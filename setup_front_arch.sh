#!/bin/bash

# Entrar na pasta frontend existente
cd frontend || { echo "Erro: Pasta frontend não encontrada."; exit 1; }

# Criar a estrutura de diretórios base dentro de src
mkdir -p src/{assets,components/ui,hooks,pages,routes,services,store,types,utils}

# Criar arquivos base do core da aplicação
touch src/services/api.ts          # Configuração do Axios/Fetch apontando para o backend
touch src/store/useAppStore.ts     # Configuração base do Zustand para estado global
touch src/routes/index.tsx         # Configuração de rotas (React Router)
touch src/types/index.ts           # Tipagens globais do TypeScript
touch src/utils/formatters.ts      # Funções utilitárias (ex: formatar moeda, datas)

# Criar estrutura de exemplo para o módulo de Entradas (Inbounds)
mkdir -p src/pages/Inbounds
touch src/pages/Inbounds/InboundList.tsx
touch src/pages/Inbounds/InboundForm.tsx

echo "Arquitetura base do Frontend gerada com sucesso na pasta src/"
