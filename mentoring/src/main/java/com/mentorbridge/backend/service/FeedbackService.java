package com.mentorbridge.backend.service;

import com.mentorbridge.backend.dto.FeedbackPostDto;
import com.mentorbridge.backend.dto.MentorFeedbackDto;
import com.mentorbridge.backend.model.*;
import com.mentorbridge.backend.repository.FeedbackPostRepository;
import com.mentorbridge.backend.repository.MentorFeedbackRepository;
import com.mentorbridge.backend.repository.MentorProfileRepository;
import com.mentorbridge.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FeedbackService {

    private static final Logger log = LoggerFactory.getLogger(FeedbackService.class);

    private final FeedbackPostRepository feedbackPostRepository;
    private final MentorFeedbackRepository mentorFeedbackRepository;
    private final UserRepository userRepository;
    private final MentorProfileRepository mentorProfileRepository;
    private final NotificationService notificationService;
    private final FileStorageService fileStorageService;
    private final FileTextExtractionService fileTextExtractionService;
    private final GeminiService geminiService;

    @Transactional
    public FeedbackPostDto createFeedbackPost(String email, String title, String content, MultipartFile file) {
        User author = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        FeedbackPost.FeedbackPostBuilder builder = FeedbackPost.builder()
                .author(author)
                .title(title)
                .content(content);

        String extractedText = null;
        if (file != null && !file.isEmpty()) {
            try {
                FileStorageService.StoredFile stored = fileStorageService.storeFeedbackAttachment(file);
                builder.fileUrl(stored.url()).fileName(stored.originalName());
                extractedText = fileTextExtractionService.extractText(file);
            } catch (IllegalArgumentException e) {
                throw new RuntimeException(e.getMessage());
            } catch (IOException e) {
                log.error("첨부파일 저장 실패", e);
                throw new RuntimeException("파일 저장에 실패했습니다.");
            }
        }

        builder.aiFeedback(generateAiFeedback(title, content, extractedText));

        FeedbackPost post = feedbackPostRepository.save(builder.build());

        return mapToDto(post);
    }

    private String generateAiFeedback(String title, String content, String extractedText) {
        if (!geminiService.isConfigured()) {
            return "AI 피드백을 생성하지 못했습니다. (관리자가 GEMINI_API_KEY를 설정하면 자동으로 생성됩니다)";
        }

        String prompt;
        if (extractedText != null && !extractedText.isBlank()) {
            prompt = """
                    당신은 전문 커리어 멘토입니다. 아래는 사용자가 첨부한 이력서/포트폴리오/발표자료에서 추출한 실제 텍스트입니다.
                    이 내용을 바탕으로 구체적인 피드백을 마크다운 형식으로 작성해주세요.

                    [게시글 제목]
                    %s

                    [사용자가 남긴 요청 사항]
                    %s

                    [첨부파일에서 추출한 내용]
                    %s

                    다음 형식으로 작성해주세요:
                    1. 강점 분석
                    2. 개선이 필요한 부분 (첨부파일 내용을 구체적으로 인용해서)
                    3. 향후 학습 방향
                    """.formatted(title, content == null ? "" : content, extractedText);
        } else {
            prompt = """
                    당신은 전문 커리어 멘토입니다. 사용자가 '%s' 제목으로 피드백을 요청했고, 요청 내용은 다음과 같습니다: '%s'
                    (첨부파일 내용은 자동으로 읽어올 수 없는 형식이라, 제목과 요청 내용만으로 일반적인 조언을 마크다운 형식으로 작성해주세요.)
                    1. 강점 분석
                    2. 개선이 필요한 부분
                    3. 향후 학습 방향
                    """.formatted(title, content == null ? "" : content);
        }

        String result = geminiService.generateContent(prompt);
        return result != null ? result : "AI 피드백 생성에 실패했습니다. 잠시 후 다시 시도해주세요.";
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
                .fileName(post.getFileName())
                .aiFeedback(post.getAiFeedback())
                .createdAt(post.getCreatedAt())
                .build();
    }
}
