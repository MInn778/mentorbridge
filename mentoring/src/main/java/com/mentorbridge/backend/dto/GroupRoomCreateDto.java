package com.mentorbridge.backend.dto;

import lombok.Data;

import java.util.List;

@Data
public class GroupRoomCreateDto {
    private String name;
    private List<Integer> memberIds;
}
