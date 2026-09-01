package com.mentorbridge.backend.controller;

import com.mentorbridge.backend.dto.FeedbackPostDto;
import com.mentorbridge.backend.dto.MentorFeedbackDto;
import com.mentorbridge.backend.service.FeedbackService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/feedback")
@RequiredArgsConstructor
public class FeedbackController {

    private final FeedbackService feedbackService;

    @PostMapping
    public ResponseEntity<FeedbackPostDto> createFeedbackPost(Authentication authentication, @RequestBody FeedbackPostDto dto) {
        String email = authentication.getName();
        return ResponseEntity.ok(feedbackService.createFeedbackPost(email, dto));
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
    public ResponseEntity<FeedbackPostDto> getFeedbackPost(@PathVariable Integer id) {
        return ResponseEntity.ok(feedbackService.getFeedbackPost(id));
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
