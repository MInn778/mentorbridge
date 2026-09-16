package com.mentorbridge.backend.controller;

import com.mentorbridge.backend.dto.MentorApplyRequest;
import com.mentorbridge.backend.dto.MentorMatchingDto;
import com.mentorbridge.backend.dto.MentorProfileDto;
import com.mentorbridge.backend.dto.MentorRequestDto;
import com.mentorbridge.backend.model.MatchingStatus;
import com.mentorbridge.backend.service.MentorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/mentors")
@RequiredArgsConstructor
public class MentorController {

    private final MentorService mentorService;

    @GetMapping
    public ResponseEntity<List<MentorProfileDto>> getAllMentors() {
        return ResponseEntity.ok(mentorService.getAllMentors());
    }

    @PostMapping("/request")
    public ResponseEntity<MentorRequestDto> requestMentorRole(
            Authentication authentication,
            @RequestBody MentorApplyRequest request) {
        String email = authentication.getName();
        return ResponseEntity.ok(mentorService.applyForMentor(email, request));
    }

    @PostMapping("/{mentorId}/match")
    public ResponseEntity<String> requestMatching(
            Authentication authentication,
            @PathVariable Integer mentorId) {
        String email = authentication.getName();
        mentorService.requestMatching(email, mentorId);
        return ResponseEntity.ok("멘토링 신청이 완료되었습니다.");
    }

    @PutMapping("/profile")
    public ResponseEntity<MentorProfileDto> updateMyMentorProfile(Authentication authentication, @RequestBody MentorProfileDto dto) {
        return ResponseEntity.ok(mentorService.updateMyMentorProfile(authentication.getName(), dto));
    }

    @GetMapping("/my-matchings")
    public ResponseEntity<List<MentorMatchingDto>> getMyMatchings(Authentication authentication) {
        return ResponseEntity.ok(mentorService.getMyMatchings(authentication.getName()));
    }

    @PostMapping("/matchings/{matchingId}/accept")
    public ResponseEntity<Void> acceptMatching(Authentication authentication, @PathVariable Integer matchingId) {
        mentorService.respondToMatching(authentication.getName(), matchingId, MatchingStatus.ACCEPTED);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/matchings/{matchingId}/reject")
    public ResponseEntity<Void> rejectMatching(Authentication authentication, @PathVariable Integer matchingId) {
        mentorService.respondToMatching(authentication.getName(), matchingId, MatchingStatus.REJECTED);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/matchings/{matchingId}/complete")
    public ResponseEntity<Void> completeMatching(Authentication authentication, @PathVariable Integer matchingId) {
        mentorService.completeMatching(authentication.getName(), matchingId);
        return ResponseEntity.ok().build();
    }
}
