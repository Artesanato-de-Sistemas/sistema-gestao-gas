package com.sistema.gas.modules.vasilhame.repository;

import com.sistema.gas.modules.vasilhame.entity.TipoVasilhameEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface TipoVasilhameRepository
        extends JpaRepository<TipoVasilhameEntity, UUID> {
}