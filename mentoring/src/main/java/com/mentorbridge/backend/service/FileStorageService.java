package com.mentorbridge.backend.service;

import com.mentorbridge.backend.model.FeedbackFile;
import com.mentorbridge.backend.repository.FeedbackFileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FileStorageService {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("pdf", "doc", "docx", "ppt", "pptx", "hwp");

    private final FeedbackFileRepository feedbackFileRepository;

    // DB 저장 이전에 디스크에 올라간 파일을 읽기 위한 경로 (새 파일은 디스크에 쓰지 않음)
    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    /**
     * UUID 파일명으로 DB(feedback_file)에 저장하고, 프론트가 GET할 상대 경로(/api/feedback/files/xxx)를 돌려준다.
     */
    public StoredFile storeFeedbackAttachment(MultipartFile file) throws IOException {
        String originalName = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "file");
        String extension = getExtension(originalName);
        if (!ALLOWED_EXTENSIONS.contains(extension.toLowerCase())) {
            throw new IllegalArgumentException("지원하지 않는 파일 형식입니다: ." + extension);
        }

        String storedName = UUID.randomUUID() + "." + extension;
        feedbackFileRepository.save(FeedbackFile.builder().storedName(storedName).data(file.getBytes()).build());

        return new StoredFile(storedName, originalName, "/api/feedback/files/" + storedName);
    }

    /** DB에서 먼저 찾고, 없으면 예전 방식으로 이 서버 디스크에 저장된 파일을 찾는다. 둘 다 없으면 empty. */
    public Optional<byte[]> load(String storedName) {
        // storedName은 UUID.확장자 형태로만 생성되므로, 경로 조작 문자가 섞이지 않게 한 번 더 방어한다.
        String safeName = Paths.get(storedName).getFileName().toString();
        Optional<byte[]> fromDb = feedbackFileRepository.findById(safeName).map(FeedbackFile::getData);
        if (fromDb.isPresent()) return fromDb;

        Path legacy = Paths.get(uploadDir, "feedback").resolve(safeName);
        try {
            return Files.isReadable(legacy) ? Optional.of(Files.readAllBytes(legacy)) : Optional.empty();
        } catch (IOException e) {
            return Optional.empty();
        }
    }

    public void delete(String storedName) {
        feedbackFileRepository.deleteById(Paths.get(storedName).getFileName().toString());
    }

    public static String storedNameOf(String fileUrl) {
        return fileUrl.substring(fileUrl.lastIndexOf('/') + 1);
    }

    private String getExtension(String filename) {
        List<String> parts = List.of(filename.split("\\."));
        return parts.size() > 1 ? parts.get(parts.size() - 1) : "";
    }

    public record StoredFile(String storedName, String originalName, String url) {}
}
