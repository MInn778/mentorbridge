package com.mentorbridge.backend.service;

import com.mentorbridge.backend.dto.FeedbackPostDto;
import com.mentorbridge.backend.dto.MentorFeedbackDto;
import com.mentorbridge.backend.model.*;
import com.mentorbridge.backend.repository.FeedbackPostRepository;
import com.mentorbridge.backend.repository.MentorFeedbackRepository;
import com.mentorbridge.backend.repository.MentorProfileRepository;
import com.mentorbridge.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FeedbackService {

    private final FeedbackPostRepository feedbackPostRepository;
    private final MentorFeedbackRepository mentorFeedbackRepository;
    private final UserRepository userRepository;
    private final MentorProfileRepository mentorProfileRepository;
    private final NotificationService notificationService;

    @Transactional
    public FeedbackPostDto createFeedbackPost(String email, FeedbackPostDto dto) {
        User author = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        FeedbackPost post = FeedbackPost.builder()
                .author(author)
                .title(dto.getTitle())
                .content(dto.getContent())
                .fileUrl(dto.getFileUrl())
                .aiFeedback(dto.getAiFeedback())
                .build();

        post = feedbackPostRepository.save(post);

        return mapToDto(post);
    }

    @Transactional(readOnly = true)
    public List<FeedbackPostDto> getAllFeedbackPosts() {
        return feedbackPostRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<FeedbackPostDto> getMyFeedbackPosts(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return feedbackPostRepository.findByAuthorIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public FeedbackPostDto getFeedbackPost(Integer id) {
        FeedbackPost post = feedbackPostRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Feedback Post not found"));
        
        FeedbackPostDto dto = mapToDto(post);
        
        List<MentorFeedbackDto> feedbacks = mentorFeedbackRepository.findByFeedbackPostIdOrderByCreatedAtAsc(id).stream()
                .map(f -> MentorFeedbackDto.builder()
                        .id(f.getId())
                        .feedbackPostId(f.getFeedbackPost().getId())
                        .mentorId(f.getMentor().getId())
                        .mentorName(f.getMentor().getUser().getName())
                        .content(f.getContent())
                        .createdAt(f.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
                
        dto.setMentorFeedbacks(feedbacks);
        return dto;
    }

    @Transactional
    public MentorFeedbackDto addMentorFeedback(String email, Integer postId, String content) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
                
        MentorProfile mentor = mentorProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Only mentors can add feedback"));

        FeedbackPost post = feedbackPostRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Feedback Post not found"));

        MentorFeedback feedback = MentorFeedback.builder()
                .feedbackPost(post)
                .mentor(mentor)
                .content(content)
                .build();

        feedback = mentorFeedbackRepository.save(feedback);

        // Notify author
        notificationService.sendNotification(post.getAuthor().getId(), NotificationType.COMMENT, "게시글에 멘토의 피드백이 등록되었습니다.", "/feedback");

        return MentorFeedbackDto.builder()
                .id(feedback.getId())
                .feedbackPostId(post.getId())
                .mentorId(mentor.getId())
                .mentorName(mentor.getUser().getName())
                .content(feedback.getContent())
                .createdAt(feedback.getCreatedAt())
                .build();
    }

    private FeedbackPostDto mapToDto(FeedbackPost post) {
        return FeedbackPostDto.builder()
                .id(post.getId())
                .authorId(post.getAuthor().getId())
                .authorName(post.getAuthor().getName())
                .title(post.getTitle())
                .content(post.getContent())
                .fileUrl(post.getFileUrl())
                .aiFeedback(post.getAiFeedback())
                .createdAt(post.getCreatedAt())
                .build();
    }
}
