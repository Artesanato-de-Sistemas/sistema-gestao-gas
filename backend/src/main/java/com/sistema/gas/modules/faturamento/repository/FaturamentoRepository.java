package com.sistema.gas.modules.faturamento.repository;

import com.sistema.gas.modules.faturamento.entity.FaturamentoEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface FaturamentoRepository
        extends JpaRepository<FaturamentoEntity, UUID> {
}
