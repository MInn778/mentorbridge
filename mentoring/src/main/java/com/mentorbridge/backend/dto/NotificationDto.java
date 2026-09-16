package com.mentorbridge.backend.dto;

import com.mentorbridge.backend.model.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDto {
    private Integer id;
    private NotificationType type;
    private String title;
    private String link;
    private Boolean isRead;
    private LocalDateTime createdAt;
}
