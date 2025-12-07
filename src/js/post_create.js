// frontend/src/js/post_create.js

const API_BASE_URL = "http://localhost:8000";

const titleInput = document.getElementById("title");
const contentInput = document.getElementById("content");
const imageInput = document.getElementById("image");

const titleHelper = document.getElementById("title-helper");
const contentHelper = document.getElementById("content-helper");
const imageHelper = document.getElementById("image-helper");
const formError = document.getElementById("form-error");
const titleCounter = document.getElementById("title-counter");
const fileCaption = document.getElementById("file-caption");

const titleGroup = document.getElementById("title-group");
const contentGroup = document.getElementById("content-group");
const imageGroup = document.getElementById("image-group");

const submitButton = document.getElementById("submit-button");
const backButton = document.getElementById("back-button");
const postForm = document.getElementById("post-form");

let isSubmitting = false;

// -------------------- 유틸 함수 --------------------

// 제목 검증 (필수, 1~26글자)
function validateTitle(value) {
  const v = (value || "").trim();
  if (!v) {
    return {
      valid: false,
      message: "제목을 입력해주세요.",
    };
  }
  if (v.length > 26) {
    return {
      valid: false,
      message: "제목은 최대 26글자까지 입력 가능합니다.",
    };
  }
  return { valid: true, message: "" };
}

// 내용 검증 (필수)
function validateContent(value) {
  const v = (value || "").trim();
  if (!v) {
    return {
      valid: false,
      message: "내용을 입력해주세요.",
    };
  }
  return { valid: true, message: "" };
}

// 이미지 검증 (선택, 이미지 파일이 아닐 때만 에러)
function validateImage(file) {
  if (!file) {
    return { valid: true, message: "" }; // 선택 안 해도 됨
  }
  if (!file.type.startsWith("image/")) {
    return {
      valid: false,
      message: "이미지 파일만 업로드 가능합니다.",
    };
  }
  return { valid: true, message: "" };
}

// 현재 로그인한 사용자 정보 가져오기
function getCurrentUser() {
  try {
    console.log("=== getCurrentUser 호출 ===");

    const raw = localStorage.getItem("currentUser");

    if (!raw) {
      console.log("❌ localStorage에 currentUser 없음");
      return null;
    }

    console.log("✅ currentUser raw 데이터:", raw);

    const user = JSON.parse(raw);
    console.log("✅ currentUser 파싱 성공:", user);

    if (!user.user_id) {
      console.log("❌ user_id 필드가 없음");
      console.log("전체 user 객체:", JSON.stringify(user, null, 2));
      return null;
    }

    console.log("✅ 최종 반환할 user:", user);
    return user;
  } catch (e) {
    console.error("getCurrentUser 파싱 에러:", e);
    return null;
  }
}

// -------------------- 버튼 활성화 / 에러 표시 --------------------

function updateValidationState() {
  const titleResult = validateTitle(titleInput.value);
  const contentResult = validateContent(contentInput.value);
  const imageResult = validateImage(imageInput.files[0]);

  console.log("🔍 유효성 검사:", {
    title: titleResult,
    content: contentResult,
    image: imageResult,
  });

  // 제목 helper
  if (!titleResult.valid && titleInput.value.trim() !== "") {
    titleHelper.textContent = titleResult.message;
    titleGroup.classList.add("error");
  } else {
    titleHelper.textContent = "";
    titleGroup.classList.remove("error");
  }

  // 내용 helper
  if (!contentResult.valid && contentInput.value.trim() !== "") {
    contentHelper.textContent = contentResult.message;
    contentGroup.classList.add("error");
  } else {
    contentHelper.textContent = "";
    contentGroup.classList.remove("error");
  }

  // 이미지 helper
  if (!imageResult.valid) {
    imageHelper.textContent = imageResult.message;
    imageGroup.classList.add("error");
  } else {
    imageHelper.textContent = "";
    imageGroup.classList.remove("error");
  }

  // 버튼 활성화 기준: 제목 + 내용이 유효
  const canSubmit = titleResult.valid && contentResult.valid;

  if (canSubmit && !isSubmitting) {
    submitButton.classList.add("enabled");
  } else {
    submitButton.classList.remove("enabled");
  }
}

// -------------------- 이벤트 바인딩 --------------------

// 제목 입력: 글자수 + 밸리데이션
titleInput.addEventListener("input", () => {
  const current = titleInput.value;
  if (current.length > 26) {
    titleInput.value = current.slice(0, 26);
  }
  titleCounter.textContent = `${titleInput.value.length} / 26`;

  formError.textContent = "";
  updateValidationState();
});

// 내용 입력
contentInput.addEventListener("input", () => {
  formError.textContent = "";
  updateValidationState();
});

// 이미지 선택
imageInput.addEventListener("change", () => {
  formError.textContent = "";

  const file = imageInput.files[0];
  if (file) {
    fileCaption.textContent = file.name;
  } else {
    fileCaption.textContent = "파일을 선택해주세요.";
  }

  updateValidationState();
});

// -------------------- 폼 제출 --------------------

