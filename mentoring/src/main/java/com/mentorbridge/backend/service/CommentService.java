package com.mentorbridge.backend.service;

import com.mentorbridge.backend.dto.CommentDto;
import com.mentorbridge.backend.model.Comment;
import com.mentorbridge.backend.model.NotificationType;
import com.mentorbridge.backend.model.Post;
import com.mentorbridge.backend.model.User;
import com.mentorbridge.backend.repository.CommentRepository;
import com.mentorbridge.backend.repository.PostRepository;
import com.mentorbridge.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<CommentDto> getCommentsByPostId(Integer boardId) {
        return commentRepository.findByPostBoardIdAndIsDeletedFalse(boardId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public CommentDto createComment(Integer boardId, CommentDto.Request request, String email) {
        Post post = postRepository.findById(boardId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        User author = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Comment comment = Comment.builder()
                .post(post)
                .author(author)
                .content(request.getContent())
                .build();

        Comment savedComment = commentRepository.save(comment);

        User postAuthor = post.getAuthor();
        if (!postAuthor.getId().equals(author.getId())) {
            notificationService.sendNotification(
                    postAuthor.getId(),
                    NotificationType.COMMENT,
                    author.getName() + "님이 게시글에 댓글을 남겼습니다.",
                    "/community/" + post.getBoardId());
        }

        return convertToDto(savedComment);
    }

    @Transactional
    public void deleteComment(Integer commentId, String email) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));
        
        if (comment.getIsDeleted()) {
            throw new RuntimeException("Comment already deleted");
        }
        
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
                
        if (!comment.getAuthor().getId().equals(user.getId())) {
            throw new RuntimeException("Not authorized to delete this comment");
        }
        
        comment.setIsDeleted(true);
        comment.setDeletedBy(user);
        comment.setDeletedAt(java.time.LocalDateTime.now());
        commentRepository.save(comment);
    }

    private CommentDto convertToDto(Comment comment) {
        return CommentDto.builder()
                .commentId(comment.getCommentId())
                .boardId(comment.getPost().getBoardId())
                .authorId(comment.getAuthor().getId())
                .authorName(comment.getAuthor().getName())
                .content(comment.getContent())
                .createdAt(comment.getCreatedAt())
                .build();
    }
}
