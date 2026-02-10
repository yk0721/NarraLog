package com.narralog.repository;

import com.narralog.model.Problem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProblemRepository extends JpaRepository<Problem, UUID> {
}
