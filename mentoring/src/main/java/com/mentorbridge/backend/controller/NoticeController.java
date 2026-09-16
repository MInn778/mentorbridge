package com.mentorbridge.backend.controller;

import com.mentorbridge.backend.dto.NoticeDto;
import com.mentorbridge.backend.service.NoticeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class NoticeController {

    private final NoticeService noticeService;

    @GetMapping("/api/notices")
    public ResponseEntity<List<NoticeDto>> getAllNotices() {
        return ResponseEntity.ok(noticeService.getAllNotices());
    }

    @PostMapping("/api/admin/notices")
    public ResponseEntity<NoticeDto> createNotice(Authentication authentication, @RequestBody NoticeDto.Request request) {
        return ResponseEntity.ok(noticeService.createNotice(authentication.getName(), request));
    }

    @DeleteMapping("/api/admin/notices/{noticeId}")
    public ResponseEntity<Void> deleteNotice(@PathVariable Integer noticeId) {
        noticeService.deleteNotice(noticeId);
        return ResponseEntity.ok().build();
    }
}
