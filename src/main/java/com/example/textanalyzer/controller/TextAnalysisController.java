package com.example.textanalyzer.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.RequestParam;

import com.example.textanalyzer.dto.TextAnalysisResponse;
import com.example.textanalyzer.service.AuthService;
import com.example.textanalyzer.service.FileTextExtractionService;
import com.example.textanalyzer.service.TextAnalysisService;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class TextAnalysisController {

	private final AuthService authService;
	private final TextAnalysisService textAnalysisService;
	private final FileTextExtractionService fileTextExtractionService;

	@GetMapping("/test")
	public ResponseEntity<String> test() {
		return ResponseEntity.ok("API calisiyor");
	}

	@PostMapping("/analyze")
	public ResponseEntity<TextAnalysisResponse> analyze(@RequestBody String text, HttpSession session) {
		String safeText = text == null ? "" : text;
		int characterLimit = authService.resolveCharacterLimit(session);
		if (safeText.length() > characterLimit) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
					"Bu hesap turu icin maksimum metin uzunlugu " + characterLimit + " karakter.");
		}

		return ResponseEntity.ok(textAnalysisService.analyzeText(safeText));
	}

	@PostMapping("/legacy/analyze")
	public ResponseEntity<TextAnalysisResponse> legacyAnalyze(@RequestBody String text, HttpSession session) {
		return analyze(text, session);
	}

	@PostMapping("/analyze-file")
	public ResponseEntity<TextAnalysisResponse> analyzeFile(@RequestParam("file") MultipartFile file, HttpSession session) {
		if (!authService.canUploadFiles(session)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN,
					"Dosya yukleme ozelligi sadece premium kullanicilar icindir.");
		}

		try {
			String extractedText = fileTextExtractionService.extractText(file);
			return analyze(extractedText, session);
		} catch (IllegalArgumentException exception) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, exception.getMessage());
		}
	}
}
