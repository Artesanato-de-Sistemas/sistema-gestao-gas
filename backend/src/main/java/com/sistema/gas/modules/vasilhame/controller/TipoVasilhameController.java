package com.sistema.gas.modules.vasilhame.controller;

import com.sistema.gas.modules.vasilhame.dto.CreateTipoVasilhameDTO;
import com.sistema.gas.modules.vasilhame.entity.TipoVasilhameEntity;
import com.sistema.gas.modules.vasilhame.service.TipoVasilhameService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tipo-vasilhame")
@RequiredArgsConstructor
public class TipoVasilhameController {

    private final TipoVasilhameService service;

    @PostMapping
    public TipoVasilhameEntity criar(
            @RequestBody @Valid CreateTipoVasilhameDTO dto
    ) {
        return service.criar(dto);
    }

    @GetMapping
    public List<TipoVasilhameEntity> listar() {
        return service.listar();
    }
}