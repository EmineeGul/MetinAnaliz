package com.example.textanalyzer.service;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;

import com.example.textanalyzer.dto.TextAnalysisResponse;

@Service
public class TextAnalysisService {

	private static final Pattern WORD_PATTERN = Pattern.compile("\\p{L}[\\p{L}\\p{N}'-]*");

	public TextAnalysisResponse analyzeText(String text) {
		String safeText = text == null ? "" : text;

		return TextAnalysisResponse.builder()
				.wordCount(countWords(safeText))
				.characterCount(safeText.length())
				.sentenceCount(countSentences(safeText))
				.mostFrequentWord(findMostFrequentWord(safeText))
				.build();
	}

	private int countWords(String text) {
		Matcher matcher = WORD_PATTERN.matcher(text);
		int count = 0;
		while (matcher.find()) {
			count++;
		}
		return count;
	}

	private int countSentences(String text) {
		String trimmedText = text.trim();
		if (trimmedText.isEmpty()) {
			return 0;
		}

		String[] sentences = trimmedText.split("[.!?]+");
		int count = 0;
		for (String sentence : sentences) {
			if (!sentence.isBlank()) {
				count++;
			}
		}
		return count;
	}

	private String findMostFrequentWord(String text) {
		Matcher matcher = WORD_PATTERN.matcher(text.toLowerCase());
		Map<String, Integer> frequencies = new LinkedHashMap<>();
		String mostFrequentWord = null;
		int highestCount = 0;

		while (matcher.find()) {
			String word = matcher.group();
			int newCount = frequencies.getOrDefault(word, 0) + 1;
			frequencies.put(word, newCount);

			if (newCount > highestCount) {
				highestCount = newCount;
				mostFrequentWord = word;
			}
		}

		return mostFrequentWord;
	}
}
