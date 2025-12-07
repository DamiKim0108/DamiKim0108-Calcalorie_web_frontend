const API_BASE_URL = "http://localhost:8000";

document.addEventListener("DOMContentLoaded", () => {
  // ===== DOM 요소 =====
  const profileInput = document.getElementById("profile-image-input");
  const profilePreview = document.getElementById("profile-preview");
  const profilePlaceholder = document.getElementById("profile-placeholder");
  const profileUpload = document.getElementById("profile-upload");
  const profileHelper = document.getElementById("profile-helper");

  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const passwordConfirmInput = document.getElementById("password-confirm");
  const nicknameInput = document.getElementById("nickname");

  const emailHelper = document.getElementById("email-helper");
  const passwordHelper = document.getElementById("password-helper");
  const passwordConfirmHelper = document.getElementById(
    "password-confirm-helper"
  );
  const nicknameHelper = document.getElementById("nickname-helper");

  const formError = document.getElementById("form-error");
  const signupButton = document.getElementById("signup-button");
  const goLoginButton = document.getElementById("go-login-button");
  const signupCard = document.getElementById("signup-card");
  const signupForm = document.getElementById("signup-form");
  const cardBackButton = document.getElementById("card-back-button");

  // 프로필 이미지 데이터 (base64)
  let profileImageData = null;

  // ====================== 프로필 이미지 미리보기 ======================
  profileInput.addEventListener("change", () => {
    const file = profileInput.files[0];

    if (!file) {
      profileImageData = null;
      profilePreview.src = "";
      profilePreview.classList.add("hidden");
      profilePlaceholder.classList.remove("hidden");

      profileHelper.textContent = "프로필 사진을 추가해주세요.";
      profileUpload.classList.add("error");

      updateValidationState();
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      profileImageData = e.target.result;

      profilePreview.src = profileImageData;
      profilePreview.classList.remove("hidden");
      profilePlaceholder.classList.add("hidden");

      profileHelper.textContent = "";
      profileUpload.classList.remove("error");

      updateValidationState();
    };
    reader.readAsDataURL(file);
  });

  // ====================== 유효성 검사 함수들 ======================
  function validateProfileImage() {
    if (!profileImageData) {
      return {
        valid: false,
        message: "프로필 사진을 추가해주세요.",
      };
    }
    return { valid: true, message: "" };
  }

  function validateEmail(value) {
    const email = (value || "").trim();
    if (!email) {
      return {
        valid: false,
        message:
          "올바른 이메일 주소 형식을 입력해주세요. (예: example@example.com)",
      };
    }

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

  function validatePassword(value) {
    const password = (value || "").trim();

    if (!password) {
      return {
        valid: false,
        message: "비밀번호를 입력해주세요.",
      };
    }

    const lengthOk = password.length >= 8 && password.length <= 20;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);

    if (!lengthOk || !hasUpper || !hasLower || !hasDigit || !hasSpecial) {
      return {
        valid: false,
        message:
          "비밀번호는 8~20자이며, 대문자·소문자·숫자·특수문자를 각각 최소 1개 포함해야 합니다.",
      };
    }

    return { valid: true, message: "" };
  }

  function validatePasswordConfirm(password, confirm) {
    const pw = (password || "").trim();
    const conf = (confirm || "").trim();

    if (!conf) {
      return {
        valid: false,
        message: "비밀번호를 한 번 더 입력해주세요.",
      };
    }

    if (pw !== conf) {
      return {
        valid: false,
        message: "비밀번호가 일치하지 않습니다.",
      };
    }

    return { valid: true, message: "" };
  }

  function validateNickname(value) {
    const nickname = (value || "").trim();
    if (!nickname) {
      return {
        valid: false,
        message: "닉네임을 입력해주세요.",
      };
    }

    if (/\s/.test(nickname)) {
      return {
        valid: false,
        message:
          "닉네임에는 띄어쓰기를 사용할 수 없습니다. 띄어쓰기를 없애주세요.",
      };
    }

    if (nickname.length > 10) {
      return {
        valid: false,
        message: "닉네임은 최대 10자까지 입력 가능합니다.",
      };
    }

    return { valid: true, message: "" };
  }

  // ====================== UI 업데이트 ======================
  function updateValidationState() {
    const profileResult = validateProfileImage();
    const emailResult = validateEmail(emailInput.value);
    const passwordResult = validatePassword(passwordInput.value);
    const pwConfirmResult = validatePasswordConfirm(
      passwordInput.value,
      passwordConfirmInput.value
    );
    const nicknameResult = validateNickname(nicknameInput.value);

    // 프로필
    if (!profileResult.valid) {
      profileHelper.textContent = profileResult.message;
      profileUpload.classList.add("error");
    } else {
      profileHelper.textContent = "";
      profileUpload.classList.remove("error");
    }

    // 이메일
    if (!emailResult.valid) {
      emailHelper.textContent = emailResult.message;
      emailInput.parentElement.classList.add("error");
    } else {
      emailHelper.textContent = "";
      emailInput.parentElement.classList.remove("error");
    }

    // 비밀번호
    if (!passwordResult.valid) {
      passwordHelper.textContent = passwordResult.message;
      passwordInput.parentElement.classList.add("error");
    } else {
      passwordHelper.textContent = "";
      passwordInput.parentElement.classList.remove("error");
    }

    // 비밀번호 확인
    if (!pwConfirmResult.valid) {
      passwordConfirmHelper.textContent = pwConfirmResult.message;
      passwordConfirmInput.parentElement.classList.add("error");
    } else {
      passwordConfirmHelper.textContent = "";
      passwordConfirmInput.parentElement.classList.remove("error");
    }

    // 닉네임
    if (!nicknameResult.valid) {
      nicknameHelper.textContent = nicknameResult.message;
      nicknameInput.parentElement.classList.add("error");
    } else {
      nicknameHelper.textContent = "";
      nicknameInput.parentElement.classList.remove("error");
    }

    const canSubmit =
      profileResult.valid &&
      emailResult.valid &&
      passwordResult.valid &&
      pwConfirmResult.valid &&
      nicknameResult.valid;

    signupButton.disabled = !canSubmit;
    if (canSubmit) {
      signupButton.classList.add("enabled");
    } else {
      signupButton.classList.remove("enabled");
    }
  }

  // ====================== 이벤트 바인딩 ======================
  [emailInput, passwordInput, passwordConfirmInput, nicknameInput].forEach(
    (input) => {
      input.addEventListener("input", () => {
        formError.textContent = "";
        signupCard.classList.remove("has-error");
        updateValidationState();
      });
    }
  );

  // 카드 왼쪽 상단 화살표 / 아래 로그인 버튼
  cardBackButton.addEventListener("click", () => {
    window.location.href = "./login.html";
  });
  goLoginButton.addEventListener("click", () => {
    window.location.href = "./login.html";
  });

  // ====================== 회원가입 버튼 클릭 (폼 제출 X) ======================
  signupButton.addEventListener("click", async (event) => {
    event.preventDefault();

    formError.textContent = "";
    signupCard.classList.remove("has-error");

    const profileResult = validateProfileImage();
    const emailResult = validateEmail(emailInput.value);
    const passwordResult = validatePassword(passwordInput.value);
    const pwConfirmResult = validatePasswordConfirm(
      passwordInput.value,
      passwordConfirmInput.value
    );
    const nicknameResult = validateNickname(nicknameInput.value);

    if (
      !profileResult.valid ||
      !emailResult.valid ||
      !passwordResult.valid ||
      !pwConfirmResult.valid ||
      !nicknameResult.valid
    ) {
      updateValidationState();
      signupCard.classList.add("has-error");
      return;
    }

    try {
      signupButton.disabled = true;
      signupButton.textContent = "처리중...";

      const payload = {
        email: emailInput.value.trim(),
        password: passwordInput.value.trim(),
        nickname: nicknameInput.value.trim(),
        profile_image: profileImageData || null,
      };

      const res = await fetch(`${API_BASE_URL}/users/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      // ✅ 회원가입 성공: localStorage 저장 후 바로 이동
      if (res.status === 201 && data?.message === "register_success") {
        console.log("회원가입 성공 -> 로그인 페이지로 이동");

        localStorage.setItem(
          "lastRegisteredUser",
          JSON.stringify({
            email: payload.email,
            nickname: payload.nickname,
          })
        );

        localStorage.setItem("signupSuccess", "true");

        // 바로 이동
        window.location.href = "./login.html";
        return;
      }

      if (res.status === 409 && data?.message === "email_already_exists") {
        emailHelper.textContent = "이미 사용 중인 이메일입니다.";
        emailInput.parentElement.classList.add("error");
        signupCard.classList.add("has-error");
        return;
      }

      if (res.status === 400 && data?.message === "invalid_request") {
        formError.textContent =
          "입력값을 다시 확인해주세요. 모든 필드를 올바르게 입력해야 합니다.";
        signupCard.classList.add("has-error");
        return;
      }

      formError.textContent =
        "회원가입 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
      signupCard.classList.add("has-error");
    } catch (error) {
      console.error(error);
      formError.textContent =
        "서버와 통신 중 오류가 발생했습니다. 네트워크 상태를 확인해주세요.";
      signupCard.classList.add("has-error");
    } finally {
      signupButton.disabled = false;
      signupButton.textContent = "회원가입";
      updateValidationState();
    }
  });

  // 초기 진입 시 한 번 유효성 체크
  updateValidationState();
});
