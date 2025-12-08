import React, { useEffect, useState } from 'react';
import "./CreatePost.css";
import { addDoc, collection, serverTimestamp, doc, updateDoc, increment, getDoc } from 'firebase/firestore'; 
import { db, auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faList, faSave } from '@fortawesome/free-solid-svg-icons'; 

const CreatePost = ({ isAuth }) => {
  const [title, setTitle] = useState("");
  const [postText, setPostText] = useState("");
  const [studyTime, setStudyTime] = useState(0);
  const [category, setCategory] = useState("プログラミング");
  const [imageURL, setImageURL] = useState(""); 
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const categories = ["プログラミング", "英語", "資格試験", "読書", "学校の課題", "その他"];

  const createPost = async (isDraft = false) => {
    if (!title || !postText) {
      alert("タイトルと内容を入力してください");
      return;
    }
    if (studyTime < 0) {
        alert("学習時間は0分以上で入力してください");
        return;
    }
    
    setIsLoading(true);

    try {
      await addDoc(collection(db, "posts"), {
        title: title,
        postText: postText,
        studyTime: Number(studyTime),
        category: category,
        tags: [category],
        imageURL: imageURL, 
        likedUsers: [],
        likes: 0,
        isDraft: isDraft,
        author: {
          username: auth.currentUser.displayName,
          id: auth.currentUser.uid
        },
        timestamp: serverTimestamp()
      });

      if (!isDraft && studyTime > 0) {
        const userRef = doc(db, "users", auth.currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            await updateDoc(userRef, { totalStudyTime: increment(Number(studyTime)) });
        } else {
        }
      }

      if (isDraft) {
        alert("下書き保存しました！");
      }
      navigate("/");
    } catch (error) {
      console.error(error);
      alert("処理に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuth) {
      navigate("/login");
    }
  }, [isAuth, navigate]);

  return (
    <div className='createPostPage'>
      <div className='postContainer'>
        <h1>今日の積み上げを記録</h1>
        
        <div className='inputGp'>
          <div>タイトル</div>
          <input type='text' placeholder="例: ReactのHooksを勉強した" onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div style={{display: "flex", gap: "20px"}}>
            <div className='inputGp' style={{flex: 1}}>
                <div><FontAwesomeIcon icon={faClock} /> 学習時間 (分)</div>
                <input type='number' placeholder="分" min="0" onChange={(e) => setStudyTime(e.target.value)} />
            </div>
            <div className='inputGp' style={{flex: 1}}>
                <div><FontAwesomeIcon icon={faList} /> カテゴリ</div>
                <select onChange={(e) => setCategory(e.target.value)} style={{width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd"}}>
                    {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                </select>
            </div>
        </div>

        <div className='inputGp'>
          <div>画像URL (任意)</div>
          <input type='text' placeholder="画像のURLを貼り付け" onChange={(e) => setImageURL(e.target.value)} value={imageURL} />
          {imageURL && (
            <div className="imagePreviewContainer">
                <p style={{fontSize: "12px", color: "#666", marginBottom: "5px"}}>プレビュー:</p>
                <img src={imageURL} alt="プレビュー" onError={(e) => e.target.style.display = 'none'} />
            </div>
          )}
        </div>

        <div className='inputPost'>
          <div style={{display: "flex", justifyContent: "space-between"}}>
            <div>メモ・感想</div>
            <div style={{fontSize: "12px", color: postText.length > 200 ? "red" : "#666"}}> {postText.length}文字 </div>
          </div>
          <textarea placeholder='内容を記入' onChange={(e) => setPostText(e.target.value)}></textarea>
        </div>

        <div style={{display: "flex", gap: "15px", marginTop: "10px"}}>
            <button 
                className='postButton' 
                style={{backgroundColor: "#888", flex: 1}}
                onClick={() => createPost(true)} 
                disabled={isLoading}
            >
                <FontAwesomeIcon icon={faSave} /> 下書き保存
            </button>

            <button 
                className='postButton' 
                style={{flex: 2}}
                onClick={() => createPost(false)} 
                disabled={isLoading}
            >
                {isLoading ? "処理中..." : "記録する（公開）"}
            </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;