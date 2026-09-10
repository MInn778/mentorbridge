package com.mentorbridge.backend.service;

import com.mentorbridge.backend.dto.PostDto;
import com.mentorbridge.backend.model.BoardType;
import com.mentorbridge.backend.model.Post;
import com.mentorbridge.backend.model.PostStatus;
import com.mentorbridge.backend.model.PostTag;
import com.mentorbridge.backend.model.StudyGroup;
import com.mentorbridge.backend.model.StudyGroupStatus;
import com.mentorbridge.backend.model.StudyMember;
import com.mentorbridge.backend.model.User;
import com.mentorbridge.backend.repository.CommentRepository;
import com.mentorbridge.backend.repository.PostRepository;
import com.mentorbridge.backend.repository.PostTagRepository;
import com.mentorbridge.backend.repository.StudyGroupRepository;
import com.mentorbridge.backend.repository.StudyMemberRepository;
import com.mentorbridge.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final PostTagRepository postTagRepository;
    private final UserRepository userRepository;
    private final StudyGroupRepository studyGroupRepository;
    private final StudyMemberRepository studyMemberRepository;
    private final CommentRepository commentRepository;

    @Transactional(readOnly = true)
    public List<PostDto> getAllPosts() {
        return postRepository.findByIsDeletedFalse().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PostDto getPost(Integer postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        if (post.getIsDeleted()) {
            throw new RuntimeException("Post is deleted");
        }
        return convertToDto(post);
    }

    @Transactional
    public PostDto createPost(PostDto.Request request, String email) {
        User author = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Post post = Post.builder()
                .author(author)
                .boardType(request.getBoardType())
                .title(request.getTitle())
                .content(request.getContent())
                .status(request.getStatus() != null ? request.getStatus() : PostStatus.RECRUITING)
                .meetingType(request.getMeetingType())
                .region(request.getRegion())
                .timeSlot(request.getTimeSlot())
                .build();

        Post savedPost = postRepository.save(post);

        if (request.getTags() != null && !request.getTags().isEmpty()) {
            List<PostTag> tags = request.getTags().stream()
                    .map(tagName -> PostTag.builder().post(savedPost).tagName(tagName).build())
                    .collect(Collectors.toList());
            postTagRepository.saveAll(tags);
        }

        // 모집글(자유 게시판 제외)은 작성자를 방장 겸 참여자로 바로 등록해둔다.
        if (savedPost.getBoardType() != BoardType.자유) {
            int maxMembers = request.getMaxMembers() != null && request.getMaxMembers() > 0 ? request.getMaxMembers() : 10;
            StudyGroup group = StudyGroup.builder()
                    .post(savedPost)
                    .leader(author)
                    .groupName(savedPost.getTitle())
                    .maxMembers(maxMembers)
                    .status(StudyGroupStatus.모집중)
                    .build();
            StudyGroup savedGroup = studyGroupRepository.save(group);
            studyMemberRepository.save(StudyMember.builder().studyGroup(savedGroup).user(author).build());
        }

        return convertToDto(savedPost);
    }

    @Transactional
    public PostDto updatePost(Integer postId, PostDto.Request request, String email) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        
        if (post.getIsDeleted()) {
            throw new RuntimeException("Post is deleted");
        }
        
        User author = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
                
        if (!post.getAuthor().getId().equals(author.getId())) {
            throw new RuntimeException("Not authorized to update this post");
        }
        
        post.setBoardType(request.getBoardType());
        post.setTitle(request.getTitle());
        post.setContent(request.getContent());
        if (request.getStatus() != null) {
            post.setStatus(request.getStatus());
        }
        post.setMeetingType(request.getMeetingType());
        post.setRegion(request.getRegion());
        post.setTimeSlot(request.getTimeSlot());

        Post savedPost = postRepository.save(post);

        // Update tags
        postTagRepository.deleteAll(postTagRepository.findByPostBoardId(savedPost.getBoardId()));
        if (request.getTags() != null && !request.getTags().isEmpty()) {
            List<PostTag> tags = request.getTags().stream()
                    .map(tagName -> PostTag.builder().post(savedPost).tagName(tagName).build())
                    .collect(Collectors.toList());
            postTagRepository.saveAll(tags);
        }

        if (request.getMaxMembers() != null && request.getMaxMembers() > 0) {
            studyGroupRepository.findByPostBoardId(savedPost.getBoardId()).ifPresent(group -> {
                group.setMaxMembers(request.getMaxMembers());
                studyGroupRepository.save(group);
            });
        }

        return convertToDto(savedPost);
    }

    @Transactional
    public PostDto updateStatus(Integer postId, PostStatus status, String email) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        if (post.getIsDeleted()) {
            throw new RuntimeException("Post is deleted");
        }

        User author = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!post.getAuthor().getId().equals(author.getId())) {
            throw new RuntimeException("Not authorized to update this post");
        }

        post.setStatus(status);
        Post savedPost = postRepository.save(post);
        return convertToDto(savedPost);
    }

    @Transactional
    public void deletePost(Integer postId, String email) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        
        if (post.getIsDeleted()) {
            throw new RuntimeException("Post already deleted");
        }
        
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
                
        if (!post.getAuthor().getId().equals(user.getId())) {
            throw new RuntimeException("Not authorized to delete this post");
        }
        
        post.setIsDeleted(true);
        post.setDeletedBy(user);
        post.setDeletedAt(LocalDateTime.now());
        postRepository.save(post);
    }

    @Transactional
    public void adminDeletePost(Integer postId, String adminEmail) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        if (post.getIsDeleted()) {
            throw new RuntimeException("Post already deleted");
        }

        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        post.setIsDeleted(true);
        post.setDeletedBy(admin);
        post.setDeletedAt(LocalDateTime.now());
        postRepository.save(post);
    }

    private PostDto convertToDto(Post post) {
        List<String> tags = postTagRepository.findByPostBoardId(post.getBoardId())
                .stream().map(PostTag::getTagName).collect(Collectors.toList());

        List<String> participantNames = new ArrayList<>();
        Integer[] maxMembersHolder = new Integer[1];
        studyGroupRepository.findByPostBoardId(post.getBoardId()).ifPresent(group -> {
            participantNames.addAll(studyMemberRepository.findByStudyGroupGroupId(group.getGroupId())
                    .stream().map(m -> m.getUser().getName()).collect(Collectors.toList()));
            maxMembersHolder[0] = group.getMaxMembers();
        });

        long commentCount = commentRepository.countByPostBoardIdAndIsDeletedFalse(post.getBoardId());

        return PostDto.builder()
                .boardId(post.getBoardId())
                .authorId(post.getAuthor().getId())
                .authorName(post.getAuthor().getName())
                .boardType(post.getBoardType())
                .title(post.getTitle())
                .content(post.getContent())
                .viewCount(post.getViewCount())
                .status(post.getStatus())
                .tags(tags)
                .participantNames(participantNames)
                .maxMembers(maxMembersHolder[0])
                .commentCount(commentCount)
                .meetingType(post.getMeetingType())
                .region(post.getRegion())
                .timeSlot(post.getTimeSlot())
                .createdAt(post.getCreatedAt())
                .build();
    }
}
