package com.mentorbridge.backend.service;

import com.mentorbridge.backend.dto.BookmarkDto;
import com.mentorbridge.backend.dto.JobDto;
import com.mentorbridge.backend.model.Bookmark;
import com.mentorbridge.backend.model.JobCache;
import com.mentorbridge.backend.model.NotificationType;
import com.mentorbridge.backend.model.User;
import com.mentorbridge.backend.repository.BookmarkRepository;
import com.mentorbridge.backend.repository.JobCacheRepository;
import com.mentorbridge.backend.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class JobService {

    private static final int DEADLINE_REMINDER_DAYS = 3;

    private final JobCacheRepository jobCacheRepository;
    private final BookmarkRepository bookmarkRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    /**
     * 사람인/워크넷 Open API 연동 전까지 사용하는 시드 데이터.
     * job_cache 테이블이 비어 있을 때만 채용공고 캐시를 채워 넣는다.
     */
    @PostConstruct
    public void seedIfEmpty() {
        if (jobCacheRepository.count() > 0) {
            return;
        }

        LocalDateTime expiresAt = LocalDateTime.now().plusDays(30);
        List<JobCache> seed = List.of(
                JobCache.builder().externalJobId("SEED-001").source("MentorBridge").title("2024 상반기 신입 개발자 공개 채용")
                        .company("네이버").location("성남시 분당구").employmentType("신입").jobPosition("백엔드/프론트엔드")
                        .deadline(LocalDate.now().plusDays(7)).originalUrl("https://recruit.navercorp.com").expiresAt(expiresAt).build(),
                JobCache.builder().externalJobId("SEED-002").source("MentorBridge").title("FE 개발자 경력 수시 채용")
                        .company("카카오").location("제주시").employmentType("경력").jobPosition("프론트엔드")
                        .deadline(null).originalUrl("https://careers.kakao.com").expiresAt(expiresAt).build(),
                JobCache.builder().externalJobId("SEED-003").source("MentorBridge").title("Data Scientist (Product)")
                        .company("토스").location("서울시 강남구").employmentType("경력").jobPosition("데이터 사이언스")
                        .deadline(LocalDate.now().plusDays(14)).originalUrl("https://toss.im/career").expiresAt(expiresAt).build(),
                JobCache.builder().externalJobId("SEED-004").source("MentorBridge").title("백엔드 엔지니어 인턴십")
                        .company("당근").location("서울시 서초구").employmentType("인턴").jobPosition("백엔드")
                        .deadline(LocalDate.now().plusDays(3)).originalUrl("https://about.daangn.com/jobs").expiresAt(expiresAt).build(),
                JobCache.builder().externalJobId("SEED-005").source("MentorBridge").title("AI 서비스 백엔드 개발자")
                        .company("업스테이지").location("서울시 강남구").employmentType("경력").jobPosition("백엔드")
                        .deadline(LocalDate.now().plusDays(21)).originalUrl("https://www.upstage.ai/careers").expiresAt(expiresAt).build()
        );
        jobCacheRepository.saveAll(seed);
    }

    @Transactional(readOnly = true)
    public List<JobDto> getJobs(String keyword, String email) {
        List<JobCache> jobs = (keyword == null || keyword.isBlank())
                ? jobCacheRepository.findAll()
                : jobCacheRepository.findByTitleContainingIgnoreCaseOrCompanyContainingIgnoreCase(keyword, keyword);

        Set<String> bookmarkedIds = email == null
                ? Set.of()
                : userRepository.findByEmail(email)
                    .map(bookmarkRepository::findByUser)
                    .orElse(List.of())
                    .stream()
                    .map(Bookmark::getExternalJobId)
                    .collect(Collectors.toSet());

        return jobs.stream().map(job -> JobDto.builder()
                .cacheId(job.getId())
                .externalJobId(job.getExternalJobId())
                .source(job.getSource())
                .title(job.getTitle())
                .company(job.getCompany())
                .location(job.getLocation())
                .employmentType(job.getEmploymentType())
                .jobPosition(job.getJobPosition())
                .deadline(job.getDeadline())
                .originalUrl(job.getOriginalUrl())
                .bookmarked(bookmarkedIds.contains(job.getExternalJobId()))
                .build()).collect(Collectors.toList());
    }

    @Transactional
    public void addBookmark(String email, String externalJobId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (bookmarkRepository.existsByUserAndExternalJobId(user, externalJobId)) {
            return; // idempotent
        }

        JobCache job = jobCacheRepository.findAll().stream()
                .filter(j -> j.getExternalJobId().equals(externalJobId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Job not found"));

        Bookmark bookmark = Bookmark.builder()
                .user(user)
                .externalJobId(job.getExternalJobId())
                .jobTitle(job.getTitle())
                .originalUrl(job.getOriginalUrl())
                .source(job.getSource())
                .build();
        bookmarkRepository.save(bookmark);
    }

    @Transactional
    public void removeBookmark(String email, String externalJobId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        bookmarkRepository.deleteByUserAndExternalJobId(user, externalJobId);
    }

    @Transactional(readOnly = true)
    public List<BookmarkDto> getBookmarks(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return bookmarkRepository.findByUser(user).stream().map(b -> BookmarkDto.builder()
                .bookmarkId(b.getId())
                .externalJobId(b.getExternalJobId())
                .jobTitle(b.getJobTitle())
                .originalUrl(b.getOriginalUrl())
                .source(b.getSource())
                .savedAt(b.getSavedAt())
                .build()).collect(Collectors.toList());
    }

    /**
     * 스크랩(북마크)한 공고의 마감일이 {@value #DEADLINE_REMINDER_DAYS}일 남았으면 알림을 보낸다.
     * deadline이 정확히 "오늘+N일"인 경우에만 보내서(매일 정오 실행 기준) 같은 알림이 반복 발송되지 않게 한다.
     * 실제 채용 API가 아직 연동 전이라 job_cache가 샘플 데이터뿐이어도, 스케줄러 로직 자체는 지금 완성해둔다 —
     * 연동되면 별도 코드 변경 없이 실제 마감일에 대해 그대로 동작한다.
     */
    @Scheduled(cron = "0 0 9 * * *") // 매일 오전 9시
    @Transactional
    public void notifyUpcomingDeadlines() {
        LocalDate targetDate = LocalDate.now().plusDays(DEADLINE_REMINDER_DAYS);

        for (Bookmark bookmark : bookmarkRepository.findAll()) {
            jobCacheRepository.findByExternalJobIdAndSource(bookmark.getExternalJobId(), bookmark.getSource())
                    .filter(job -> targetDate.equals(job.getDeadline()))
                    .ifPresent(job -> notificationService.sendNotification(
                            bookmark.getUser().getId(),
                            NotificationType.SCRAP,
                            "스크랩한 공고 마감이 " + DEADLINE_REMINDER_DAYS + "일 남았습니다: " + job.getTitle(),
                            "/recruitment"));
        }
    }
}
