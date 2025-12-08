import React from 'react'
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import "./CreatePost.css"; 

const Logout = ({ setIsAuth }) => {
  const navigate = useNavigate();
  const logout = () => {
    signOut(auth).then(() => {
      localStorage.clear();
      setIsAuth(false);
      navigate("/login");
    });
  };

  return (
    <div className="createPostPage">
      <div className="postContainer" style={{height: "auto", padding: "50px 40px"}}>
        <h1>ログアウト</h1>
        <p style={{textAlign: "center", color: "#666", marginBottom: "20px"}}>
            ログアウトしますか？
        </p>
        <button 
            className="postButton" 
            onClick={logout}
            style={{backgroundColor: "#ff4b4b"}} 
        >
            ログアウト
        </button>
      </div>
    </div>
  );
}

export default Logout;