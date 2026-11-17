package com.mentorbridge.backend.controller;

import com.mentorbridge.backend.dto.FeedbackPostDto;
import com.mentorbridge.backend.dto.MentorFeedbackDto;
import com.mentorbridge.backend.service.FeedbackService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/feedback")
@RequiredArgsConstructor
public class FeedbackController {

    private final FeedbackService feedbackService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<FeedbackPostDto> createFeedbackPost(
            Authentication authentication,
            @RequestParam String title,
            @RequestParam(required = false) String content,
            @RequestParam(required = false) MultipartFile file) {
        String email = authentication.getName();
        return ResponseEntity.ok(feedbackService.createFeedbackPost(email, title, content, file));
    }

    // 프론트가 Authorization 헤더를 붙여 fetch -> blob으로 받아 저장한다 (일반 링크로 열면 헤더가 없어 401)
    @GetMapping("/files/{storedName}")
    public ResponseEntity<byte[]> downloadFile(Authentication authentication, @PathVariable String storedName) {
        FeedbackService.Attachment file = feedbackService.getAttachment(storedName, authentication.getName());
        if (file == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "첨부파일을 찾을 수 없습니다.");
        }
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(file.fileName(), StandardCharsets.UTF_8).build().toString())
                .body(file.data());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFeedbackPost(Authentication authentication, @PathVariable Integer id) {
        feedbackService.deleteFeedbackPost(id, authentication.getName());
        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<List<FeedbackPostDto>> getAllFeedbackPosts() {
        return ResponseEntity.ok(feedbackService.getAllFeedbackPosts());
    }

    @GetMapping("/my")
    public ResponseEntity<List<FeedbackPostDto>> getMyFeedbackPosts(Authentication authentication) {
        return ResponseEntity.ok(feedbackService.getMyFeedbackPosts(authentication.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<FeedbackPostDto> getFeedbackPost(Authentication authentication, @PathVariable Integer id) {
        return ResponseEntity.ok(feedbackService.getFeedbackPost(id, authentication.getName()));
    }

    @PostMapping("/{id}/regenerate")
    public ResponseEntity<FeedbackPostDto> regenerateAiFeedback(Authentication authentication, @PathVariable Integer id) {
        return ResponseEntity.ok(feedbackService.regenerateAiFeedback(id, authentication.getName()));
    }

    @PostMapping("/{id}/comment")
    public ResponseEntity<MentorFeedbackDto> addMentorFeedback(
            Authentication authentication,
            @PathVariable Integer id,
            @RequestBody Map<String, String> payload) {
        String email = authentication.getName();
        String content = payload.get("content");
        return ResponseEntity.ok(feedbackService.addMentorFeedback(email, id, content));
    }
}
