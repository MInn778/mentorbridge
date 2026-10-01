package com.mentorbridge.backend.service;

import com.mentorbridge.backend.dto.NotificationDto;
import com.mentorbridge.backend.model.Notification;
import com.mentorbridge.backend.model.NotificationType;
import com.mentorbridge.backend.model.User;
import com.mentorbridge.backend.repository.NotificationRepository;
import com.mentorbridge.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.ContextClosedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);
    private static final Long DEFAULT_TIMEOUT = 60L * 1000 * 60; // 1 hour
    // key = email. subscribe()에서 DB를 조회하면 open-in-view 때문에 그 DB 커넥션이 SSE가 끝날 때까지(최대 1시간)
    // 반납되지 않아 커넥션 풀(10개)이 금방 고갈된다. JWT에 이미 있는 email을 키로 써서 DB 조회 자체를 없앤다.
    private final Map<String, SseEmitter> emitters = new ConcurrentHashMap<>();

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public SseEmitter subscribe(String email) {
        SseEmitter emitter = new SseEmitter(DEFAULT_TIMEOUT);
        emitters.put(email, emitter);

        // remove(key, value): 같은 사용자가 새로 연결한 emitter까지 지우지 않도록
        emitter.onCompletion(() -> emitters.remove(email, emitter));
        emitter.onTimeout(() -> emitters.remove(email, emitter));
        emitter.onError((e) -> emitters.remove(email, emitter));

        // Send a dummy event to prevent 503 error for no events
        try {
            emitter.send(SseEmitter.event().name("connect").data("Connected to SSE"));
        } catch (IOException e) {
            emitters.remove(email, emitter);
        }

        return emitter;
    }

    /**
     * SSE 연결은 서버가 완전히 종료될 때까지(최대 1시간) 끝나지 않는 요청으로 취급돼서,
     * 그냥 두면 Graceful shutdown이 매번 타임아웃(기본 30초)까지 대기하다 강제 종료된다.
     * ContextClosedEvent는 Tomcat의 graceful shutdown(활성 요청 대기)보다 먼저 발행되므로,
     * 여기서 열려 있는 emitter를 모두 즉시 완료시켜야 그 대기 자체가 걸리지 않는다.
     * (참고: @PreDestroy는 graceful shutdown 대기가 끝난 "이후"에 실행돼서 너무 늦다.)
     */
    @EventListener(ContextClosedEvent.class)
    public void closeAllEmitters() {
        emitters.values().forEach(SseEmitter::complete);
        emitters.clear();
    }

    @Transactional
    public void sendNotification(Integer userId, NotificationType type, String title, String link) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Notification notification = Notification.builder()
                .user(user)
                .type(type)
                .title(title)
                .link(link)
                .isRead(false)
                .build();
        
        notification = notificationRepository.save(notification);

        NotificationDto dto = NotificationDto.builder()
                .id(notification.getId())
                .type(notification.getType())
                .title(notification.getTitle())
                .link(notification.getLink())
                .isRead(notification.getIsRead())
                .createdAt(notification.getCreatedAt())
                .build();

        SseEmitter emitter = emitters.get(user.getEmail());
        if (emitter != null) {
            try {
                emitter.send(SseEmitter.event().name("notification").data(dto));
            } catch (IOException e) {
                emitters.remove(user.getEmail(), emitter);
                log.error("Failed to send SSE event for user " + userId, e);
            }
        }
    }

    @Transactional(readOnly = true)
    public List<NotificationDto> getNotifications(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(n -> NotificationDto.builder()
                        .id(n.getId())
                        .type(n.getType())
                        .title(n.getTitle())
                        .link(n.getLink())
                        .isRead(n.getIsRead())
                        .createdAt(n.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public void markAsRead(String email, Integer notificationId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        
        if (!notification.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }
        
        notification.setIsRead(true);
        notificationRepository.save(notification);
    }
    
    @Transactional
    public void markAllAsRead(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        List<Notification> unreadList = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream().filter(n -> !n.getIsRead()).collect(Collectors.toList());
        
        for (Notification n : unreadList) {
            n.setIsRead(true);
        }
        notificationRepository.saveAll(unreadList);
    }

    @Transactional
    public void triggerTestNotification(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        sendNotification(user.getId(), NotificationType.MESSAGE, "테스트 실시간 알림이 도착했습니다!", "/messages");
    }
}
