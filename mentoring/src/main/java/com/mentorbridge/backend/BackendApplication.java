package com.mentorbridge.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class BackendApplication {
    public static void main(String[] args) {
        // 로컬(KST)과 Render(UTC)가 같은 DB에 서로 다른 시간대로 시각을 저장하지 않도록 고정
        java.util.TimeZone.setDefault(java.util.TimeZone.getTimeZone("Asia/Seoul"));
        SpringApplication.run(BackendApplication.class, args);
    }
}
