import React, { useEffect, useState } from 'react';
import "./CreatePost.css"; 
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate, useParams } from 'react-router-dom';

const EditPost = ({ isAuth }) => {
  const [title, setTitle] = useState("");
  const [postText, setPostText] = useState("");
  const { id } = useParams(); 
  const navigate = useNavigate();

  useEffect(() => {
    const getPost = async () => {
      const docRef = doc(db, "posts", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setTitle(docSnap.data().title);
        setPostText(docSnap.data().postText);
      } else {
        console.log("No such document!");
      }
    };
    getPost();
  }, [id]);

  const updatePost = async () => {
    if (!title || !postText) {
        alert("タイトルと内容を入力してください");
        return;
    }

    const docRef = doc(db, "posts", id);
    await updateDoc(docRef, {
      title: title,
      postText: postText
    });
    navigate("/");
  };

  useEffect(() => {
    if (!isAuth) {
      navigate("/login");
    }
  }, [isAuth, navigate]);

  return (
    <div className='createPostPage'>
      <div className='postContainer'>
        <h1>記事を編集する</h1>
        <div className='inputGp'>
          <div>タイトル</div>
          <input 
            type='text' 
            placeholder="タイトルを記入"
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
          />
        </div>
        <div className='inputPost'>
          <div>内容 (Markdown対応)</div>
          <textarea 
            placeholder='投稿内容を記入' 
            value={postText} 
            onChange={(e) => setPostText(e.target.value)}
          ></textarea>
        </div>
        <button className='postButton' onClick={updatePost}>更新する</button>
      </div>
    </div>
  );
};

export default EditPost;