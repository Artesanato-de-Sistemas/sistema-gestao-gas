package com.sistema.gas.modules.vasilhame.service;

import com.sistema.gas.modules.vasilhame.dto.CreateTipoVasilhameDTO;
import com.sistema.gas.modules.vasilhame.entity.TipoVasilhameEntity;
import com.sistema.gas.modules.vasilhame.repository.TipoVasilhameRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TipoVasilhameService {

    private final TipoVasilhameRepository repository;

    public TipoVasilhameEntity criar(
            CreateTipoVasilhameDTO dto
    ) {

        TipoVasilhameEntity entity =
                TipoVasilhameEntity.builder()
                        .codigo(dto.getCodigo())
                        .descricao(dto.getDescricao())
                        .capacidadeKg(dto.getCapacidadeKg())
                        .build();

        return repository.save(entity);
    }

    public List<TipoVasilhameEntity> listar() {
        return repository.findAll();
    }
}