import React, { useEffect, useState } from 'react';
import { db, auth } from "../firebase";
import { collection, getDocs, deleteDoc, doc, updateDoc, arrayUnion, arrayRemove, addDoc, serverTimestamp, query, orderBy, limit, where } from "firebase/firestore";
import "./Home.css";
import { useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faClock, faFolderOpen, faTrophy, faCrown } from '@fortawesome/free-solid-svg-icons';
import { faHeart as faHeartReg } from '@fortawesome/free-regular-svg-icons';
import CommentSection from './CommentSection';

const Home = () => {
  const [postList, setPostList] = useState([]);
  const [ranking, setRanking] = useState([]); 
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const getData = async () => {
      const q = query(collection(db, "posts"), where("isDraft", "==", false));
      const data = await getDocs(collection(db, "posts"));
      
      const formattedData = data.docs
        .map((doc) => ({ ...doc.data(), id: doc.id }))
        .filter(post => post.isDraft !== true); 

      formattedData.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      setPostList(formattedData);

      const usersSnap = await getDocs(collection(db, "users"));
      const usersData = usersSnap.docs.map(doc => ({...doc.data(), id: doc.id}));
      
      usersData.sort((a, b) => (b.totalStudyTime || 0) - (a.totalStudyTime || 0));
      setRanking(usersData.slice(0, 3)); 
    };
    getData();
  }, []);

  const handleDelete = async (id) => {
    if(!window.confirm("本当に削除しますか？")) return;
    try {
      await deleteDoc(doc(db, "posts", id));
      setPostList(postList.filter((post) => post.id !== id));
    } catch (error) { console.error(error); }
  };

  const handleLike = async (post) => {
    if (!auth.currentUser) return;
    const isLiked = post.likedUsers?.includes(auth.currentUser.uid);
    const postRef = doc(db, "posts", post.id);

    try {
      if (isLiked) {
        await updateDoc(postRef, {
          likedUsers: arrayRemove(auth.currentUser.uid),
          likes: post.likes - 1
        });
        setPostList(postList.map(p => p.id === post.id ? {...p, likedUsers: p.likedUsers.filter(id => id !== auth.currentUser.uid), likes: p.likes - 1} : p));
      } else {
        await updateDoc(postRef, {
          likedUsers: arrayUnion(auth.currentUser.uid),
          likes: (post.likes || 0) + 1
        });
        
        if (post.author.id !== auth.currentUser.uid) {
            await addDoc(collection(db, "notifications"), {
                type: "like",
                fromUser: auth.currentUser.uid,
                fromName: auth.currentUser.displayName,
                toUser: post.author.id,
                postId: post.id,
                postTitle: post.title,
                timestamp: serverTimestamp(),
                read: false
            });
        }

        setPostList(postList.map(p => p.id === post.id ? {...p, likedUsers: [...(p.likedUsers || []), auth.currentUser.uid], likes: (p.likes || 0) + 1} : p));
      }
    } catch (error) { console.error(error); }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    return timestamp.toDate().toLocaleString('ja-JP', {
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
    });
  };

  const filteredPosts = postList.filter((post) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      post.title?.toLowerCase().includes(searchLower) ||
      post.postText?.toLowerCase().includes(searchLower) ||
      post.category?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="homePage">
      <div className="rankingContainer">
        <h3 className="rankingTitle"><FontAwesomeIcon icon={faTrophy} style={{color: "#f1c40f"}} /> 今週の学習リーダー</h3>
        <div className="rankingList">
            {ranking.map((user, index) => (
                <Link to={`/profile/${user.id}`} key={user.id} className="rankingItem">
                    <div className={`rankBadge rank-${index + 1}`}>
                        {index === 0 && <FontAwesomeIcon icon={faCrown} />} {index + 1}
                    </div>
                    <div className="rankUser">
                        <span className="rankName">{user.displayName || "ユーザー"}</span>
                        <span className="rankTime">{user.totalStudyTime || 0} min</span>
                    </div>
                </Link>
            ))}
            {ranking.length === 0 && <p style={{fontSize:"12px", color:"#888"}}>まだデータがありません</p>}
        </div>
      </div>

      <div className="searchContainer">
        <input type="text" placeholder="キーワードまたはカテゴリで検索..." onChange={(e) => setSearchQuery(e.target.value)} />
      </div>

      {filteredPosts.map((post) => (
        <div className="postContents" key={post.id}>
          <div className="postHeader"><h1>{post.title}</h1></div>
          
          <div className="studyInfoContainer">
            {post.studyTime > 0 && <span className="timeBadge"><FontAwesomeIcon icon={faClock} /> {post.studyTime} min</span>}
            {post.category && <span className="categoryBadge"><FontAwesomeIcon icon={faFolderOpen} /> {post.category}</span>}
          </div>

          <div className="postTextContainer">
            {post.imageURL && <img src={post.imageURL} alt="post" className="postImage" onError={(e) => e.target.style.display = 'none'} />}
            <ReactMarkdown>{post.postText}</ReactMarkdown>
          </div>
          
          <div className="postFooter">
            <div className="postDate">{formatDate(post.timestamp)}</div>
            <div className="likeArea">
                <button className="likeButton" onClick={() => handleLike(post)}>
                    <FontAwesomeIcon icon={post.likedUsers?.includes(auth.currentUser?.uid) ? faHeart : faHeartReg} style={{color: post.likedUsers?.includes(auth.currentUser?.uid) ? "#ff4b4b" : "#888"}} /> 
                    {post.likes || 0}
                </button>
            </div>
            <div className="nameAndDeleteButton">
              <Link to={`/profile/${post.author.id}`} style={{textDecoration: "none", color: "inherit"}}>
                <h3>@{post.author.username}</h3>
              </Link>
              
              {post.author.id === auth.currentUser?.uid && (
                <>
                  <button className="editButton" onClick={() => navigate(`/edit/${post.id}`)}>編集</button>
                  <button onClick={() => handleDelete(post.id)}>削除</button>
                </>
              )}
            </div>
          </div>
          <CommentSection postId={post.id} />
        </div>
      ))}
    </div>
  );
};

export default Home;