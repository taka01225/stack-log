import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, getDocs, orderBy, updateDoc, doc } from 'firebase/firestore';
import "./Home.css"; 
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faUser } from '@fortawesome/free-solid-svg-icons';

const Notifications = ({ isAuth }) => {
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuth) navigate("/login");

    const getNotifications = async () => {
      const q = query(
        collection(db, "notifications"), 
        where("toUser", "==", auth.currentUser.uid),
        orderBy("timestamp", "desc")
      );
      
      const data = await getDocs(q);
      const formatted = data.docs.map(doc => ({...doc.data(), id: doc.id}));
      setNotifications(formatted);

      formatted.forEach(async (notif) => {
        if(!notif.read) {
            await updateDoc(doc(db, "notifications", notif.id), { read: true });
        }
      });
    };

    getNotifications();
  }, [isAuth, navigate]);

  return (
    <div className="homePage">
      <div className="myPageContainer">
         <h2 style={{textAlign: "center", padding: "20px", borderBottom: "1px solid #eee"}}>通知</h2>
         {notifications.length > 0 ? (
             notifications.map((notif) => (
                 <div key={notif.id} className="simplePost" style={{display: "flex", alignItems: "center", gap: "15px"}}>
                     <div style={{fontSize: "24px", width: "40px", textAlign: "center"}}>
                        {notif.type === "like" ? (
                            <FontAwesomeIcon icon={faHeart} style={{color: "#ff4b4b"}} />
                        ) : (
                            <FontAwesomeIcon icon={faUser} style={{color: "#4b85ff"}} />
                        )}
                     </div>
                     
                     <div>
                        {notif.type === "like" ? (
                            <p>
                                <strong>{notif.fromName}</strong>さんが
                                あなたの投稿「{notif.postTitle}」にいいねしました
                            </p>
                        ) : (
                            <p>
                                <strong>{notif.fromName}</strong>さんが
                                あなたをフォローしました
                            </p>
                        )}
                        <p style={{fontSize: "12px", color: "#888", marginTop: "5px"}}>
                            {notif.timestamp?.toDate().toLocaleString()}
                        </p>
                     </div>
                 </div>
             ))
         ) : (
             <h3 style={{textAlign: "center", padding: "40px", color: "#888"}}>まだ通知はありません</h3>
         )}
      </div>
    </div>
  );
};

export default Notifications;