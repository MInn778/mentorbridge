package com.mentorbridge.backend.config;

import com.mentorbridge.backend.service.CustomUserDetailsService;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

/**
 * 일반 HTTP 요청은 JwtFilter가 처리하지만, STOMP는 핸드셰이크(HTTP GET /ws-chat) 이후
 * 하나의 WebSocket 연결 위에서 CONNECT/SEND/SUBSCRIBE 프레임이 오가므로 별도 인증이 필요하다.
 * CONNECT 프레임의 Authorization 헤더로 JWT를 검증하고, 세션에 Principal을 심어서
 * 이후 모든 @MessageMapping에서 Principal을 그대로 쓸 수 있게 한다.
 */
@Component
@RequiredArgsConstructor
public class StompAuthChannelInterceptor implements ChannelInterceptor {

    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService userDetailsService;

    @Override
    public Message<?> preSend(@NonNull Message<?> message, @NonNull MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authHeader = accessor.getFirstNativeHeader("Authorization");
            String token = (authHeader != null && authHeader.startsWith("Bearer ")) ? authHeader.substring(7) : null;

            if (token == null) {
                throw new MessagingException("인증 토큰이 없습니다.");
            }

            try {
                String username = jwtUtil.extractUsername(token);
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                if (!jwtUtil.validateToken(token, userDetails)) {
                    throw new MessagingException("유효하지 않거나 만료된 토큰입니다.");
                }
                accessor.setUser(new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities()));
            } catch (MessagingException e) {
                throw e;
            } catch (Exception e) {
                throw new MessagingException("인증에 실패했습니다.", e);
            }
        }

        return message;
    }
}
