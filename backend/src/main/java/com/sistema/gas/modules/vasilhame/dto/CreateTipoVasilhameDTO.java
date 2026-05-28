package com.sistema.gas.modules.vasilhame.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateTipoVasilhameDTO {

    @NotBlank
    private String codigo;

    @NotBlank
    private String descricao;

    @NotNull
    private BigDecimal capacidadeKg;
}