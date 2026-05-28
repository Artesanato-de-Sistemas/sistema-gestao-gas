package com.sistema.gas.modules.faturamento.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "faturamento")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FaturamentoEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
}
