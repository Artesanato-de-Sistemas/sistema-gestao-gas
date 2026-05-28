package com.sistema.gas.modules.vasilhame.controller;

import com.sistema.gas.modules.vasilhame.service.VasilhameService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/vasilhame")
@RequiredArgsConstructor
public class VasilhameController {

    private final VasilhameService service;
}
