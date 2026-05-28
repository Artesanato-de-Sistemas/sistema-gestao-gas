#!/bin/bash

BASE="src/main/java/com/sistema/gas/modules"

DOMINIOS=(
  "cliente"
  "faturamento"
  "pedido"
  "produto"
  "vasilhame"
)

for dominio in "${DOMINIOS[@]}"
do

  DOMAIN_CAPITALIZED="$(tr '[:lower:]' '[:upper:]' <<< ${dominio:0:1})${dominio:1}"

  echo "Gerando módulo: $DOMAIN_CAPITALIZED"

  # =========================
  # DTO
  # =========================

  cat > "$BASE/$dominio/dto/Create${DOMAIN_CAPITALIZED}DTO.java" <<EOF
package com.sistema.gas.modules.$dominio.dto;

import lombok.Data;

@Data
public class Create${DOMAIN_CAPITALIZED}DTO {
}
EOF

  # =========================
  # ENTITY
  # =========================

  cat > "$BASE/$dominio/entity/${DOMAIN_CAPITALIZED}Entity.java" <<EOF
package com.sistema.gas.modules.$dominio.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "${dominio}")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ${DOMAIN_CAPITALIZED}Entity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
}
EOF

  # =========================
  # REPOSITORY
  # =========================

  cat > "$BASE/$dominio/repository/${DOMAIN_CAPITALIZED}Repository.java" <<EOF
package com.sistema.gas.modules.$dominio.repository;

import com.sistema.gas.modules.$dominio.entity.${DOMAIN_CAPITALIZED}Entity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ${DOMAIN_CAPITALIZED}Repository
        extends JpaRepository<${DOMAIN_CAPITALIZED}Entity, UUID> {
}
EOF

  # =========================
  # SERVICE
  # =========================

  cat > "$BASE/$dominio/service/${DOMAIN_CAPITALIZED}Service.java" <<EOF
package com.sistema.gas.modules.$dominio.service;

import com.sistema.gas.modules.$dominio.repository.${DOMAIN_CAPITALIZED}Repository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ${DOMAIN_CAPITALIZED}Service {

    private final ${DOMAIN_CAPITALIZED}Repository repository;
}
EOF

  # =========================
  # CONTROLLER
  # =========================

  cat > "$BASE/$dominio/controller/${DOMAIN_CAPITALIZED}Controller.java" <<EOF
package com.sistema.gas.modules.$dominio.controller;

import com.sistema.gas.modules.$dominio.service.${DOMAIN_CAPITALIZED}Service;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/${dominio}")
@RequiredArgsConstructor
public class ${DOMAIN_CAPITALIZED}Controller {

    private final ${DOMAIN_CAPITALIZED}Service service;
}
EOF

done

echo ""
echo "CRUD base gerado com sucesso 🚀"
