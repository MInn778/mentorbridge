package com.mentorbridge.backend.dto;

import com.mentorbridge.backend.model.StudyGroupStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudyGroupDto {
    private Integer groupId;
    private Integer boardId;
    private Integer leaderId;
    private String leaderName;
    private String groupName;
    private Integer maxMembers;
    private StudyGroupStatus status;
    private long currentMembersCount;
    private LocalDateTime createdAt;
    
    public static class Request {
        private Integer boardId;
        private String groupName;
        private Integer maxMembers;
        
        public Integer getBoardId() { return boardId; }
        public void setBoardId(Integer boardId) { this.boardId = boardId; }
        public String getGroupName() { return groupName; }
        public void setGroupName(String groupName) { this.groupName = groupName; }
        public Integer getMaxMembers() { return maxMembers; }
        public void setMaxMembers(Integer maxMembers) { this.maxMembers = maxMembers; }
    }
}
