package com.mentorbridge.backend.dto;

import com.mentorbridge.backend.model.BoardType;
import com.mentorbridge.backend.model.PostStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostDto {
    private Integer boardId;
    private Integer authorId;
    private String authorName;
    private BoardType boardType;
    private String title;
    private String content;
    private Integer viewCount;
    private PostStatus status;
    private List<String> tags;
    private List<String> participantNames;
    private LocalDateTime createdAt;
    
    // For creating/updating
    public static class Request {
        private BoardType boardType;
        private String title;
        private String content;
        private PostStatus status;
        private List<String> tags;
        
        // getters and setters
        public BoardType getBoardType() { return boardType; }
        public void setBoardType(BoardType boardType) { this.boardType = boardType; }
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
        public PostStatus getStatus() { return status; }
        public void setStatus(PostStatus status) { this.status = status; }
        public List<String> getTags() { return tags; }
        public void setTags(List<String> tags) { this.tags = tags; }
    }
}
