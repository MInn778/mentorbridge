package com.mentorbridge.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSearchDto {
    private Integer id;
    private String name;
    private String role; // 이메일 대신 역할(MENTOR/MENTEE)로 구분 - 검색 결과에 이메일을 노출하지 않음
}
