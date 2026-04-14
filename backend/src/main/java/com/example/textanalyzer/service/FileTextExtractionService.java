package com.example.textanalyzer.service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Set;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class FileTextExtractionService {

	private static final Set<String> SUPPORTED_EXTENSIONS = Set.of("txt", "pdf", "docx");

	public String extractText(MultipartFile file) {
		if (file == null || file.isEmpty()) {
			throw new IllegalArgumentException("Lutfen bir dosya secin.");
		}

		String extension = resolveExtension(file.getOriginalFilename());
		if (!SUPPORTED_EXTENSIONS.contains(extension)) {
			throw new IllegalArgumentException("Sadece .txt, .pdf ve .docx dosyalari desteklenir.");
		}

		try {
			return switch (extension) {
				case "txt" -> extractTxt(file);
				case "pdf" -> extractPdf(file);
				case "docx" -> extractDocx(file);
				default -> throw new IllegalArgumentException("Desteklenmeyen dosya tipi.");
			};
		} catch (IOException exception) {
			throw new IllegalArgumentException("Dosya icerigi okunamadi.");
		}
	}

	private String extractTxt(MultipartFile file) throws IOException {
		return new String(file.getBytes(), StandardCharsets.UTF_8);
	}

	private String extractPdf(MultipartFile file) throws IOException {
		try (InputStream inputStream = file.getInputStream();
				PDDocument document = Loader.loadPDF(inputStream.readAllBytes())) {
			return new PDFTextStripper().getText(document);
		}
	}

	private String extractDocx(MultipartFile file) throws IOException {
		try (InputStream inputStream = file.getInputStream();
				XWPFDocument document = new XWPFDocument(inputStream);
				XWPFWordExtractor extractor = new XWPFWordExtractor(document)) {
			return extractor.getText();
		}
	}

	private String resolveExtension(String filename) {
		if (filename == null || !filename.contains(".")) {
			return "";
		}
		return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
	}
}
