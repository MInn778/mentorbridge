package com.mentorbridge.backend.service;

import com.mentorbridge.backend.dto.DashboardStatsDto;
import com.mentorbridge.backend.model.MatchingStatus;
import com.mentorbridge.backend.model.MentorMatching;
import com.mentorbridge.backend.model.User;
import com.mentorbridge.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final UserRepository userRepository;
    private final StudyMemberRepository studyMemberRepository;
    private final MentorMatchingRepository mentorMatchingRepository;
    private final MentorProfileRepository mentorProfileRepository;
    private final FeedbackPostRepository feedbackPostRepository;
    private final BookmarkRepository bookmarkRepository;

    @Transactional(readOnly = true)
    public DashboardStatsDto getStats(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        long studyCount = studyMemberRepository.findByUserId(user.getId()).size();

        List<MentorMatching> asMentee = mentorMatchingRepository.findByMenteeId(user.getId());
        List<MentorMatching> asMentor = mentorProfileRepository.findByUserId(user.getId())
                .map(profile -> mentorMatchingRepository.findByMentorId(profile.getId()))
                .orElse(List.of());

        long mentoringCount = Stream.concat(asMentee.stream(), asMentor.stream())
                .filter(m -> m.getStatus() == MatchingStatus.REQUESTED || m.getStatus() == MatchingStatus.ACCEPTED)
                .count();

        long feedbackCount = feedbackPostRepository.countByAuthorId(user.getId());
        long bookmarkCount = bookmarkRepository.findByUser(user).size();

        return DashboardStatsDto.builder()
                .studyCount(studyCount)
                .mentoringCount(mentoringCount)
                .feedbackCount(feedbackCount)
                .bookmarkCount(bookmarkCount)
                .build();
    }
}
