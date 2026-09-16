package com.mentorbridge.backend.service;

import com.mentorbridge.backend.dto.MentorApplyRequest;
import com.mentorbridge.backend.dto.MentorMatchingDto;
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
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class MentorService {

    private final MentorProfileRepository mentorProfileRepository;
    private final MentorRequestRepository mentorRequestRepository;
    private final MentorMatchingRepository mentorMatchingRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

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

        if (user.getRole() == Role.ADMIN) {
            throw new RuntimeException("관리자 계정은 멘토 신청을 할 수 없습니다.");
        }

        MentorRequest mentorRequest = MentorRequest.builder()
                .user(user)
                .selfIntro(request.getSelfIntro())
                .career(request.getCareer())
                .proofUrl(request.getProofUrl())
                .specs(MentorProfileDto.joinSpecs(request.getSpecs()))
                .status(RequestStatus.PENDING)
                .build();
        mentorRequest = mentorRequestRepository.save(mentorRequest);

        return mapToDto(mentorRequest);
    }

    @Transactional(readOnly = true)
    public List<MentorRequestDto> getAllMentorRequests() {
        return mentorRequestRepository.findAll().stream()
                .sorted((a, b) -> b.getRequestedAt().compareTo(a.getRequestedAt()))
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void approveMentorRequest(Integer requestId, String adminEmail) {
        MentorRequest request = mentorRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (request.getStatus() != RequestStatus.PENDING) {
            throw new RuntimeException("Already processed");
        }

        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        request.setStatus(RequestStatus.APPROVED);
        request.setAdmin(admin);
        request.setProcessedAt(java.time.LocalDateTime.now());
        mentorRequestRepository.save(request);

        User user = request.getUser();
        if (user.getRole() == Role.ADMIN) {
            throw new RuntimeException("관리자 계정은 멘토로 승인할 수 없습니다.");
        }
        user.setRole(Role.MENTOR);
        user.setIsMentorVerified(true);
        userRepository.save(user);

        MentorProfile profile = MentorProfile.builder()
                .user(user)
                .mentorIntro(request.getSelfIntro())
                .mentorCareer(request.getCareer())
                .specs(request.getSpecs())
                .profileImageUrl(null) // Can be set via profile updates later
                .rating(0.0f)
                .reviewCount(0)
                .build();
        mentorProfileRepository.save(profile);

        notificationService.sendNotification(
                user.getId(),
                NotificationType.APPLICATION_STATUS,
                "멘토 신청이 승인되었습니다.",
                "/mentors");
    }

    @Transactional
    public void rejectMentorRequest(Integer requestId, String reason, String adminEmail) {
        MentorRequest request = mentorRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (request.getStatus() != RequestStatus.PENDING) {
            throw new RuntimeException("Already processed");
        }

        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        request.setStatus(RequestStatus.REJECTED);
        request.setAdmin(admin);
        request.setRejectReason(reason);
        request.setProcessedAt(java.time.LocalDateTime.now());
        mentorRequestRepository.save(request);

        notificationService.sendNotification(
                request.getUser().getId(),
                NotificationType.APPLICATION_STATUS,
                "멘토 신청이 반려되었습니다.",
                "/mentors");
    }

    private MentorRequestDto mapToDto(MentorRequest request) {
        return MentorRequestDto.builder()
                .requestId(request.getId())
                .userId(request.getUser().getId())
                .userName(request.getUser().getName())
                .userEmail(request.getUser().getEmail())
                .selfIntro(request.getSelfIntro())
                .career(request.getCareer())
                .proofUrl(request.getProofUrl())
                .specs(MentorProfileDto.parseSpecs(request.getSpecs()))
                .status(request.getStatus())
                .rejectReason(request.getRejectReason())
                .requestedAt(request.getRequestedAt())
                .processedAt(request.getProcessedAt())
                .build();
    }

    @Transactional
    public MentorProfileDto updateMyMentorProfile(String email, MentorProfileDto dto) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        MentorProfile profile = mentorProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Mentor profile not found"));

        profile.setMentorIntro(dto.getMentorIntro());
        profile.setMentorCareer(dto.getMentorCareer());
        profile.setSpecs(MentorProfileDto.joinSpecs(dto.getSpecs()));
        MentorProfile saved = mentorProfileRepository.save(profile);

        return MentorProfileDto.builder()
                .mentorId(saved.getId())
                .userId(user.getId())
                .name(user.getName())
                .mentorIntro(saved.getMentorIntro())
                .mentorCareer(saved.getMentorCareer())
                .specs(MentorProfileDto.parseSpecs(saved.getSpecs()))
                .profileImageUrl(saved.getProfileImageUrl())
                .rating(saved.getRating())
                .reviewCount(saved.getReviewCount())
                .build();
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

        notificationService.sendNotification(
                mentor.getUser().getId(),
                NotificationType.MENTORING,
                mentee.getName() + "님이 멘토링을 신청했습니다.",
                "/mentors");
    }

    @Transactional
    public void respondToMatching(String email, Integer matchingId, MatchingStatus newStatus) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        MentorMatching matching = mentorMatchingRepository.findById(matchingId)
                .orElseThrow(() -> new RuntimeException("Matching not found"));

        if (!matching.getMentor().getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        if (matching.getStatus() != MatchingStatus.REQUESTED) {
            throw new RuntimeException("이미 처리된 신청입니다.");
        }

        matching.setStatus(newStatus);
        mentorMatchingRepository.save(matching);

        notificationService.sendNotification(
                matching.getMentee().getId(),
                NotificationType.APPLICATION_STATUS,
                newStatus == MatchingStatus.ACCEPTED ? "멘토링 신청이 수락되었습니다." : "멘토링 신청이 거절되었습니다.",
                "/mentors");
    }

    @Transactional
    public void completeMatching(String email, Integer matchingId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        MentorMatching matching = mentorMatchingRepository.findById(matchingId)
                .orElseThrow(() -> new RuntimeException("Matching not found"));

        boolean isMentor = matching.getMentor().getUser().getId().equals(user.getId());
        boolean isMentee = matching.getMentee().getId().equals(user.getId());
        if (!isMentor && !isMentee) {
            throw new RuntimeException("Unauthorized");
        }

        if (matching.getStatus() != MatchingStatus.ACCEPTED) {
            throw new RuntimeException("진행 중인 멘토링만 완료 처리할 수 있습니다.");
        }

        matching.setStatus(MatchingStatus.COMPLETED);
        mentorMatchingRepository.save(matching);

        Integer otherPartyId = isMentor ? matching.getMentee().getId() : matching.getMentor().getUser().getId();
        notificationService.sendNotification(
                otherPartyId,
                NotificationType.MENTORING,
                "멘토링이 완료 처리되었습니다.",
                "/mentors");
    }

    @Transactional(readOnly = true)
    public List<MentorMatchingDto> getMyMatchings(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Stream<MentorMatchingDto> asMentee = mentorMatchingRepository.findByMenteeId(user.getId()).stream()
                .map(m -> MentorMatchingDto.builder()
                        .matchingId(m.getId())
                        .myRole("MENTEE")
                        .otherPartyUserId(m.getMentor().getUser().getId())
                        .otherPartyName(m.getMentor().getUser().getName())
                        .status(m.getStatus())
                        .createdAt(m.getCreatedAt())
                        .build());

        Stream<MentorMatchingDto> asMentor = mentorProfileRepository.findByUserId(user.getId())
                .map(profile -> mentorMatchingRepository.findByMentorId(profile.getId()).stream()
                        .map(m -> MentorMatchingDto.builder()
                                .matchingId(m.getId())
                                .myRole("MENTOR")
                                .otherPartyUserId(m.getMentee().getId())
                                .otherPartyName(m.getMentee().getName())
                                .status(m.getStatus())
                                .createdAt(m.getCreatedAt())
                                .build()))
                .orElse(Stream.empty());

        return Stream.concat(asMentee, asMentor)
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .collect(Collectors.toList());
    }
}
