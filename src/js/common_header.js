// frontend/src/js/common_header.js

const HEADER_POSTS_PAGE = "./posts.html";
const HEADER_EDIT_PROFILE_PAGE = "./edit_profile.html";
const HEADER_CHANGE_PASSWORD_PAGE = "./edit_password.html";
const HEADER_LOGIN_PAGE = "./login.html";

// 🔒 중복 실행 방지
if (window.commonHeaderInitialized) {
  console.warn("⚠️ common_header.js가 이미 로드되었습니다. 중복 실행 방지.");
} else {
  window.commonHeaderInitialized = true;

  // 현재 로그인 유저 가져오기
  function getCurrentUser() {
    try {
      const raw = localStorage.getItem("currentUser");
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.warn("currentUser 파싱 실패:", e);
      return null;
    }
  }

  function initHeader() {
    console.log("🎨 common_header.js 초기화 시작");

    const profileCircle = document.getElementById("profile-circle");
    const profileMenu = document.getElementById("profile-menu");
    //const backButton = document.getElementById("back-button");

    // 가운데 로고 텍스트
    const headerTitle =
      document.querySelector(".top-bar-center") ||
      document.querySelector(".top-bar-title");

    // 1) 왼쪽 상단 화살표: 각 페이지 JS에서 처리하도록 변경
    // ⚠️ post_detail.js 같은 개별 페이지에서 backButton을 처리하므로
    //    여기서는 data-back-handler 속성이 없는 경우만 처리
    //if (backButton && !backButton.dataset.backHandler) {
    //  backButton.addEventListener("click", (e) => {
    //    e.preventDefault();
    //    window.location.href = HEADER_POSTS_PAGE;
    //  });
    //}

    // 2) 가운데 제목 클릭: 게시글 목록 페이지로 이동
    if (headerTitle) {
      headerTitle.style.cursor = "pointer";
      headerTitle.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = HEADER_POSTS_PAGE;
      });
    }

    // 3) 프로필 관련
    if (!profileCircle) {
      console.log("ℹ️ 프로필 영역 없음");
      return;
    }

    // 3-1) 로그인 유저 정보로 프로필 동그라미 표시
    const currentUser = getCurrentUser();
    if (currentUser) {
      if (
        currentUser.profile_image &&
        currentUser.profile_image.trim() !== ""
      ) {
        // 프로필 이미지가 있을 때
        profileCircle.style.backgroundImage = `url(${currentUser.profile_image})`;
        profileCircle.style.backgroundSize = "cover";
        profileCircle.style.backgroundPosition = "center";
        profileCircle.style.backgroundRepeat = "no-repeat";
        profileCircle.textContent = "";
      } else {
        // 이미지가 없을 때 → 이니셜 표시
        const firstChar = (currentUser.nickname || currentUser.email || "U")
          .charAt(0)
          .toUpperCase();
        profileCircle.textContent = firstChar;
        profileCircle.style.backgroundImage = "";
      }
    } else {
      profileCircle.textContent = "U";
      profileCircle.style.backgroundImage = "";
    }

    // 3-2) 드롭다운 열기/닫기
    if (profileMenu) {
      // 프로필 클릭 시 토글
      profileCircle.addEventListener("click", (e) => {
        e.stopPropagation();
        profileMenu.classList.toggle("open");
      });

      // 바깥 클릭 시 닫기
      document.addEventListener("click", (e) => {
        if (e.target !== profileCircle && !profileMenu.contains(e.target)) {
          profileMenu.classList.remove("open");
        }
      });

      // 3-3) 메뉴 항목 클릭 동작
      profileMenu.addEventListener("click", (e) => {
        const item = e.target.closest(".profile-menu__item");
        if (!item) return;

        const action = item.dataset.action;
        if (action === "edit-profile") {
          window.location.href = HEADER_EDIT_PROFILE_PAGE;
        } else if (action === "change-password") {
          window.location.href = HEADER_CHANGE_PASSWORD_PAGE;
        } else if (action === "logout") {
          localStorage.removeItem("currentUser");
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          window.location.href = HEADER_LOGIN_PAGE;
        }
      });
    }

    console.log("✅ common_header.js 초기화 완료");
  }

  // 🔒 단 한 번만 실행
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initHeader, { once: true });
  } else {
    initHeader();
  }
}
