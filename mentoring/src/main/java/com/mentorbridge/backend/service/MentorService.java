package com.mentorbridge.backend.service;

import com.mentorbridge.backend.dto.MentorApplyRequest;
import com.mentorbridge.backend.dto.MentorProfileDto;
import com.mentorbridge.backend.dto.MentorRequestDto;
import com.mentorbridge.backend.model.*;
import com.mentorbridge.backend.repository.MentorMatchingRepository;
import com.mentorbridge.backend.repository.MentorProfileRepository;
import com.mentorbridge.backend.repository.MentorRequestRepository;
import com.mentorbridge.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MentorService {

    private final MentorProfileRepository mentorProfileRepository;
    private final MentorRequestRepository mentorRequestRepository;
    private final MentorMatchingRepository mentorMatchingRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<MentorProfileDto> getAllMentors() {
        return mentorProfileRepository.findAll().stream().map(profile -> MentorProfileDto.builder()
                .mentorId(profile.getId())
                .userId(profile.getUser().getId())
                .name(profile.getUser().getName())
                .mentorIntro(profile.getMentorIntro())
                .mentorCareer(profile.getMentorCareer())
                .specs(MentorProfileDto.parseSpecs(profile.getSpecs()))
                .profileImageUrl(profile.getProfileImageUrl())
                .rating(profile.getRating())
                .reviewCount(profile.getReviewCount())
                .build()).collect(Collectors.toList());
    }

    @Transactional
    public MentorRequestDto applyForMentor(String email, MentorApplyRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        MentorRequest mentorRequest = MentorRequest.builder()
                .user(user)
                .selfIntro(request.getSelfIntro())
                .career(request.getCareer())
                .proofUrl(request.getProofUrl())
                .status(RequestStatus.PENDING)
                .build();
        mentorRequest = mentorRequestRepository.save(mentorRequest);

        // Auto-approve for testing purposes since we don't have an admin panel
        approveMentorRequest(mentorRequest.getId(), request.getSpecs());

        return MentorRequestDto.builder()
                .requestId(mentorRequest.getId())
                .userId(user.getId())
                .selfIntro(mentorRequest.getSelfIntro())
                .career(mentorRequest.getCareer())
                .proofUrl(mentorRequest.getProofUrl())
                .status(mentorRequest.getStatus())
                .requestedAt(mentorRequest.getRequestedAt())
                .build();
    }

    @Transactional
    public void approveMentorRequest(Integer requestId, List<String> specs) {
        MentorRequest request = mentorRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        request.setStatus(RequestStatus.APPROVED);
        mentorRequestRepository.save(request);

        User user = request.getUser();
        user.setRole(Role.MENTOR);
        user.setIsMentorVerified(true);
        userRepository.save(user);

        MentorProfile profile = MentorProfile.builder()
                .user(user)
                .mentorIntro(request.getSelfIntro())
                .mentorCareer(request.getCareer())
                .specs(MentorProfileDto.joinSpecs(specs))
                .profileImageUrl(null) // Can be set via profile updates later
                .rating(0.0f)
                .reviewCount(0)
                .build();
        mentorProfileRepository.save(profile);
    }

    @Transactional
    public void requestMatching(String email, Integer mentorId) {
        User mentee = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        MentorProfile mentor = mentorProfileRepository.findById(mentorId)
                .orElseThrow(() -> new RuntimeException("Mentor not found"));

        if (mentee.getId().equals(mentor.getUser().getId())) {
            throw new RuntimeException("Cannot request mentoring to yourself");
        }

        MentorMatching matching = MentorMatching.builder()
                .mentor(mentor)
                .mentee(mentee)
                .status(MatchingStatus.REQUESTED)
                .build();
        mentorMatchingRepository.save(matching);
    }
}
