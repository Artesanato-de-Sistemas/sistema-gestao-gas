package com.sistema.gas.modules.vasilhame.repository;

import com.sistema.gas.modules.vasilhame.entity.VasilhameEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface VasilhameRepository
        extends JpaRepository<VasilhameEntity, UUID> {
}
