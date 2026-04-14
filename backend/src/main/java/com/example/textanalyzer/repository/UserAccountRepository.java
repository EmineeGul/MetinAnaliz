package com.example.textanalyzer.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.textanalyzer.model.UserAccount;

public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {

	Optional<UserAccount> findByUsername(String username);

	Optional<UserAccount> findByEmail(String email);

	boolean existsByUsername(String username);

	boolean existsByEmail(String email);
}
