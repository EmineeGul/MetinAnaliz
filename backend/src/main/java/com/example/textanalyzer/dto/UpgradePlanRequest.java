package com.example.textanalyzer.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpgradePlanRequest {

	private String planType;
	private PaymentDetailsRequest paymentDetails;
}
