#!/bin/bash

PROJETO="sistema-gestao-gas"
mkdir -p $PROJETO
cd $PROJETO

BACKEND_DIR="backend/src/main/java/com/sistema/gas"

mkdir -p $BACKEND_DIR/config
mkdir -p $BACKEND_DIR/exception
mkdir -p $BACKEND_DIR/modules/produto
mkdir -p $BACKEND_DIR/modules/vasilhame
mkdir -p $BACKEND_DIR/modules/cliente
mkdir -p $BACKEND_DIR/modules/pedido
mkdir -p $BACKEND_DIR/modules/faturamento
mkdir -p $BACKEND_DIR/shared

touch $BACKEND_DIR/GasApplication.java

FRONTEND_DIR="frontend/lib"

mkdir -p $FRONTEND_DIR/core/network
mkdir -p $FRONTEND_DIR/core/theme
mkdir -p $FRONTEND_DIR/core/utils
mkdir -p $FRONTEND_DIR/features/auth
mkdir -p $FRONTEND_DIR/features/dashboard
mkdir -p $FRONTEND_DIR/features/estoque
mkdir -p $FRONTEND_DIR/features/pdv

touch $FRONTEND_DIR/main.dart

echo "Arquitetura criada com sucesso em: ./$PROJETO"
