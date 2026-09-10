package com.mentorbridge.backend.controller;

import com.mentorbridge.backend.dto.FeedbackPostDto;
import com.mentorbridge.backend.dto.MentorFeedbackDto;
import com.mentorbridge.backend.service.FeedbackService;
import com.mentorbridge.backend.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.MalformedURLException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/feedback")
@RequiredArgsConstructor
public class FeedbackController {

    private final FeedbackService feedbackService;
    private final FileStorageService fileStorageService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<FeedbackPostDto> createFeedbackPost(
            Authentication authentication,
            @RequestParam String title,
            @RequestParam(required = false) String content,
            @RequestParam(required = false) MultipartFile file) {
        String email = authentication.getName();
        return ResponseEntity.ok(feedbackService.createFeedbackPost(email, title, content, file));
    }

    @GetMapping("/files/{storedName}")
    public ResponseEntity<Resource> downloadFile(@PathVariable String storedName) {
        try {
            Resource resource = new UrlResource(fileStorageService.resolve(storedName).toUri());
            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok()
                    .header("Content-Disposition", "inline; filename=\"" + resource.getFilename() + "\"")
                    .body(resource);
        } catch (MalformedURLException e) {
            return ResponseEntity.notFound().build();
        }
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
