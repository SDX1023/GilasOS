"use client";

import { useState, useEffect, useCallback, useRef } from "react";

declare global {
  interface Window {
    Spotify: any;
  }
}

interface SpotifyPlayerState {
  isReady: boolean;
  isPlaying: boolean;
  currentTrack: any;
  position: number;
  duration: number;
  deviceId: string | null;
}

export function useSpotifyPlayer() {
  const [state, setState] = useState<SpotifyPlayerState>({
    isReady: false,
    isPlaying: false,
    currentTrack: null,
    position: 0,
    duration: 0,
    deviceId: null,
  });
  const playerRef = useState<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const tokenRef = useRef<string>("");

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    const stored = localStorage.getItem("spotify_access_token");
    const expiry = localStorage.getItem("spotify_token_expiry");
    if (stored && expiry && Date.now() < Number(expiry)) {
      tokenRef.current = stored;
      return stored;
    }
    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
    if (!clientId) return null;
    const scopes = "streaming user-read-email user-read-private user-read-playback-state user-modify-playback-state";
    const redirectUri = `${window.location.origin}/spotify-callback`;
    const url = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&show_dialog=false`;
    window.location.href = url;
    return null;
  }, []);

  const initPlayer = useCallback(async () => {
    if (playerRef[0]) return;
    const token = await getAccessToken();
    if (!token) return;

    if (!window.Spotify) {
      const script = document.createElement("script");
      script.src = "https://sdk.scdn.co/spotify-player.js";
      document.body.appendChild(script);
      await new Promise<void>((resolve) => { script.onload = () => resolve(); });
    }

    const player = new window.Spotify.Player({
      name: "GilasOS Player",
      getOAuthToken: async (cb: (token: string) => void) => {
        const t = await getAccessToken();
        if (t) cb(t);
      },
      volume: 0.8,
    });

    player.addListener("ready", ({ device_id }: { device_id: string }) => {
      setState((s) => ({ ...s, isReady: true, deviceId: device_id }));
    });

    player.addListener("not_ready", () => {
      setState((s) => ({ ...s, isReady: false }));
    });

    player.addListener("player_state_changed", (state: any) => {
      if (!state) return;
      const track = state.track_window?.current_track || null;
      setState((s) => ({
        ...s,
        isPlaying: !state.paused,
        currentTrack: track,
        position: state.position / 1000,
        duration: state.duration / 1000,
      }));
    });

    player.connect();
    playerRef[0] = player;
  }, [getAccessToken]);

  useEffect(() => {
    initPlayer();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      playerRef[0]?.disconnect();
    };
  }, [initPlayer]);

  const playTrack = useCallback(async (spotifyUri: string, positionMs = 0) => {
    const token = tokenRef.current || await getAccessToken();
    if (!token || !state.deviceId) return;
    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${state.deviceId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ uris: [spotifyUri], position_ms: positionMs }),
    });
    setState((s) => ({ ...s, isPlaying: true }));
  }, [state.deviceId, getAccessToken]);

  const togglePlay = useCallback(() => { playerRef[0]?.togglePlay(); }, []);

  const pause = useCallback(() => { playerRef[0]?.pause(); }, []);

  const seek = useCallback(async (positionMs: number) => {
    await playerRef[0]?.seek(positionMs);
    setState((s) => ({ ...s, position: positionMs / 1000 }));
  }, []);

  const disconnect = useCallback(() => {
    playerRef[0]?.disconnect();
    playerRef[0] = null;
    setState({ isReady: false, isPlaying: false, currentTrack: null, position: 0, duration: 0, deviceId: null });
  }, []);

  return { ...state, playTrack, togglePlay, pause, seek, disconnect, getAccessToken, initPlayer };
}
