import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { fetchArticleMetadata } from '../services/api';
import { ArrowLeft, Loader2 } from 'lucide-react';
import './ArticleView.css';

const ArticleView = ({ articleId, onBack }) => {
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadArticle = async () => {
            try {
                setLoading(true);
                const res = await fetchArticleMetadata(articleId);
                const { url, content, title, author, phaseTag } = res.data;
                
                if (url) {
                    // Fallback routing in case internal logic reaches here
                    window.open(url, "_blank");
                    onBack();
                    return;
                }
                
                setArticle({ content, title, author, phaseTag });
            } catch (err) {
                console.error("Failed to load article", err);
                setError("Failed to load the article. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        if (articleId) {
            loadArticle();
        }
    }, [articleId, onBack]);

    if (loading) {
        return (
            <div className="article-container article-loader fade-in">
                <Loader2 className="animate-spin" size={48} />
                <p style={{ marginTop: '1rem', fontWeight: 600 }}>Gathering insights...</p>
            </div>
        );
    }

    if (error || !article) {
        return (
            <div className="article-container fade-in">
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <button className="back-button" onClick={onBack}>
                        <ArrowLeft size={20} /> Back to Dashboard
                    </button>
                </div>
                <div className="article-content-wrapper article-error">
                    <h2>Oops!</h2>
                    <p>{error || "Article not found."}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="article-container fade-in">
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <button className="back-button" onClick={onBack}>
                    <ArrowLeft size={20} /> Back to Dashboard
                </button>
            </div>
            
            <article className="article-content-wrapper">
                <header className="article-header">
                    {article.phaseTag && <span className="article-tag">{article.phaseTag} Tip</span>}
                    <h1 className="article-title" style={{ marginTop: '1rem' }}>{article.title}</h1>
                    <div className="article-meta">
                        <span>By {article.author || 'Predict Her Team'}</span>
                    </div>
                </header>
                <div 
                    className="article-body"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.content) }}
                />
            </article>
        </div>
    );
};

export default ArticleView;
