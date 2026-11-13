package com.enxua.spacevoyage;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;
import com.google.android.gms.games.PlayGamesSdk;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(PlayGamesPlugin.class);          // 앱 안에 둔 Play 게임즈 플러그인 (js/cloud.js)
        super.onCreate(savedInstanceState);
        PlayGamesSdk.initialize(this);                  // 시작할 때 Play 게임즈 자동 로그인을 시도한다
    }
}
