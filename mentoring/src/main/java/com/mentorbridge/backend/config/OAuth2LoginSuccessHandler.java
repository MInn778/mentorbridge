package com.mentorbridge.backend.config;

import com.mentorbridge.backend.dto.Dto.AuthResponse;
import com.mentorbridge.backend.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final AuthService authService;

    @Value("${app.oauth2.redirect-uri}")
    private String redirectUri;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");

        AuthResponse authResponse = authService.oauthLogin(email, name);

        String targetUrl = UriComponentsBuilder.fromUriString(redirectUri)
                .queryParam("token", authResponse.getToken())
                .queryParam("refreshToken", authResponse.getRefreshToken())
                .queryParam("email", authResponse.getEmail())
                .queryParam("name", authResponse.getName())
                .queryParam("role", authResponse.getRole())
                .build()
                .encode() // 한글 이름 등 비-ASCII 값이 Location 헤더에 그대로 들어가 깨지는 것을 방지
                .toUriString();

        response.sendRedirect(targetUrl);
    }
}
