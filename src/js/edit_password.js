// frontend/src/js/edit_password.js

const API_BASE_URL = "http://localhost:8000";

// 요소 참조
const passwordInput = document.getElementById("password");
const passwordConfirmInput = document.getElementById("password-confirm");

const passwordHelper = document.getElementById("password-helper");
const passwordConfirmHelper = document.getElementById(
  "password-confirm-helper"
);

const submitButton = document.getElementById("change-password-button");
const passwordForm = document.getElementById("password-form");

// ============================
// 🔐 비밀번호 유효성 검사 함수
// ============================
function validatePassword(pw) {
  const lengthOk = pw.length >= 8 && pw.length <= 20;
  const upper = /[A-Z]/.test(pw);
  const lower = /[a-z]/.test(pw);
  const number = /[0-9]/.test(pw);
  const special = /[^A-Za-z0-9]/.test(pw);

  return lengthOk && upper && lower && number && special;
}

// ============================
// 🔍 실시간 입력 검사
// ============================
function handleValidation() {
  const pw = passwordInput.value.trim();
  const pw2 = passwordConfirmInput.value.trim();

  let isValid = true;

  // -------- 비밀번호 검사 --------
  if (!pw) {
    passwordHelper.textContent = "*비밀번호를 입력해주세요.";
    isValid = false;
  } else if (!validatePassword(pw)) {
    passwordHelper.textContent =
      "*비밀번호는 8~20자이며 대문자, 소문자, 숫자, 특수문자를 각각 최소 1개 포함해야 합니다.";
    isValid = false;
  } else {
    passwordHelper.textContent = "";
  }

  // -------- 비밀번호 확인 검사 --------
  if (!pw2) {
    passwordConfirmHelper.textContent = "*비밀번호를 한 번 더 입력해주세요.";
    isValid = false;
  } else if (pw !== pw2) {
    passwordConfirmHelper.textContent = "*비밀번호 확인과 다릅니다.";
    isValid = false;
  } else {
    passwordConfirmHelper.textContent = "";
  }

  // -------- 버튼 활성화 --------
  if (isValid) {
    submitButton.disabled = false;
    submitButton.classList.add("enabled");
  } else {
    submitButton.disabled = true;
    submitButton.classList.remove("enabled");
  }
}

// ============================
// 이벤트 등록
// ============================
passwordInput.addEventListener("input", handleValidation);
passwordConfirmInput.addEventListener("input", handleValidation);

// ============================
// 토스트 메시지 표시 함수
// ============================
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.remove("hidden");
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
    toast.classList.add("hidden");
  }, 3500);
}

// ============================
// 비밀번호 변경 요청
// ============================
submitButton.addEventListener("click", async (e) => {
  e.preventDefault();

  const pw = passwordInput.value.trim();
  const pw2 = passwordConfirmInput.value.trim();

  if (!pw || !pw2 || pw !== pw2) {
    showToast("비밀번호를 확인해주세요");
    return;
  }

  const user = JSON.parse(localStorage.getItem("currentUser"));
  if (!user) {
    alert("로그인이 필요합니다.");
    window.location.href = "./login.html";
    return;
  }

  // 버튼 비활성화 (중복 클릭 방지)
  submitButton.disabled = true;
  submitButton.textContent = "수정 중...";

  try {
    const res = await fetch(`${API_BASE_URL}/users/${user.user_id}/password`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ new_password: pw }),
    });

    console.log("✅ 응답 상태:", res.status);
    const data = await res.json();
    console.log("✅ 응답 데이터:", data);

    if (!res.ok) {
      showToast("비밀번호 변경 실패");
      submitButton.disabled = false;
      submitButton.textContent = "수정하기";
      return;
    }

    // ✅ 성공! 토스트 메시지 표시
    console.log("✅ 비밀번호 변경 성공!");
    showToast("✅ 비밀번호가 변경되었습니다");

    // 입력 필드 초기화
    passwordInput.value = "";
    passwordConfirmInput.value = "";
    submitButton.disabled = true;
    submitButton.textContent = "수정하기";
    handleValidation();
  } catch (err) {
    console.error("❌ 요청 오류:", err);
    showToast("서버 연결 오류");
    submitButton.disabled = false;
    submitButton.textContent = "수정하기";
  }
});
