package com.mentorbridge.backend.dto;

import lombok.Data;

import java.util.List;

@Data
public class AddMembersDto {
    private List<Integer> memberIds;
}
