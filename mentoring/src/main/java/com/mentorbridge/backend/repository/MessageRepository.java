package com.mentorbridge.backend.repository;

import com.mentorbridge.backend.model.Message;
import com.mentorbridge.backend.model.MessageType;
import com.mentorbridge.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MessageRepository extends JpaRepository<Message, Integer> {
    List<Message> findByReceiverOrderByCreatedAtDesc(User receiver);
    List<Message> findByReceiverAndIsReadFalse(User receiver);
    List<Message> findBySenderOrderByCreatedAtDesc(User sender);
    Optional<Message> findFirstBySenderAndRelatedGroupIdAndMessageTypeOrderByCreatedAtDesc(
            User sender, Integer relatedGroupId, MessageType messageType);
    List<Message> findBySenderAndMessageTypeOrderByCreatedAtDesc(User sender, MessageType messageType);
}
