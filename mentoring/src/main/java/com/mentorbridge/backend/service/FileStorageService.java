package com.mentorbridge.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("pdf", "doc", "docx", "ppt", "pptx", "hwp");

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    /**
     * feedback 하위에 UUID 파일명으로 저장하고, 프론트가 그대로 GET할 수 있는 상대 경로(/api/feedback/files/xxx)를 돌려준다.
     */
    public StoredFile storeFeedbackAttachment(MultipartFile file) throws IOException {
        String originalName = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "file");
        String extension = getExtension(originalName);
        if (!ALLOWED_EXTENSIONS.contains(extension.toLowerCase())) {
            throw new IllegalArgumentException("지원하지 않는 파일 형식입니다: ." + extension);
        }

        Path dir = Paths.get(uploadDir, "feedback");
        Files.createDirectories(dir);

        String storedName = UUID.randomUUID() + "." + extension;
        Path target = dir.resolve(storedName);
        file.transferTo(target);

        return new StoredFile(storedName, originalName, "/api/feedback/files/" + storedName);
    }

    public Path resolve(String storedName) {
        // storedName은 UUID.확장자 형태로만 생성되므로, 경로 조작 문자가 섞이지 않게 한 번 더 방어한다.
        String safeName = Paths.get(storedName).getFileName().toString();
        return Paths.get(uploadDir, "feedback").resolve(safeName);
    }

    private String getExtension(String filename) {
        List<String> parts = List.of(filename.split("\\."));
        return parts.size() > 1 ? parts.get(parts.size() - 1) : "";
    }

    public record StoredFile(String storedName, String originalName, String url) {}
}
