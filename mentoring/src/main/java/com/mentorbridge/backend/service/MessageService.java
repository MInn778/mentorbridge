package com.mentorbridge.backend.service;

import com.mentorbridge.backend.dto.MessageCreateDto;
import com.mentorbridge.backend.dto.MessageDto;
import com.mentorbridge.backend.model.*;
import com.mentorbridge.backend.repository.MessageRepository;
import com.mentorbridge.backend.repository.StudyGroupRepository;
import com.mentorbridge.backend.repository.StudyMemberRepository;
import com.mentorbridge.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final StudyGroupRepository studyGroupRepository;
    private final StudyMemberRepository studyMemberRepository;

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

        Message message = Message.builder()
                .sender(sender)
                .receiver(receiver)
                .content(dto.getContent())
                .messageType(dto.getMessageType() != null ? dto.getMessageType() : MessageType.NORMAL)
                .relatedGroupId(dto.getRelatedGroupId())
                .status(dto.getMessageType() == MessageType.APPLICATION ? MessageStatus.PENDING : null)
                .build();

        Message saved = messageRepository.save(message);
        return mapToDto(saved);
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

        // Add to StudyGroup
        StudyGroup group = studyGroupRepository.findById(message.getRelatedGroupId())
                .orElseThrow(() -> new RuntimeException("Study group not found"));

        StudyMember member = StudyMember.builder()
                .studyGroup(group)
                .user(message.getSender())
                .build();
        studyMemberRepository.save(member);

        // Send System Message back
        Message systemMessage = Message.builder()
                .sender(receiver) // In a real app, might be a 'System' user
                .receiver(message.getSender())
                .content("Your application to the group has been ACCEPTED.")
                .messageType(MessageType.SYSTEM)
                .relatedGroupId(message.getRelatedGroupId())
                .build();
        messageRepository.save(systemMessage);
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
                .content("Your application to the group has been REJECTED.")
                .messageType(MessageType.SYSTEM)
                .relatedGroupId(message.getRelatedGroupId())
                .build();
        messageRepository.save(systemMessage);
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
