package com.example.textanalyzer.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentDetailsRequest {

	private String cardHolderName;
	private String cardNumber;
	private String expiryMonth;
	private String expiryYear;
	private String cvv;
	private boolean acceptedTerms;
}
