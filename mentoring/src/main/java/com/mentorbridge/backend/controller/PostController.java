package com.mentorbridge.backend.controller;

import com.mentorbridge.backend.dto.PostDto;
import com.mentorbridge.backend.dto.PostReportDto;
import com.mentorbridge.backend.model.PostStatus;
import com.mentorbridge.backend.service.PostReportService;
import com.mentorbridge.backend.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;
    private final PostReportService postReportService;

    @GetMapping
    public ResponseEntity<List<PostDto>> getAllPosts() {
        return ResponseEntity.ok(postService.getAllPosts());
    }

    @PostMapping
    public ResponseEntity<PostDto> createPost(@RequestBody PostDto.Request request) {
        String email = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(postService.createPost(request, email));
    }

    @GetMapping("/{postId}")
    public ResponseEntity<PostDto> getPost(@PathVariable Integer postId) {
        return ResponseEntity.ok(postService.getPost(postId));
    }

    @PutMapping("/{postId}")
    public ResponseEntity<PostDto> updatePost(@PathVariable Integer postId, @RequestBody PostDto.Request request) {
        String email = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(postService.updatePost(postId, request, email));
    }

    @PatchMapping("/{postId}/status")
    public ResponseEntity<PostDto> updateStatus(@PathVariable Integer postId, @RequestBody Map<String, String> payload) {
        String email = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        PostStatus status = PostStatus.valueOf(payload.get("status"));
        return ResponseEntity.ok(postService.updateStatus(postId, status, email));
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<Void> deletePost(@PathVariable Integer postId) {
        String email = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        postService.deletePost(postId, email);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{postId}/report")
    public ResponseEntity<PostReportDto> reportPost(
            Authentication authentication,
            @PathVariable Integer postId,
            @RequestBody PostReportDto.CreateRequest request) {
        return ResponseEntity.ok(postReportService.reportPost(authentication.getName(), postId, request.getReason()));
    }
}
