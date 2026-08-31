# 📝 프롬프트 및 데이터베이스 명세서 (Prompts & DB Specs)

이 문서는 프로젝트에서 사용되는 **AI 프롬프트(Prompts)**와 **데이터베이스(DB) 스키마/설정**을 정리하고 관리하기 위한 공간입니다. 아래의 템플릿을 필요에 맞게 수정하여 사용해 주세요.

---

## 1. 🤖 AI 프롬프트 (Prompts)

이곳에 AI 모델(예: ChatGPT, Gemini 등)에게 전달할 시스템 프롬프트(System Prompt), 템플릿, 그리고 활용 목적을 기록하세요.

### 1.1. [기능명] 프롬프트 템플릿
- **목적**: (예: 멘토와 멘티의 성향을 분석하여 매칭 추천)
- **사용 모델**: (예: GPT-4o, Gemini 1.5 Pro)
- **System Prompt**: 
  ```text
  당신은 전문적인 멘토링 매칭 매니저입니다. 
  주어진 멘토의 정보와 멘티의 요구사항을 분석하여...
  ```
- **User Prompt 템플릿**:
  ```text
  [멘토 정보]: {{mentor_data}}
  [멘티 요구사항]: {{mentee_data}}
  위 정보를 바탕으로 두 사람의 매칭 적합도를 100점 만점으로 평가하고 이유를 설명해주세요.
  ```

---

## 2. 🗄️ 데이터베이스 스키마 (Database Schema)

