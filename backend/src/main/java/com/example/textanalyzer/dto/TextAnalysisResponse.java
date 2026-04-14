package com.example.textanalyzer.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TextAnalysisResponse {

	private int wordCount;
	private int characterCount;
	private int sentenceCount;
	private String mostFrequentWord;
}
