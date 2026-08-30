"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { getSupabase } from "@/lib/supabase";
import { Search, UserPlus, UserCheck, UserX, X, Check, Loader2, Users, Clock, Link as LinkIcon, MessageCircle, Music, Trash2, Edit3, Send } from "lucide-react";
import Link from "next/link";
import { postFriendNote, loadFriendNotes, deleteFriendNote, updateFriendNote, FriendNote } from "@/lib/user-data";

interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  other_user?: { user_id: string; username: string; avatar_url: string | null };
}

type Tab = "notes" | "friends" | "requests" | "search";

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
  }, [user]);

  useEffect(() => { loadFriends(); loadNotes(); }, [loadFriends, loadNotes]);

  const postNote = async () => {
    if (!user || !noteText.trim()) return;
    setPosting(true);
    await postFriendNote(user.id, noteText.trim());
    setNoteText("");
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

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60 }}>
        <Loader2 size={24} className="animate-spin" style={{ color: "var(--os-accent)" }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "24px 20px" }}>
      <h1 className="page-title" style={{ fontSize: 24, marginBottom: 20 }}>
        <Users size={24} /> Friends
      </h1>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, padding: 3, borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", marginBottom: 20 }}>
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "var(--os-text-dim)" }}>{noteText.length}/200</span>
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
                      <a
                        href={note.song_url || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "flex", alignItems: "center", gap: 10, marginTop: 10, padding: "8px 12px",
                          borderRadius: 8, background: "rgba(30,215,96,0.08)", border: "1px solid rgba(30,215,96,0.2)",
                          textDecoration: "none",
                        }}
                      >
                        {note.song_album_art && (
                          <img src={note.song_album_art} alt="" style={{ width: 36, height: 36, borderRadius: 4, objectFit: "cover" }} />
                        )}
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 500, color: "#1ed760", margin: 0 }}>{note.song_name}</p>
                          <p style={{ fontSize: 11, color: "var(--os-text-dim)", margin: 0 }}>{note.song_artist}</p>
                        </div>
                        <Music size={14} style={{ color: "#1ed760", marginLeft: "auto" }} />
                      </a>
                    )}
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
    </div>
  );
}