// ❗ 폼 submit 이벤트에서만 처리 + 기본 submit 완전히 막기
postForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  console.log("🔥 폼 submit 발생!");

  formError.textContent = "";

  // 이미 요청 중이면 중복 제출 방지
  if (isSubmitting) {
    console.log("⚠️ 이미 제출 중...");
    return;
  }

  // 1) 프론트 쪽 기본 검증
  const titleResult = validateTitle(titleInput.value);
  const contentResult = validateContent(contentInput.value);
  const imageResult = validateImage(imageInput.files[0]);

  if (!titleResult.valid || !contentResult.valid) {
    // 제목/내용 에러 → helperText만 보여주고 서버 요청 안함
    formError.textContent = "* 제목과 내용을 모두 작성해주세요.";
    updateValidationState && updateValidationState();
    return;
  }

  if (!imageResult.valid) {
    // 이미지 파일 타입 잘못된 경우
    formError.textContent = imageResult.message;
    updateValidationState && updateValidationState();
    return;
  }

  // 2) 로그인 상태 확인
  const currentUser = getCurrentUser();
  console.log("📝 폼 제출 시 currentUser:", currentUser);

  if (!currentUser || !currentUser.user_id) {
    formError.textContent = "로그인이 필요합니다. 다시 로그인해주세요.";
    console.error("❌ 로그인 정보 없음 - 로그인 페이지로 이동 예정");
    setTimeout(() => {
      window.location.href = "./login.html";
    }, 1500);
    return;
  }

  try {
    isSubmitting = true;
    updateValidationState && updateValidationState();

    // 3) FormData 생성
    const formData = new FormData();
    formData.append("title", titleInput.value.trim());
    formData.append("body", contentInput.value.trim());
    formData.append("user_id", String(currentUser.user_id)); // FastAPI에서 user_id로 받음

    if (imageInput.files[0]) {
      formData.append("image", imageInput.files[0]);
    }

    console.log("📤 서버로 전송할 데이터:", {
      title: titleInput.value.trim(),
      body: contentInput.value.trim(),
      user_id: currentUser.user_id,
      hasImage: !!imageInput.files[0],
    });

    // 4) POST /posts 호출
    const res = await fetch(`${API_BASE_URL}/posts`, {
      method: "POST",
      body: formData, // multipart/form-data 자동 설정
    });

    const data = await res.json().catch(() => null);

    console.log("=".repeat(40));
    console.log("📥 서버 응답 상태:", res.status);
    console.log("📥 서버 응답 전체:", data);
    console.log("=".repeat(40));

    // 4-1) 생성 성공
    // 4-1) 생성 성공
    if (res.status === 201 || res.status === 200) {
      // 🔍 postId 안전하게 추출 (여러 응답 구조 대응)
      let postId = null;

      if (data) {
        // 1) data.data.post.id / post_id
        if (data.data && data.data.post) {
          postId = data.data.post.post_id ?? data.data.post.id ?? null;
        }

        // 2) data.data.id / post_id (post 없이 바로 들어있는 경우)
        if (!postId && data.data) {
          postId = data.data.post_id ?? data.data.id ?? null;
        }

        // 3) data.post.id / post_id (루트에 post 객체가 있는 경우)
        if (!postId && data.post) {
          postId = data.post.post_id ?? data.post.id ?? null;
        }

        // 4) data.id / post_id (아주 단순한 경우)
        if (!postId) {
          postId = data.post_id ?? data.id ?? null;
        }
      }

      console.log("🔍 추출한 postId:", postId, " (type:", typeof postId, ")");
      console.log("🔍 전체 응답 data:", data);

      alert("게시글이 등록되었습니다.");

      if (
        postId !== null &&
        postId !== undefined &&
        String(postId).trim() !== ""
      ) {
        // ✅ 상세 페이지로 이동
        const targetUrl = `./post_detail.html?postId=${postId}`;
        console.log(`✅ 게시글 상세 페이지로 이동: ${targetUrl}`);
        window.location.href = targetUrl;
      } else {
        // postId 못 찾으면 목록으로라도 이동
        console.log(
          "⚠️ postId를 찾을 수 없어 목록 페이지로 이동 (응답 구조 확인 필요)"
        );
        window.location.href = "./posts.html";
      }
      return;
    }

    // 4-2) 입력 오류
    if (res.status === 400) {
      formError.textContent = data?.message || "입력값을 다시 확인해주세요.";
      return;
    }

    // 4-3) 비도덕성(403) 등 기타 에러
    if (res.status === 403 && data?.message === "blocked_toxic_post") {
      alert(
        "비도덕적인 내용이 포함되어 있어 게시글이 등록되지 않았습니다.\n" +
          "내용을 수정한 후 다시 시도해주세요."
      );
      return;
    }

    // 이 외 상태코드는 일단 공통 에러 처리
    alert("게시글 등록 중 오류가 발생했습니다.");
  } catch (error) {
    console.error("❌ 게시글 등록 중 예외:", error);
    alert("서버와 통신 중 오류가 발생했습니다.");
  } finally {
    isSubmitting = false;
    updateValidationState && updateValidationState();
  }
});

// -------------------- 초기화 --------------------

document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 게시글 작성 페이지 로드됨");
  console.log("현재 URL:", window.location.href);

  // 로그인 체크
  const user = getCurrentUser();
  console.log("페이지 로드 시 user:", user);

  if (!user) {
    console.log("❌ 로그인 정보 없음 - 로그인 페이지로 이동 예정");
    alert("로그인이 필요한 페이지입니다.");
    // 필요한 경우 여기서 바로 로그인 페이지로 보내도 됨
    // window.location.href = "./login.html";
    // return;
  } else {
    console.log("✅ 로그인 확인됨:", user);
  }

  titleCounter.textContent = "0 / 26";
  updateValidationState();

  // 제출 버튼 임시 활성화 (원하면 제거 가능)
  submitButton.disabled = false;
  console.log("✅ 제출 버튼 강제 활성화됨");
});
