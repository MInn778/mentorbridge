package com.mentorbridge.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class GeminiService {

    private static final Logger log = LoggerFactory.getLogger(GeminiService.class);
    private static final String MODEL = "gemini-3-flash-preview";
    private static final String ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/" + MODEL + ":generateContent";

    private final HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${app-gemini.api-key:}")
    private String apiKey;

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    /**
     * 실패 시 예외를 던지지 않고 null을 반환한다. 호출부에서 null이면 안내 문구로 대체해서 게시글 작성 자체는 막지 않는다.
     */
    public String generateContent(String prompt) {
        if (!isConfigured()) {
            log.info("GEMINI_API_KEY가 설정되지 않아 AI 피드백 생성을 건너뜁니다.");
            return null;
        }

        try {
            Map<String, Object> body = Map.of(
                    "contents", new Object[]{
                            Map.of("parts", new Object[]{ Map.of("text", prompt) })
                    }
            );

            HttpRequest request = HttpRequest.newBuilder(URI.create(ENDPOINT + "?key=" + apiKey))
                    .timeout(Duration.ofSeconds(30))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body), StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));

            if (response.statusCode() != 200) {
                log.warn("Gemini API 호출 실패: HTTP {} - {}", response.statusCode(), response.body());
                return null;
            }

            JsonNode root = objectMapper.readTree(response.body());
            JsonNode textNode = root.path("candidates").path(0).path("content").path("parts").path(0).path("text");
            return textNode.isMissingNode() ? null : textNode.asText();
        } catch (Exception e) {
            log.error("Gemini API 호출 중 오류가 발생했습니다.", e);
            return null;
        }
    }
}
