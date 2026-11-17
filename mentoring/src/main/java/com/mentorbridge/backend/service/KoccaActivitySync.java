package com.mentorbridge.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mentorbridge.backend.model.Activity;
import com.mentorbridge.backend.repository.ActivityRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * 한국콘텐츠진흥원 지원사업공고 Open API -> 공모전 & 활동(activity) 자동 등록.
 * 문서: https://kocca.kr/kocca/subPage.do?menuNo=204796 (키는 콘진원 사이트에서 활용신청으로 발급)
 * KOCCA_API_KEY가 없으면 아무것도 하지 않는다(직접 등록만 사용).
 */
@Service
@RequiredArgsConstructor
public class KoccaActivitySync {

    private static final Logger log = LoggerFactory.getLogger(KoccaActivitySync.class);
    static final String SOURCE = "한국콘텐츠진흥원";
    private static final String LIST_URL = "https://kocca.kr/api/pims/List.do";
    private static final DateTimeFormatter YMD = DateTimeFormatter.ofPattern("yyyyMMdd");
    // 1=자유공모, 2=지정공모, 3=모집공고 (4=종료된 사업은 제외)
    private static final List<String> CATEGORIES = List.of("1", "2", "3");

    private final ActivityRepository activityRepository;
    private final HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();

    @Value("${public-data.kocca-api-key:}")
    private String apiKey;

    @EventListener(ApplicationReadyEvent.class)
    @Scheduled(cron = "0 40 6 * * *") // 매일 오전 6시 40분 (채용정보 갱신 직후)
    public void sync() {
        if (apiKey == null || apiKey.isBlank()) {
            log.info("KOCCA_API_KEY가 설정되지 않아 콘진원 공모전 연동을 건너뜁니다.");
            return;
        }
        int saved = 0;
        for (String cate : CATEGORIES) {
            try {
                String url = LIST_URL + "?serviceKey=" + URLEncoder.encode(apiKey, StandardCharsets.UTF_8)
                        + "&cate=" + cate + "&pageNo=1&numOfRows=100";
                HttpResponse<String> res = httpClient.send(
                        HttpRequest.newBuilder(URI.create(url)).timeout(Duration.ofSeconds(15)).GET().build(),
                        HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
                for (Activity a : parse(res.body(), LocalDate.now())) {
                    Activity target = activityRepository.findBySourceAndExternalId(SOURCE, a.getExternalId()).orElse(a);
                    target.setTitle(a.getTitle());
                    target.setStartDate(a.getStartDate());
                    target.setEndDate(a.getEndDate());
                    target.setLink(a.getLink());
                    target.setTags(a.getTags());
                    activityRepository.save(target);
                    saved++;
                }
            } catch (Exception e) {
                log.warn("콘진원 공모전 API 호출 실패 (cate={}): {}", cate, e.getMessage());
            }
        }
        long removed = activityRepository.deleteBySourceAndEndDateBefore(SOURCE, LocalDate.now());
        log.info("콘진원 공모전 {}건 갱신, 마감 {}건 삭제", saved, removed);
    }

    /** 응답 JSON -> 아직 마감 안 된 공고 목록. 문서와 실제 응답의 필드명이 달라서(list/List, cate/cata) 둘 다 받는다. */
    static List<Activity> parse(String json, LocalDate today) throws Exception {
        JsonNode info = new ObjectMapper().readTree(json).path("INFO");
        if (!"INFO-000".equals(info.path("resultCode").asText())) {
            throw new IllegalStateException(info.path("resultCode").asText() + " " + info.path("resultMgs").asText());
        }
        JsonNode list = info.has("list") ? info.path("list") : info.path("List");
        List<Activity> result = new ArrayList<>();
        for (JsonNode item : list) {
            String id = text(item, "intcNoSeq");
            String title = text(item, "title");
            if (id == null || title == null) continue;
            LocalDate end = date(text(item, "endDt"));
            if (end != null && end.isBefore(today)) continue;

            String link = text(item, "link");
            if (link != null && !link.matches("(?i)^https?://.*")) link = "https://" + link; // 응답에 스킴이 빠져 있음
            String cate = text(item, "cate") != null ? text(item, "cate") : text(item, "cata");

            result.add(Activity.builder()
                    .source(SOURCE)
                    .externalId(id)
                    .title(title)
                    .organizer(SOURCE)
                    .startDate(date(text(item, "startDt")))
                    .endDate(end)
                    .link(link)
                    .tags(cate != null ? "공공데이터," + cate : "공공데이터")
                    .build());
        }
        return result;
    }

    private static String text(JsonNode node, String field) {
        JsonNode v = node.get(field);
        return v == null || v.isNull() || v.asText().isBlank() ? null : v.asText().trim();
    }

    private static LocalDate date(String ymd) {
        try {
            return ymd == null ? null : LocalDate.parse(ymd, YMD);
        } catch (Exception e) {
            return null;
        }
    }
}
