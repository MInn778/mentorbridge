-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: localhost    Database: mentoring_db
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `ai_recommendation`
--

DROP TABLE IF EXISTS `ai_recommendation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ai_recommendation` (
  `recommendation_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '사용자 참조 (FK)',
  `recommended_career` text COLLATE utf8mb4_unicode_ci COMMENT '추천 진로',
  `recommended_study_path` text COLLATE utf8mb4_unicode_ci COMMENT '추천 학습 방향',
  `detailed_plan` text COLLATE utf8mb4_unicode_ci COMMENT '세부 계획',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일시',
  PRIMARY KEY (`recommendation_id`),
  KEY `fk_ai_recommendation_user` (`user_id`),
  CONSTRAINT `fk_ai_recommendation_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI 진로 추천 결과 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `bookmark`
--

DROP TABLE IF EXISTS `bookmark`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bookmark` (
  `bookmark_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '사용자 참조 (FK)',
  `external_job_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '외부 공고 ID',
  `job_title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '공고 제목',
  `original_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '원본 링크',
  `source` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '출처 (사람인, 워크넷)',
  `saved_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '저장 일시',
  PRIMARY KEY (`bookmark_id`),
  UNIQUE KEY `uq_bookmark` (`user_id`,`external_job_id`),
  CONSTRAINT `fk_bookmark_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='채용공고 북마크 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `comment`
--

DROP TABLE IF EXISTS `comment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `comment` (
  `board_id` int NOT NULL,
  `comment_id` int NOT NULL AUTO_INCREMENT,
  `deleted_by` int DEFAULT NULL,
  `is_deleted` bit(1) NOT NULL,
  `user_id` int NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `deleted_at` datetime(6) DEFAULT NULL,
  `content` text NOT NULL,
  PRIMARY KEY (`comment_id`),
  KEY `FKqm52p1v3o13hy268he0wcngr5` (`user_id`),
  KEY `FKooifkgj84icp47evlo9ul9u7k` (`deleted_by`),
  KEY `FK5q9y1d4e0cri34y3fmdgnh70c` (`board_id`),
  CONSTRAINT `FK5q9y1d4e0cri34y3fmdgnh70c` FOREIGN KEY (`board_id`) REFERENCES `post` (`board_id`),
  CONSTRAINT `FKooifkgj84icp47evlo9ul9u7k` FOREIGN KEY (`deleted_by`) REFERENCES `users` (`user_id`),
  CONSTRAINT `FKqm52p1v3o13hy268he0wcngr5` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `contest`
--

DROP TABLE IF EXISTS `contest`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contest` (
  `contest_id` int NOT NULL AUTO_INCREMENT,
  `created_by` int NOT NULL COMMENT '등록자(관리자) 참조 (FK)',
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '공모전 제목',
  `organizer` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '주최 기관',
  `field` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '분야',
  `start_date` date DEFAULT NULL COMMENT '시작일',
  `end_date` date DEFAULT NULL COMMENT '종료일',
  `link` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '공모전 링크',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '등록 일시',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정 일시',
  PRIMARY KEY (`contest_id`),
  KEY `fk_contest_created_by` (`created_by`),
  CONSTRAINT `fk_contest_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='공모전 정보 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `feedback_post`
--

DROP TABLE IF EXISTS `feedback_post`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `feedback_post` (
  `feedback_id` int NOT NULL AUTO_INCREMENT,
  `author_id` int NOT NULL COMMENT '작성자(멘티) 참조 (FK)',
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '제목',
  `content` text COLLATE utf8mb4_unicode_ci COMMENT '본문 내용',
  `file_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '첨부 파일 링크',
  `ai_feedback` text COLLATE utf8mb4_unicode_ci COMMENT 'AI 자동 피드백 내용',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일시',
  PRIMARY KEY (`feedback_id`),
  KEY `fk_feedback_post_author` (`author_id`),
  CONSTRAINT `fk_feedback_post_author` FOREIGN KEY (`author_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='피드백 게시글 테이블 (이력서/포트폴리오 등)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `interest`
--

DROP TABLE IF EXISTS `interest`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `interest` (
  `interest_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '사용자 참조 (FK)',
  `tag` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '관심 분야 태그명',
  PRIMARY KEY (`interest_id`),
  KEY `fk_interest_user` (`user_id`),
  CONSTRAINT `fk_interest_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='사용자 관심분야 태그 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `job_cache`
--

DROP TABLE IF EXISTS `job_cache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `job_cache` (
  `cache_id` int NOT NULL AUTO_INCREMENT,
  `external_job_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '외부 공고 ID',
  `source` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '출처 (사람인, 워크넷)',
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '공고 제목',
  `company` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '회사명',
  `location` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '지역',
  `employment_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '고용 형태',
  `job_position` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '직무',
  `deadline` date DEFAULT NULL COMMENT '마감일',
  `original_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '원본 링크',
  `fetched_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '수집 일시',
  `expires_at` timestamp NOT NULL COMMENT '캐시 만료 일시',
  PRIMARY KEY (`cache_id`),
  UNIQUE KEY `uq_job_cache` (`external_job_id`,`source`),
  KEY `idx_job_cache_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='외부 채용공고 캐시 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mentor_feedback`
--

DROP TABLE IF EXISTS `mentor_feedback`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mentor_feedback` (
  `mf_id` int NOT NULL AUTO_INCREMENT,
  `feedback_id` int NOT NULL COMMENT '피드백 게시글 참조 (FK)',
  `mentor_id` int NOT NULL COMMENT '멘토 프로필 참조 (FK)',
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '멘토 피드백 내용',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '작성 일시',
  PRIMARY KEY (`mf_id`),
  KEY `fk_mentor_feedback_post` (`feedback_id`),
  KEY `fk_mentor_feedback_mentor` (`mentor_id`),
  CONSTRAINT `fk_mentor_feedback_mentor` FOREIGN KEY (`mentor_id`) REFERENCES `mentor_profile` (`mentor_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_mentor_feedback_post` FOREIGN KEY (`feedback_id`) REFERENCES `feedback_post` (`feedback_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='멘토 피드백 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mentor_matching`
--

DROP TABLE IF EXISTS `mentor_matching`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mentor_matching` (
  `matching_id` int NOT NULL AUTO_INCREMENT,
  `mentor_id` int NOT NULL COMMENT '멘토 프로필 참조 (FK)',
  `mentee_id` int NOT NULL COMMENT '멘티(사용자) 참조 (FK)',
  `status` enum('요청','수락','거절','완료') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '요청' COMMENT '매칭 상태',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일시',
  PRIMARY KEY (`matching_id`),
  KEY `fk_mentor_matching_mentor` (`mentor_id`),
  KEY `fk_mentor_matching_mentee` (`mentee_id`),
  CONSTRAINT `fk_mentor_matching_mentee` FOREIGN KEY (`mentee_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_mentor_matching_mentor` FOREIGN KEY (`mentor_id`) REFERENCES `mentor_profile` (`mentor_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='멘토-멘티 매칭 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mentor_profile`
--

DROP TABLE IF EXISTS `mentor_profile`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mentor_profile` (
  `mentor_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '사용자 참조 (FK)',
  `mentor_intro` text COLLATE utf8mb4_unicode_ci COMMENT '자기소개',
  `mentor_career` text COLLATE utf8mb4_unicode_ci COMMENT '경력 사항',
  `profile_image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '프로필 이미지 URL',
  `rating` float NOT NULL DEFAULT '0' COMMENT '평균 평점 (0.0 ~ 5.0)',
  `review_count` int NOT NULL DEFAULT '0' COMMENT '리뷰 수',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일시',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정 일시',
  PRIMARY KEY (`mentor_id`),
  UNIQUE KEY `uq_mentor_profile_user_id` (`user_id`),
  CONSTRAINT `fk_mentor_profile_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='멘토 상세 프로필 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mentor_request`
--

DROP TABLE IF EXISTS `mentor_request`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mentor_request` (
  `request_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '신청자 참조 (FK)',
  `admin_id` int DEFAULT NULL COMMENT '처리 관리자 참조 (FK)',
  `self_intro` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '자기소개',
  `career` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '경력',
  `proof_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '증빙 자료 링크',
  `status` enum('대기','승인','반려') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '대기' COMMENT '처리 상태',
  `reject_reason` text COLLATE utf8mb4_unicode_ci COMMENT '반려 사유',
  `requested_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '신청 일시',
  `processed_at` timestamp NULL DEFAULT NULL COMMENT '처리 일시',
  PRIMARY KEY (`request_id`),
  KEY `fk_mentor_request_user` (`user_id`),
  KEY `fk_mentor_request_admin` (`admin_id`),
  CONSTRAINT `fk_mentor_request_admin` FOREIGN KEY (`admin_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_mentor_request_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='멘토 신청 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `message`
--

DROP TABLE IF EXISTS `message`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `message` (
  `message_id` int NOT NULL AUTO_INCREMENT,
  `sender_id` int NOT NULL COMMENT '발신자 참조 (FK)',
  `receiver_id` int NOT NULL COMMENT '수신자 참조 (FK)',
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '쪽지 내용',
  `is_read` tinyint(1) NOT NULL DEFAULT '0' COMMENT '읽음 여부',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '발송 일시',
  `message_type` enum('APPLICATION','NORMAL','SYSTEM') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `related_group_id` int DEFAULT NULL,
  `status` enum('ACCEPTED','PENDING','REJECTED') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`message_id`),
  KEY `fk_message_sender` (`sender_id`),
  KEY `fk_message_receiver` (`receiver_id`),
  CONSTRAINT `fk_message_receiver` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_message_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='1:1 쪽지 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `notice`
--

DROP TABLE IF EXISTS `notice`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notice` (
  `notice_id` int NOT NULL AUTO_INCREMENT,
  `author_id` int NOT NULL COMMENT '작성자(관리자) 참조 (FK)',
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '공지 제목',
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '공지 내용',
  `is_pinned` tinyint(1) NOT NULL DEFAULT '0' COMMENT '상단 고정 여부',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일시',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정 일시',
  PRIMARY KEY (`notice_id`),
  KEY `fk_notice_author` (`author_id`),
  CONSTRAINT `fk_notice_author` FOREIGN KEY (`author_id`) REFERENCES `users` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='공지사항 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `post`
--

DROP TABLE IF EXISTS `post`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `post` (
  `board_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '작성자 참조 (FK)',
  `board_type` enum('스터디모집','멘토모집','멘티모집','프로젝트모집','자유') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '게시판 유형',
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '게시글 제목',
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '게시글 내용',
  `status` enum('RECRUITING','COMPLETED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'RECRUITING' COMMENT '모집 상태',
  `view_count` int NOT NULL DEFAULT '0' COMMENT '조회 수',
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0' COMMENT '삭제 여부 (소프트 딜리트)',
  `deleted_by` int DEFAULT NULL COMMENT '삭제 처리자 참조 (FK)',
  `deleted_at` timestamp NULL DEFAULT NULL COMMENT '삭제 일시',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일시',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정 일시',
  PRIMARY KEY (`board_id`),
  KEY `FK7ky67sgi7k0ayf22652f7763r` (`user_id`),
  KEY `FK7rinck3gix18i3eybc3xthcqo` (`deleted_by`),
  CONSTRAINT `FK7ky67sgi7k0ayf22652f7763r` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `FK7rinck3gix18i3eybc3xthcqo` FOREIGN KEY (`deleted_by`) REFERENCES `users` (`user_id`),
  CONSTRAINT `fk_post_deleted_by` FOREIGN KEY (`deleted_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_post_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='커뮤니티 게시글 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `post_report`
--

DROP TABLE IF EXISTS `post_report`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `post_report` (
  `report_id` int NOT NULL AUTO_INCREMENT,
  `post_id` int NOT NULL COMMENT '신고 게시글 참조 (FK)',
  `reporter_id` int NOT NULL COMMENT '신고자 참조 (FK)',
  `admin_id` int DEFAULT NULL COMMENT '처리 관리자 참조 (FK)',
  `reason` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '신고 사유',
  `status` enum('접수','처리중','완료') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '접수' COMMENT '처리 상태',
  `process_result` text COLLATE utf8mb4_unicode_ci COMMENT '처리 결과',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '신고 일시',
  `processed_at` timestamp NULL DEFAULT NULL COMMENT '처리 일시',
  PRIMARY KEY (`report_id`),
  KEY `fk_post_report_post` (`post_id`),
  KEY `fk_post_report_reporter` (`reporter_id`),
  KEY `fk_post_report_admin` (`admin_id`),
  CONSTRAINT `fk_post_report_admin` FOREIGN KEY (`admin_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_post_report_post` FOREIGN KEY (`post_id`) REFERENCES `post` (`board_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_post_report_reporter` FOREIGN KEY (`reporter_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='게시글 신고 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `post_tag`
--

DROP TABLE IF EXISTS `post_tag`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `post_tag` (
  `board_id` int NOT NULL,
  `tag_id` int NOT NULL AUTO_INCREMENT,
  `tag_name` varchar(100) NOT NULL,
  PRIMARY KEY (`tag_id`),
  KEY `FKj54awgri24boigcg7didoasly` (`board_id`),
  CONSTRAINT `FKj54awgri24boigcg7didoasly` FOREIGN KEY (`board_id`) REFERENCES `post` (`board_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `refresh_token`
--

DROP TABLE IF EXISTS `refresh_token`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `refresh_token` (
  `token_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '사용자 참조 (FK)',
  `token_value` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '토큰 값',
  `expires_at` timestamp NOT NULL COMMENT '만료 일시',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일시',
  PRIMARY KEY (`token_id`),
  KEY `fk_refresh_token_user` (`user_id`),
  CONSTRAINT `fk_refresh_token_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='JWT 리프레시 토큰 테이블';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `study_group`
--

DROP TABLE IF EXISTS `study_group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `study_group` (
  `board_id` int NOT NULL,
  `group_id` int NOT NULL AUTO_INCREMENT,
  `leader_id` int NOT NULL,
  `max_members` int NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `group_name` varchar(100) NOT NULL,
  `status` enum('모집중','완료','진행중') NOT NULL,
  PRIMARY KEY (`group_id`),
  UNIQUE KEY `UK3ooicil6i8nhydn1m84sc70bd` (`board_id`),
  KEY `FKbda9w318m3bsrll8ndcypvkl` (`leader_id`),
  CONSTRAINT `FKbda9w318m3bsrll8ndcypvkl` FOREIGN KEY (`leader_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `FKhm9edggj3gp1omoddudufcl34` FOREIGN KEY (`board_id`) REFERENCES `post` (`board_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `study_member`
--

DROP TABLE IF EXISTS `study_member`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `study_member` (
  `group_id` int NOT NULL,
  `member_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `joined_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`member_id`),
  UNIQUE KEY `UKhdiu4hxc0ei2gp251jvg2m7s1` (`group_id`,`user_id`),
  KEY `FKa3rdclacg05je5c2fviwed6i8` (`user_id`),
  CONSTRAINT `FK6axm5tv9n7jwasmu67t1tpe91` FOREIGN KEY (`group_id`) REFERENCES `study_group` (`group_id`),
  CONSTRAINT `FKa3rdclacg05je5c2fviwed6i8` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_profile`
--

DROP TABLE IF EXISTS `user_profile`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_profile` (
  `profile_id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `goal` text,
  `goal_type` enum('대학원','자격증','취업') DEFAULT NULL,
  `major` varchar(100) DEFAULT NULL,
  `profile_image_url` varchar(500) DEFAULT NULL,
  `skills` text,
  `status` enum('재직자','취준생','학생') NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `user_id` int NOT NULL,
  PRIMARY KEY (`profile_id`),
  UNIQUE KEY `UKebc21hy5j7scdvcjt0jy6xxrv` (`user_id`),
  CONSTRAINT `FKuganfwvnbll4kn2a3jeyxtyi` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `is_mentor_verified` bit(1) NOT NULL,
  `is_suspended` bit(1) NOT NULL,
  `user_id` int NOT NULL AUTO_INCREMENT,
  `join_date` datetime(6) DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `user_name` varchar(255) NOT NULL,
  `user_role` enum('ADMIN','MENTEE','MENTOR') NOT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `UK6dotkott2kjsp8vw4d0m25fb7` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping routines for database 'mentoring_db'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-31 13:02:36
