package com.mentorbridge.backend.config;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

/**
 * ResponseStatusException의 사유(reason)는 사용자에게 보여줄 문구로만 쓰므로 {message}로 내려준다.
 * (Spring 기본 에러 응답은 message를 비워서 프론트의 data.message가 항상 비어 있었음)
 */
@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> handle(ResponseStatusException e) {
        return ResponseEntity.status(e.getStatusCode())
                .body(Map.of("message", e.getReason() != null ? e.getReason() : ""));
    }
}
