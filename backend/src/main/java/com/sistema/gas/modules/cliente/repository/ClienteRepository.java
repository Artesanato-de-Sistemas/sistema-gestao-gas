package com.sistema.gas.modules.cliente.repository;

import com.sistema.gas.modules.cliente.entity.ClienteEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ClienteRepository
        extends JpaRepository<ClienteEntity, UUID> {
}
