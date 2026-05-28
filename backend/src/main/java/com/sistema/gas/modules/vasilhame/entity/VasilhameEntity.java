package com.sistema.gas.modules.vasilhame.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "vasilhame")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VasilhameEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
}
