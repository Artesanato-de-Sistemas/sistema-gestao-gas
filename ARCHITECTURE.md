# Arquitetura do sistema

## Visão geral
O sistema é um monorepo com frontend em React e backend em Django REST Framework. O PostgreSQL (hospedado no Supabase) é a fonte de verdade transacional. O Backend atua como proxy seguro e orquestrador de regras de negócio.

Browser -> React (Vite) -> HTTP /api -> Django REST Framework -> PostgreSQL (Supabase - service_role)

## Padrão interno por app (Django)
api/            # views, viewsets, serializers, urls
domain/         # invariantes e regras puras
models.py       # persistência do domínio (achatado, sem herança complexa)
services.py     # casos de uso e transações
tests/          # unitários e integração