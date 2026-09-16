package com.mentorbridge.backend.controller;

import com.mentorbridge.backend.dto.NotificationDto;
import com.mentorbridge.backend.model.NotificationType;
import com.mentorbridge.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping(value = "/subscribe", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe(Authentication authentication) {
        String email = authentication.getName();
        return notificationService.subscribe(email);
    }

    @GetMapping
    public ResponseEntity<List<NotificationDto>> getNotifications(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(notificationService.getNotifications(email));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(Authentication authentication, @PathVariable Integer id) {
        String email = authentication.getName();
        notificationService.markAsRead(email, id);
        return ResponseEntity.ok().build();
    }
    
    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(Authentication authentication) {
        String email = authentication.getName();
        notificationService.markAllAsRead(email);
        return ResponseEntity.ok().build();
    }

    // For testing purposes: an endpoint to trigger a dummy notification to the current user
    @PostMapping("/test-trigger")
    public ResponseEntity<String> triggerTestNotification(Authentication authentication) {
        String email = authentication.getName();
        notificationService.triggerTestNotification(email);
        return ResponseEntity.ok("테스트 알림이 전송되었습니다.");
    }
}
