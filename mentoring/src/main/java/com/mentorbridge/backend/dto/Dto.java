package com.mentorbridge.backend.dto;

import com.mentorbridge.backend.model.Role;
import lombok.Data;

public class Dto {
    @Data
    public static class SignupRequest {
        private String email;
        private String password;
        private String name;
        private Role role;
    }

    @Data
    public static class LoginRequest {
        private String email;
        private String password;
    }

    @Data
    public static class RefreshRequest {
        private String refreshToken;
    }

    @Data
    public static class AuthResponse {
        private String token;
        private String refreshToken;
        private String email;
        private String name;
        private Role role;

        public AuthResponse(String token, String refreshToken, String email, String name, Role role) {
            this.token = token;
            this.refreshToken = refreshToken;
            this.email = email;
            this.name = name;
            this.role = role;
        }
    }
}
