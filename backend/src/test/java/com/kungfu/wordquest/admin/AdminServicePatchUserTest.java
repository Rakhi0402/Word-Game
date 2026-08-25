package com.kungfu.wordquest.admin;

import com.kungfu.wordquest.admin.dto.AdminUserPatchRequest;
import com.kungfu.wordquest.admin.service.AdminService;
import com.kungfu.wordquest.user.entity.User;
import com.kungfu.wordquest.user.entity.UserRole;
import com.kungfu.wordquest.user.entity.UserStats;
import com.kungfu.wordquest.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminServicePatchUserTest {

    @Mock UserRepository userRepository;
    @InjectMocks AdminService adminService;

    @Test
    void patchUser_promotesAndBumpsTokenVersion() {
        UUID id = UUID.randomUUID();
        User user = User.builder()
                .id(id)
                .username("disciple")
                .email("d@example.com")
                .passwordHash("hash")
                .role(UserRole.ROLE_USER)
                .tokenVersion(2)
                .stats(UserStats.builder().build())
                .build();
        when(userRepository.findWithStatsById(id)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        AdminUserPatchRequest req = new AdminUserPatchRequest();
        req.setRole("ROLE_ADMIN");

        var detail = adminService.patchUser(id, req);

        assertEquals("ROLE_ADMIN", detail.getRole());
        assertEquals(3, detail.getTokenVersion());
        assertEquals(3,user.getTokenVersion());
        verify(userRepository).save(user);
    }
}
