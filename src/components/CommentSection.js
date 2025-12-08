import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, query, where, onSnapshot, orderBy, serverTimestamp } from 'firebase/firestore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faCommentDots } from '@fortawesome/free-solid-svg-icons';
import "./Home.css";

const CommentSection = ({ postId }) => {
  const [comments, setComments] = useState([]);
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, "comments"),
      where("postId", "==", postId),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    });

    return () => unsubscribe();
  }, [postId]);

  const sendMessage = async () => {
    if (input === "") return;
    await addDoc(collection(db, "comments"), {
      text: input,
      postId: postId,
      timestamp: serverTimestamp(),
      author: {
        username: auth.currentUser ? auth.currentUser.displayName : "ゲスト",
        id: auth.currentUser ? auth.currentUser.uid : "guest"
      }
    });
    setInput("");
  };

  return (
    <div className="commentSection">
      <button onClick={() => setIsOpen(!isOpen)} className="toggleCommentBtn">
        <FontAwesomeIcon icon={faCommentDots} /> コメント ({comments.length})
      </button>

      {isOpen && (
        <div className="commentArea">
          <div className="commentList">
            {comments.map((comment) => (
              <div key={comment.id} className="commentBubble">
                <div className="commentAuthor">{comment.author.username}</div>
                <div className="commentText">{comment.text}</div>
              </div>
            ))}
            {comments.length === 0 && <p className="noComments">まだコメントはありません</p>}
          </div>

          {auth.currentUser && (
            <div className="commentInputContainer">
              <input
                type="text"
                placeholder="コメントを入力..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <button onClick={sendMessage}>
                <FontAwesomeIcon icon={faPaperPlane} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommentSection;