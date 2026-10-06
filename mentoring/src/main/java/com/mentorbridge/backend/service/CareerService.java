package com.mentorbridge.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

/**
 * AI 진로추천 (RAG). 커리어넷 데이터를 build_career_index.py로 미리 임베딩해둔 career/career_index.json을
 * 메모리에 올려두고, 질문 임베딩과 내적(=코사인 유사도, 둘 다 정규화됨)이 큰 문서를 참고 자료로 Gemini에 넘긴다.
 * ponytail: 1500개 남짓이라 전수 비교로 충분. 수만 개로 늘면 pgvector 등 벡터 검색으로 교체.
 */
@Service
@RequiredArgsConstructor
public class CareerService {

    private static final Logger log = LoggerFactory.getLogger(CareerService.class);
    private static final String INDEX_PATH = "career/career_index.json";
    private static final Duration ANSWER_TIMEOUT = Duration.ofSeconds(90);

    private static final String RULES = """
            작성 규칙:
            - 인사말, 자기소개("전문 커리어 멘토입니다" 등), 사용자 답변을 다시 요약하는 도입부 없이 바로 본론으로 시작하세요.
            - "커리어넷", "제공된 데이터", "참고 데이터를 분석하여" 등 데이터 출처를 언급하는 표현은 쓰지 마세요.""";

    private final GeminiService geminiService;
    private final ObjectMapper objectMapper;

    private String embedModel;
    private int dimension;
    private final List<String> texts = new ArrayList<>();
    private final List<float[]> vectors = new ArrayList<>();

    public record ChatMessage(String role, String content) {}

    public record ChatRequest(Map<String, String> answers, String recommendation, List<ChatMessage> history, String question) {}

    @PostConstruct
    void loadIndex() {
        ClassPathResource resource = new ClassPathResource(INDEX_PATH);
        if (!resource.exists()) {
            log.warn("{}가 없어 참고 데이터 없이 진로추천을 합니다. (python build_career_index.py로 생성)", INDEX_PATH);
            return;
        }
        try (InputStream in = resource.getInputStream()) {
            JsonNode root = objectMapper.readTree(in);
            embedModel = root.path("model").asText();
            dimension = root.path("dim").asInt();
            for (JsonNode doc : root.path("docs")) {
                texts.add(doc.path("text").asText());
                vectors.add(decode(doc.path("vector").asText()));
            }
            log.info("진로추천 인덱스 로드: 문서 {}개 ({}, {}차원)", texts.size(), embedModel, dimension);
        } catch (Exception e) {
            log.error("진로추천 인덱스 로드 실패", e);
        }
    }

    public String recommend(Map<String, String> answers) {
        String query = answers.values().stream()
                .filter(v -> v != null && !v.isBlank() && !v.equals("답변하지 않음"))
                .collect(Collectors.joining(" "));

        String prompt = """
                당신은 전문 커리어 멘토입니다. 아래 참고 데이터를 활용하여 사용자에게 맞는 진로를 추천해주세요.
                IT에 한정하지 말고, 사용자의 관심 분야에 맞는 모든 직군을 대상으로 추천하세요.

                [참고 데이터]
                %s

                %s

                추천하는 구체적인 직업, 필요한 추가 역량, 준비 로드맵을 한국어 마크다운으로 상세히 설명해주세요.
                참고 데이터에 실려있는 실제 직업/학과 정보를 최대한 반영하고, 답변하지 않은 항목은 고려하지 마세요.

                %s""".formatted(search(query, 6), answersBlock(answers), RULES);
        return generate(prompt);
    }

    public String chat(ChatRequest request) {
        String history = request.history() == null || request.history().isEmpty()
                ? "(없음)"
                : request.history().stream()
                        .map(m -> ("user".equals(m.role()) ? "사용자: " : "멘토: ") + m.content())
                        .collect(Collectors.joining("\n\n"));

        String prompt = """
                당신은 전문 커리어 멘토입니다. 앞서 사용자에게 진로를 추천했고, 이어서 사용자의 추가 질문에 답하고 있습니다.

                %s

                [앞서 제공한 진로 추천]
                %s

                [이전 대화]
                %s

                [참고 데이터]
                %s

                [사용자의 새 질문]
                %s

                앞의 추천과 대화 흐름을 이어서, 새 질문에 한국어 마크다운으로 답하세요. 질문에 필요한 만큼만 간결하게 답하고,
                참고 데이터에 관련 정보가 있으면 반영하세요. 진로와 관련 없는 질문이면 정중하게 진로 상담 범위로 안내하세요.

                %s""".formatted(
                answersBlock(request.answers() == null ? Map.of() : request.answers()),
                request.recommendation() == null ? "" : request.recommendation(),
                history,
                search(request.question(), 4),
                request.question(),
                RULES);
        return generate(prompt);
    }

    /** 질문과 가장 비슷한 문서 k개를 이어 붙인 참고 자료. 인덱스가 없거나 임베딩이 실패하면 빈 문자열(참고 자료 없이 답변). */
    private String search(String query, int k) {
        if (texts.isEmpty() || query == null || query.isBlank()) {
            return "";
        }
        float[] q = geminiService.embedQuery(query, embedModel, dimension);
        if (q == null) {
            return "";
        }
        float norm = 0;
        for (float x : q) norm += x * x;
        float scale = norm > 0 ? (float) (1 / Math.sqrt(norm)) : 1;

        return IntStream.range(0, vectors.size())
                .boxed()
                .sorted(Comparator.comparingDouble((Integer i) -> -dot(vectors.get(i), q, scale)))
                .limit(k)
                .map(texts::get)
                .collect(Collectors.joining("\n\n"));
    }

    private String generate(String prompt) {
        if (!geminiService.isConfigured()) {
            throw new IllegalStateException("서버에 Gemini API 키(BACKEND_GEMINI_API_KEY)가 설정되지 않았습니다.");
        }
        String result = geminiService.generateContent(prompt, ANSWER_TIMEOUT);
        if (result == null) {
            throw new IllegalStateException("AI 답변 생성에 실패했습니다. 잠시 후 다시 시도해주세요.");
        }
        return result;
    }

    private static String answersBlock(Map<String, String> a) {
        return """
                [사용자 답변]
                - 관심 분야/직군: %s
                - 보유 기술/잘하는 일: %s
                - 자격증: %s
                - 성향/방식: %s""".formatted(
                a.getOrDefault("interest", ""), a.getOrDefault("techStack", ""),
                a.getOrDefault("certificates", ""), a.getOrDefault("personality", ""));
    }

    private static double dot(float[] doc, float[] q, float scale) {
        double sum = 0;
        for (int i = 0; i < doc.length; i++) sum += doc[i] * q[i];
        return sum * scale;
    }

    /** build_career_index.py가 struct.pack("<Nf")로 저장한 little-endian float32 배열을 읽는다. */
    static float[] decode(String base64) {
        ByteBuffer buf = ByteBuffer.wrap(Base64.getDecoder().decode(base64)).order(ByteOrder.LITTLE_ENDIAN);
        float[] v = new float[buf.remaining() / 4];
        buf.asFloatBuffer().get(v);
        return v;
    }
}
