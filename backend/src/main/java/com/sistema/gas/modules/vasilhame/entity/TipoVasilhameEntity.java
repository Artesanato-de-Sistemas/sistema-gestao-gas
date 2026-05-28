package com.sistema.gas.modules.vasilhame.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "tipo_vasilhame")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TipoVasilhameEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String codigo;

    private String descricao;

    @Column(name = "capacidade_kg")
    private BigDecimal capacidadeKg;
}
