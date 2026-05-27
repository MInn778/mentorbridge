package com.mentorbridge.backend.controller;

import com.mentorbridge.backend.dto.StudyGroupDto;
import com.mentorbridge.backend.service.StudyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/studies")
@RequiredArgsConstructor
public class StudyController {

    private final StudyService studyService;

    @GetMapping
    public ResponseEntity<List<StudyGroupDto>> getAllStudyGroups() {
        return ResponseEntity.ok(studyService.getAllStudyGroups());
    }

    @PostMapping
    public ResponseEntity<StudyGroupDto> createStudyGroup(
            @RequestBody StudyGroupDto.Request request,
            @RequestParam Integer userId) {
        return ResponseEntity.ok(studyService.createStudyGroup(request, userId));
    }

    @PostMapping("/{groupId}/join")
    public ResponseEntity<Void> joinStudyGroup(
            @PathVariable Integer groupId,
            @RequestParam Integer userId) {
        studyService.joinStudyGroup(groupId, userId);
        return ResponseEntity.ok().build();
    }
}
