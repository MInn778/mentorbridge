package com.mentorbridge.backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class MentorApplyRequest {
    private String selfIntro;
    private String career;
    private List<String> specs; // e.g. ["React", "Java"]
    private String proofUrl;
}
