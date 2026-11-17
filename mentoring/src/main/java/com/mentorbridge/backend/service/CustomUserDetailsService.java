package com.mentorbridge.backend.service;

import com.mentorbridge.backend.model.User;
import com.mentorbridge.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        // 정지된 계정은 enabled=false -> JwtUtil.validateToken이 거부해서, 정지 전에 받은 토큰(HTTP/SSE/STOMP)도 바로 막힌다
        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),
                !Boolean.TRUE.equals(user.getIsSuspended()), true, true, true,
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
        );
    }
}
