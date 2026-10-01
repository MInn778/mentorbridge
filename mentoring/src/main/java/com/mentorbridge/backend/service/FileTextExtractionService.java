package com.mentorbridge.backend.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.hslf.usermodel.HSLFSlide;
import org.apache.poi.hslf.usermodel.HSLFSlideShow;
import org.apache.poi.hslf.usermodel.HSLFTextParagraph;
import org.apache.poi.hwpf.HWPFDocument;
import org.apache.poi.hwpf.extractor.WordExtractor;
import org.apache.poi.xslf.usermodel.XMLSlideShow;
import org.apache.poi.xslf.usermodel.XSLFShape;
import org.apache.poi.xslf.usermodel.XSLFSlide;
import org.apache.poi.xslf.usermodel.XSLFTextShape;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.List;

/**
 * 업로드된 첨부파일(pptx/ppt/docx/doc/pdf)에서 텍스트를 뽑아 AI 프롬프트에 넣기 위한 서비스.
 * hwp나 그 외 확장자는 지원하지 않고 null을 반환한다 — 호출부는 이 경우 제목/본문만으로
 * 프롬프트를 구성해서 게시글 작성 자체는 계속 진행한다.
 */
@Service
public class FileTextExtractionService {

    private static final Logger log = LoggerFactory.getLogger(FileTextExtractionService.class);
    private static final int MAX_CHARS = 8000;

    public String extractText(MultipartFile file) {
        String filename = file.getOriginalFilename();
        if (filename == null) return null;
        try {
            return extractText(file.getInputStream(), filename);
        } catch (Exception e) {
            log.warn("파일 텍스트 추출 실패 ({}): {}", filename, e.getMessage());
            return null;
        }
    }

    public String extractText(InputStream in, String filename) {
        if (filename == null) return null;
        String lower = filename.toLowerCase();

        try {
            String text;
            if (lower.endsWith(".pptx")) {
                text = extractFromPptx(in);
            } else if (lower.endsWith(".ppt")) {
                text = extractFromPpt(in);
            } else if (lower.endsWith(".docx")) {
                text = extractFromDocx(in);
            } else if (lower.endsWith(".doc")) {
                text = extractFromDoc(in);
            } else if (lower.endsWith(".pdf")) {
                text = extractFromPdf(in);
            } else {
                log.info("지원하지 않는 파일 형식이라 텍스트 추출을 건너뜁니다: {}", filename);
                return null;
            }
            if (text == null || text.isBlank()) return null;
            return text.length() > MAX_CHARS ? text.substring(0, MAX_CHARS) : text;
        } catch (Exception e) {
            log.warn("파일 텍스트 추출 실패 ({}): {}", filename, e.getMessage());
            return null;
        }
    }

    private String extractFromPptx(InputStream in) throws Exception {
        StringBuilder sb = new StringBuilder();
        try (XMLSlideShow ppt = new XMLSlideShow(in)) {
            int slideNo = 1;
            for (XSLFSlide slide : ppt.getSlides()) {
                sb.append("[슬라이드 ").append(slideNo++).append("]\n");
                for (XSLFShape shape : slide.getShapes()) {
                    if (shape instanceof XSLFTextShape textShape) {
                        String t = textShape.getText();
                        if (t != null && !t.isBlank()) {
                            sb.append(t).append("\n");
                        }
                    }
                }
            }
        }
        return sb.toString();
    }

    private String extractFromPpt(InputStream in) throws Exception {
        StringBuilder sb = new StringBuilder();
        try (HSLFSlideShow ppt = new HSLFSlideShow(in)) {
            int slideNo = 1;
            for (HSLFSlide slide : ppt.getSlides()) {
                sb.append("[슬라이드 ").append(slideNo++).append("]\n");
                for (List<HSLFTextParagraph> paragraphs : slide.getTextParagraphs()) {
                    String t = HSLFTextParagraph.getText(paragraphs);
                    if (t != null && !t.isBlank()) {
                        sb.append(t).append("\n");
                    }
                }
            }
        }
        return sb.toString();
    }

    private String extractFromDocx(InputStream in) throws Exception {
        try (XWPFDocument doc = new XWPFDocument(in);
             XWPFWordExtractor extractor = new XWPFWordExtractor(doc)) {
            return extractor.getText();
        }
    }

    private String extractFromDoc(InputStream in) throws Exception {
        try (HWPFDocument doc = new HWPFDocument(in);
             WordExtractor extractor = new WordExtractor(doc)) {
            return extractor.getText();
        }
    }

    private String extractFromPdf(InputStream in) throws Exception {
        try (PDDocument doc = Loader.loadPDF(in.readAllBytes())) {
            return new PDFTextStripper().getText(doc);
        }
    }
}
