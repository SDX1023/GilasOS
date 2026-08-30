"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { getSupabase } from "@/lib/supabase";
import { Search, UserPlus, UserCheck, UserX, X, Check, Loader2, Users, Clock, Link as LinkIcon, MessageCircle, Music, Trash2, Edit3, Send } from "lucide-react";
import Link from "next/link";
import { postFriendNote, loadFriendNotes, deleteFriendNote, updateFriendNote, FriendNote, toggleReaction, loadReactions } from "@/lib/user-data";
import { MusicSelector } from "@/components/music-selector";

interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  other_user?: { user_id: string; username: string; avatar_url: string | null };
}

type Tab = "notes" | "friends" | "requests" | "search";

const REACTION_EMOJIS = ["❤️", "😂", "😢", "😡"];

export default function FriendsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("notes");
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [pendingIn, setPendingIn] = useState<Friendship[]>([]);
  const [pendingOut, setPendingOut] = useState<Friendship[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ user_id: string; username: string; avatar_url: string | null; friendship_status: string | null }[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);

  // Notes state
  const [notes, setNotes] = useState<FriendNote[]>([]);
  const [noteText, setNoteText] = useState("");
  const [notesLoading, setNotesLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [showSpotify, setShowSpotify] = useState(false);
  const [attachedSong, setAttachedSong] = useState<{ name: string; artist: string; url: string; albumArt: string; preview: string | null } | null>(null);
  const [songStartTime, setSongStartTime] = useState(0);
  const [reactions, setReactions] = useState<Record<string, { emoji: string; count: number; myReaction: boolean; users: string[] }[]>>({});
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);
  const [hoveredReaction, setHoveredReaction] = useState<string | null>(null);
  const [playingNoteId, setPlayingNoteId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const supabase = getSupabase();

  const loadFriends = useCallback(async () => {
    if (!user) return;

    const { data: allFriendships } = await supabase
      .from("user_friends")
      .select("*")
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .in("status", ["accepted", "pending"]);

    if (!allFriendships) return;

    const otherIds = allFriendships.map((f) =>
      f.requester_id === user.id ? f.addressee_id : f.requester_id
    );

    let profileMap: Record<string, { username: string; avatar_url: string | null }> = {};
    if (otherIds.length > 0) {
      const { data: profiles } = await supabase
        .from("user_profiles")
        .select("user_id, username, avatar_url")
        .in("user_id", otherIds);
      if (profiles) {
        profiles.forEach((p) => { profileMap[p.user_id] = { username: p.username, avatar_url: p.avatar_url }; });
      }
    }

    const enriched = allFriendships.map((f) => ({
      ...f,
      other_user: {
        user_id: f.requester_id === user.id ? f.addressee_id : f.requester_id,
        username: profileMap[f.requester_id === user.id ? f.addressee_id : f.requester_id]?.username || "Unknown",
        avatar_url: profileMap[f.requester_id === user.id ? f.addressee_id : f.requester_id]?.avatar_url || null,
      },
    }));

    setFriends(enriched.filter((f) => f.status === "accepted"));
    setPendingIn(enriched.filter((f) => f.status === "pending" && f.addressee_id === user.id));
    setPendingOut(enriched.filter((f) => f.status === "pending" && f.requester_id === user.id));
    setLoading(false);
  }, [user, supabase]);

  const loadNotes = useCallback(async () => {
    if (!user) return;
    setNotesLoading(true);
    const data = await loadFriendNotes(user.id);
    setNotes(data);
    setNotesLoading(false);
    const noteIds = data.map((n) => n.id);
    if (noteIds.length > 0) {
      const { reactions: r } = await loadReactions(noteIds, user.id);
      setReactions(r);
    }
  }, [user]);

  useEffect(() => { loadFriends(); loadNotes(); }, [loadFriends, loadNotes]);

  useEffect(() => {
    if (showReactionPicker) {
      const timer = setTimeout(() => setShowReactionPicker(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [showReactionPicker]);

  const postNote = async () => {
    if (!user || !noteText.trim()) return;
    setPosting(true);
    await postFriendNote(user.id, noteText.trim(), attachedSong ? { name: attachedSong.name, artist: attachedSong.artist, url: attachedSong.url, album_art: attachedSong.albumArt, preview: attachedSong.preview } : undefined, songStartTime);
    setNoteText("");
    setAttachedSong(null);
    await loadNotes();
    setPosting(false);
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!user) return;
    await deleteFriendNote(user.id, noteId);
    await loadNotes();
  };

  const handleEditNote = async (noteId: string) => {
    if (!user || !editText.trim()) return;
    await updateFriendNote(user.id, noteId, editText.trim());
    setEditingNoteId(null);
    setEditText("");
    await loadNotes();
  };

  const handleReaction = async (noteId: string, emoji: string) => {
    if (!user) return;
    await toggleReaction(user.id, noteId, emoji);
    setShowReactionPicker(null);
    const noteIds = notes.map((n) => n.id);
    const { reactions: r } = await loadReactions(noteIds, user.id);
    setReactions(r);
  };

  const searchUsers = async () => {
    if (!searchQuery.trim() || !user) return;
    setSearching(true);

    const { data: profiles } = await supabase
      .from("user_profiles")
      .select("user_id, username, avatar_url")
      .ilike("username", `%${searchQuery.trim()}%`)
      .neq("user_id", user.id)
      .limit(20);

    if (!profiles) { setSearchResults([]); setSearching(false); return; }

    const userIds = profiles.map((p) => p.user_id);
    const { data: existingFriendships } = await supabase
      .from("user_friends")
      .select("requester_id, addressee_id, status")
      .or(`requester_id.in.(${user.id}),addressee_id.in.(${user.id})`)
      .or(`requester_id.in.(${userIds.join(",")}),addressee_id.in.(${userIds.join(",")})`);

    const statusMap: Record<string, string | null> = {};
    if (existingFriendships) {
      existingFriendships.forEach((f) => {
        const otherId = f.requester_id === user.id ? f.addressee_id : f.requester_id;
        if (f.requester_id === user.id || f.addressee_id === user.id) {
          statusMap[otherId] = f.status;
        }
      });
    }

    setSearchResults(profiles.map((p) => ({
      ...p,
      friendship_status: statusMap[p.user_id] || null,
    })));
    setSearching(false);
  };

  useEffect(() => {
    if (tab === "search") searchUsers();
  }, [searchQuery]);

  const sendRequest = async (targetId: string) => {
    if (!user) return;
    await supabase.from("user_friends").insert({ requester_id: user.id, addressee_id: targetId });
    setSearchResults((prev) => prev.map((r) => r.user_id === targetId ? { ...r, friendship_status: "pending" } : r));
  };

  const acceptRequest = async (friendshipId: string) => {
    await supabase.from("user_friends").update({ status: "accepted", updated_at: new Date().toISOString() }).eq("id", friendshipId);
    loadFriends();
  };

  const rejectRequest = async (friendshipId: string) => {
    await supabase.from("user_friends").delete().eq("id", friendshipId);
    loadFriends();
  };

  const cancelRequest = async (friendshipId: string) => {
    await supabase.from("user_friends").delete().eq("id", friendshipId);
    loadFriends();
  };

  const unfriend = async (friendshipId: string) => {
    await supabase.from("user_friends").delete().eq("id", friendshipId);
    loadFriends();
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const togglePlay = (noteId: string, previewUrl: string, startTime: number = 0) => {
    if (audioRef.current) {
      audioRef.current.pause();
      if (playingNoteId === noteId) {
        setPlayingNoteId(null);
        audioRef.current = null;
        return;
      }
    }
    const audio = new Audio(previewUrl);
    audio.onloadedmetadata = () => { if (startTime > 0) audio.currentTime = startTime; };
    audio.onended = () => { setPlayingNoteId(null); audioRef.current = null; };
    audio.play().catch(() => {});
    audioRef.current = audio;
    setPlayingNoteId(noteId);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60 }}>
        <Loader2 size={24} className="animate-spin" style={{ color: "var(--os-accent)" }} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-state-icon"><Users size={32} style={{ color: "var(--os-text-dim)" }} /></div>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Sign in required</h2>
          <p className="text-secondary text-sm" style={{ marginBottom: 16 }}>Log in to see your friends and notes.</p>
          <Link href="/login" className="glass-btn glass-btn-primary">Log In</Link>
        </div>
      </div>
    );
  }

  return (
      </h1>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, padding: 3, borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.35)", marginBottom: 20 }}>
        {([
          { id: "notes" as Tab, label: "Notes", count: notes.length },
          { id: "friends" as Tab, label: "Friends", count: friends.length },
          { id: "requests" as Tab, label: "Requests", count: pendingIn.length },
          { id: "search" as Tab, label: "Find Users", count: null },
        ]).map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: "8px 14px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "Inter, sans-serif",
            background: tab === t.id ? "var(--os-accent)" : "transparent",
            color: tab === t.id ? "#fff" : "var(--os-text-dim)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}>
            {t.label}
            {t.count !== null && t.count > 0 && (
              <span style={{
                fontSize: 10, padding: "1px 6px", borderRadius: 10,
                background: tab === t.id ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.08)",
              }}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Notes Tab */}
      {tab === "notes" && (
        <div>
          {/* Compose box */}
          <div className="glass-card" style={{ padding: 16, marginBottom: 16 }}>
            <textarea
              className="glass-input"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="What's on your mind?"
              maxLength={200}
              rows={2}
              style={{ width: "100%", resize: "none", marginBottom: 8, fontSize: 13 }}
            />

            {attachedSong && (
              <div style={{
                display: "flex", alignItems: "center", gap: 10, marginBottom: 10, padding: "8px 12px",
                borderRadius: 8, background: "rgba(30,215,96,0.08)", border: "1px solid rgba(30,215,96,0.2)",
              }}>
                {attachedSong.albumArt && (
                  <img src={attachedSong.albumArt} alt="" style={{ width: 32, height: 32, borderRadius: 4, objectFit: "cover" }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 500, color: "#1ed760", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{attachedSong.name}</p>
                  <p style={{ fontSize: 11, color: "var(--os-text-dim)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{attachedSong.artist}</p>
                </div>
                <button onClick={() => setAttachedSong(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--os-text-dim)", padding: 2, flexShrink: 0 }}>
                  <X size={14} />
                </button>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, color: "var(--os-text-dim)" }}>{noteText.length}/200</span>
                <button
                  onClick={() => setShowSpotify(true)}
                  style={{
                    padding: "4px 8px", borderRadius: 6, background: "rgba(30,215,96,0.1)", border: "1px solid rgba(30,215,96,0.2)",
                    color: "#1ed760", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  <Music size={12} /> Song
                </button>
              </div>
              <button
                onClick={postNote}
                disabled={!noteText.trim() || posting}
                className="glass-btn glass-btn-primary"
                style={{ padding: "6px 16px", fontSize: 12, display: "flex", alignItems: "center", gap: 4, opacity: (!noteText.trim() || posting) ? 0.5 : 1 }}
              >
                {posting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                Post
              </button>
            </div>
          </div>

          {/* Notes list */}
          {notesLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
              <Loader2 size={24} className="animate-spin" style={{ color: "var(--os-accent)" }} />
            </div>
          ) : notes.length === 0 ? (
            <div className="empty-state" style={{ padding: 40 }}>
              <MessageCircle size={32} style={{ color: "var(--os-text-dim)" }} />
              <p className="text-secondary text-sm" style={{ marginTop: 12 }}>No notes from friends yet</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {notes.map((note) => {
                const isMine = user?.id === note.user_id;
                const isEditing = editingNoteId === note.id;
                const noteReactions = reactions[note.id] || [];
                return (
                  <div key={note.id} className="glass-card" style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <Link href={`/profile/${note.user_id}`} style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                          {note.avatar_url ? (
                            <img src={note.avatar_url} alt="" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} />
                          ) : (
                            <UserCheck size={14} style={{ color: "var(--os-accent)" }} />
                          )}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--os-text-primary)" }}>{note.username}</span>
                      </Link>
                      <span style={{ fontSize: 11, color: "var(--os-text-dim)", marginLeft: "auto" }}>{timeAgo(note.created_at)}</span>
                      {isMine && !isEditing && (
                        <div style={{ display: "flex", gap: 4 }}>
                          <button
                            onClick={() => { setEditingNoteId(note.id); setEditText(note.content); }}
                            style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "var(--os-text-dim)" }}
                          >
                            <Edit3 size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "#ef4444" }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>

                    {isEditing ? (
                      <div>
                        <textarea
                          className="glass-input"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          maxLength={200}
                          rows={2}
                          style={{ width: "100%", resize: "none", fontSize: 13, marginBottom: 8 }}
                          autoFocus
                        />
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => handleEditNote(note.id)} className="glass-btn glass-btn-primary" style={{ padding: "4px 12px", fontSize: 11 }}>
                            Save
                          </button>
                          <button onClick={() => { setEditingNoteId(null); setEditText(""); }} className="glass-btn glass-btn-ghost" style={{ padding: "4px 12px", fontSize: 11, color: "var(--os-text-dim)" }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p style={{ fontSize: 14, color: "var(--os-text-primary)", lineHeight: 1.5, margin: 0, whiteSpace: "pre-wrap" }}>{note.content}</p>
                    )}

                    {note.song_name && (
                      <div style={{
                        display: "flex", alignItems: "center", gap: 10, marginTop: 10, padding: "8px 12px",
                        borderRadius: 8, background: "rgba(30,215,96,0.08)", border: "1px solid rgba(30,215,96,0.2)",
                      }}>
                        {note.song_preview && (
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); togglePlay(note.id, note.song_preview!, note.song_start_time || 0); }}
                            style={{
                              width: 32, height: 32, borderRadius: 16, flexShrink: 0,
                              background: playingNoteId === note.id ? "#1ed760" : "rgba(30,215,96,0.2)",
                              border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                              transition: "all 0.2s",
                            }}
                          >
                            {playingNoteId === note.id ? (
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="#fff"><rect x="1" y="1" width="3.5" height="10" rx="1"/><rect x="7.5" y="1" width="3.5" height="10" rx="1"/></svg>
                            ) : (
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="#1ed760"><polygon points="2,0 12,6 2,12"/></svg>
                            )}
                          </button>
                        )}
                        <a
                          href={note.song_url || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0, textDecoration: "none" }}
                        >
                          {note.song_album_art && (
                            <img src={note.song_album_art} alt="" style={{ width: 36, height: 36, borderRadius: 4, objectFit: "cover", flexShrink: 0 }} />
                          )}
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: 12, fontWeight: 500, color: "#1ed760", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{note.song_name}</p>
                            <p style={{ fontSize: 11, color: "var(--os-text-dim)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{note.song_artist}</p>
                          </div>
                        </a>
                        <Music size={14} style={{ color: "#1ed760", flexShrink: 0 }} />
                      </div>
                    )}

                    {/* Reactions */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                      {noteReactions.map((r) => (
                        <div key={r.emoji} style={{ position: "relative" }}
                          onMouseEnter={() => setHoveredReaction(`${note.id}-${r.emoji}`)}
                          onMouseLeave={() => setHoveredReaction(null)}>
                          <button
                            onClick={() => handleReaction(note.id, r.emoji)}
                            style={{
                              padding: "2px 8px", borderRadius: 12, fontSize: 13, cursor: "pointer",
                              background: r.myReaction ? "rgba(109,40,217,0.2)" : "rgba(255,255,255,0.05)",
                              border: r.myReaction ? "1px solid rgba(109,40,217,0.4)" : "1px solid rgba(255,255,255,0.08)",
                              display: "flex", alignItems: "center", gap: 4, fontFamily: "Inter, sans-serif",
                            }}
                          >
                            <span>{r.emoji}</span>
                            {r.count > 0 && <span style={{ fontSize: 11, color: "var(--os-text-dim)" }}>{r.count}</span>}
                          </button>
                          {hoveredReaction === `${note.id}-${r.emoji}` && r.users.length > 0 && (
                            <div style={{
                              position: "absolute", bottom: "100%", left: "50%", transform: "translateX(-50%)",
                              marginBottom: 6, padding: "4px 8px", borderRadius: 6,
                              background: "var(--os-bg-secondary)", border: "1px solid var(--os-glass-border)",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.3)", whiteSpace: "nowrap",
                              fontSize: 11, color: "var(--os-text-secondary)", zIndex: 30,
                            }}>
                              {r.users.join(", ")}
                            </div>
                          )}
                        </div>
                      ))}
                      <div style={{ position: "relative" }}>
                        <button
                          onClick={() => setShowReactionPicker(showReactionPicker === note.id ? null : note.id)}
                          style={{
                            width: 26, height: 26, borderRadius: 13, fontSize: 13, cursor: "pointer",
                            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
                            display: "flex", alignItems: "center", justifyContent: "center", color: "var(--os-text-dim)",
                          }}
                        >
                          +
                        </button>
                        {showReactionPicker === note.id && (
                          <div style={{
                            position: "absolute", bottom: 32, left: 0, display: "flex", gap: 4,
                            padding: "6px 8px", borderRadius: 20, background: "var(--os-bg-secondary)",
                            border: "1px solid var(--os-glass-border)", boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                            zIndex: 20,
                          }}>
                            {REACTION_EMOJIS.map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => handleReaction(note.id, emoji)}
                                style={{
                                  width: 32, height: 32, borderRadius: 16, fontSize: 16, cursor: "pointer",
                                  background: "transparent", border: "none",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  transition: "transform 0.15s",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.3)")}
                                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Friends Tab */}
      {tab === "friends" && (
        <div>
          {friends.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><Users size={32} style={{ color: "var(--os-text-dim)" }} /></div>
              <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>No friends yet</h2>
              <p className="text-secondary text-sm">Find and add friends to collaborate!</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {friends.map((f) => (
                <div key={f.id} className="glass-card" style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                  <Link href={`/profile/${f.other_user?.user_id}`} style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, textDecoration: "none" }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                      {f.other_user?.avatar_url ? (
                        <img src={f.other_user.avatar_url} alt="" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }} />
                      ) : (
                        <UserCheck size={20} style={{ color: "var(--os-accent)" }} />
                      )}
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 500, color: "var(--os-text-primary)" }}>{f.other_user?.username}</p>
                      <p style={{ fontSize: 11, color: "var(--os-text-dim)" }}>Friends</p>
                    </div>
                  </Link>
                  <button onClick={() => unfriend(f.id)} className="glass-btn glass-btn-ghost" style={{ padding: "6px 12px", fontSize: 12, color: "#ef4444" }}>
                    Unfriend
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Requests Tab */}
      {tab === "requests" && (
        <div>
          {pendingIn.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><Clock size={32} style={{ color: "var(--os-text-dim)" }} /></div>
              <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>No pending requests</h2>
              <p className="text-secondary text-sm">When someone adds you, you&apos;ll see their request here.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {pendingIn.map((f) => (
                <div key={f.id} className="glass-card" style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                  <Link href={`/profile/${f.other_user?.user_id}`} style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, textDecoration: "none" }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                      {f.other_user?.avatar_url ? (
                        <img src={f.other_user.avatar_url} alt="" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }} />
                      ) : (
                        <UserPlus size={20} style={{ color: "var(--os-accent)" }} />
                      )}
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 500, color: "var(--os-text-primary)" }}>{f.other_user?.username}</p>
                      <p style={{ fontSize: 11, color: "var(--os-text-dim)" }}>wants to be your friend</p>
                    </div>
                  </Link>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => acceptRequest(f.id)} style={{ padding: "6px 12px", borderRadius: 8, background: "var(--os-accent)", border: "none", color: "#fff", fontSize: 12, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontFamily: "Inter, sans-serif" }}>
                      <Check size={14} /> Accept
                    </button>
                    <button onClick={() => rejectRequest(f.id)} className="glass-btn glass-btn-ghost" style={{ padding: "6px 12px", fontSize: 12, color: "#ef4444" }}>
                      <X size={14} /> Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {pendingOut.length > 0 && (
            <>
              <h2 style={{ fontSize: 14, fontWeight: 600, marginTop: 24, marginBottom: 12, color: "var(--os-text-dim)" }}>Sent Requests</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {pendingOut.map((f) => (
                  <div key={f.id} className="glass-card" style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                    <Link href={`/profile/${f.other_user?.user_id}`} style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, textDecoration: "none" }}>
                      <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                        {f.other_user?.avatar_url ? (
                          <img src={f.other_user.avatar_url} alt="" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }} />
                        ) : (
                          <Clock size={20} style={{ color: "var(--os-text-dim)" }} />
                        )}
                      </div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 500, color: "var(--os-text-primary)" }}>{f.other_user?.username}</p>
                        <p style={{ fontSize: 11, color: "var(--os-text-dim)" }}>Request pending...</p>
                      </div>
                    </Link>
                    <button onClick={() => cancelRequest(f.id)} className="glass-btn glass-btn-ghost" style={{ padding: "6px 12px", fontSize: 12, color: "var(--os-text-dim)" }}>
                      Cancel
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Search Tab */}
      {tab === "search" && (
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            <div style={{ flex: 1, position: "relative" }}>
              <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--os-text-dim)" }} />
              <input
                className="glass-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchUsers()}
                placeholder="Search by username..."
                style={{ paddingLeft: 38 }}
                autoFocus
              />
            </div>
            <button onClick={searchUsers} className="glass-btn glass-btn-primary" style={{ padding: "8px 16px" }}>
              {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            </button>
          </div>

          {searching && (
            <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
              <Loader2 size={24} className="animate-spin" style={{ color: "var(--os-accent)" }} />
            </div>
          )}

          {!searching && searchResults.length === 0 && searchQuery && (
            <div className="empty-state" style={{ padding: 40 }}>
              <p className="text-secondary text-sm">No users found matching &ldquo;{searchQuery}&rdquo;</p>
            </div>
          )}

          {!searching && searchResults.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {searchResults.map((r) => (
                <div key={r.user_id} className="glass-card" style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                  <Link href={`/profile/${r.user_id}`} style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, textDecoration: "none" }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                      {r.avatar_url ? (
                        <img src={r.avatar_url} alt="" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }} />
                      ) : (
                        <Users size={20} style={{ color: "var(--os-accent)" }} />
                      )}
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 500, color: "var(--os-text-primary)" }}>{r.username}</p>
                    </div>
                  </Link>
                  {r.friendship_status === null && (
                    <button onClick={() => sendRequest(r.user_id)} className="glass-btn glass-btn-primary" style={{ padding: "6px 12px", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                      <UserPlus size={14} /> Add
                    </button>
                  )}
                  {r.friendship_status === "pending" && (
                    <span style={{ fontSize: 12, color: "var(--os-text-dim)", padding: "6px 12px" }}>Pending</span>
                  )}
                  {r.friendship_status === "accepted" && (
                    <span style={{ fontSize: 12, color: "var(--os-accent)", padding: "6px 12px", display: "flex", alignItems: "center", gap: 4 }}>
                      <UserCheck size={14} /> Friends
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {!searchQuery && !searching && (
            <div className="empty-state" style={{ padding: 40 }}>
              <Search size={32} style={{ color: "var(--os-text-dim)" }} />
              <p className="text-secondary text-sm" style={{ marginTop: 12 }}>Type a username to find friends</p>
            </div>
          )}
        </div>
      )}

      {/* Music Selector Modal */}
      {showSpotify && (
        <MusicSelector
          onSelect={(track, startTime) => {
            setAttachedSong({ name: track.name, artist: track.artist, url: track.url, albumArt: track.albumArt, preview: track.preview });
            setSongStartTime(startTime);
            setShowSpotify(false);
          }}
          onClose={() => setShowSpotify(false)}
        />
      )}
    </div>
  );
}