package com.sistema.gas.modules.faturamento.service;

import com.sistema.gas.modules.faturamento.repository.FaturamentoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class FaturamentoService {

    private final FaturamentoRepository repository;
}
