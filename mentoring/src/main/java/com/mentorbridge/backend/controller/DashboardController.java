package com.mentorbridge.backend.controller;

import com.mentorbridge.backend.dto.DashboardStatsDto;
import com.mentorbridge.backend.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsDto> getStats(Authentication authentication) {
        return ResponseEntity.ok(dashboardService.getStats(authentication.getName()));
    }
}