### 목차
- [1. 데이터베이스 연결 및 설정](#1-데이터베이스-연결-및-설정)
- [2. Users (사용자)](#2-users-사용자)
- [3. User_Profile (멘티 프로필)](#3-user_profile-멘티-프로필)
- [4. Mentor_Profile (멘토 프로필)](#4-mentor_profile-멘토-프로필)
- [5. Interest (관심분야)](#5-interest-관심분야)
- [6. Refresh_Token (리프레시 토큰)](#6-refresh_token-리프레시-토큰)
- [7. Mentor_Request (멘토 신청)](#7-mentor_request-멘토-신청)
- [8. Mentor_Matching (멘토 매칭)](#8-mentor_matching-멘토-매칭)
- [9. AI_Recommendation (AI 추천 결과)](#9-ai_recommendation-ai-추천-결과)
- [10. Post (게시글)](#10-post-게시글)
- [11. Post_Tag (게시글 태그)](#11-post_tag-게시글-태그)
- [12. Comment (댓글)](#12-comment-댓글)
- [13. Post_Report (게시글 신고)](#13-post_report-게시글-신고)
- [14. Message (쪽지)](#14-message-쪽지)
- [15. Study_Group (스터디 그룹)](#15-study_group-스터디-그룹)
- [16. Study_Member (스터디 멤버)](#16-study_member-스터디-멤버)
- [17. Bookmark (북마크)](#17-bookmark-북마크)
- [18. Contest (공모전)](#18-contest-공모전)
- [19. Job_Cache (채용공고 캐시)](#19-job_cache-채용공고-캐시)
- [20. Feedback_Post (피드백 게시글)](#20-feedback_post-피드백-게시글)
- [21. Mentor_Feedback (멘토 피드백)](#21-mentor_feedback-멘토-피드백)
- [22. Notice (공지사항)](#22-notice-공지사항)
- [23. 테이블 관계 요약](#23-테이블-관계-요약)

### 1. 데이터베이스 연결 및 설정
- **DB 종류**: MySQL
- **스키마명**: mentoring_db
- **환경 변수**:
  - `DB_HOST`: localhost
  - `DB_PORT`: 3306
  - `DB_NAME`: mentoring_db
  - `DB_USER`: user
  - `DB_PASSWORD`: password

**DB 생성 명령어**
```sql
CREATE DATABASE IF NOT EXISTS mentoring_db
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE mentoring_db;
```
> **실행 순서**: `schema_01_users.sql` → `schema_02_rest.sql` 순서로 실행해야 FK 오류가 발생하지 않습니다.

-- ============================================================
-- MentorBridge Database Schema
-- 대상 테이블: Users, User_Profile, Mentor_Profile
-- ============================================================

CREATE DATABASE IF NOT EXISTS mentoring_db
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE mentoring_db;

-- ============================================================
-- 2. Users (사용자)
-- 사용자의 기본 계정 정보와 역할을 저장합니다.
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    user_id            INT              NOT NULL AUTO_INCREMENT,
    email              VARCHAR(255)     NOT NULL,
    password_hash      VARCHAR(255)     NOT NULL                   COMMENT '해시된 비밀번호',
    user_name          VARCHAR(50)      NOT NULL                   COMMENT '사용자 이름 또는 닉네임',
    user_role          ENUM(
                           'MENTEE',
                           'MENTOR',
                           'ADMIN'
                       )                NOT NULL DEFAULT 'MENTEE'  COMMENT '사용자 역할',
    is_suspended       BOOLEAN          NOT NULL DEFAULT FALSE      COMMENT '계정 정지 여부',
    is_mentor_verified BOOLEAN          NOT NULL DEFAULT FALSE      COMMENT '멘토 인증 여부',
    join_date          TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '가입 일시',
    updated_at         TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                        ON UPDATE CURRENT_TIMESTAMP COMMENT '마지막 수정 일시',

    PRIMARY KEY (user_id),
    UNIQUE KEY uq_users_email (email)
)
ENGINE = InnoDB
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_unicode_ci
COMMENT = '사용자 기본 계정 테이블';


-- ============================================================
-- 3. User_Profile (멘티 프로필)
-- 멘티(일반 사용자)의 상세 프로필 정보를 저장합니다.
-- ============================================================
CREATE TABLE IF NOT EXISTS user_profile (
    profile_id        INT              NOT NULL AUTO_INCREMENT,
    user_id           INT              NOT NULL                    COMMENT '사용자 참조 (FK)',
    status            ENUM(
                          '학생',
                          '취준생',
                          '재직자'
                      )                NOT NULL                    COMMENT '현재 상태',
    major             VARCHAR(100)     NULL                        COMMENT '전공',
    skills            TEXT             NULL                        COMMENT '보유 기술 (쉼표 구분)',
    goal              TEXT             NULL                        COMMENT '목표 상세 내용',
    goal_type         ENUM(
                          '취업',
                          '대학원',
                          '자격증'
                      )                NULL                        COMMENT '목표 유형',
    profile_image_url VARCHAR(500)     NULL                        COMMENT '프로필 이미지 URL',
    created_at        TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일시',
    updated_at        TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                       ON UPDATE CURRENT_TIMESTAMP COMMENT '수정 일시',

    PRIMARY KEY (profile_id),
    UNIQUE KEY uq_user_profile_user_id (user_id),   -- 1:1 관계 보장
    CONSTRAINT fk_user_profile_user
        FOREIGN KEY (user_id)
        REFERENCES users (user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
)
ENGINE = InnoDB
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_unicode_ci
COMMENT = '멘티 상세 프로필 테이블';


-- ============================================================
-- 4. Mentor_Profile (멘토 프로필)
-- 멘토 역할 사용자의 상세 프로필 정보를 저장합니다.
-- ============================================================
CREATE TABLE IF NOT EXISTS mentor_profile (
    mentor_id         INT              NOT NULL AUTO_INCREMENT,
    user_id           INT              NOT NULL                    COMMENT '사용자 참조 (FK)',
    mentor_intro      TEXT             NULL                        COMMENT '자기소개',
    mentor_career     TEXT             NULL                        COMMENT '경력 사항',
    -- 🚨 [추가됨] 멘토의 전문 분야를 저장하는 컬럼 (React, UI/UX 등 쉼표로 구분) 🚨
    specs             VARCHAR(500)     NULL                        COMMENT '전문 분야',
    profile_image_url VARCHAR(500)     NULL                        COMMENT '프로필 이미지 URL',
    rating            FLOAT            NOT NULL DEFAULT 0.0        COMMENT '평균 평점 (0.0 ~ 5.0)',
    review_count      INT              NOT NULL DEFAULT 0          COMMENT '리뷰 수',
    created_at        TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일시',
    updated_at        TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                       ON UPDATE CURRENT_TIMESTAMP COMMENT '수정 일시',

    PRIMARY KEY (mentor_id),
    UNIQUE KEY uq_mentor_profile_user_id (user_id),  -- 1:1 관계 보장
    CONSTRAINT fk_mentor_profile_user
        FOREIGN KEY (user_id)
        REFERENCES users (user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
)
ENGINE = InnoDB
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_unicode_ci
COMMENT = '멘토 상세 프로필 테이블';

-- ============================================================
-- MentorBridge Database Schema
-- 대상 테이블: 5번 ~ 22번
-- 실행 전 schema_01_users.sql 을 먼저 실행해야 합니다.
-- ============================================================

USE mentoring_db;

-- ============================================================
-- 5. Interest (관심분야)
-- 사용자의 관심 분야 태그를 저장합니다.
-- ============================================================
CREATE TABLE IF NOT EXISTS interest (
    interest_id INT          NOT NULL AUTO_INCREMENT,
    user_id     INT          NOT NULL              COMMENT '사용자 참조 (FK)',
    tag         VARCHAR(100) NOT NULL              COMMENT '관심 분야 태그명',

    PRIMARY KEY (interest_id),
    CONSTRAINT fk_interest_user
        FOREIGN KEY (user_id)
        REFERENCES users (user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
)
ENGINE = InnoDB
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_unicode_ci
COMMENT = '사용자 관심분야 태그 테이블';


-- ============================================================
-- 6. Refresh_Token (리프레시 토큰)
-- JWT 리프레시 토큰을 관리합니다.
-- ============================================================
CREATE TABLE IF NOT EXISTS refresh_token (
    token_id    INT          NOT NULL AUTO_INCREMENT,
    user_id     INT          NOT NULL              COMMENT '사용자 참조 (FK)',
    token_value VARCHAR(500) NOT NULL              COMMENT '토큰 값',
    expires_at  TIMESTAMP    NOT NULL              COMMENT '만료 일시',
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일시',

    PRIMARY KEY (token_id),
    CONSTRAINT fk_refresh_token_user
        FOREIGN KEY (user_id)
        REFERENCES users (user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
)
ENGINE = InnoDB
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_unicode_ci
COMMENT = 'JWT 리프레시 토큰 테이블';


-- ============================================================
-- 7. Mentor_Request (멘토 신청)
-- 일반 사용자가 멘토 자격을 신청하는 정보를 저장합니다.
-- ============================================================
CREATE TABLE IF NOT EXISTS mentor_request (
    request_id    INT          NOT NULL AUTO_INCREMENT,
    user_id       INT          NOT NULL              COMMENT '신청자 참조 (FK)',
    admin_id      INT          NULL                  COMMENT '처리 관리자 참조 (FK)',
    self_intro    TEXT         NOT NULL              COMMENT '자기소개',
    career        TEXT         NOT NULL              COMMENT '경력',
    proof_url     VARCHAR(500) NULL                  COMMENT '증빙 자료 링크',
    status        ENUM(
                      '대기',
                      '승인',
                      '반려'
                  )             NOT NULL DEFAULT '대기' COMMENT '처리 상태',
    reject_reason TEXT         NULL                  COMMENT '반려 사유',
    requested_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '신청 일시',
    processed_at  TIMESTAMP    NULL                  COMMENT '처리 일시',

    PRIMARY KEY (request_id),
    CONSTRAINT fk_mentor_request_user
        FOREIGN KEY (user_id)
        REFERENCES users (user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_mentor_request_admin
        FOREIGN KEY (admin_id)
        REFERENCES users (user_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
)
ENGINE = InnoDB
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_unicode_ci
COMMENT = '멘토 신청 테이블';


-- ============================================================
-- 8. Mentor_Matching (멘토 매칭)
-- 멘토-멘티 간의 매칭 정보를 저장합니다.
-- ============================================================
CREATE TABLE IF NOT EXISTS mentor_matching (
    matching_id INT       NOT NULL AUTO_INCREMENT,
    mentor_id   INT       NOT NULL              COMMENT '멘토 프로필 참조 (FK)',
    mentee_id   INT       NOT NULL              COMMENT '멘티(사용자) 참조 (FK)',
    status      ENUM(
                    '요청',
                    '수락',
                    '거절',
                    '완료'
                )          NOT NULL DEFAULT '요청' COMMENT '매칭 상태',
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일시',

    PRIMARY KEY (matching_id),
    CONSTRAINT fk_mentor_matching_mentor
        FOREIGN KEY (mentor_id)
        REFERENCES mentor_profile (mentor_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_mentor_matching_mentee
        FOREIGN KEY (mentee_id)
        REFERENCES users (user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
)
ENGINE = InnoDB
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_unicode_ci
COMMENT = '멘토-멘티 매칭 테이블';


-- ============================================================
-- 9. AI_Recommendation (AI 추천 결과)
-- AI가 생성한 진로 추천 결과를 저장합니다.
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_recommendation (
    recommendation_id    INT       NOT NULL AUTO_INCREMENT,
    user_id              INT       NOT NULL  COMMENT '사용자 참조 (FK)',
    recommended_career   TEXT      NULL      COMMENT '추천 진로',
    recommended_study_path TEXT    NULL      COMMENT '추천 학습 방향',
    detailed_plan        TEXT      NULL      COMMENT '세부 계획',
    created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일시',

    PRIMARY KEY (recommendation_id),
    CONSTRAINT fk_ai_recommendation_user
        FOREIGN KEY (user_id)
        REFERENCES users (user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
)
ENGINE = InnoDB
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_unicode_ci
COMMENT = 'AI 진로 추천 결과 테이블';


-- ============================================================
-- 10. Post (게시글)
-- 커뮤니티 게시글을 저장합니다.
-- ============================================================
CREATE TABLE IF NOT EXISTS post (
    board_id   INT          NOT NULL AUTO_INCREMENT,
    user_id    INT          NOT NULL              COMMENT '작성자 참조 (FK)',
    board_type ENUM(
                   '스터디모집',
                   '멘토모집',
                   '멘티모집',
                   '프로젝트모집',
                   '자유'
               )             NOT NULL              COMMENT '게시판 유형',
    title      VARCHAR(200) NOT NULL              COMMENT '게시글 제목',
    content    TEXT         NOT NULL              COMMENT '게시글 내용',
    status     ENUM('RECRUITING','COMPLETED') NOT NULL DEFAULT 'RECRUITING' COMMENT '모집 상태',
    view_count INT          NOT NULL DEFAULT 0    COMMENT '조회 수',
    is_deleted BOOLEAN      NOT NULL DEFAULT FALSE COMMENT '삭제 여부 (소프트 딜리트)',
    deleted_by INT          NULL                  COMMENT '삭제 처리자 참조 (FK)',
    deleted_at TIMESTAMP    NULL                  COMMENT '삭제 일시',
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일시',
    updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                             ON UPDATE CURRENT_TIMESTAMP COMMENT '수정 일시',

    PRIMARY KEY (board_id),
    CONSTRAINT fk_post_user
        FOREIGN KEY (user_id)
        REFERENCES users (user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_post_deleted_by
        FOREIGN KEY (deleted_by)
        REFERENCES users (user_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
)
ENGINE = InnoDB
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_unicode_ci
COMMENT = '커뮤니티 게시글 테이블';


-- ============================================================
-- 11. Post_Tag (게시글 태그)
-- 게시글에 연결된 태그를 저장합니다.
-- ============================================================
CREATE TABLE IF NOT EXISTS post_tag (
    tag_id   INT          NOT NULL AUTO_INCREMENT,
    board_id INT          NOT NULL  COMMENT '게시글 참조 (FK)',
    tag_name VARCHAR(100) NOT NULL  COMMENT '태그명',

    PRIMARY KEY (tag_id),
    CONSTRAINT fk_post_tag_post
        FOREIGN KEY (board_id)
        REFERENCES post (board_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
)
ENGINE = InnoDB
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_unicode_ci
COMMENT = '게시글 태그 테이블';


-- ============================================================
-- 🚨 [중요/핵심] 12. Comment (댓글) 🚨
-- 🚨 이 테이블 스키마는 커뮤니티 댓글 기능에 핵심적으로 사용됩니다. 🚨
-- 게시글에 달린 댓글을 저장합니다.
-- ============================================================
CREATE TABLE IF NOT EXISTS comment (
    comment_id INT       NOT NULL AUTO_INCREMENT,
    board_id   INT       NOT NULL               COMMENT '게시글 참조 (FK)',
    user_id    INT       NOT NULL               COMMENT '작성자 참조 (FK)',
    content    TEXT      NOT NULL               COMMENT '댓글 내용',
    is_deleted BOOLEAN   NOT NULL DEFAULT FALSE  COMMENT '삭제 여부 (소프트 딜리트)',
    deleted_by INT       NULL                   COMMENT '삭제 처리자 참조 (FK)',
    deleted_at TIMESTAMP NULL                   COMMENT '삭제 일시',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일시',

    PRIMARY KEY (comment_id),
    CONSTRAINT fk_comment_post
        FOREIGN KEY (board_id)
        REFERENCES post (board_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_comment_user
        FOREIGN KEY (user_id)
        REFERENCES users (user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_comment_deleted_by
        FOREIGN KEY (deleted_by)
        REFERENCES users (user_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
)
ENGINE = InnoDB
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_unicode_ci
COMMENT = '게시글 댓글 테이블';


-- ============================================================
-- 13. Post_Report (게시글 신고)
-- 게시글 신고 내역 및 처리 결과를 저장합니다.
-- ============================================================
CREATE TABLE IF NOT EXISTS post_report (
    report_id      INT       NOT NULL AUTO_INCREMENT,
    post_id        INT       NOT NULL               COMMENT '신고 게시글 참조 (FK)',
    reporter_id    INT       NOT NULL               COMMENT '신고자 참조 (FK)',
    admin_id       INT       NULL                   COMMENT '처리 관리자 참조 (FK)',
    reason         TEXT      NOT NULL               COMMENT '신고 사유',
    status         ENUM(
                       '접수',
                       '처리중',
                       '완료'
                   )          NOT NULL DEFAULT '접수' COMMENT '처리 상태',
    process_result TEXT      NULL                   COMMENT '처리 결과',
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '신고 일시',
    processed_at   TIMESTAMP NULL                   COMMENT '처리 일시',

    PRIMARY KEY (report_id),
    CONSTRAINT fk_post_report_post
        FOREIGN KEY (post_id)
        REFERENCES post (board_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_post_report_reporter
        FOREIGN KEY (reporter_id)
        REFERENCES users (user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_post_report_admin
        FOREIGN KEY (admin_id)
        REFERENCES users (user_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
)
ENGINE = InnoDB
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_unicode_ci
COMMENT = '게시글 신고 테이블';


-- ============================================================
-- 14. Message (쪽지)
-- 사용자 간 1:1 쪽지를 저장합니다.
-- ============================================================
CREATE TABLE IF NOT EXISTS message (
    message_id  INT       NOT NULL AUTO_INCREMENT,
    sender_id   INT       NOT NULL               COMMENT '발신자 참조 (FK)',
    receiver_id INT       NOT NULL               COMMENT '수신자 참조 (FK)',
    content     TEXT      NOT NULL               COMMENT '쪽지 내용',
    is_read     BOOLEAN   NOT NULL DEFAULT FALSE  COMMENT '읽음 여부',
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '발송 일시',

    PRIMARY KEY (message_id),
    CONSTRAINT fk_message_sender
        FOREIGN KEY (sender_id)
        REFERENCES users (user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_message_receiver
        FOREIGN KEY (receiver_id)
        REFERENCES users (user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
)
ENGINE = InnoDB
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_unicode_ci
COMMENT = '1:1 쪽지 테이블';


-- ============================================================
-- 15. Study_Group (스터디 그룹)
-- 스터디 게시글로부터 생성된 스터디 그룹 정보를 저장합니다.
-- ============================================================
CREATE TABLE IF NOT EXISTS study_group (
    group_id    INT          NOT NULL AUTO_INCREMENT,
    board_id    INT          NOT NULL               COMMENT '스터디 모집 게시글 참조 (FK)',
    leader_id   INT          NOT NULL               COMMENT '리더(개설자) 참조 (FK)',
    group_name  VARCHAR(100) NOT NULL               COMMENT '그룹명',
    max_members INT          NOT NULL               COMMENT '최대 인원',
    status      ENUM(
                    '모집중',
                    '진행중',
                    '완료'
                )             NOT NULL DEFAULT '모집중' COMMENT '그룹 상태',
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일시',

    PRIMARY KEY (group_id),
    UNIQUE KEY uq_study_group_board (board_id),  -- 게시글 1:1 관계 보장
    CONSTRAINT fk_study_group_post
        FOREIGN KEY (board_id)
        REFERENCES post (board_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_study_group_leader
        FOREIGN KEY (leader_id)
        REFERENCES users (user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
)
ENGINE = InnoDB
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_unicode_ci
COMMENT = '스터디 그룹 테이블';


-- ============================================================
-- 16. Study_Member (스터디 멤버)
-- 스터디 그룹의 참여 멤버를 저장합니다.
-- ============================================================
CREATE TABLE IF NOT EXISTS study_member (
    member_id INT       NOT NULL AUTO_INCREMENT,
    group_id  INT       NOT NULL  COMMENT '스터디 그룹 참조 (FK)',
    user_id   INT       NOT NULL  COMMENT '사용자 참조 (FK)',
    joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '참여 일시',

    PRIMARY KEY (member_id),
    UNIQUE KEY uq_study_member (group_id, user_id),  -- 중복 참여 방지
    CONSTRAINT fk_study_member_group
        FOREIGN KEY (group_id)
        REFERENCES study_group (group_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_study_member_user
        FOREIGN KEY (user_id)
        REFERENCES users (user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
)
ENGINE = InnoDB
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_unicode_ci
COMMENT = '스터디 그룹 멤버 테이블';


-- ============================================================
-- 17. Bookmark (북마크)
-- 사용자가 저장한 외부 채용공고 북마크를 저장합니다.
-- ============================================================
CREATE TABLE IF NOT EXISTS bookmark (
    bookmark_id     INT          NOT NULL AUTO_INCREMENT,
    user_id         INT          NOT NULL  COMMENT '사용자 참조 (FK)',
    external_job_id VARCHAR(100) NOT NULL  COMMENT '외부 공고 ID',
    job_title       VARCHAR(200) NOT NULL  COMMENT '공고 제목',
    original_url    VARCHAR(500) NOT NULL  COMMENT '원본 링크',
    source          VARCHAR(50)  NOT NULL  COMMENT '출처 (사람인, 워크넷)',
    saved_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '저장 일시',

    PRIMARY KEY (bookmark_id),
    UNIQUE KEY uq_bookmark (user_id, external_job_id),  -- 동일 공고 중복 저장 방지
    CONSTRAINT fk_bookmark_user
        FOREIGN KEY (user_id)
        REFERENCES users (user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
)
ENGINE = InnoDB
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_unicode_ci
COMMENT = '채용공고 북마크 테이블';


-- ============================================================
-- 18. Contest (공모전)
-- 공모전 정보를 저장합니다.
-- ============================================================
CREATE TABLE IF NOT EXISTS contest (
    contest_id INT          NOT NULL AUTO_INCREMENT,
    created_by INT          NOT NULL  COMMENT '등록자(관리자) 참조 (FK)',
    title      VARCHAR(200) NOT NULL  COMMENT '공모전 제목',
    organizer  VARCHAR(100) NOT NULL  COMMENT '주최 기관',
    field      VARCHAR(100) NULL      COMMENT '분야',
    start_date DATE         NULL      COMMENT '시작일',
    end_date   DATE         NULL      COMMENT '종료일',
    link       VARCHAR(500) NULL      COMMENT '공모전 링크',
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '등록 일시',
    updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                             ON UPDATE CURRENT_TIMESTAMP COMMENT '수정 일시',

    PRIMARY KEY (contest_id),
    CONSTRAINT fk_contest_created_by
        FOREIGN KEY (created_by)
        REFERENCES users (user_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
)
ENGINE = InnoDB
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_unicode_ci
COMMENT = '공모전 정보 테이블';


-- ============================================================
-- 19. Job_Cache (채용공고 캐시)
-- 외부 API에서 수집한 채용공고 데이터를 캐싱합니다.
-- ============================================================
CREATE TABLE IF NOT EXISTS job_cache (
    cache_id        INT          NOT NULL AUTO_INCREMENT,
    external_job_id VARCHAR(100) NOT NULL  COMMENT '외부 공고 ID',
    source          VARCHAR(50)  NOT NULL  COMMENT '출처 (사람인, 워크넷)',
    title           VARCHAR(200) NOT NULL  COMMENT '공고 제목',
    company         VARCHAR(100) NOT NULL  COMMENT '회사명',
    location        VARCHAR(100) NULL      COMMENT '지역',
    employment_type VARCHAR(50)  NULL      COMMENT '고용 형태',
    job_position    VARCHAR(100) NULL      COMMENT '직무',
    deadline        DATE         NULL      COMMENT '마감일',
    original_url    VARCHAR(500) NOT NULL  COMMENT '원본 링크',
    fetched_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '수집 일시',
    expires_at      TIMESTAMP    NOT NULL  COMMENT '캐시 만료 일시',

    PRIMARY KEY (cache_id),
    UNIQUE KEY uq_job_cache (external_job_id, source),  -- 출처별 공고 중복 방지
    INDEX idx_job_cache_expires (expires_at)             -- 만료 조회 성능 향상
)
ENGINE = InnoDB
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_unicode_ci
COMMENT = '외부 채용공고 캐시 테이블';


-- ============================================================
-- 20. Feedback_Post (피드백 게시글)
-- 멘티가 자료를 업로드하고 AI/멘토 피드백을 받는 게시글입니다.
-- ============================================================
CREATE TABLE IF NOT EXISTS feedback_post (
    feedback_id INT          NOT NULL AUTO_INCREMENT,
    author_id   INT          NOT NULL  COMMENT '작성자(멘티) 참조 (FK)',
    title       VARCHAR(200) NOT NULL  COMMENT '제목',
    content     TEXT         NULL      COMMENT '본문 내용',
    file_url    VARCHAR(500) NULL      COMMENT '첨부 파일 링크',
    ai_feedback TEXT         NULL      COMMENT 'AI 자동 피드백 내용',
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일시',

    PRIMARY KEY (feedback_id),
    CONSTRAINT fk_feedback_post_author
        FOREIGN KEY (author_id)
        REFERENCES users (user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
)
ENGINE = InnoDB
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_unicode_ci
COMMENT = '피드백 게시글 테이블 (이력서/포트폴리오 등)';


-- ============================================================
-- 21. Mentor_Feedback (멘토 피드백)
-- 멘토가 피드백 게시글에 남기는 전문 피드백입니다.
-- ============================================================
CREATE TABLE IF NOT EXISTS mentor_feedback (
    mf_id       INT       NOT NULL AUTO_INCREMENT,
    feedback_id INT       NOT NULL  COMMENT '피드백 게시글 참조 (FK)',
    mentor_id   INT       NOT NULL  COMMENT '멘토 프로필 참조 (FK)',
    content     TEXT      NOT NULL  COMMENT '멘토 피드백 내용',
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '작성 일시',

    PRIMARY KEY (mf_id),
    CONSTRAINT fk_mentor_feedback_post
        FOREIGN KEY (feedback_id)
        REFERENCES feedback_post (feedback_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_mentor_feedback_mentor
        FOREIGN KEY (mentor_id)
        REFERENCES mentor_profile (mentor_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
)
ENGINE = InnoDB
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_unicode_ci
COMMENT = '멘토 피드백 테이블';


-- ============================================================
-- 22. Notice (공지사항)
-- 관리자가 작성하는 공지사항을 저장합니다.
-- ============================================================
CREATE TABLE IF NOT EXISTS notice (
    notice_id  INT          NOT NULL AUTO_INCREMENT,
    author_id  INT          NOT NULL               COMMENT '작성자(관리자) 참조 (FK)',
    title      VARCHAR(200) NOT NULL               COMMENT '공지 제목',
    content    TEXT         NOT NULL               COMMENT '공지 내용',
    is_pinned  BOOLEAN      NOT NULL DEFAULT FALSE  COMMENT '상단 고정 여부',
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일시',
    updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                             ON UPDATE CURRENT_TIMESTAMP COMMENT '수정 일시',

    PRIMARY KEY (notice_id),
    CONSTRAINT fk_notice_author
        FOREIGN KEY (author_id)
        REFERENCES users (user_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
)
ENGINE = InnoDB
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_unicode_ci
COMMENT = '공지사항 테이블';

-- ============================================================
-- 23. 시스템 관리자 권한 부여 방법
-- 개발 및 테스트 단계에서 본인의 계정을 관리자(ADMIN)로 변경하는 쿼리입니다.
-- ============================================================
-- 아래 SQL 문을 복사하여 MySQL DB 클라이언트에서 실행하세요.
-- "가입하신이메일@도메인.com" 부분을 실제 이메일로 변경해야 합니다.
-- 
-- UPDATE users SET user_role = 'ADMIN' WHERE email = '가입하신이메일@도메인.com';
-- ============================================================

-- ============================================================
-- 24. Notification (실시간 알림)
-- 사용자에게 전달되는 실시간 알림 이력을 저장합니다. (SSE 활용)
-- ============================================================
CREATE TABLE IF NOT EXISTS notification (
    notification_id    INT              NOT NULL AUTO_INCREMENT,
    user_id            INT              NOT NULL                    COMMENT '알림 수신자 참조 (FK)',
    type               ENUM('COMMENT', 'MENTORING', 'SCRAP', 'APPLICATION_STATUS', 'MESSAGE') NOT NULL COMMENT '알림 종류',
    title              VARCHAR(255)     NOT NULL                    COMMENT '알림 내용/제목',
    link               VARCHAR(500)     NULL                        COMMENT '클릭 시 이동할 링크 URL',
    is_read            BOOLEAN          NOT NULL DEFAULT FALSE      COMMENT '읽음 여부',
    created_at         TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '알림 생성 일시',

    PRIMARY KEY (notification_id),
    CONSTRAINT fk_notification_user
        FOREIGN KEY (user_id)
        REFERENCES users (user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
)
ENGINE = InnoDB
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_unicode_ci
COMMENT = '실시간 알림(SSE) 기록 테이블';