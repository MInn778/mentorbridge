package com.mentorbridge.backend.controller;

import com.mentorbridge.backend.dto.*;
import com.mentorbridge.backend.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @GetMapping("/rooms")
    public ResponseEntity<List<ChatRoomDto>> getMyRooms() {
        return ResponseEntity.ok(chatService.getMyRooms(currentEmail()));
    }

    @PostMapping("/rooms/direct")
    public ResponseEntity<ChatRoomDto> createDirectRoom(@RequestBody DirectRoomCreateDto dto) {
        return ResponseEntity.ok(chatService.getOrCreateDirectRoom(currentEmail(), dto.getTargetUserId()));
    }

    @PostMapping("/rooms/group")
    public ResponseEntity<ChatRoomDto> createGroupRoom(@RequestBody GroupRoomCreateDto dto) {
        return ResponseEntity.ok(chatService.createGroupRoom(currentEmail(), dto.getName(), dto.getMemberIds()));
    }

    // 모집 완료된 게시글의 작성자가 참여 인원 전체와 단체 채팅방을 만든다(이미 있으면 그 방을 반환).
    @PostMapping("/rooms/from-post/{postId}")
    public ResponseEntity<ChatRoomDto> createGroupRoomFromPost(@PathVariable Integer postId) {
        return ResponseEntity.ok(chatService.createGroupRoomFromPost(currentEmail(), postId));
    }

    @PostMapping("/rooms/{roomId}/members")
    public ResponseEntity<Void> addMembers(@PathVariable Integer roomId, @RequestBody AddMembersDto dto) {
        chatService.addMembers(currentEmail(), roomId, dto.getMemberIds());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/rooms/{roomId}/messages")
    public ResponseEntity<List<ChatMessageDto>> getMessages(
            @PathVariable Integer roomId,
            @RequestParam(required = false) Integer before,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(chatService.getMessages(currentEmail(), roomId, before, size));
    }

    // STOMP가 연결되지 않은 상황을 대비한 fallback. 평소 전송은 WebSocket(/app/rooms/{roomId}/send)으로 한다.
    @PostMapping("/rooms/{roomId}/messages")
    public ResponseEntity<ChatMessageDto> sendMessage(@PathVariable Integer roomId, @RequestBody ChatSendMessageDto dto) {
        return ResponseEntity.ok(chatService.sendMessage(currentEmail(), roomId, dto.getContent()));
    }

    @PostMapping("/rooms/{roomId}/read")
    public ResponseEntity<Void> markRead(@PathVariable Integer roomId) {
        chatService.markRead(currentEmail(), roomId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/users/search")
    public ResponseEntity<List<UserSearchDto>> searchUsers(@RequestParam String query) {
        return ResponseEntity.ok(chatService.searchUsers(currentEmail(), query));
    }

    private String currentEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }
}
