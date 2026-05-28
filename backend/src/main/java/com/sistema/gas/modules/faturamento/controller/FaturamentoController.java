package com.sistema.gas.modules.faturamento.controller;

import com.sistema.gas.modules.faturamento.service.FaturamentoService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/faturamento")
@RequiredArgsConstructor
public class FaturamentoController {

    private final FaturamentoService service;
}
