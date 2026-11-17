package com.mentorbridge.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * 피드백 첨부파일 원본. 서버 디스크(uploads/)에 두면 업로드한 서버에만 파일이 있어서
 * 같은 DB를 쓰는 다른 PC/Render에서는 열리지 않았다. 그래서 DB에 함께 저장한다.
 * 게시글 목록 조회 때 파일 바이트까지 읽지 않도록 FeedbackPost와 분리된 테이블로 둔다.
 * ponytail: 파일당 최대 20MB(multipart 제한). 용량이 문제 되면 S3 같은 오브젝트 스토리지로 옮긴다.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "feedback_file")
public class FeedbackFile {

    // FileStorageService가 만든 "UUID.확장자" (feedback_post.file_url의 마지막 경로)
    @Id
    @Column(name = "stored_name", length = 100)
    private String storedName;

    @JdbcTypeCode(SqlTypes.VARBINARY)
    @Column(name = "data", nullable = false, length = 25_000_000)
    private byte[] data;
}
