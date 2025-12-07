// frontend/src/js/posts.js - 수정 버전

const API_BASE_URL = "http://localhost:8000";
const POSTS_LIMIT = 10;

const postsList = document.getElementById("posts-list");
const loadingEl = document.getElementById("loading");
const endMessageEl = document.getElementById("end-message");
const writeButton = document.getElementById("write-button");
const profileCircle = document.getElementById("profile-circle");

let offset = 0;
let isLoading = false;
let isEnd = false;

// 날짜 포맷
function formatDateTime(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return isoString;

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

// 숫자 포맷
function formatCount(n) {
  if (n == null) return "0";
  const num = Number(n);
  if (Number.isNaN(num)) return "0";
  if (num >= 1000) {
    const k = Math.floor(num / 1000);
    return `${k}k`;
  }
  return String(num);
}

// 제목 26자 제한
function trimTitle(title) {
  if (!title) return "";
  const t = String(title);
  if (t.length <= 26) return t;
  return t.slice(0, 26) + "…";
}

// DOM 렌더링
function createPostCard(post) {
  const card = document.createElement("article");
  card.className = "post-card";

  const titleRow = document.createElement("div");
  titleRow.className = "post-title-row";

  const titleEl = document.createElement("div");
  titleEl.className = "post-title";
  titleEl.textContent = trimTitle(post.title || "(제목 없음)");

  const dateEl = document.createElement("div");
  dateEl.className = "post-date";
  dateEl.textContent = formatDateTime(post.created_at || post.createdAt);

  titleRow.appendChild(titleEl);
  titleRow.appendChild(dateEl);

  const metaRow = document.createElement("div");
  metaRow.className = "post-meta-row";

  const authorEl = document.createElement("div");
  authorEl.className = "post-author";

  const avatar = document.createElement("div");
  avatar.className = "post-author-avatar";

  const authorName = document.createElement("span");
  authorName.textContent = post.author_nickname || post.nickname || "익명";

  authorEl.appendChild(avatar);
  authorEl.appendChild(authorName);

  const statsEl = document.createElement("div");
  statsEl.className = "post-stats";

  const likeSpan = document.createElement("span");
  likeSpan.textContent = `좋아요 ${formatCount(
    post.like_count || post.likes || 0
  )}`;

  const commentSpan = document.createElement("span");
  commentSpan.textContent = `댓글 ${formatCount(
    post.comment_count || post.comments || 0
  )}`;

  const viewSpan = document.createElement("span");
  viewSpan.textContent = `조회수 ${formatCount(
    post.view_count || post.views || 0
  )}`;

  statsEl.appendChild(likeSpan);
  statsEl.appendChild(commentSpan);
  statsEl.appendChild(viewSpan);

  metaRow.appendChild(authorEl);
  metaRow.appendChild(statsEl);

  card.appendChild(titleRow);
  card.appendChild(metaRow);

  // 카드 클릭 시 상세 페이지로 이동
  card.addEventListener("click", () => {
    const postId = Number(post.id || post.post_id);

    if (!postId || isNaN(postId)) {
      alert("이동할 게시글 ID가 올바르지 않습니다.");
      return;
    }

    window.location.href = `./post_detail.html?postId=${postId}`;
  });

  return card;
}

// API 호출
async function loadPosts() {
  if (isLoading || isEnd) return;

  isLoading = true;
  loadingEl.classList.remove("hidden");

  try {
    const url = `${API_BASE_URL}/posts?offset=${offset}&limit=${POSTS_LIMIT}`;
    console.log("📍 게시글 조회 URL:", url);

    const res = await fetch(url);
    console.log("📊 응답 상태:", res.status);

    if (!res.ok) {
      console.error("❌ HTTP 에러:", res.status, res.statusText);
      loadingEl.classList.add("hidden");
      isLoading = false;
      return;
    }

    const data = await res.json();
    console.log("📥 응답 전체 데이터:", data);
    console.log("📥 data.data:", data?.data);
    console.log("📥 data.posts:", data?.posts);

    // 다양한 응답 구조 대응
    let posts = [];
    if (Array.isArray(data)) {
      posts = data; // 바로 배열이면 사용
    } else if (data && Array.isArray(data.data)) {
      posts = data.data; // data 필드가 배열
    } else if (data && Array.isArray(data.posts)) {
      posts = data.posts; // posts 필드가 배열
    } else if (data && data.data && Array.isArray(data.data.posts)) {
      posts = data.data.posts; // data.posts
    }

    console.log("✅ 추출된 posts 배열:", posts);
    console.log("✅ posts 개수:", posts.length);

    if (posts.length === 0) {
      isEnd = true;
      endMessageEl.classList.remove("hidden");
      loadingEl.classList.add("hidden");
      isLoading = false;
      return;
    }

    posts.forEach((post) => {
      const card = createPostCard(post);
      postsList.appendChild(card);
    });

    offset += posts.length;

    if (posts.length < POSTS_LIMIT) {
      isEnd = true;
      endMessageEl.classList.remove("hidden");
    }
  } catch (error) {
    console.error("❌ loadPosts 오류:", error);
    alert("게시글을 불러올 수 없습니다.");
  } finally {
    loadingEl.classList.add("hidden");
    isLoading = false;
  }
}

// 인피니트 스크롤
function handleScroll() {
  if (isLoading || isEnd) return;

  const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
  if (scrollTop + clientHeight >= scrollHeight - 200) {
    loadPosts();
  }
}

// 초기화
function initCurrentUser() {
  try {
    const raw = localStorage.getItem("currentUser");
    if (!raw) return;
    const user = JSON.parse(raw);
    const firstChar = (user.nickname || user.email || "U")
      .charAt(0)
      .toUpperCase();
    profileCircle.textContent = firstChar;
  } catch {
    // 무시
  }
}

function init() {
  console.log("🚀 posts.js 초기화 시작");

  initCurrentUser();
  loadPosts();

  window.addEventListener("scroll", handleScroll);

  writeButton.addEventListener("click", () => {
    window.location.href = "./post_create.html";
  });
}

document.addEventListener("DOMContentLoaded", init);
