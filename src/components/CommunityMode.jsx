import React, { useState, useRef } from 'react';
import { Leaf, Moon, Waves, Heart, MessageCircle, HeartHandshake, ShieldCheck, TrendingUp, CheckCircle2, Send, Loader2, ChevronUp } from 'lucide-react';
import { postCommunityItem, reactToCommunityItem, addCommunityComment, getSessionAlias } from '../services/api';
import { useDashboardContext } from '../context/DashboardContext';
import './CommunityMode.css';

const MAX_CHARS = 280;

const CommunityMode = ({ showToast }) => {
  const { dashboardData, isDashboardLoading, triggerDashboardRefresh } = useDashboardContext();

  // Read posts directly from global context — no isolated fetch needed
  const contextPosts = dashboardData?.communityPosts || [];
  const isLoading = isDashboardLoading && contextPosts.length === 0;

  // Local overlay for optimistic reaction + comment updates
  const [localOverrides, setLocalOverrides] = useState({}); // { [postId]: { reactions, commentsList } }
  const [expandedComments, setExpandedComments] = useState({}); // { [postId]: bool }
  const [commentInputs, setCommentInputs] = useState({});     // { [postId]: string }
  const [inputValue, setInputValue] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  // dedup: tracks which reaction types user has already sent per post
  const [reactedPosts, setReactedPosts] = useState({}); // { [postId]: Set<type> }
  // in-flight guard: prevents double comment sends
  const submittingComment = useRef(new Set());
  // stable alias from localStorage
  const [currentAlias] = useState(() => getSessionAlias());

  // Merge context posts with local reaction overrides for instant UI feedback
  const posts = contextPosts.map(p => ({
    ...p,
    reactions: localOverrides[p.postId]?.reactions ?? p.reactions,
    commentsList: localOverrides[p.postId]?.commentsList ?? p.commentsList ?? [],
  }));

  const handlePost = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isPosting) return;
    setIsPosting(true);
    const payload = inputValue.trim();
    setInputValue('');
    try {
      const res = await postCommunityItem(payload);
      if (res.data?.success) {
        triggerDashboardRefresh();
        if (showToast) showToast('Post published anonymously! 🌸');
      }
    } catch (err) {
      console.error('Failed to post', err);
      if (showToast) showToast('⚠️ Failed to publish post.');
    } finally {
      setIsPosting(false);
    }
  };

  // Optimistic reaction — update locally first, then sync; guard against duplicates
  const handleReact = async (postId, type) => {
    // Frontend guard: already reacted?
    if (reactedPosts[postId]?.has(type)) {
      if (showToast) showToast('You already reacted! 😊');
      return;
    }

    // Optimistic update
    setLocalOverrides(prev => {
      const existing = prev[postId]?.reactions ?? contextPosts.find(p => p.postId === postId)?.reactions ?? {};
      return {
        ...prev,
        [postId]: {
          ...prev[postId],
          reactions: { ...existing, [type]: (existing[type] || 0) + 1 }
        }
      };
    });

    try {
      const res = await reactToCommunityItem(postId, type);
      if (res.data?.alreadyReacted) {
        // Backend says already reacted — rollback optimistic
        setLocalOverrides(prev => {
          const existing = prev[postId]?.reactions ?? {};
          return {
            ...prev,
            [postId]: {
              ...prev[postId],
              reactions: { ...existing, [type]: Math.max(0, (existing[type] || 1) - 1) }
            }
          };
        });
        if (showToast) showToast('Already reacted! 😊');
        return;
      }
      // Mark as reacted in local state
      setReactedPosts(prev => {
        const existing = prev[postId] ? new Set(prev[postId]) : new Set();
        existing.add(type);
        return { ...prev, [postId]: existing };
      });
      if (showToast) showToast(type === 'hugs' ? 'Hug sent! 🤗' : 'Reaction updated! ❤️');
    } catch (err) {
      console.error('Reaction failed', err);
    }
  };

  // Post a comment — in-flight guard prevents double-sends; add only after server confirms
  const handleComment = async (postId) => {
    const text = (commentInputs[postId] || '').trim();
    if (!text) return;
    // In-flight guard: bail if a send is already in progress for this post
    if (submittingComment.current.has(postId)) return;
    submittingComment.current.add(postId);
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    try {
      const res = await addCommunityComment(postId, text);
      if (res.data?.success) {
        const newComment = res.data.comment;
        setLocalOverrides(prev => {
          const existing = prev[postId]?.commentsList ?? contextPosts.find(p => p.postId === postId)?.commentsList ?? [];
          // Dedup by id: never add the same comment twice
          const alreadyPresent = existing.some(c => c.id === newComment.id);
          if (alreadyPresent) return prev;
          const existingReactions = prev[postId]?.reactions ?? contextPosts.find(p => p.postId === postId)?.reactions ?? {};
          return {
            ...prev,
            [postId]: {
              ...prev[postId],
              commentsList: [...existing, newComment],
              reactions: { ...existingReactions, comments: (existingReactions.comments || 0) + 1 }
            }
          };
        });
        if (showToast) showToast('Comment added! 💬');
      } else if (res.data?.reason === 'duplicate') {
        if (showToast) showToast('Comment already sent!');
      }
    } catch (err) {
      console.error('Comment failed', err);
    } finally {
      submittingComment.current.delete(postId);
    }
  };

  const getSkin = (index) => {
    const mode = index % 3;
    if (mode === 0) return { card: 'card-pink', avatar: 'avatar-pink', icon: <Leaf size={24} />, hug: 'hug-pink' };
    if (mode === 1) return { card: 'card-purple', avatar: 'avatar-purple', icon: <Moon size={24} />, hug: 'hug-purple' };
    return { card: 'card-blue', avatar: 'avatar-white', icon: <Waves size={24} />, hug: 'hug-blue' };
  };

  return (
    <div style={{ position: 'relative', minHeight: '100%', backgroundColor: 'var(--background)' }}>
      <div className="community-container fade-in">
        <div className="community-grid">

          {/* Feed Column */}
          <div className="feed-col">
            <header className="community-header">
              <h1 className="community-title">Anonymous Support</h1>
              <p className="community-subtitle">A safe space for shared experiences. All posts are anonymous.</p>
            </header>

            {isLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
                <Loader2 className="animate-spin" size={40} color="#e040a0" />
              </div>
            ) : posts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#604868', fontStyle: 'italic' }}>
                No posts yet. Be the first to share! 🌸
              </div>
            ) : (
              posts.map((post, index) => {
                const skin = getSkin(index);
                const isBlue = index % 3 === 2;
                const isCommentsOpen = !!expandedComments[post.postId];
                const commentList = post.commentsList || [];

                return (
                  <article key={post.postId} className={`post-card ${skin.card} group`}>
                    {isBlue && (
                      <div style={{ position: 'absolute', right: '-2.5rem', top: '-2.5rem', width: '10rem', height: '10rem', backgroundColor: 'rgba(0,150,204,0.1)', borderRadius: '50%', filter: 'blur(40px)' }} />
                    )}

                    <div style={{ position: 'relative', zIndex: 10 }}>
                      <div className="post-header">
                        <div className={`avatar-icon ${skin.avatar}`}>{skin.icon}</div>
                        <div>
                          <h3 className="post-user" style={isBlue ? { color: '#00334d' } : {}}>{post.userAlias}</h3>
                          <p className="post-meta">{post.timestamp}</p>
                        </div>
                      </div>

                      <p className="post-content" style={isBlue ? { color: '#001a33', fontWeight: 500, fontSize: '1.125rem' } : {}}>
                        {post.content}
                      </p>

                      {post.tags && post.tags.length > 0 && (
                        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                          {post.tags.map((tag, i) => (
                            <span key={i} className="hashtag-pill" style={!isBlue ? { color: '#e040a0', backgroundColor: '#fdf2f8' } : {}}>#{tag}</span>
                          ))}
                        </div>
                      )}

                      {/* Reaction Row */}
                      <div className="post-footer">
                        <div className="post-actions">
                          <button
                            className={`action-btn text-pink${reactedPosts[post.postId]?.has('likes') ? ' reacted' : ''}`}
                            onClick={() => handleReact(post.postId, 'likes')}
                            title={reactedPosts[post.postId]?.has('likes') ? 'Already liked' : 'Like'}
                          >
                            <Heart size={20} fill={reactedPosts[post.postId]?.has('likes') ? 'currentColor' : 'none'} />
                            <span>{post.reactions?.likes || 0}</span>
                          </button>
                          <button
                            className="action-btn text-purple"
                            onClick={() => setExpandedComments(prev => ({ ...prev, [post.postId]: !prev[post.postId] }))}
                          >
                            {isCommentsOpen ? <ChevronUp size={20} /> : <MessageCircle size={20} />}
                            <span>{post.reactions?.comments || 0}</span>
                          </button>
                        </div>
                        <button
                          className={`hug-btn ${skin.hug}${reactedPosts[post.postId]?.has('hugs') ? ' reacted-hug' : ''}`}
                          onClick={() => handleReact(post.postId, 'hugs')}
                          title={reactedPosts[post.postId]?.has('hugs') ? 'Hug already sent' : 'Send Hug'}
                        >
                          <HeartHandshake size={18} /> {reactedPosts[post.postId]?.has('hugs') ? 'Hugged' : 'Send Hug'} ({post.reactions?.hugs || 0})
                        </button>
                      </div>

                      {/* Threaded Comments Panel */}
                      {isCommentsOpen && (
                        <div className="comments-thread">
                          {commentList.length === 0 ? (
                            <p style={{ fontSize: '0.85rem', color: '#a0aec0', fontStyle: 'italic', padding: '0.5rem 0' }}>No replies yet — be the first to respond.</p>
                          ) : (
                            commentList.map(c => (
                              <div key={c.id} className="comment-bubble">
                                <span className="comment-alias">{c.alias}</span>
                                <p className="comment-text">{c.text}</p>
                                <span className="comment-time">{c.timestamp}</span>
                              </div>
                            ))
                          )}
                          <div className="comment-input-row">
                            <input
                              type="text"
                              className="comment-input"
                              placeholder="Reply anonymously..."
                              value={commentInputs[post.postId] || ''}
                              onChange={e => setCommentInputs(prev => ({ ...prev, [post.postId]: e.target.value }))}
                              onKeyDown={e => { if (e.key === 'Enter') handleComment(post.postId); }}
                            />
                            <button
                              className="comment-send-btn"
                              onClick={() => handleComment(post.postId)}
                              disabled={!(commentInputs[post.postId] || '').trim()}
                            >
                              <Send size={14} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>

          {/* Widgets Column */}
          <aside className="widgets-col">
            <div className="widget-card secure-badge">
              <div className="secure-icon"><ShieldCheck size={32} /></div>
              <h4 style={{ fontWeight: 900, fontSize: '1.125rem', color: '#2e1a28', marginBottom: '0.5rem' }}>Safe & Encrypted</h4>
              <p style={{ fontSize: '0.875rem', color: '#604868', lineHeight: 1.6 }}>
                Your identity is never shared. Every post gets a randomly assigned alias — your name is never stored.
              </p>
            </div>

            <div className="widget-card trending-moods">
              <h4 style={{ fontWeight: 900, fontSize: '1.125rem', color: '#2e1a28', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp color="#7c52aa" /> Trending Moods
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span className="mood-tag mood-1">Feeling Reflective</span>
                <span className="mood-tag mood-2">Low Energy</span>
                <span className="mood-tag mood-3">High Focus</span>
                <span className="mood-tag mood-4">Nurturing</span>
                <span className="mood-tag mood-5">Cravings</span>
              </div>
            </div>

            <div className="widget-card" style={{ backgroundColor: '#f8eef8', border: '1px solid #dcc8e0' }}>
              <h4 style={{ fontWeight: 900, color: '#2e1a28', marginBottom: '0.75rem' }}>Community Norms</h4>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem', color: '#604868', fontWeight: 500 }}>
                <li style={{ display: 'flex', gap: '0.5rem' }}><CheckCircle2 size={16} color="#e040a0" style={{ flexShrink: 0 }} /> Lead with empathy and kindness.</li>
                <li style={{ display: 'flex', gap: '0.5rem' }}><CheckCircle2 size={16} color="#e040a0" style={{ flexShrink: 0 }} /> Protect your privacy (and others').</li>
                <li style={{ display: 'flex', gap: '0.5rem' }}><CheckCircle2 size={16} color="#e040a0" style={{ flexShrink: 0 }} /> Shared support, not medical advice.</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>

      {/* Persistent Post Bar */}
      <form onSubmit={handlePost} className="chat-input-wrapper">
        <div className="chat-alias-label">
          Posting as <strong>{currentAlias}</strong> 🌸
        </div>
        <div className="chat-input-container">
          <input
            type="text"
            className="chat-input"
            placeholder="Share your thoughts anonymously..."
            value={inputValue}
            maxLength={MAX_CHARS}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <span style={{ fontSize: '0.75rem', color: inputValue.length > MAX_CHARS * 0.85 ? '#e040a0' : '#a0aec0', whiteSpace: 'nowrap' }}>
            {inputValue.length}/{MAX_CHARS}
          </span>
          <button type="submit" className="chat-send-btn" disabled={!inputValue.trim() || isPosting}>
            {isPosting ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CommunityMode;
