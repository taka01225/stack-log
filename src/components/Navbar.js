import "./Navbar.css";
import React from 'react'
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHouse, faFilePen, faArrowRightFromBracket, faUser } from '@fortawesome/free-solid-svg-icons'
import { auth } from '../firebase';
import { faBell } from '@fortawesome/free-solid-svg-icons';

const Navbar = ({ isAuth }) => {
  return (
    <nav>
      <Link to="/" className="site-title">
        StackLog
      </Link>

      <div className="nav-links">
        <Link to="/">
          <FontAwesomeIcon icon={faHouse} />
          ホーム
        </Link>

        {!isAuth ? (
          <Link to="/login">
            <FontAwesomeIcon icon={faArrowRightFromBracket} />
            ログイン
          </Link>
        ) : (
          <>
            <Link to="/createpost">
              <FontAwesomeIcon icon={faFilePen} />
              記録する
            </Link>
            
            <Link to="/mypage">
              <FontAwesomeIcon icon={faUser} />
              マイページ
            </Link>

            <Link to="/notifications">
              <FontAwesomeIcon icon={faBell} />
              通知
            </Link>
            
            <Link to="/logout">
              <FontAwesomeIcon icon={faArrowRightFromBracket} />
              ログアウト
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;