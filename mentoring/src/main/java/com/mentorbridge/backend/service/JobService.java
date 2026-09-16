package com.mentorbridge.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationContext;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class JobService {

    private static final Logger log = LoggerFactory.getLogger(JobService.class);
    private static final int DEADLINE_REMINDER_DAYS = 3;

    // 재정경제부_공공기관 채용정보 조회서비스 (공공데이터포털, 개발계정 자동승인).
    // 문서: https://www.data.go.kr/data/15125273/openapi.do
    private static final String RECRUIT_LIST_URL = "https://apis.data.go.kr/1051000/recruitment/list";
    private static final String RECRUIT_SOURCE = "공공기관채용정보";
    private static final DateTimeFormatter RECRUIT_DATE_FORMAT = DateTimeFormatter.ofPattern("yyyyMMdd");

    private final JobCacheRepository jobCacheRepository;
    private final BookmarkRepository bookmarkRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${public-data.recruit-api-key:}")
    private String recruitApiKey;

    private final ApplicationContext applicationContext;

    @PostConstruct
    public void seedJobsIfEmpty() {
        seedIfEmpty();
    }

    // this.refreshPublicJobs()로 self-invocation 하면 @Transactional 프록시를 안 타서
    // 커밋 시점에 TransactionRequiredException이 난다. 앱이 완전히 뜬 뒤 컨텍스트에서
    // 프록시 빈을 다시 조회해서 호출하면 문제없이 트랜잭션이 걸린다.
    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        applicationContext.getBean(JobService.class).refreshPublicJobs();
    }

    /**
     * PUBLIC_DATA_RECRUIT_API_KEY가 아직 없는 환경(로컬 개발 등)에서 화면이 비어 보이지 않도록 넣어두는 시드 데이터.
     * job_cache 테이블이 비어 있을 때만 채워 넣고, 실제 API 연동이 성공하면 refreshPublicJobs()가 이 시드를 지운다.
     */
    private void seedIfEmpty() {
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

    // 관리자 페이지에서 즉시 한 번 갱신해보고 싶을 때 쓰는 수동 트리거와, 매일 새벽 자동 갱신 둘 다 이 메서드를 탄다.
    @Scheduled(cron = "0 30 6 * * *") // 매일 오전 6시 30분
    @Transactional
    public void refreshPublicJobs() {
        if (recruitApiKey == null || recruitApiKey.isBlank()) {
            log.info("PUBLIC_DATA_RECRUIT_API_KEY가 설정되지 않아 채용정보 실연동을 건너뜁니다. (job_cache는 시드 데이터로 유지됩니다)");
            return;
        }

        try {
            String encodedKey = URLEncoder.encode(recruitApiKey, StandardCharsets.UTF_8);
            String url = RECRUIT_LIST_URL
                    + "?serviceKey=" + encodedKey
                    + "&pageNo=1&numOfRows=100&type=json";

            HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                    .timeout(Duration.ofSeconds(15))
                    .GET()
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));

            if (response.statusCode() != 200) {
                log.warn("공공기관 채용정보 API 호출 실패: HTTP {}", response.statusCode());
                return;
            }

            List<JobCache> fetched = parseRecruitResponse(response.body());
            if (fetched.isEmpty()) {
                log.warn("공공기관 채용정보 API 응답에서 공고를 하나도 파싱하지 못했습니다: {}",
                        response.body().length() > 300 ? response.body().substring(0, 300) : response.body());
                return;
            }

            for (JobCache job : fetched) {
                jobCacheRepository.findByExternalJobIdAndSource(job.getExternalJobId(), job.getSource())
                        .ifPresentOrElse(existing -> {
                            existing.setTitle(job.getTitle());
                            existing.setCompany(job.getCompany());
                            existing.setLocation(job.getLocation());
                            existing.setEmploymentType(job.getEmploymentType());
                            existing.setJobPosition(job.getJobPosition());
                            existing.setDeadline(job.getDeadline());
                            existing.setOriginalUrl(job.getOriginalUrl());
                            existing.setExpiresAt(job.getExpiresAt());
                            jobCacheRepository.save(existing);
                        }, () -> jobCacheRepository.save(job));
            }

            // 실연동이 성공했으니, 연동 전까지 화면을 채워주던 더미 시드 데이터는 지운다.
            jobCacheRepository.deleteBySource("MentorBridge");

            log.info("공공기관 채용정보 {}건을 갱신했습니다.", fetched.size());
        } catch (Exception e) {
            log.error("공공기관 채용정보 API 연동 중 오류가 발생했습니다. 기존 job_cache는 그대로 유지합니다.", e);
        }
    }

    private List<JobCache> parseRecruitResponse(String json) throws Exception {
        JsonNode root = objectMapper.readTree(json);
        JsonNode result = root.path("result");
        if (!result.isArray()) {
            return List.of();
        }

        LocalDateTime expiresAt = LocalDateTime.now().plusDays(1);
        List<JobCache> jobs = new ArrayList<>();

        for (JsonNode item : result) {
            if (!"Y".equals(text(item, "ongoingYn"))) {
                continue; // 마감된 공고는 캐시에 넣지 않는다
            }
            String externalJobId = text(item, "recrutPblntSn");
            String title = text(item, "recrutPbancTtl");
            String company = text(item, "instNm");
            String srcUrl = text(item, "srcUrl");
            if (externalJobId == null || title == null || company == null || srcUrl == null) {
                continue;
            }

            jobs.add(JobCache.builder()
                    .externalJobId(externalJobId)
                    .source(RECRUIT_SOURCE)
                    .title(title)
                    .company(company)
                    .location(text(item, "workRgnNmLst"))
                    .employmentType(text(item, "hireTypeNmLst"))
                    .jobPosition(text(item, "ncsCdNmLst"))
                    .deadline(parseRecruitDate(text(item, "pbancEndYmd")))
                    .originalUrl(srcUrl)
                    .expiresAt(expiresAt)
                    .build());
        }
        return jobs;
    }

    private String text(JsonNode node, String field) {
        JsonNode value = node.get(field);
        if (value == null || value.isNull()) return null;
        String text = value.asText();
        return (text == null || text.isBlank()) ? null : text.trim();
    }

    private LocalDate parseRecruitDate(String raw) {
        if (raw == null) return null;
        try {
            return LocalDate.parse(raw, RECRUIT_DATE_FORMAT);
        } catch (Exception e) {
            return null;
        }
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
