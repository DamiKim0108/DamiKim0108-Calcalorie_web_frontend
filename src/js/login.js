// login.js

// 백엔드 FastAPI 주소에 맞게 수정
const API_BASE_URL = "http://localhost:8000";

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const emailHelper = document.getElementById("email-helper");
const passwordHelper = document.getElementById("password-helper");
const formError = document.getElementById("form-error");
const loginButton = document.getElementById("login-button");
const signupButton = document.getElementById("signup-button");
const loginCard = document.getElementById("login-card");
const loginForm = document.getElementById("login-form");

// 이메일 형식 검사
function validateEmail(value) {
  const email = (value || "").trim();
  if (!email) {
    return {
      valid: false,
      message:
        "올바른 이메일 주소 형식을 입력해주세요. (예: example@example.com)",
    };
  }

  // 간단한 이메일 정규식
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email) || email.length < 5) {
    return {
      valid: false,
      message:
        "올바른 이메일 주소 형식을 입력해주세요. (예: example@example.com)",
    };
  }

  return { valid: true, message: "" };
}

// 비밀번호 형식 검사
function validatePassword(value) {
  const password = (value || "").trim();

  if (!password) {
    return {
      valid: false,
      message: "비밀번호를 입력해주세요",
    };
  }

  // 8~20자, 대문자/소문자/숫자/특수문자 각각 최소 1개
  const lengthOk = password.length >= 8 && password.length <= 20;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  if (!lengthOk || !hasUpper || !hasLower || !hasDigit || !hasSpecial) {
    return {
      valid: false,
      message:
        "비밀번호는 8자 이상, 20자 이하이며, 대문자, 소문자, 숫자, 특수문자를 각각 최소 1개 포함해야 합니다.",
    };
  }

  return { valid: true, message: "" };
}

// 입력 값에 따라 UI 갱신 (버튼 색상, 에러 표시 등)
function updateValidationState() {
  const emailResult = validateEmail(emailInput.value);
  const passwordResult = validatePassword(passwordInput.value);

  // 이메일 메시지
  if (!emailResult.valid && emailInput.value.trim() !== "") {
    emailHelper.textContent = emailResult.message;
    emailInput.parentElement.classList.add("error");
  } else {
    emailHelper.textContent = "";
    emailInput.parentElement.classList.remove("error");
  }

  // 비밀번호 메시지
  // ✅ 수정 버전: 비밀번호가 비어 있든 아니든, invalid면 항상 helper 표시
  if (!passwordResult.valid) {
    passwordHelper.textContent = passwordResult.message; // "비밀번호를 입력해주세요" 포함
    passwordInput.parentElement.classList.add("error");
  } else {
    passwordHelper.textContent = "";
    passwordInput.parentElement.classList.remove("error");
  }

  // 둘 다 유효하면 버튼 활성화 + 색상 변경
  const canSubmit = emailResult.valid && passwordResult.valid;

  loginButton.disabled = !canSubmit;
  if (canSubmit) {
    loginButton.classList.add("enabled"); // #7F6AEE
  } else {
    loginButton.classList.remove("enabled"); // #ACA0EB
  }

  // 에러 테두리는 폼 제출 시 따로 제어
}

// 이메일/비밀번호 입력할 때마다 유효성 업데이트
emailInput.addEventListener("input", () => {
  formError.textContent = "";
  loginCard.classList.remove("has-error");
  updateValidationState();
});

passwordInput.addEventListener("input", () => {
  formError.textContent = "";
  loginCard.classList.remove("has-error");
  updateValidationState();
});

