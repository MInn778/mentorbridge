package com.mentorbridge.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.Arrays;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MentorProfileDto {
    private Integer mentorId;
    private Integer userId;
    private String name;
    private String mentorIntro;
    private String mentorCareer;
    private List<String> specs;
    private String profileImageUrl;
    private Float rating;
    private Integer reviewCount;

    // Helper method to convert comma-separated specs to List
    public static List<String> parseSpecs(String specsString) {
        if (specsString == null || specsString.trim().isEmpty()) {
            return List.of();
        }
        return Arrays.stream(specsString.split(","))
                .map(String::trim)
                .collect(Collectors.toList());
    }

    // Helper to convert List to comma-separated string
    public static String joinSpecs(List<String> specsList) {
        if (specsList == null || specsList.isEmpty()) {
            return "";
        }
        return String.join(", ", specsList);
    }
}
