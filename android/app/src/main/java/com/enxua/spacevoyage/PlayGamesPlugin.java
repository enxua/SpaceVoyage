package com.enxua.spacevoyage;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.games.GamesSignInClient;
import com.google.android.gms.games.PlayGames;
import com.google.android.gms.games.SnapshotsClient;
import com.google.android.gms.games.snapshot.Snapshot;
import com.google.android.gms.games.snapshot.SnapshotMetadataChange;

import java.nio.charset.StandardCharsets;

/**
 * 구글 Play 게임즈 서비스(v2): 로그인 · 저장된 게임(클라우드 세이브).
 * 자바스크립트 쪽은 js/cloud.js 가 window.Capacitor.Plugins.PlayGames 로 부른다.
 *
 *  status()            → { auth, id, name }       지금 로그인돼 있는지 (자동 로그인 결과)
 *  signIn()            → { auth, id, name }       로그인 창을 띄운다 (플레이어가 직접 누른 경우에만)
 *  load({ name })      → { data }                 저장된 게임을 읽는다. 없으면 빈 문자열
 *  save({ name, data, desc, played }) → {}        저장된 게임에 쓴다
 *
 * ※ Play 게임즈 v2 에는 앱 안에서 로그아웃하는 기능이 없다. 계정 전환·로그아웃은 Play 게임즈 앱에서 한다.
 */
@CapacitorPlugin(name = "PlayGames")
public class PlayGamesPlugin extends Plugin {

    private void reply(PluginCall call, boolean auth) {
        JSObject r = new JSObject();
        r.put("auth", auth);
        if (!auth) { call.resolve(r); return; }
        PlayGames.getPlayersClient(getActivity()).getCurrentPlayer().addOnCompleteListener(t -> {
            if (t.isSuccessful() && t.getResult() != null) {
                r.put("id", t.getResult().getPlayerId());
                r.put("name", t.getResult().getDisplayName());
            }
            call.resolve(r);
        });
    }

    @PluginMethod
    public void status(PluginCall call) {
        GamesSignInClient c = PlayGames.getGamesSignInClient(getActivity());
        c.isAuthenticated().addOnCompleteListener(t ->
            reply(call, t.isSuccessful() && t.getResult() != null && t.getResult().isAuthenticated()));
    }

    @PluginMethod
    public void signIn(PluginCall call) {
        GamesSignInClient c = PlayGames.getGamesSignInClient(getActivity());
        c.signIn().addOnCompleteListener(t ->
            reply(call, t.isSuccessful() && t.getResult() != null && t.getResult().isAuthenticated()));
    }

    @PluginMethod
    public void load(PluginCall call) {
        String name = call.getString("name", "voyage");
        SnapshotsClient sc = PlayGames.getSnapshotsClient(getActivity());
        sc.open(name, true, SnapshotsClient.RESOLUTION_POLICY_MOST_RECENTLY_MODIFIED).addOnCompleteListener(t -> {
            if (!t.isSuccessful() || t.getResult() == null || t.getResult().isConflict()) {
                call.reject("open failed", t.getException());
                return;
            }
            Snapshot s = t.getResult().getData();
            try {
                byte[] b = s.getSnapshotContents().readFully();
                JSObject r = new JSObject();
                r.put("data", b == null ? "" : new String(b, StandardCharsets.UTF_8));
                call.resolve(r);
            } catch (Exception e) {
                call.reject("read failed", e);
            } finally {
                sc.discardAndClose(s);
            }
        });
    }

    @PluginMethod
    public void save(PluginCall call) {
        String name = call.getString("name", "voyage");
        String data = call.getString("data", "");
        String desc = call.getString("desc", "");
        long played = call.getLong("played", 0L);
        SnapshotsClient sc = PlayGames.getSnapshotsClient(getActivity());
        sc.open(name, true, SnapshotsClient.RESOLUTION_POLICY_MOST_RECENTLY_MODIFIED).addOnCompleteListener(t -> {
            if (!t.isSuccessful() || t.getResult() == null || t.getResult().isConflict()) {
                call.reject("open failed", t.getException());
                return;
            }
            Snapshot s = t.getResult().getData();
            s.getSnapshotContents().writeBytes(data.getBytes(StandardCharsets.UTF_8));
            SnapshotMetadataChange.Builder ch = new SnapshotMetadataChange.Builder().setDescription(desc);
            if (played > 0) ch.setPlayedTimeMillis(played);
            sc.commitAndClose(s, ch.build()).addOnCompleteListener(c -> {
                if (c.isSuccessful()) call.resolve(); else call.reject("commit failed", c.getException());
            });
        });
    }
}
