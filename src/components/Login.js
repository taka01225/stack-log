import React from 'react'
import { auth, provider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import "./CreatePost.css"; 

const Login = ({ setIsAuth }) => {
  const navigate = useNavigate();
  
  const loginInWithGoogle = () => {
    provider.setCustomParameters({
        prompt: 'select_account'
    });

    signInWithPopup(auth, provider)
      .then((result) => {
        localStorage.setItem("isAuth", true);
        setIsAuth(true);
        navigate("/");
      })
      .catch((error) => {
        if (error.code === 'auth/cancelled-popup-request') {
            console.log("ログインがキャンセルされました（ウィンドウが閉じられたか、連打されました）");
        } else if (error.code === 'auth/popup-closed-by-user') {
            console.log("ユーザーによってポップアップが閉じられました");
        } else {
            console.error("ログインエラー:", error);
        }
      });
  };

  return (
    <div className="createPostPage">
      <div className="postContainer" style={{height: "auto", padding: "50px 40px"}}>
        <h1>ログイン</h1>
        <p style={{textAlign: "center", color: "#666", marginBottom: "20px"}}>
            StackLogを始めるためにログインしてください
        </p>
        <button 
            className="postButton" 
            onClick={loginInWithGoogle}
            style={{display: "flex", justifyContent: "center", alignItems: "center", gap: "10px"}}
        >
            Googleでログイン
        </button>
      </div>
    </div>
  );
}

export default Login;