package com.mentorbridge.backend.service;

import com.mentorbridge.backend.config.JwtUtil;
import com.mentorbridge.backend.dto.Dto.*;
import com.mentorbridge.backend.model.RefreshToken;
import com.mentorbridge.backend.model.Role;
import com.mentorbridge.backend.model.User;
import com.mentorbridge.backend.repository.RefreshTokenRepository;
import com.mentorbridge.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    public AuthResponse signup(SignupRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email is already taken!");
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .name(request.getName())
                .role(request.getRole())
                .build();

        userRepository.save(user);

        return issueTokens(user);
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (Boolean.TRUE.equals(user.getIsSuspended())) {
            throw new RuntimeException("정지된 계정입니다. 관리자에게 문의해주세요.");
        }

        return issueTokens(user);
    }

    @Transactional
    public AuthResponse reissue(String refreshTokenValue) {
        RefreshToken refreshToken = refreshTokenRepository.findByTokenValue(refreshTokenValue)
                .orElseThrow(() -> new RuntimeException("Invalid refresh token"));

        if (refreshToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            refreshTokenRepository.delete(refreshToken);
            throw new RuntimeException("Refresh token expired");
        }

        User user = refreshToken.getUser();
        refreshTokenRepository.delete(refreshToken); // rotate: old refresh token is single-use

        return issueTokens(user);
    }

    @Transactional
    public AuthResponse oauthLogin(String email, String name) {
        User user = userRepository.findByEmail(email)
                .orElseGet(() -> userRepository.save(User.builder()
                        .email(email)
                        .password(passwordEncoder.encode(UUID.randomUUID().toString())) // 소셜 계정은 비밀번호 로그인을 쓰지 않음
                        .name(name != null && !name.isBlank() ? name : email)
                        .role(Role.MENTEE)
                        .build()));

        if (Boolean.TRUE.equals(user.getIsSuspended())) {
            throw new RuntimeException("정지된 계정입니다. 관리자에게 문의해주세요.");
        }

        return issueTokens(user);
    }

    @Transactional
    public void logout(String refreshTokenValue) {
        refreshTokenRepository.deleteByTokenValue(refreshTokenValue);
    }

    private AuthResponse issueTokens(User user) {
        String accessToken = jwtUtil.generateToken(user.getEmail());
        String refreshTokenValue = jwtUtil.generateRefreshToken(user.getEmail());

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .tokenValue(refreshTokenValue)
                .expiresAt(LocalDateTime.now().plusSeconds(jwtUtil.getRefreshExpiration() / 1000))
                .build();
        refreshTokenRepository.save(refreshToken);

        return new AuthResponse(accessToken, refreshTokenValue, user.getEmail(), user.getName(), user.getRole());
    }
}
