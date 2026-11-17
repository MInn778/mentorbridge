package com.mentorbridge.backend.service;

import com.mentorbridge.backend.model.Activity;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class KoccaActivitySyncTest {

    // 콘진원 이용가이드의 샘플 응답 형태 + 마감된 공고 1건
    private static final String SAMPLE = """
            {"INFO":{"resultCode":"INFO-000","resultMgs":"정상 처리되었습니다","list":[
              {"title":"OTT 연계 기획안 공모","intcNoSeq":"3-22-J261-006","cate":"모집공고",
               "link":"www.kocca.kr/kocca/pims/view.do?intcNo=322J261006","startDt":"20261101","endDt":"20261130"},
              {"title":"이미 마감","intcNoSeq":"OLD-1","cate":"자유공모","link":"https://kocca.kr/x","startDt":"20260101","endDt":"20260201"}
            ]}}""";

    @Test
    void parsesOpenItemsAndSkipsClosed() throws Exception {
        List<Activity> items = KoccaActivitySync.parse(SAMPLE, LocalDate.of(2026, 11, 17));

        assertEquals(1, items.size());
        Activity a = items.get(0);
        assertEquals("3-22-J261-006", a.getExternalId());
        assertEquals("https://www.kocca.kr/kocca/pims/view.do?intcNo=322J261006", a.getLink());
        assertEquals(LocalDate.of(2026, 11, 30), a.getEndDate());
        assertEquals("공공데이터,모집공고", a.getTags());
    }

    @Test
    void invalidKeyThrows() {
        String invalid = "{\"INFO\":{\"resultCode\":\"INFO-100\",\"resultMgs\":\"유효하지 않은 서비스키\",\"listCount\":0}}";
        assertThrows(IllegalStateException.class, () -> KoccaActivitySync.parse(invalid, LocalDate.now()));
    }
}
