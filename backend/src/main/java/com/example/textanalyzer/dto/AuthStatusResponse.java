package com.example.textanalyzer.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthStatusResponse {

	private boolean loggedIn;
	private String username;
	private String email;
	private String planType;
	private int maxCharacters;
	private boolean fileUploadEnabled;
	private boolean canUpgradeToPremium;
	private String premiumPriceLabel;
	private String billingMessage;
	private String proPriceLabel;
}
