package com.mentorbridge.backend.controller;

import com.mentorbridge.backend.dto.ChatSendMessageDto;
import com.mentorbridge.backend.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {

    private final ChatService chatService;

    // 클라이언트는 /app/rooms/{roomId}/send 로 publish한다.
    // 인증된 사용자(Principal)는 StompAuthChannelInterceptor가 CONNECT 시점에 세팅해둔다.
    @MessageMapping("/rooms/{roomId}/send")
    public void send(@DestinationVariable Integer roomId, @Payload ChatSendMessageDto payload, Principal principal) {
        chatService.sendMessage(principal.getName(), roomId, payload.getContent());
    }
}
