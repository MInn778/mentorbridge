package com.mentorbridge.backend.config;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

// Neon/Render가 주는 postgresql://user:pass@host/db?sslmode=require 형식을 그대로 DATABASE_URL에 넣을 수 있게 한다.
// DATABASE_URL이 비어 있으면 기존 DB_URL/DB_USERNAME/DB_PASSWORD(spring.datasource.*) 설정을 그대로 쓴다.
@Configuration
public class DatabaseConfig {

    @Bean
    @ConfigurationProperties("spring.datasource.hikari") // application.yml의 hikari 설정(leak-detection 등) 적용
    public HikariDataSource dataSource(DataSourceProperties props, @Value("${DATABASE_URL:}") String databaseUrl) {
        if (!databaseUrl.isBlank()) {
            String[] parsed = toJdbc(databaseUrl);
            props.setUrl(parsed[0]);
            props.setUsername(parsed[1]);
            props.setPassword(parsed[2]);
        }
        return props.initializeDataSourceBuilder().type(HikariDataSource.class).build();
    }

    /** postgresql://user:pass@host[:port]/db?query -> {jdbcUrl, user, password} */
    static String[] toJdbc(String databaseUrl) {
        URI uri = URI.create(databaseUrl.trim());
        String[] userInfo = uri.getRawUserInfo().split(":", 2);
        String jdbcUrl = "jdbc:postgresql://" + uri.getHost()
                + (uri.getPort() > 0 ? ":" + uri.getPort() : "")
                + uri.getRawPath()
                + (uri.getRawQuery() != null ? "?" + uri.getRawQuery() : "");
        return new String[]{
                jdbcUrl,
                URLDecoder.decode(userInfo[0], StandardCharsets.UTF_8),
                userInfo.length > 1 ? URLDecoder.decode(userInfo[1], StandardCharsets.UTF_8) : ""
        };
    }
}
