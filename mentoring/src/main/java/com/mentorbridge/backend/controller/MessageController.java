package com.mentorbridge.backend.controller;

import com.mentorbridge.backend.dto.MessageCreateDto;
import com.mentorbridge.backend.dto.MessageDto;
import com.mentorbridge.backend.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    @GetMapping
    public ResponseEntity<List<MessageDto>> getInbox() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(messageService.getInbox(email));
    }

    @PostMapping
    public ResponseEntity<MessageDto> sendMessage(@RequestBody MessageCreateDto dto) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(messageService.sendMessage(email, dto));
    }

    @PostMapping("/{id}/accept")
    public ResponseEntity<Void> acceptApplication(@PathVariable Integer id) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        messageService.acceptApplication(email, id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<Void> rejectApplication(@PathVariable Integer id) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        messageService.rejectApplication(email, id);
        return ResponseEntity.ok().build();
    }
}
