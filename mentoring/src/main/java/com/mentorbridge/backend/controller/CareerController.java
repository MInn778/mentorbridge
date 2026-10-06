package com.mentorbridge.backend.controller;

import com.mentorbridge.backend.service.CareerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.function.Supplier;

@RestController
@RequestMapping("/api/career")
@RequiredArgsConstructor
public class CareerController {

    private final CareerService careerService;

    @PostMapping("/recommend")
    public ResponseEntity<Map<String, String>> recommend(@RequestBody Map<String, String> answers) {
        return respond(() -> careerService.recommend(answers));
    }

    @PostMapping("/chat")
    public ResponseEntity<Map<String, String>> chat(@RequestBody CareerService.ChatRequest request) {
        if (request.question() == null || request.question().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "질문을 입력하세요."));
        }
        return respond(() -> careerService.chat(request));
    }

    // 프론트(AICareer.tsx)는 성공 시 {result}, 실패 시 {error}를 읽는다.
    private ResponseEntity<Map<String, String>> respond(Supplier<String> call) {
        try {
            return ResponseEntity.ok(Map.of("result", call.get()));
        } catch (IllegalStateException e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}
