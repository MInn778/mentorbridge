package com.mentorbridge.backend.service;

import com.mentorbridge.backend.dto.NoticeDto;
import com.mentorbridge.backend.model.Notice;
import com.mentorbridge.backend.model.User;
import com.mentorbridge.backend.repository.NoticeRepository;
import com.mentorbridge.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NoticeService {

    private final NoticeRepository noticeRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<NoticeDto> getAllNotices() {
        return noticeRepository.findAllByOrderByIsPinnedDescCreatedAtDesc().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public NoticeDto createNotice(String email, NoticeDto.Request request) {
        User author = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Notice notice = Notice.builder()
                .author(author)
                .title(request.getTitle())
                .content(request.getContent())
                .isPinned(Boolean.TRUE.equals(request.getIsPinned()))
                .build();

        return mapToDto(noticeRepository.save(notice));
    }

    @Transactional
    public void deleteNotice(Integer noticeId) {
        Notice notice = noticeRepository.findById(noticeId)
                .orElseThrow(() -> new RuntimeException("Notice not found"));
        noticeRepository.delete(notice);
    }

    private NoticeDto mapToDto(Notice notice) {
        return NoticeDto.builder()
                .id(notice.getId())
                .authorName(notice.getAuthor().getName())
                .title(notice.getTitle())
                .content(notice.getContent())
                .isPinned(notice.getIsPinned())
                .createdAt(notice.getCreatedAt())
                .build();
    }
}
