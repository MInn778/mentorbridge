package com.mentorbridge.backend.service;

import com.mentorbridge.backend.dto.ChatMessageDto;
import com.mentorbridge.backend.dto.ChatParticipantDto;
import com.mentorbridge.backend.dto.ChatRoomDto;
import com.mentorbridge.backend.dto.UserSearchDto;
import com.mentorbridge.backend.model.*;
import com.mentorbridge.backend.repository.ChatMessageRepository;
import com.mentorbridge.backend.repository.ChatRoomMemberRepository;
import com.mentorbridge.backend.repository.ChatRoomRepository;
import com.mentorbridge.backend.repository.PostRepository;
import com.mentorbridge.backend.repository.StudyGroupRepository;
import com.mentorbridge.backend.repository.StudyMemberRepository;
import com.mentorbridge.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatRoomMemberRepository chatRoomMemberRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final StudyGroupRepository studyGroupRepository;
    private final StudyMemberRepository studyMemberRepository;
    private final NotificationService notificationService;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public ChatRoomDto getOrCreateDirectRoom(String email, Integer targetUserId) {
        User me = getUser(email);
        if (targetUserId == null || me.getId().equals(targetUserId)) {
            throw new RuntimeException("자기 자신과는 채팅할 수 없습니다.");
        }
        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new RuntimeException("상대방을 찾을 수 없습니다."));

        ChatRoom room = chatRoomRepository.findDirectRoomBetween(me.getId(), targetUserId).stream()
                .findFirst()
                .orElseGet(() -> {
                    ChatRoom newRoom = chatRoomRepository.save(ChatRoom.builder().isGroup(false).build());
                    chatRoomMemberRepository.save(ChatRoomMember.builder().chatRoom(newRoom).user(me).build());
                    chatRoomMemberRepository.save(ChatRoomMember.builder().chatRoom(newRoom).user(target).build());
                    return newRoom;
                });

        return toDto(room, me);
    }

    @Transactional
    public ChatRoomDto createGroupRoom(String email, String name, List<Integer> memberIds) {
        User me = getUser(email);

        Set<Integer> ids = new LinkedHashSet<>();
        if (memberIds != null) ids.addAll(memberIds);
        ids.add(me.getId());

        if (ids.size() < 2) {
            throw new RuntimeException("참여자를 1명 이상 선택하세요.");
        }

        List<User> users = userRepository.findAllById(ids);
        if (users.size() != ids.size()) {
            throw new RuntimeException("존재하지 않는 참여자가 포함되어 있습니다.");
        }

        ChatRoom room = chatRoomRepository.save(ChatRoom.builder()
                .isGroup(true)
                .name(name != null && !name.isBlank() ? name.trim() : null)
                .build());

        for (User u : users) {
            chatRoomMemberRepository.save(ChatRoomMember.builder().chatRoom(room).user(u).build());
        }

        return toDto(room, me);
    }

    // 모집 완료된 게시글의 작성자가 "단체 채팅방 만들기"를 누르면, 그 게시글의 스터디 그룹에 속한
    // 전원(작성자 포함)을 모아 단체 채팅방을 만든다. 이미 만들어둔 방이 있으면 그 방을 그대로 반환한다(멱등).
    @Transactional
    public ChatRoomDto createGroupRoomFromPost(String email, Integer postId) {
        User me = getUser(email);
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("게시글을 찾을 수 없습니다."));

        if (!post.getAuthor().getId().equals(me.getId())) {
            throw new RuntimeException("작성자만 단체 채팅방을 만들 수 있습니다.");
        }
        if (post.getStatus() != PostStatus.COMPLETED) {
            throw new RuntimeException("모집이 완료된 게시글만 단체 채팅방을 만들 수 있습니다.");
        }

        ChatRoom existing = chatRoomRepository.findByRelatedPostId(postId).orElse(null);
        if (existing != null) {
            return toDto(existing, me);
        }

        StudyGroup group = studyGroupRepository.findByPostBoardId(postId)
                .orElseThrow(() -> new RuntimeException("참여 중인 스터디 그룹이 없습니다."));
        List<User> members = studyMemberRepository.findByStudyGroupGroupId(group.getGroupId()).stream()
                .map(StudyMember::getUser)
                .collect(Collectors.toList());

        if (members.size() < 2) {
            throw new RuntimeException("참여 인원이 없어 단체 채팅방을 만들 수 없습니다.");
        }

        ChatRoom room = chatRoomRepository.save(ChatRoom.builder()
                .isGroup(true)
                .name(post.getTitle())
                .relatedPostId(postId)
                .build());

        for (User u : members) {
            chatRoomMemberRepository.save(ChatRoomMember.builder().chatRoom(room).user(u).build());
        }

        return toDto(room, me);
    }

    @Transactional
    public void addMembers(String email, Integer roomId, List<Integer> memberIds) {
        ChatRoom room = getRoomChecked(roomId);
        requireMember(email, room);

        if (!Boolean.TRUE.equals(room.getIsGroup())) {
            throw new RuntimeException("1:1 채팅방에는 인원을 추가할 수 없습니다.");
        }
        if (memberIds == null || memberIds.isEmpty()) {
            throw new RuntimeException("추가할 참여자를 선택하세요.");
        }

        List<User> users = userRepository.findAllById(memberIds);
        for (User u : users) {
            if (!chatRoomMemberRepository.existsByChatRoom_IdAndUser_Id(roomId, u.getId())) {
                chatRoomMemberRepository.save(ChatRoomMember.builder().chatRoom(room).user(u).build());
            }
        }
    }

    @Transactional(readOnly = true)
    public List<ChatRoomDto> getMyRooms(String email) {
        User me = getUser(email);
        List<ChatRoomMember> myMemberships = chatRoomMemberRepository.findByUser_Id(me.getId());

        return myMemberships.stream()
                .map(m -> toDto(m.getChatRoom(), me))
                .sorted(Comparator.comparing(
                        (ChatRoomDto d) -> d.getLastMessage() != null ? d.getLastMessage().getCreatedAt() : d.getCreatedAt(),
                        Comparator.nullsFirst(Comparator.naturalOrder())
                ).reversed())
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ChatMessageDto> getMessages(String email, Integer roomId, Integer beforeId, int size) {
        ChatRoom room = getRoomChecked(roomId);
        requireMember(email, room);

        int pageSize = Math.min(Math.max(size, 1), 100);
        Pageable pageable = PageRequest.of(0, pageSize);

        List<ChatMessage> page = beforeId == null
                ? chatMessageRepository.findByChatRoom_IdOrderByCreatedAtDesc(roomId, pageable)
                : chatMessageRepository.findByChatRoom_IdAndIdLessThanOrderByCreatedAtDesc(roomId, beforeId, pageable);

        Collections.reverse(page);
        return page.stream().map(this::toMessageDto).collect(Collectors.toList());
    }

    @Transactional
    public ChatMessageDto sendMessage(String email, Integer roomId, String content) {
        if (content == null || content.isBlank()) {
            throw new RuntimeException("내용을 입력하세요.");
        }

        User sender = getUser(email);
        ChatRoom room = getRoomChecked(roomId);
        ChatRoomMember membership = requireMember(email, room);

        ChatMessage message = chatMessageRepository.save(ChatMessage.builder()
                .chatRoom(room)
                .sender(sender)
                .content(content.trim())
                .build());

        membership.setLastReadMessageId(message.getId());
        chatRoomMemberRepository.save(membership);

        ChatMessageDto dto = toMessageDto(message);
        messagingTemplate.convertAndSend("/topic/rooms/" + roomId, dto);

        String roomLabel = Boolean.TRUE.equals(room.getIsGroup())
                ? (room.getName() != null ? room.getName() : "단체 채팅방")
                : sender.getName();

        List<ChatRoomMember> members = chatRoomMemberRepository.findByChatRoom_Id(roomId);
        for (ChatRoomMember m : members) {
            if (!m.getUser().getId().equals(sender.getId())) {
                notificationService.sendNotification(
                        m.getUser().getId(),
                        NotificationType.MESSAGE,
                        roomLabel + ": " + truncate(message.getContent()),
                        "/chat/" + roomId);
            }
        }

        return dto;
    }

    @Transactional
    public void markRead(String email, Integer roomId) {
        ChatRoom room = getRoomChecked(roomId);
        ChatRoomMember membership = requireMember(email, room);

        chatMessageRepository.findFirstByChatRoom_IdOrderByCreatedAtDesc(roomId)
                .ifPresent(last -> membership.setLastReadMessageId(last.getId()));
        chatRoomMemberRepository.save(membership);
    }

    @Transactional(readOnly = true)
    public List<UserSearchDto> searchUsers(String email, String query) {
        User me = getUser(email);
        String q = query == null ? "" : query.trim();

        // 이메일 일부로 회원 목록을 훑어볼 수 없도록: 이메일은 전체가 정확히 일치할 때만, 이름은 2글자 이상부터
        List<User> candidates;
        if (q.contains("@")) {
            candidates = userRepository.findByEmail(q).map(List::of).orElse(List.of());
        } else if (q.length() >= 2) {
            candidates = userRepository.findByNameContainingIgnoreCase(q);
        } else {
            return List.of();
        }

        return candidates.stream()
                .filter(u -> !u.getId().equals(me.getId()))
                .filter(u -> !Boolean.TRUE.equals(u.getIsSuspended()))
                .filter(u -> u.getRole() != Role.ADMIN)
                .limit(20)
                .map(u -> UserSearchDto.builder().id(u.getId()).name(u.getName()).role(u.getRole().name()).build())
                .collect(Collectors.toList());
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
    }

    private ChatRoom getRoomChecked(Integer roomId) {
        return chatRoomRepository.findById(roomId).orElseThrow(() -> new RuntimeException("채팅방을 찾을 수 없습니다."));
    }

    private ChatRoomMember requireMember(String email, ChatRoom room) {
        User me = getUser(email);
        return chatRoomMemberRepository.findByChatRoom_IdAndUser_Id(room.getId(), me.getId())
                .orElseThrow(() -> new RuntimeException("채팅방 참여자가 아닙니다."));
    }

    private ChatRoomDto toDto(ChatRoom room, User viewer) {
        List<ChatRoomMember> members = chatRoomMemberRepository.findByChatRoom_Id(room.getId());

        List<ChatParticipantDto> participants = members.stream()
                .map(m -> ChatParticipantDto.builder().id(m.getUser().getId()).name(m.getUser().getName()).build())
                .collect(Collectors.toList());

        String displayName = Boolean.TRUE.equals(room.getIsGroup())
                ? (room.getName() != null ? room.getName() : "단체 채팅방")
                : members.stream()
                        .map(ChatRoomMember::getUser)
                        .filter(u -> !u.getId().equals(viewer.getId()))
                        .map(User::getName)
                        .findFirst()
                        .orElse("알 수 없음");

        ChatMessage last = chatMessageRepository.findFirstByChatRoom_IdOrderByCreatedAtDesc(room.getId()).orElse(null);

        ChatRoomMember myMembership = members.stream()
                .filter(m -> m.getUser().getId().equals(viewer.getId()))
                .findFirst()
                .orElse(null);

        int unreadCount = 0;
        if (myMembership != null) {
            unreadCount = (int) (myMembership.getLastReadMessageId() == null
                    ? chatMessageRepository.countByChatRoom_Id(room.getId())
                    : chatMessageRepository.countByChatRoom_IdAndIdGreaterThan(room.getId(), myMembership.getLastReadMessageId()));
        }

        return ChatRoomDto.builder()
                .id(room.getId())
                .name(displayName)
                .isGroup(room.getIsGroup())
                .participants(participants)
                .lastMessage(last != null ? toMessageDto(last) : null)
                .unreadCount(unreadCount)
                .createdAt(room.getCreatedAt())
                .build();
    }

    private ChatMessageDto toMessageDto(ChatMessage m) {
        return ChatMessageDto.builder()
                .id(m.getId())
                .roomId(m.getChatRoom().getId())
                .senderId(m.getSender().getId())
                .senderName(m.getSender().getName())
                .senderEmail(m.getSender().getEmail())
                .content(m.getContent())
                .createdAt(m.getCreatedAt())
                .build();
    }

    private String truncate(String s) {
        return s.length() > 30 ? s.substring(0, 30) + "..." : s;
    }
}
