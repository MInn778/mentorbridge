package com.mentorbridge.backend.service;

import com.mentorbridge.backend.dto.UserAdminDto;
import com.mentorbridge.backend.model.Role;
import com.mentorbridge.backend.model.User;
import com.mentorbridge.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<UserAdminDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserAdminDto setSuspended(Integer userId, boolean suspended) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() == com.mentorbridge.backend.model.Role.ADMIN) {
            throw new RuntimeException("Cannot suspend an admin account");
        }

        user.setIsSuspended(suspended);
        return mapToDto(userRepository.save(user));
    }

    @Transactional
    public UserAdminDto promoteToAdmin(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setRole(Role.ADMIN);
        user.setIsSuspended(false);
        return mapToDto(userRepository.save(user));
    }

    private UserAdminDto mapToDto(User user) {
        return UserAdminDto.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole())
                .isSuspended(user.getIsSuspended())
                .isMentorVerified(user.getIsMentorVerified())
                .joinDate(user.getCreatedAt())
                .build();
    }
}
