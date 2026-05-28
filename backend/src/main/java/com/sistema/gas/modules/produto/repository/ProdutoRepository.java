package com.sistema.gas.modules.produto.repository;

import com.sistema.gas.modules.produto.entity.ProdutoEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ProdutoRepository
        extends JpaRepository<ProdutoEntity, UUID> {
}
