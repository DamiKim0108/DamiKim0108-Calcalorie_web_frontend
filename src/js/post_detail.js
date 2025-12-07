// frontend/src/js/post_detail.js - 최종 안정화 버전 (back-button 제거 버전)
const API_BASE_URL = "http://localhost:8000";

(function () {
  "use strict";

  // ====== 중복 실행 방지 ======
  if (window.__POST_DETAIL_INITIALIZED__) return;
  window.__POST_DETAIL_INITIALIZED__ = true;

  console.log("🚀 post_detail.js 초기화");

  // ====== DOM 요소 가져오기 ======
  const profileCircle = document.getElementById("profile-circle");

  const postTitleEl = document.getElementById("post-title");
  const postAuthorNameEl = document.getElementById("post-author-name");
  const postCreatedAtEl = document.getElementById("post-created-at");
  const postContentEl = document.getElementById("post-content");
  const postImageWrapperEl = document.getElementById("post-image-wrapper");
  const postImageEl = document.getElementById("post-image");

  const likeButtonEl = document.getElementById("like-button");
  const likeCountEl = document.getElementById("like-count");
  const viewCountEl = document.getElementById("view-count");
  const commentCountEl = document.getElementById("comment-count");

  const editPostButton = document.getElementById("edit-post-button");
  const deletePostButton = document.getElementById("delete-post-button");

  const commentInputEl = document.getElementById("comment-input");
  const commentSubmitButton = document.getElementById("comment-submit-button");
  const commentsListEl = document.getElementById("comments-list");

  // 모달
  const postDeleteModalBackdrop = document.getElementById(
    "post-delete-modal-backdrop"
  );
  const postDeleteCancelBtn = document.getElementById("post-delete-cancel");
  const postDeleteConfirmBtn = document.getElementById("post-delete-confirm");

  const commentDeleteModalBackdrop = document.getElementById(
    "comment-delete-modal-backdrop"
  );
  const commentDeleteCancelBtn = document.getElementById(
    "comment-delete-cancel"
  );
  const commentDeleteConfirmBtn = document.getElementById(
    "comment-delete-confirm"
  );

  // ====== 상태 관리 ======
  let currentPostId = null;
  let isLiked = false;
  let currentLikeCount = 0;
  let editingCommentId = null;
  let currentCommentIdForDelete = null;

  // -----------------------------------------------------
  //  유틸 함수
  // -----------------------------------------------------

  function getPostIdFromURL() {
    return new URLSearchParams(location.search).get("postId");
  }

  function formatDateTime(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(
      2,
      "0"
    )}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  function formatCount(n) {
    return n >= 1000 ? `${Math.floor(n / 1000)}k` : String(n || 0);
  }

  function initCurrentUserCircle() {
    try {
      const raw = localStorage.getItem("currentUser");
      if (!raw) return;
      const user = JSON.parse(raw);

      profileCircle.textContent = (user.nickname || user.email || "U")
        .charAt(0)
        .toUpperCase();
    } catch {}
  }

  // -----------------------------------------------------
  //  렌더링
  // -----------------------------------------------------

  function renderPostDetail(post, commentCount = 0) {
    postTitleEl.textContent = post.title || "(제목 없음)";
    postAuthorNameEl.textContent = post.author || post.nickname || "익명";
    postCreatedAtEl.textContent = formatDateTime(
      post.created_at || post.createdAt
    );
    postContentEl.textContent = post.content || post.body || "";

    // 이미지
    const img = post.image_url || post.imageUrl;
    if (img) {
      postImageEl.src = img.startsWith("http") ? img : `${API_BASE_URL}${img}`;
      postImageWrapperEl.style.display = "flex";
    } else {
      postImageWrapperEl.style.display = "none";
    }

    // 좋아요
    currentLikeCount = post.like_count ?? post.likes ?? 0;
    isLiked = !!post.is_liked;
    updateLikeButtonUI();

    // 조회수 / 댓글
    viewCountEl.textContent = formatCount(post.view_count || post.views);
    commentCountEl.textContent = formatCount(commentCount);
  }

  function updateLikeButtonUI() {
    likeButtonEl.classList.toggle("enabled", isLiked);
    likeCountEl.textContent = formatCount(currentLikeCount);
  }

  // 댓글 카드 만들기
  function createCommentCard(comment) {
    const el = document.createElement("article");
    el.className = "comment-card";
    el.dataset.commentId = comment.id;

    el.innerHTML = `
      <div class="comment-header">
        <div class="comment-info">
          <div class="comment-avatar"></div>
          <div class="comment-meta">
            <div class="comment-author">${comment.nickname || "익명"}</div>
            <div class="comment-date">${formatDateTime(
              comment.created_at
            )}</div>
          </div>
        </div>
        <div class="comment-actions">
          <button class="comment-action-button edit-btn">수정</button>
          <button class="comment-action-button danger delete-btn">삭제</button>
        </div>
      </div>
      <div class="comment-content">${comment.content}</div>
    `;

    el.querySelector(".edit-btn").addEventListener("click", () => {
      editingCommentId = comment.id;
      commentInputEl.value = comment.content;
      commentSubmitButton.textContent = "댓글 수정";
      updateCommentButtonState();
    });

    el.querySelector(".delete-btn").addEventListener("click", () => {
      currentCommentIdForDelete = comment.id;
      openCommentDeleteModal();
    });

    return el;
  }

  function renderComments(list) {
    commentsListEl.innerHTML = "";
    list.forEach((c) => commentsListEl.appendChild(createCommentCard(c)));
  }

  // -----------------------------------------------------
  //  API
  // -----------------------------------------------------

  async function fetchPostDetail() {
    try {
      const res = await fetch(`${API_BASE_URL}/posts/${currentPostId}`);
      const json = await res.json();

      const post = json.data?.post || json.post || json.data || json;
      const comments = json.data?.comments || json.comments || [];

      renderPostDetail(post, comments.length);
      renderComments(comments);
    } catch (err) {
      alert("게시글을 불러오는 중 오류가 발생했습니다.");
    }
  }

  async function toggleLike() {
    if (!currentPostId) return;
    isLiked = !isLiked;
    currentLikeCount += isLiked ? 1 : -1;
    updateLikeButtonUI();

    try {
      await fetch(`${API_BASE_URL}/posts/${currentPostId}/like`, {
        method: "POST",
      });
    } catch {}
  }

  async function submitComment() {
    const content = commentInputEl.value.trim();
    if (!content) return;

    const user = JSON.parse(localStorage.getItem("currentUser") || "{}");
    if (!user.user_id) {
      alert("로그인이 필요합니다.");
      return (location.href = "./login.html");
    }

    const url = editingCommentId
      ? `${API_BASE_URL}/comments/${editingCommentId}`
      : `${API_BASE_URL}/posts/${currentPostId}/comments`;

    const method = editingCommentId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, author_id: user.user_id }),
      });

      if (!res.ok) return alert("댓글 처리 실패");

      commentInputEl.value = "";
      commentSubmitButton.textContent = "댓글 등록";
      editingCommentId = null;

      await fetchPostDetail();
    } catch {
      alert("댓글 처리 오류");
    }
  }

  async function deletePost() {
    try {
      const res = await fetch(`${API_BASE_URL}/posts/${currentPostId}`, {
        method: "DELETE",
      });
      if (!res.ok) return alert("삭제 실패");

      alert("게시글이 삭제되었습니다.");
      location.href = "./posts.html";
    } catch {
      alert("삭제 중 오류 발생");
    }
  }

  async function deleteComment() {
    try {
      const res = await fetch(
        `${API_BASE_URL}/comments/${currentCommentIdForDelete}`,
        { method: "DELETE" }
      );
      if (!res.ok) return alert("댓글 삭제 실패");

      closeCommentDeleteModal();
      await fetchPostDetail();
    } catch {
      alert("댓글 삭제 오류");
    }
  }

  // -----------------------------------------------------
  //  모달
  // -----------------------------------------------------

  function openPostDeleteModal() {
    postDeleteModalBackdrop.classList.remove("hidden");
  }
  function closePostDeleteModal() {
    postDeleteModalBackdrop.classList.add("hidden");
  }

  function openCommentDeleteModal() {
    commentDeleteModalBackdrop.classList.remove("hidden");
  }
  function closeCommentDeleteModal() {
    commentDeleteModalBackdrop.classList.add("hidden");
  }

  // -----------------------------------------------------
  //  이벤트 바인딩
  // -----------------------------------------------------

  function bindEvents() {
    likeButtonEl.addEventListener("click", toggleLike);
    commentInputEl.addEventListener("input", updateCommentButtonState);
    commentSubmitButton.addEventListener("click", submitComment);

    editPostButton.addEventListener("click", () => {
      location.href = `./post_edit.html?postId=${currentPostId}`;
    });

    deletePostButton.addEventListener("click", openPostDeleteModal);
    postDeleteCancelBtn.addEventListener("click", closePostDeleteModal);
    postDeleteConfirmBtn.addEventListener("click", deletePost);

    commentDeleteCancelBtn.addEventListener("click", closeCommentDeleteModal);
    commentDeleteConfirmBtn.addEventListener("click", deleteComment);
  }

  function updateCommentButtonState() {
    const active = commentInputEl.value.trim().length > 0;
    commentSubmitButton.disabled = !active;
    commentSubmitButton.classList.toggle("enabled", active);
  }

  // -----------------------------------------------------
  //  초기화
  // -----------------------------------------------------

  async function init() {
    currentPostId = getPostIdFromURL();
    if (
      currentPostId === null ||
      currentPostId === "" ||
      currentPostId === "undefined" ||
      currentPostId === "null" ||
      isNaN(Number(currentPostId))
    ) {
      alert("잘못된 접근입니다.");
      location.href = "./posts.html";
      return;
    }
    initCurrentUserCircle();
    bindEvents();
    updateCommentButtonState();
    await fetchPostDetail();
  }

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", init, { once: true })
    : init();
})();
