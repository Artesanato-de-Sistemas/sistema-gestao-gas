package com.sistema.gas.modules.pedido.service;

import com.sistema.gas.modules.pedido.repository.PedidoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PedidoService {

    private final PedidoRepository repository;
}
