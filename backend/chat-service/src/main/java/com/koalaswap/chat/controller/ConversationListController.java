package com.koalaswap.chat.controller;

import com.koalaswap.chat.security.CurrentUser;          // [B3 CHANGE]
import com.koalaswap.chat.service.ConversationCommandService;
import com.koalaswap.chat.service.ConversationQueryService;
import com.koalaswap.chat.dto.ConversationListItem;
import com.koalaswap.common.dto.ApiResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/chat")
public class ConversationListController {

    private final ConversationQueryService query;
    private final ConversationCommandService cmd;

    public ConversationListController(ConversationQueryService q, ConversationCommandService c) {
        this.query = q; this.cmd = c;
    }

    /** [B3 CHANGE] 默认 aggregate=true；可通过参数关闭以便排查 */
    @GetMapping("/conversations")
    public ResponseEntity<ApiResponse<Page<ConversationListItem>>> page(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "false") boolean onlyArchived,
            @RequestParam(defaultValue = "false") boolean onlyPinned,
            @RequestParam(defaultValue = "true") boolean aggregate) {               // [B3 CHANGE]
        UUID uid = CurrentUser.idRequired();
        Page<ConversationListItem> data = aggregate
                ? query.pageAggregated(uid, onlyArchived, onlyPinned, PageRequest.of(page, size))
                : query.page(uid, onlyArchived, onlyPinned, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    @DeleteMapping("/conversations/{id}")
    public ResponseEntity<ApiResponse<Boolean>> delete(@PathVariable UUID id) {
        UUID uid = CurrentUser.idRequired();
        cmd.softDelete(id, uid);
        return ResponseEntity.ok(ApiResponse.ok(Boolean.TRUE));
    }

    @PostMapping("/conversations/{id}/archive")
    public ResponseEntity<ApiResponse<Boolean>> archive(@PathVariable UUID id,
                                                        @RequestParam(defaultValue = "true") boolean archived) {
        UUID uid = CurrentUser.idRequired();
        cmd.archive(id, uid, archived);
        return ResponseEntity.ok(ApiResponse.ok(Boolean.TRUE));
    }

    @PostMapping("/conversations/{id}/pin")
    public ResponseEntity<ApiResponse<Boolean>> pin(@PathVariable UUID id,
                                                    @RequestParam(defaultValue = "true") boolean pin) {
        UUID uid = CurrentUser.idRequired();
        cmd.pin(id, uid, pin);
        return ResponseEntity.ok(ApiResponse.ok(Boolean.TRUE));
    }

    @PostMapping("/conversations/{id}/mute")
    public ResponseEntity<ApiResponse<Boolean>> mute(@PathVariable UUID id,
                                                     @RequestParam(required = false) Integer minutes) {
        UUID uid = CurrentUser.idRequired();
        cmd.mute(id, uid, minutes);
        return ResponseEntity.ok(ApiResponse.ok(Boolean.TRUE));
    }
}
