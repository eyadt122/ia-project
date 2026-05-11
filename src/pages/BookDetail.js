import { useState, useEffect } from "react";
import API from "../api";

export default function BookDetail({ book, navigate, user }) {
  const [comments, setComments]     = useState([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo]       = useState(null);
  const [replyText, setReplyText]   = useState("");
  const [borrowed, setBorrowed]     = useState(false);
  const [likeCount, setLikeCount]   = useState({ likes: 0, dislikes: 0, userVote: null });

  useEffect(() => {
    if (!book) return;
    API.get(`/comments/${book.id}`).then(r => setComments(r.data)).catch(console.error);
    API.get(`/likes/${book.id}`).then(r => setLikeCount(r.data)).catch(console.error);
  }, [book]);

  const sendBorrow = async () => {
    try {
      await API.post("/borrow", { bookId: book.id });
      setBorrowed(true);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to send request");
    }
  };

  const handleLike = async (isLike) => {
    if (!user) { navigate("login"); return; }
    try {
      await API.post("/likes", { bookId: book.id, isLike });
      const res = await API.get(`/likes/${book.id}`);
      setLikeCount(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const submitComment = async () => {
    if (!user) { navigate("login"); return; }
    if (!newComment.trim()) return;
    try {
      await API.post("/comments", { bookId: book.id, content: newComment.trim(), parentId: null });
      const res = await API.get(`/comments/${book.id}`);
      setComments(res.data);
      setNewComment("");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to post comment");
    }
  };

  const submitReply = async (parentId) => {
    if (!user) { navigate("login"); return; }
    if (!replyText.trim()) return;
    try {
      await API.post("/comments", { bookId: book.id, content: replyText.trim(), parentId });
      const res = await API.get(`/comments/${book.id}`);
      setComments(res.data);
      setReplyTo(null);
      setReplyText("");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to post reply");
    }
  };

  if (!book) return <div style={{ padding: 40, textAlign: "center" }}>No book selected.</div>;

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-brand">Book<span>Circle</span></div>
        <div className="navbar-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate("home")}>← Back to Browse</button>
          {!user && (
            <button className="btn btn-primary btn-sm" onClick={() => navigate("login")}>Sign In</button>
          )}
        </div>
      </nav>

      <div className="page" style={{ paddingTop: 32 }}>
        <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 36, alignItems: "start" }}>

          {/* Cover */}
          <div>
            <div className="card" style={{ overflow: "hidden", aspectRatio: "2/3", background: "var(--bg2)" }}>
              {book.coverImageUrl && (
                <img src={book.coverImageUrl} alt={book.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              )}
            </div>

            {/* Like / Dislike */}
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button onClick={() => handleLike(true)} className="btn btn-outline"
                style={{
                  flex: 1, justifyContent: "center",
                  borderColor: likeCount.userVote === true ? "var(--green)" : "var(--border)",
                  color: likeCount.userVote === true ? "var(--green)" : "var(--text2)"
                }}>
                👍 {likeCount.likes}
              </button>
              <button onClick={() => handleLike(false)} className="btn btn-outline"
                style={{
                  flex: 1, justifyContent: "center",
                  borderColor: likeCount.userVote === false ? "var(--red)" : "var(--border)",
                  color: likeCount.userVote === false ? "var(--red)" : "var(--text2)"
                }}>
                👎 {likeCount.dislikes}
              </button>
            </div>
          </div>

          {/* Info */}
          <div>
            <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
              <span className={`badge ${book.status === "Available" ? "badge-green" : "badge-yellow"}`}>
                {book.status}
              </span>
              <span className="badge badge-gray">{book.genre}</span>
              <span className="badge badge-gray">{book.language}</span>
            </div>

            <h1 style={{ fontSize: 28, marginBottom: 4 }}>{book.title}</h1>
            <p style={{ color: "var(--text2)", fontSize: 15, marginBottom: 20 }}>
              Owner: <strong>{book.ownerName}</strong>
            </p>

            {/* Meta */}
            <div className="card" style={{ padding: "16px 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 24px", marginBottom: 24 }}>
              {[
                ["ISBN",         book.isbn          || "—"],
                ["Language",     book.language      || "—"],
                ["Published",    book.publicationDate || "—"],
                ["Available",    `${book.availabilityStart || "—"} → ${book.availabilityEnd || "—"}`],
                ["Borrow Price", `${book.borrowPrice} EGP`],
              ].map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontSize: 11, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: 2 }}>{k}</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Borrow CTA */}
            {book.status === "Available" ? (
              !user ? (
                <div style={{ background: "#fdf6e3", border: "1px solid #f0c040", borderRadius: "var(--radius)", padding: "14px 18px", fontSize: 14 }}>
                  <strong>Want to borrow this book?</strong>
                  <button className="btn btn-primary btn-sm" style={{ marginLeft: 12 }}
                    onClick={() => navigate("login")}>
                    Sign In to Borrow
                  </button>
                </div>
              ) : borrowed ? (
                <div style={{ background: "#e8f5ee", border: "1px solid #a3d9b8", borderRadius: "var(--radius)", padding: "14px 18px", color: "var(--green)", fontSize: 14, fontWeight: 500 }}>
                  ✅ Borrow request sent! The owner will respond shortly.
                </div>
              ) : (
                <button className="btn btn-primary" style={{ fontSize: 15, padding: "12px 28px" }}
                  onClick={sendBorrow}>
                  📩 Send Borrow Request
                </button>
              )
            ) : (
              <button className="btn btn-outline" disabled style={{ opacity: 0.5, cursor: "not-allowed" }}>
                Currently Borrowed
              </button>
            )}
          </div>
        </div>

        {/* Comments */}
        <hr className="divider" style={{ margin: "36px 0 24px" }} />
        <h2 style={{ fontSize: 20, marginBottom: 20 }}>
          Comments <span style={{ color: "var(--text2)", fontWeight: 400, fontSize: 15 }}>({comments.length})</span>
        </h2>

        {/* New comment input */}
        {user ? (
          <div style={{ display: "flex", gap: 12, marginBottom: 28 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--accent)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13 }}>
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div style={{ flex: 1, display: "flex", gap: 10 }}>
              <input className="input" value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Write a comment…"
                onKeyDown={e => e.key === "Enter" && submitComment()} />
              <button className="btn btn-primary btn-sm" onClick={submitComment}>Post</button>
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: 28, padding: "12px 16px", background: "var(--bg2)", borderRadius: "var(--radius)", fontSize: 13, color: "var(--text2)" }}>
            <button onClick={() => navigate("login")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent)", fontWeight: 600 }}>
              Sign in
            </button> to leave a comment.
          </div>
        )}

        {/* Comment list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {comments.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text2)", fontSize: 14 }}>
              No comments yet. Be the first to comment!
            </div>
          ) : (
            comments.map(c => (
              <div key={c.id} className="card" style={{ padding: "14px 16px" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--bg2)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: "var(--text2)" }}>
                    {c.userName?.[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "baseline", marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{c.userName}</span>
                      <span style={{ color: "var(--text2)", fontSize: 12 }}>
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p style={{ fontSize: 14, color: "var(--text)" }}>{c.content}</p>
                    {user && (
                      <button onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent)", fontSize: 12, fontWeight: 600, marginTop: 6, padding: 0 }}>
                        {replyTo === c.id ? "Cancel" : "Reply"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Replies */}
                {c.replies?.length > 0 && (
                  <div style={{ marginTop: 12, marginLeft: 44, display: "flex", flexDirection: "column", gap: 10 }}>
                    {c.replies.map(r => (
                      <div key={r.id} style={{ display: "flex", gap: 8, padding: "10px 12px", background: "var(--bg)", borderRadius: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--border)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 11, color: "var(--text2)" }}>
                          {r.userName?.[0]}
                        </div>
                        <div>
                          <span style={{ fontWeight: 600, fontSize: 12 }}>{r.userName}</span>
                          <span style={{ color: "var(--text2)", fontSize: 11, marginLeft: 6 }}>
                            {new Date(r.createdAt).toLocaleDateString()}
                          </span>
                          <p style={{ fontSize: 13, marginTop: 2 }}>{r.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply input */}
                {replyTo === c.id && (
                  <div style={{ marginTop: 12, marginLeft: 44, display: "flex", gap: 8 }}>
                    <input className="input" value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder="Write a reply…"
                      style={{ fontSize: 13 }}
                      onKeyDown={e => e.key === "Enter" && submitReply(c.id)} />
                    <button className="btn btn-primary btn-sm" onClick={() => submitReply(c.id)}>Reply</button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
