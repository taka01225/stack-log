import React, { useEffect, useState } from 'react';
import { db, auth } from "../firebase";
import { collection, query, where, getDocs, deleteDoc, doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, addDoc, serverTimestamp } from "firebase/firestore";
import "./Home.css"; 
import { useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faMapMarkerAlt, faLink, faBullseye, faLock } from '@fortawesome/free-solid-svg-icons'; 

import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const Mypage = ({ isAuth }) => {
  const { id } = useParams(); 
  const [displayPosts, setDisplayPosts] = useState([]);
  const [activeTab, setActiveTab] = useState("post");
  const [userProfile, setUserProfile] = useState({ bio: "", location: "", website: "", headerColor: "#607d8b", followers: [], following: [], goal: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [inputProfile, setInputProfile] = useState({});
  
  const [heatmapValues, setHeatmapValues] = useState([]);
  const [graphData, setGraphData] = useState([]); 

  const navigate = useNavigate();
  const currentPageUserId = id || auth.currentUser?.uid;
  const isMyProfile = currentPageUserId === auth.currentUser?.uid;

  useEffect(() => {
    if (!isAuth) { navigate("/login"); return; }
    if (!currentPageUserId) return; 

    const getData = async () => {
      const userDoc = await getDoc(doc(db, "users", currentPageUserId));
      if (userDoc.exists()) {
        setUserProfile(userDoc.data());
        if(isMyProfile) setInputProfile(userDoc.data());
      } else {
        setUserProfile({ bio: "", location: "", website: "", headerColor: "#607d8b", followers: [], following: [], goal: "" });
      }

      const postsRef = collection(db, "posts");
      
      const allMyPostsQ = query(postsRef, where("author.id", "==", currentPageUserId), where("isDraft", "==", false));
      const allMyPostsSnap = await getDocs(allMyPostsQ);
      
      const counts = {};
      const weeklyData = [
          { day: 'Sun', time: 0 }, { day: 'Mon', time: 0 }, { day: 'Tue', time: 0 }, 
          { day: 'Wed', time: 0 }, { day: 'Thu', time: 0 }, { day: 'Fri', time: 0 }, { day: 'Sat', time: 0 }
      ];

      allMyPostsSnap.docs.forEach(doc => {
        const data = doc.data();
        if (data.timestamp) {
            const dateObj = data.timestamp.toDate();
            const dateStr = dateObj.toISOString().split('T')[0];
            counts[dateStr] = (counts[dateStr] || 0) + 1;

            const dayIndex = dateObj.getDay(); 
            if(data.studyTime) {
                weeklyData[dayIndex].time += data.studyTime;
            }
        }
      });
      setHeatmapValues(Object.keys(counts).map(date => ({ date: date, count: counts[date] })));
      setGraphData(weeklyData);

      let newData = [];
      
      if (activeTab === "draft") {
         if (isMyProfile) {
            const draftQ = query(postsRef, where("author.id", "==", currentPageUserId), where("isDraft", "==", true));
            const data = await getDocs(draftQ);
            newData = data.docs.map(doc => ({ ...doc.data(), id: doc.id }));
         }
      } else if (activeTab === "reply") {
        const commentsQ = query(collection(db, "comments"), where("author.id", "==", currentPageUserId));
        const commentsData = await getDocs(commentsQ);
        const postIds = [...new Set(commentsData.docs.map(doc => doc.data().postId))];
        if (postIds.length > 0) {
            const promises = postIds.map(id => getDoc(doc(db, "posts", id)));
            const docs = await Promise.all(promises);
            newData = docs.filter(d => d.exists()).map(d => ({...d.data(), id: d.id}));
        }
      } else {
        let q;
        if (activeTab === "post") {
            q = query(postsRef, where("author.id", "==", currentPageUserId), where("isDraft", "==", false));
        } else if (activeTab === "media") {
            q = query(postsRef, where("author.id", "==", currentPageUserId), where("isDraft", "==", false));
        } else if (activeTab === "like") {
            q = query(postsRef, where("likedUsers", "array-contains", currentPageUserId));
        }
        
        if (q) {
            const data = await getDocs(q);
            newData = data.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        }
      }

      if (activeTab === "media") {
        newData = newData.filter(post => post.imageURL && post.imageURL !== "");
      }
      
      newData.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      setDisplayPosts(newData);
    };

    getData();
  }, [currentPageUserId, isAuth, navigate, activeTab, isMyProfile]);

  const handleSaveProfile = async () => {
    await setDoc(doc(db, "users", currentPageUserId), inputProfile, { merge: true });
    setUserProfile(inputProfile);
    setIsEditing(false);
  };

  const handleDelete = async (postId) => {
    if(window.confirm("削除しますか？")) {
        await deleteDoc(doc(db, "posts", postId));
        setDisplayPosts(displayPosts.filter((post) => post.id !== postId));
    }
  };

  const handleFollow = async () => {
    const myId = auth.currentUser.uid;
    const targetId = currentPageUserId;
    const isFollowing = userProfile.followers?.includes(myId);

    try {
        if (isFollowing) {
            await updateDoc(doc(db, "users", targetId), { followers: arrayRemove(myId) });
            await updateDoc(doc(db, "users", myId), { following: arrayRemove(targetId) });
            setUserProfile(prev => ({...prev, followers: prev.followers.filter(uid => uid !== myId)}));
        } else {
            await updateDoc(doc(db, "users", targetId), { followers: arrayUnion(myId) });
            await setDoc(doc(db, "users", myId), { following: arrayUnion(targetId) }, { merge: true });
            
            await addDoc(collection(db, "notifications"), {
                type: "follow",
                fromUser: myId,
                fromName: auth.currentUser.displayName,
                toUser: targetId,
                timestamp: serverTimestamp(),
                read: false
            });

            setUserProfile(prev => ({...prev, followers: [...(prev.followers || []), myId]}));
        }
    } catch (err) {
        if(!userProfile.followers) {
             await setDoc(doc(db, "users", targetId), { followers: [myId] }, { merge: true });
             await setDoc(doc(db, "users", myId), { following: [targetId] }, { merge: true });
             window.location.reload();
        }
    }
  };

  const joinedDate = auth.currentUser?.metadata?.creationTime 
    ? new Date(auth.currentUser.metadata.creationTime).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' }) 
    : "不明";
  const today = new Date();
  const shiftDate = (date, numDays) => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + numDays);
    return newDate;
  };

  return (
    <div className="homePage">
      <div className="myPageContainer">
        <div className="profileHeader">
            <div className="headerBanner" style={{backgroundColor: userProfile.headerColor}}></div>
            <div className="profileContent">
                <div className="profileTopRow">
                    <div className="profileIcon">
                        <img src={isMyProfile ? auth.currentUser?.photoURL : "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png"} alt="icon" />
                    </div>
                    {isMyProfile ? (
                        <button className="editProfileBtn" onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}>
                            {isEditing ? "保存する" : "プロフィールを編集"}
                        </button>
                    ) : (
                        <button 
                            className="editProfileBtn" 
                            style={{
                                backgroundColor: userProfile.followers?.includes(auth.currentUser.uid) ? "white" : "black",
                                color: userProfile.followers?.includes(auth.currentUser.uid) ? "black" : "white",
                                borderColor: "black"
                            }}
                            onClick={handleFollow}
                        >
                            {userProfile.followers?.includes(auth.currentUser.uid) ? "フォロー中" : "フォローする"}
                        </button>
                    )}
                </div>
                
                <h2 className="profileName">{isMyProfile ? auth.currentUser?.displayName : "ユーザー"}</h2>
                <p className="profileId">@{currentPageUserId?.slice(0, 8)}</p>

                {isEditing ? (
                    <div className="editForm">
                        <div style={{marginBottom: "10px"}}>
                            <label style={{fontSize:"12px", fontWeight:"bold", color:"#555"}}>現在の目標</label>
                            <input type="text" placeholder="例: 毎日コードを書く！" value={inputProfile.goal || ""} onChange={(e) => setInputProfile({...inputProfile, goal: e.target.value})} style={{marginTop: "5px"}}/>
                        </div>
                        <textarea placeholder="自己紹介" value={inputProfile.bio || ""} onChange={(e) => setInputProfile({...inputProfile, bio: e.target.value})} />
                        <input type="text" placeholder="場所" value={inputProfile.location || ""} onChange={(e) => setInputProfile({...inputProfile, location: e.target.value})} />
                        <input type="text" placeholder="Webサイト" value={inputProfile.website || ""} onChange={(e) => setInputProfile({...inputProfile, website: e.target.value})} />
                    </div>
                ) : (
                    <div className="profileMetaContainer">
                        {userProfile.goal && (
                            <div className="profileGoal">
                                <FontAwesomeIcon icon={faBullseye} style={{color: "#ff4b4b"}} /> 
                                <span className="goalTitle">Current Goal:</span>
                                <span className="goalText">{userProfile.goal}</span>
                            </div>
                        )}
                        <p className="profileBio">{userProfile.bio || ""}</p>
                        <div className="profileMeta">
                            {userProfile.location && <span><FontAwesomeIcon icon={faMapMarkerAlt} /> {userProfile.location}</span>}
                            {userProfile.website && <span><FontAwesomeIcon icon={faLink} /> <a href={userProfile.website}>{userProfile.website}</a></span>}
                            <span><FontAwesomeIcon icon={faCalendarAlt} /> {joinedDate}から利用</span>
                        </div>
                        <div className="profileStats">
                            <span><strong>{userProfile.following?.length || 0}</strong> フォロー</span>
                            <span><strong>{userProfile.followers?.length || 0}</strong> フォロワー</span>
                        </div>

                        <div className="heatmapContainer">
                            <h4 className="heatmapTitle">Stack Log (Activity)</h4>
                            <CalendarHeatmap
                                startDate={shiftDate(today, -150)}
                                endDate={today}
                                values={heatmapValues}
                                classForValue={(value) => !value ? 'color-empty' : `color-scale-${Math.min(value.count, 4)}`}
                                showWeekdayLabels={true}
                            />
                            
                            <h4 className="heatmapTitle" style={{marginTop:"20px"}}>Total Study Time (曜日別累計)</h4>
                            <div style={{ width: '100%', height: 200 }}>
                                <ResponsiveContainer>
                                    <BarChart data={graphData}>
                                        <XAxis dataKey="day" fontSize={12} />
                                        <YAxis fontSize={12} />
                                        <Tooltip />
                                        <Bar dataKey="time" fill="#4b85ff" radius={[4, 4, 0, 0]} barSize={30} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="profileTabs">
                <div className={`tab ${activeTab === "post" ? "active" : ""}`} onClick={() => setActiveTab("post")}>記録</div>
                <div className={`tab ${activeTab === "reply" ? "active" : ""}`} onClick={() => setActiveTab("reply")}>返信</div>
                <div className={`tab ${activeTab === "media" ? "active" : ""}`} onClick={() => setActiveTab("media")}>画像</div>
                <div className={`tab ${activeTab === "like" ? "active" : ""}`} onClick={() => setActiveTab("like")}>お気に入り</div>
                {isMyProfile && (
                     <div className={`tab ${activeTab === "draft" ? "active" : ""}`} onClick={() => setActiveTab("draft")}>下書き</div>
                )}
            </div>
        </div>

        <div className="feedArea">
            {displayPosts.length > 0 ? (
                displayPosts.map((post) => (
                <div className="postContents simplePost" key={post.id}>
                    <div className="postHeader"><h1>{post.title}</h1></div>
                    
                    {post.isDraft && (
                        <div style={{textAlign:"center", marginBottom:"10px"}}>
                            <span style={{backgroundColor:"#888", color:"white", padding:"2px 8px", borderRadius:"4px", fontSize:"12px"}}>
                                <FontAwesomeIcon icon={faLock} /> 下書き
                            </span>
                        </div>
                    )}

                    <div className="postTextContainer">
                        {post.imageURL && <img src={post.imageURL} alt="post" className="postImage" style={{maxHeight: "150px"}} onError={(e) => e.target.style.display = 'none'} />}
                        <p>{post.postText.length > 50 ? post.postText.substring(0, 50) + "..." : post.postText}</p>
                    </div>
                    {isMyProfile && (
                        <div className="postFooter" style={{justifyContent: "flex-end", gap: "10px"}}>
                             <button className="editButton" style={{backgroundColor: "#4b85ff", color: "white", border:"none", padding:"5px 10px", borderRadius:"5px", cursor:"pointer"}} onClick={() => navigate(`/edit/${post.id}`)}>編集</button>
                             <button style={{backgroundColor: "#ff4b4b", color: "white", border:"none", padding:"5px 10px", borderRadius:"5px", cursor:"pointer"}} onClick={() => handleDelete(post.id)}>削除</button>
                        </div>
                    )}
                </div>
                ))
            ) : (
                <h3 style={{textAlign: "center", marginTop: "30px", color: "#888"}}>投稿はありません</h3>
            )}
        </div>
      </div>
    </div>
  );
};

export default Mypage;