// 로그인 폼 제출
loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  formError.textContent = "";
  loginCard.classList.remove("has-error");

  const emailResult = validateEmail(emailInput.value);
  const passwordResult = validatePassword(passwordInput.value);

  // 클라이언트 유효성 검사 실패 시
  if (!emailResult.valid || !passwordResult.valid) {
    updateValidationState(); // 메시지 다시 표시
    loginCard.classList.add("has-error");
    return;
  }

  try {
    loginButton.disabled = true;

    const res = await fetch(`${API_BASE_URL}/users/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: emailInput.value.trim(),
        password: passwordInput.value.trim(),
      }),
    });

    const data = await res.json().catch(() => null);

    console.log("=".repeat(50));
    console.log("🔍 로그인 응답 상태 코드:", res.status);
    console.log("🔍 로그인 응답 전체:", data);
    console.log("🔍 응답 타입:", typeof data);
    console.log("🔍 응답 키들:", data ? Object.keys(data) : "null");
    console.log("🔍 data.data:", data?.data);
    console.log("🔍 data.user_id:", data?.user_id);
    console.log("🔍 data.id:", data?.id);
    console.log("=".repeat(50));

    // HTTP 상태 코드/메시지에 따라 분기
    if (res.status === 200) {
      console.log("✅ 로그인 성공");

      // ✅ 백엔드 응답 구조 확인 및 데이터 추출
      let userData = null;

      // 케이스 1: { data: { user_id, email, nickname } }
      if (data?.data && typeof data.data === "object") {
        console.log("케이스 1: data.data 사용");
        userData = data.data;
      }
      // 케이스 2: { user_id, email, nickname } 직접 반환
      else if (data?.user_id || data?.id) {
        console.log("케이스 2: data 직접 사용");
        userData = data;
      }
      // 케이스 3: 다른 필드명일 수 있음
      else if (data?.user) {
        console.log("케이스 3: data.user 사용");
        userData = data.user;
      }

      console.log("📦 추출된 userData:", userData);
      console.log("📦 userData 타입:", typeof userData);
      console.log(
        "📦 userData가 객체인가?",
        userData && typeof userData === "object"
      );
      console.log(
        "📦 빈 객체인가?",
        userData && Object.keys(userData).length === 0
      );

      // ✅ 필수 필드 검증
      if (!userData || !userData.user_id) {
        console.error("❌ 백엔드 응답에 user_id가 없습니다:", data);
        formError.textContent =
          "로그인 처리 중 오류가 발생했습니다. (user_id 없음)";
        loginCard.classList.add("has-error");
        return;
      }

      // ✅ localStorage에 저장
      const userToSave = {
        user_id: userData.user_id,
        email: userData.email || emailInput.value.trim(),
        nickname: userData.nickname || "",
      };

      console.log("💾 localStorage에 저장할 데이터:", userToSave);

      localStorage.setItem(
        "currentUser",
        JSON.stringify({
          user_id: data.data.user_id,
          email: data.data.email,
          nickname: data.data.nickname,
          profile_image: data.data.profile_image, // 추가
        })
      );

      // 저장 확인
      const saved = localStorage.getItem("currentUser");
      console.log("✅ 저장 확인:", saved);

      // ✅ 게시글 목록 페이지로 이동
      window.location.href = "./posts.html";
      return;
    }

    // 404 : 등록되지 않은 회원
    if (res.status === 404 && data?.message === "user_not_found") {
      formError.textContent =
        "등록되지 않은 회원입니다! 회원가입을 진행해주세요!";
      loginCard.classList.add("has-error");
      return;
    }

    // 401: 아이디/비밀번호 불일치
    if (res.status === 401 && data?.message === "unauthorized") {
      passwordHelper.textContent = "아이디 또는 비밀번호를 확인해주세요.";
      passwordInput.parentElement.classList.add("error");
      loginCard.classList.add("has-error");
      return;
    }

    // 400: invalid_request 등
    if (res.status === 400 && data?.message === "invalid_request") {
      formError.textContent =
        "이메일과 비밀번호를 모두 입력했는지 확인해주세요.";
      loginCard.classList.add("has-error");
      return;
    }

    // 그 외 에러
    formError.textContent =
      "로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
    loginCard.classList.add("has-error");
  } catch (error) {
    console.error("로그인 에러:", error);
    formError.textContent =
      "서버와 통신 중 오류가 발생했습니다. 네트워크 상태를 확인해주세요.";
    loginCard.classList.add("has-error");
  } finally {
    // 다시 입력 가능하도록
    loginButton.disabled = false;
    updateValidationState();
  }
});

// 회원가입 버튼 클릭 → 회원가입 페이지로 이동
signupButton.addEventListener("click", () => {
  window.location.href = "./signup.html";
});
