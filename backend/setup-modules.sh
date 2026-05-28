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

  mkdir -p "$BASE/$dominio"/{controller,service,repository,entity,dto,enums}

  DOMAIN_CAPITALIZED="$(tr '[:lower:]' '[:upper:]' <<< ${dominio:0:1})${dominio:1}"

  # ENTITY
  cat > "$BASE/$dominio/entity/${DOMAIN_CAPITALIZED}Entity.java" <<EOF
package com.sistema.gas.modules.$dominio.entity;

public class ${DOMAIN_CAPITALIZED}Entity {
}
EOF

  # REPOSITORY
  cat > "$BASE/$dominio/repository/${DOMAIN_CAPITALIZED}Repository.java" <<EOF
package com.sistema.gas.modules.$dominio.repository;

public interface ${DOMAIN_CAPITALIZED}Repository {
}
EOF

  # SERVICE
  cat > "$BASE/$dominio/service/${DOMAIN_CAPITALIZED}Service.java" <<EOF
package com.sistema.gas.modules.$dominio.service;

public class ${DOMAIN_CAPITALIZED}Service {
}
EOF

  # CONTROLLER
  cat > "$BASE/$dominio/controller/${DOMAIN_CAPITALIZED}Controller.java" <<EOF
package com.sistema.gas.modules.$dominio.controller;

public class ${DOMAIN_CAPITALIZED}Controller {
}
EOF

  # DTO
  cat > "$BASE/$dominio/dto/${DOMAIN_CAPITALIZED}DTO.java" <<EOF
package com.sistema.gas.modules.$dominio.dto;

public class ${DOMAIN_CAPITALIZED}DTO {
}
EOF

done

echo "Estrutura criada com sucesso 🚀"
