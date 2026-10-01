package com.mentorbridge.backend.service;

import com.mentorbridge.backend.dto.MessageCreateDto;
import com.mentorbridge.backend.dto.MessageDto;
import com.mentorbridge.backend.model.*;
import com.mentorbridge.backend.repository.MessageRepository;
import com.mentorbridge.backend.repository.PostRepository;
import com.mentorbridge.backend.repository.StudyGroupRepository;
import com.mentorbridge.backend.repository.StudyMemberRepository;
import com.mentorbridge.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final StudyGroupRepository studyGroupRepository;
    private final StudyMemberRepository studyMemberRepository;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<MessageDto> getInbox(String email) {
        User receiver = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return messageRepository.findByReceiverOrderByCreatedAtDesc(receiver).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public MessageDto sendMessage(String email, MessageCreateDto dto) {
        User sender = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Sender not found"));
        User receiver = userRepository.findById(dto.getReceiverId())
                .orElseThrow(() -> new RuntimeException("Receiver not found"));

        if (dto.getMessageType() == MessageType.APPLICATION && sender.getId().equals(receiver.getId())) {
            throw new RuntimeException("본인이 작성한 게시글에는 지원할 수 없습니다.");
        }

        if (dto.getMessageType() == MessageType.APPLICATION && dto.getRelatedGroupId() != null) {
            messageRepository.findFirstBySenderAndRelatedGroupIdAndMessageTypeOrderByCreatedAtDesc(
                            sender, dto.getRelatedGroupId(), MessageType.APPLICATION)
                    .filter(m -> m.getStatus() == MessageStatus.PENDING || m.getStatus() == MessageStatus.ACCEPTED)
                    .ifPresent(m -> {
                        throw new RuntimeException("이미 지원한 스터디입니다.");
                    });
        }

        Message message = Message.builder()
                .sender(sender)
                .receiver(receiver)
                .content(dto.getContent())
                .messageType(dto.getMessageType() != null ? dto.getMessageType() : MessageType.NORMAL)
                .relatedGroupId(dto.getRelatedGroupId())
                .status(dto.getMessageType() == MessageType.APPLICATION ? MessageStatus.PENDING : null)
                .build();

        Message saved = messageRepository.save(message);

        notificationService.sendNotification(
                receiver.getId(),
                NotificationType.MESSAGE,
                sender.getName() + "님이 쪽지를 보냈습니다.",
                "/messages");

        return mapToDto(saved);
    }

    @Transactional(readOnly = true)
    public MessageDto getApplicationStatus(String email, Integer relatedGroupId) {
        User sender = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return messageRepository.findFirstBySenderAndRelatedGroupIdAndMessageTypeOrderByCreatedAtDesc(
                        sender, relatedGroupId, MessageType.APPLICATION)
                .map(this::mapToDto)
                .orElse(null);
    }

    // 커뮤니티 목록 페이지에서 게시글마다 "지원하기"/"지원 취소하기"를 바로 보여주기 위해,
    // 내가 보낸 지원서 중 게시글(relatedGroupId)별 가장 최신 상태만 모아서 반환한다.
    @Transactional(readOnly = true)
    public List<MessageDto> getMyApplications(String email) {
        User sender = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Message> applications = messageRepository.findBySenderAndMessageTypeOrderByCreatedAtDesc(sender, MessageType.APPLICATION);

        Map<Integer, Message> latestByGroup = new LinkedHashMap<>();
        for (Message m : applications) {
            latestByGroup.putIfAbsent(m.getRelatedGroupId(), m);
        }

        return latestByGroup.values().stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional
    public void cancelApplication(String email, Integer messageId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));

        User sender = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!message.getSender().getId().equals(sender.getId())) {
            throw new RuntimeException("본인이 지원한 신청만 취소할 수 있습니다.");
        }
        if (message.getMessageType() != MessageType.APPLICATION || message.getStatus() != MessageStatus.PENDING) {
            throw new RuntimeException("취소할 수 없는 상태입니다.");
        }

        messageRepository.delete(message);
    }

    @Transactional
    public void acceptApplication(String email, Integer messageId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));
        
        User receiver = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (!message.getReceiver().getId().equals(receiver.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        if (message.getMessageType() != MessageType.APPLICATION || message.getStatus() != MessageStatus.PENDING) {
            throw new RuntimeException("Invalid message type or status");
        }

        message.setStatus(MessageStatus.ACCEPTED);
        messageRepository.save(message);

        // relatedGroupId는 지원할 때 프론트가 post.boardId로 채워서 보낸다.
        // 게시글 작성만으로는 study_group이 생기지 않으므로, 첫 수락 시점에 그룹을 만들어준다.
        Post post = postRepository.findById(message.getRelatedGroupId())
                .orElseThrow(() -> new RuntimeException("Post not found"));

        StudyGroup group = studyGroupRepository.findByPostBoardId(post.getBoardId())
                .orElseGet(() -> {
                    StudyGroup newGroup = StudyGroup.builder()
                            .post(post)
                            .leader(receiver)
                            .groupName(post.getTitle())
                            .maxMembers(99)
                            .status(StudyGroupStatus.모집중)
                            .build();
                    StudyGroup savedGroup = studyGroupRepository.save(newGroup);
                    studyMemberRepository.save(StudyMember.builder().studyGroup(savedGroup).user(receiver).build());
                    return savedGroup;
                });

        boolean alreadyMember = studyMemberRepository
                .findByStudyGroupGroupIdAndUser_Id(group.getGroupId(), message.getSender().getId())
                .isPresent();
        if (!alreadyMember) {
            long currentMembers = studyMemberRepository.countByStudyGroupGroupId(group.getGroupId());
            if (currentMembers >= group.getMaxMembers()) {
                throw new RuntimeException("모집 인원이 모두 찼습니다.");
            }
            StudyMember member = StudyMember.builder()
                    .studyGroup(group)
                    .user(message.getSender())
                    .build();
            studyMemberRepository.save(member);
        }

        // Send System Message back
        Message systemMessage = Message.builder()
                .sender(receiver) // In a real app, might be a 'System' user
                .receiver(message.getSender())
                .content("스터디 참여 신청이 수락되었습니다.")
                .messageType(MessageType.SYSTEM)
                .relatedGroupId(message.getRelatedGroupId())
                .build();
        messageRepository.save(systemMessage);

        notificationService.sendNotification(
                message.getSender().getId(),
                NotificationType.APPLICATION_STATUS,
                "스터디 참여 신청이 수락되었습니다.",
                "/messages");
    }

    @Transactional
    public void rejectApplication(String email, Integer messageId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));

        User receiver = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!message.getReceiver().getId().equals(receiver.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        if (message.getMessageType() != MessageType.APPLICATION || message.getStatus() != MessageStatus.PENDING) {
            throw new RuntimeException("Invalid message type or status");
        }

        message.setStatus(MessageStatus.REJECTED);
        messageRepository.save(message);

        // Send System Message back
        Message systemMessage = Message.builder()
                .sender(receiver)
                .receiver(message.getSender())
                .content("스터디 참여 신청이 거절되었습니다.")
                .messageType(MessageType.SYSTEM)
                .relatedGroupId(message.getRelatedGroupId())
                .build();
        messageRepository.save(systemMessage);

        notificationService.sendNotification(
                message.getSender().getId(),
                NotificationType.APPLICATION_STATUS,
                "스터디 참여 신청이 거절되었습니다.",
                "/messages");
    }

    private MessageDto mapToDto(Message message) {
        return MessageDto.builder()
                .id(message.getId())
                .senderId(message.getSender().getId())
                .senderName(message.getSender().getName())
                .receiverId(message.getReceiver().getId())
                .receiverName(message.getReceiver().getName())
                .content(message.getContent())
                .isRead(message.getIsRead())
                .messageType(message.getMessageType())
                .relatedGroupId(message.getRelatedGroupId())
                .status(message.getStatus())
                .createdAt(message.getCreatedAt())
                .build();
    }
}
