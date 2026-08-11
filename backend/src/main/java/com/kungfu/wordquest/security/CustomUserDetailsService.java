package com.kungfu.wordquest.security;

import com.kungfu.wordquest.user.entity.User;
import com.kungfu.wordquest.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String usernameOrEmail)
            throws UsernameNotFoundException {

        User user;
        if (usernameOrEmail != null && usernameOrEmail.contains("@")) {
            user = userRepository.findByEmailIgnoreCase(usernameOrEmail.trim())
                    .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        } else {
            user = userRepository.findByUsernameIgnoreCase(usernameOrEmail)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        }

        return new CustomUserDetails(user);
    }

    public UserDetails loadUserById(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with id: " + id));
        return new CustomUserDetails(user);
    }
}
