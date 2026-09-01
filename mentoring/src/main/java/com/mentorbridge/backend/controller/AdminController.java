package com.mentorbridge.backend.controller;

import com.mentorbridge.backend.dto.MentorRequestDto;
import com.mentorbridge.backend.dto.PostReportDto;
import com.mentorbridge.backend.dto.UserAdminDto;
import com.mentorbridge.backend.service.AdminService;
import com.mentorbridge.backend.service.JobService;
import com.mentorbridge.backend.service.MentorService;
import com.mentorbridge.backend.service.PostReportService;
import com.mentorbridge.backend.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final MentorService mentorService;
    private final PostService postService;
    private final PostReportService postReportService;
    private final JobService jobService;

    @GetMapping("/users")
    public ResponseEntity<List<UserAdminDto>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @PatchMapping("/users/{userId}/suspend")
    public ResponseEntity<UserAdminDto> setSuspended(@PathVariable Integer userId, @RequestBody Map<String, Boolean> payload) {
        boolean suspended = Boolean.TRUE.equals(payload.get("suspended"));
        return ResponseEntity.ok(adminService.setSuspended(userId, suspended));
    }

    @GetMapping("/mentor-requests")
    public ResponseEntity<List<MentorRequestDto>> getAllMentorRequests() {
        return ResponseEntity.ok(mentorService.getAllMentorRequests());
    }

    @PostMapping("/mentor-requests/{requestId}/approve")
    public ResponseEntity<Void> approveMentorRequest(Authentication authentication, @PathVariable Integer requestId) {
        mentorService.approveMentorRequest(requestId, authentication.getName());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/mentor-requests/{requestId}/reject")
    public ResponseEntity<Void> rejectMentorRequest(
            Authentication authentication,
            @PathVariable Integer requestId,
            @RequestBody Map<String, String> payload) {
        mentorService.rejectMentorRequest(requestId, payload.get("reason"), authentication.getName());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/posts/{postId}")
    public ResponseEntity<Void> deletePost(Authentication authentication, @PathVariable Integer postId) {
        postService.adminDeletePost(postId, authentication.getName());
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/users/{userId}/promote")
    public ResponseEntity<UserAdminDto> promoteToAdmin(@PathVariable Integer userId) {
        return ResponseEntity.ok(adminService.promoteToAdmin(userId));
    }

    @GetMapping("/reports")
    public ResponseEntity<List<PostReportDto>> getAllReports() {
        return ResponseEntity.ok(postReportService.getAllReports());
    }

    @PatchMapping("/reports/{reportId}")
    public ResponseEntity<PostReportDto> updateReport(
            Authentication authentication,
            @PathVariable Integer reportId,
            @RequestBody PostReportDto.UpdateRequest request) {
        return ResponseEntity.ok(postReportService.updateReport(
                reportId, authentication.getName(), request.getStatus(), request.getProcessResult()));
    }

    // 매일 오전 9시 자동 실행되는 것과 별개로, 관리자가 즉시 한 번 돌려보고 싶을 때 쓰는 수동 트리거
    @PostMapping("/jobs/check-deadlines")
    public ResponseEntity<Void> checkJobDeadlines() {
        jobService.notifyUpcomingDeadlines();
        return ResponseEntity.ok().build();
    }
}
