#!/bin/bash

# Entrar na pasta backend existente
cd backend || { echo "Erro: Pasta backend não encontrada."; exit 1; }

# Definir o pacote base
BASE_PKG="src/main/java/com/imperiodogas/api"

# Criar a estrutura de pacotes
mkdir -p $BASE_PKG/{config,controller,dto,exception,model,repository,service}

# Criar arquivos base do core da aplicação
touch $BASE_PKG/ApiApplication.java
touch $BASE_PKG/config/SecurityConfig.java
touch $BASE_PKG/exception/GlobalExceptionHandler.java

# Criar estrutura de exemplo para a entidade Inbound
touch $BASE_PKG/model/Inbound.java
touch $BASE_PKG/dto/InboundDTO.java
touch $BASE_PKG/repository/InboundRepository.java
touch $BASE_PKG/service/InboundService.java
touch $BASE_PKG/controller/InboundController.java

# Criar application.yml para configurações (Substituindo application.properties)
mkdir -p src/main/resources
touch src/main/resources/application.yml

echo "Arquitetura base do Spring Boot gerada com sucesso em $BASE_PKG"
