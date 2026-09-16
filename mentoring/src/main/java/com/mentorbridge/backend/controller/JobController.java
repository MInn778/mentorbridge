package com.mentorbridge.backend.controller;

import com.mentorbridge.backend.dto.BookmarkDto;
import com.mentorbridge.backend.dto.JobDto;
import com.mentorbridge.backend.service.JobService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
public class JobController {

    private final JobService jobService;

    @GetMapping
    public ResponseEntity<List<JobDto>> getJobs(
            Authentication authentication,
            @RequestParam(required = false) String keyword) {
        String email = authentication.getName();
        return ResponseEntity.ok(jobService.getJobs(keyword, email));
    }

    @GetMapping("/bookmarks")
    public ResponseEntity<List<BookmarkDto>> getBookmarks(Authentication authentication) {
        return ResponseEntity.ok(jobService.getBookmarks(authentication.getName()));
    }

    @PostMapping("/{externalJobId}/bookmark")
    public ResponseEntity<Void> addBookmark(Authentication authentication, @PathVariable String externalJobId) {
        jobService.addBookmark(authentication.getName(), externalJobId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{externalJobId}/bookmark")
    public ResponseEntity<Void> removeBookmark(Authentication authentication, @PathVariable String externalJobId) {
        jobService.removeBookmark(authentication.getName(), externalJobId);
        return ResponseEntity.ok().build();
    }
}
