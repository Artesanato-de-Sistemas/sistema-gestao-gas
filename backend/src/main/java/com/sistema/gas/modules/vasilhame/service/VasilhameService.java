package com.sistema.gas.modules.vasilhame.service;

import com.sistema.gas.modules.vasilhame.repository.VasilhameRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class VasilhameService {

    private final VasilhameRepository repository;
}
