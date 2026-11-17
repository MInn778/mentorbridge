package com.mentorbridge.backend.controller;

import com.mentorbridge.backend.model.Activity;
import com.mentorbridge.backend.model.Role;
import com.mentorbridge.backend.model.User;
import com.mentorbridge.backend.repository.ActivityRepository;
import com.mentorbridge.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

/** 공모전 & 활동: 로그인 사용자 누구나 조회, 멘토·관리자만 등록, 관리자만 삭제(/api/admin/** 는 SecurityConfig가 ADMIN만 허용). */
@RestController
@RequiredArgsConstructor
public class ActivityController {

    private final ActivityRepository activityRepository;
    private final UserRepository userRepository;

    public record ActivityRequest(String title, String organizer, LocalDate startDate, LocalDate endDate,
                                  String reward, String link, List<String> tags) {}

    public record ActivityDto(Integer id, String title, String organizer, LocalDate startDate, LocalDate endDate,
                              String reward, String link, List<String> tags, String authorName, LocalDateTime createdAt) {}

    @GetMapping("/api/activities")
    @Transactional(readOnly = true)
    public List<ActivityDto> list() {
        return activityRepository.findAllByOrderByCreatedAtDesc().stream().map(ActivityController::toDto).toList();
    }

    @PostMapping("/api/activities")
    @Transactional
    public ActivityDto create(Authentication auth, @RequestBody ActivityRequest req) {
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        if (user.getRole() != Role.MENTOR && user.getRole() != Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "멘토와 관리자만 등록할 수 있습니다.");
        }
        if (req.title() == null || req.title().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "제목을 입력하세요.");
        }
        String link = blankToNull(req.link());
        // href로 그대로 쓰이므로 javascript: 같은 스킴을 막는다
        if (link != null && !link.matches("(?i)^https?://.+")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "링크는 http:// 또는 https:// 로 시작해야 합니다.");
        }

        Activity saved = activityRepository.save(Activity.builder()
                .author(user)
                .title(req.title().trim())
                .organizer(blankToNull(req.organizer()))
                .startDate(req.startDate())
                .endDate(req.endDate())
                .reward(blankToNull(req.reward()))
                .link(link)
                .tags(req.tags() == null ? null : String.join(",", req.tags().stream().map(String::trim).filter(t -> !t.isEmpty()).toList()))
                .build());
        return toDto(saved);
    }

    @DeleteMapping("/api/admin/activities/{id}")
    public void delete(@PathVariable Integer id) {
        activityRepository.deleteById(id);
    }

    private static ActivityDto toDto(Activity a) {
        List<String> tags = a.getTags() == null || a.getTags().isBlank() ? List.of() : Arrays.asList(a.getTags().split(","));
        return new ActivityDto(a.getId(), a.getTitle(), a.getOrganizer(), a.getStartDate(), a.getEndDate(),
                a.getReward(), a.getLink(), tags, a.getAuthor() != null ? a.getAuthor().getName() : a.getSource(), a.getCreatedAt());
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
