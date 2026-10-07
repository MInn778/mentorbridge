package com.mentorbridge.backend.service;

import com.mentorbridge.backend.config.JwtUtil;
import com.mentorbridge.backend.dto.Dto.*;
import com.mentorbridge.backend.model.RefreshToken;
import com.mentorbridge.backend.model.Role;
import com.mentorbridge.backend.model.User;
import com.mentorbridge.backend.repository.RefreshTokenRepository;
import com.mentorbridge.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
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
        String name = request.getName() == null ? "" : request.getName().trim();
        if (name.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "닉네임을 입력해주세요.");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 가입된 이메일입니다.");
        }
        // 채팅 검색/게시글 작성자 표시 등에서 이름으로 사람을 구분하므로 닉네임은 중복 불가
        if (userRepository.existsByName(name)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 사용 중인 닉네임입니다.");
        }

        // 멘토/관리자 권한은 가입 시점에 바로 부여하지 않는다. 멘토는 가입 후 멘토 지원(mentor_request) ->
        // 관리자 승인을 거쳐야 하므로, 가입 요청에 어떤 role이 담겨 오든 전부 무시하고 MENTEE로 고정한다.
        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .name(name)
                .role(Role.MENTEE)
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
                        .name(uniqueName(name != null && !name.isBlank() ? name.trim() : email))
                        .role(Role.MENTEE)
                        .build()));

        if (Boolean.TRUE.equals(user.getIsSuspended())) {
            throw new RuntimeException("정지된 계정입니다. 관리자에게 문의해주세요.");
        }

        return issueTokens(user);
    }

    // 구글 로그인은 구글 계정 이름을 그대로 닉네임으로 쓰므로, 겹치면 "홍길동2", "홍길동3"처럼 번호를 붙인다
    private String uniqueName(String base) {
        String candidate = base;
        for (int n = 2; userRepository.existsByName(candidate); n++) {
            candidate = base + n;
        }
        return candidate;
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
