package com.mentorbridge.backend.service;

import com.mentorbridge.backend.dto.PostReportDto;
import com.mentorbridge.backend.model.NotificationType;
import com.mentorbridge.backend.model.Post;
import com.mentorbridge.backend.model.PostReport;
import com.mentorbridge.backend.model.ReportStatus;
import com.mentorbridge.backend.model.User;
import com.mentorbridge.backend.repository.PostRepository;
import com.mentorbridge.backend.repository.PostReportRepository;
import com.mentorbridge.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PostReportService {

    private final PostReportRepository postReportRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public PostReportDto reportPost(String email, Integer postId, String reason) {
        User reporter = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        if (post.getAuthor().getId().equals(reporter.getId())) {
            throw new RuntimeException("본인 게시글은 신고할 수 없습니다.");
        }

        PostReport report = PostReport.builder()
                .post(post)
                .reporter(reporter)
                .reason(reason)
                .status(ReportStatus.접수)
                .build();

        return mapToDto(postReportRepository.save(report));
    }

    @Transactional(readOnly = true)
    public List<PostReportDto> getAllReports() {
        return postReportRepository.findAll().stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public PostReportDto updateReport(Integer reportId, String adminEmail, ReportStatus status, String processResult) {
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        PostReport report = postReportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Report not found"));

        report.setStatus(status);
        report.setProcessResult(processResult);
        report.setAdmin(admin);
        report.setProcessedAt(LocalDateTime.now());
        PostReport saved = postReportRepository.save(report);

        if (status == ReportStatus.완료) {
            notificationService.sendNotification(
                    report.getReporter().getId(),
                    NotificationType.APPLICATION_STATUS,
                    "신고하신 게시글 처리가 완료되었습니다.",
                    "/community");
        }

        return mapToDto(saved);
    }

    private PostReportDto mapToDto(PostReport report) {
        return PostReportDto.builder()
                .reportId(report.getId())
                .postId(report.getPost().getBoardId())
                .postTitle(report.getPost().getTitle())
                .reporterId(report.getReporter().getId())
                .reporterName(report.getReporter().getName())
                .reason(report.getReason())
                .status(report.getStatus())
                .processResult(report.getProcessResult())
                .createdAt(report.getCreatedAt())
                .processedAt(report.getProcessedAt())
                .build();
    }
}
