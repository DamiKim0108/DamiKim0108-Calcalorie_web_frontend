// frontend/src/js/edit_profile.js

const API_BASE_URL = "http://localhost:8000";

document.addEventListener("DOMContentLoaded", () => {
  // ===== DOM 요소들 =====
  const emailInput = document.getElementById("email");
  const nicknameInput = document.getElementById("nickname");
  const nicknameHelper = document.getElementById("nickname-helper");
  const updateButton = document.getElementById("update-button");
  const deleteButton = document.getElementById("delete-button");

  const toast = document.getElementById("toast");

  const profileInput = document.getElementById("profile-image-input");
  const profilePreview = document.getElementById("profile-preview");
  const profileInitial = document.getElementById("profile-initial");

  const deleteModal = document.getElementById("delete-modal");
  const deleteCancel = document.getElementById("delete-cancel");
  const deleteConfirm = document.getElementById("delete-confirm");

  // ===== 상태 =====
  let currentUser = null; // localStorage에 저장된 로그인 유저 정보
  let profileImageData = null; // 새로 업로드한 프로필 이미지(Base64)
  let isUpdating = false;
  let isDeleting = false;

  // ==============================
  // 1. currentUser 로드 + 화면 초기 세팅
  // ==============================
  function loadCurrentUser() {
    const raw = localStorage.getItem("currentUser");
    if (!raw) {
      alert("로그인이 필요합니다.");
      window.location.href = "./login.html";
      return;
    }

    try {
      currentUser = JSON.parse(raw);
    } catch (e) {
      console.error("currentUser 파싱 실패:", e);
      localStorage.removeItem("currentUser");
      alert("로그인 정보가 올바르지 않습니다. 다시 로그인해주세요.");
      window.location.href = "./login.html";
      return;
    }

    // 이메일 / 닉네임 세팅
    emailInput.value = currentUser.email || "";
    nicknameInput.value = currentUser.nickname || "";

    // 프로필 이니셜
    const firstChar = (currentUser.nickname || currentUser.email || "U")
      .charAt(0)
      .toUpperCase();
    profileInitial.textContent = firstChar;

    // 이미 저장된 프로필 이미지가 있으면 미리보기로 표시
    if (currentUser.profile_image) {
      profilePreview.src = currentUser.profile_image;
      profilePreview.classList.remove("hidden");
      profileInitial.classList.add("hidden");
    }
  }

  // ==============================
  // 2. 닉네임 검증 & 에러 표시
  // ==============================
  function setNicknameError(message) {
    if (message) {
      nicknameHelper.textContent = message;
      nicknameInput.classList.add("field-input--error");
    } else {
      nicknameHelper.textContent = "";
      nicknameInput.classList.remove("field-input--error");
    }
  }

  // 프론트에서 한 번 검증 (공백 / 길이 10자 초과)
  function validateNickname() {
    const nickname = nicknameInput.value.trim();

    if (!nickname) {
      setNicknameError("*닉네임을 입력해주세요.");
      return false;
    }

    if (nickname.length > 10) {
      setNicknameError("*닉네임은 최대 10자 까지 작성 가능합니다.");
      return false;
    }

    setNicknameError("");
    return true;
  }

  // 입력 중일 때 실시간으로 에러 문구 정리
  nicknameInput.addEventListener("input", () => {
    if (nicknameHelper.textContent) {
      validateNickname();
    }
  });

  // ==============================
  // 3. 프로필 이미지 업로드 미리보기
  // ==============================
  profileInput.addEventListener("change", () => {
    const file = profileInput.files[0];

    if (!file) {
      profileImageData = null;
      profilePreview.src = "";
      profilePreview.classList.add("hidden");
      profileInitial.classList.remove("hidden");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      profileImageData = e.target.result; // Base64 데이터
      profilePreview.src = profileImageData;
      profilePreview.classList.remove("hidden");
      profileInitial.classList.add("hidden");
    };
    reader.readAsDataURL(file);
  });

  // ==============================
  // 4. 회원정보 수정(PATCH /users/{id})
  // ==============================
  async function handleUpdate() {
    if (!currentUser || isUpdating) return;

    // 프론트단 기본 검증
    if (!validateNickname()) return;

    const payload = {
      nickname: nicknameInput.value.trim(),
    };

    // 새 이미지가 업로드된 경우에만 전송
    if (profileImageData) {
      payload.profile_image = profileImageData;
    }

    isUpdating = true;
    updateButton.disabled = true;

    try {
      const res = await fetch(`${API_BASE_URL}/users/${currentUser.user_id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      // 서버에서 내려준 에러 코드에 따라 helper text 표시
      if (res.status === 400 && data?.message === "nickname_required") {
        setNicknameError("*닉네임을 입력해주세요.");
        return;
      }

      if (res.status === 400 && data?.message === "nickname_too_long") {
        setNicknameError("*닉네임은 최대 10자 까지 작성 가능합니다.");
        return;
      }

      if (res.status === 409 && data?.message === "nickname_duplicated") {
        setNicknameError("*중복된 닉네임 입니다.");
        return;
      }

      if (res.status !== 200 || data?.message !== "update_success") {
        alert("회원정보 수정 중 오류가 발생했습니다.");
        return;
      }

      // ===== 성공 =====
      const updated = data.data;
      currentUser.nickname = updated.nickname;
      if (updated.profile_image) {
        currentUser.profile_image = updated.profile_image;
      }
      localStorage.setItem("currentUser", JSON.stringify(currentUser));

      // 토스트 표시
      showToast();
    } catch (error) {
      console.error(error);
      alert("서버와 통신 중 오류가 발생했습니다.");
    } finally {
      isUpdating = false;
      updateButton.disabled = false;
    }
  }

  updateButton.addEventListener("click", handleUpdate);

  // ==============================
  // 5. 토스트 ("수정완료")
  // ==============================
  function showToast() {
    if (!toast) return;
    toast.classList.remove("hidden");
    setTimeout(() => {
      toast.classList.add("hidden");
    }, 2000);
  }

  // ==============================
  // 6. 회원 탈퇴 모달 & 삭제
  // ==============================
  function openDeleteModal() {
    if (!deleteModal) return;
    deleteModal.classList.remove("hidden");
    deleteModal.classList.add("open");
  }

  function closeDeleteModal() {
    if (!deleteModal) return;
    deleteModal.classList.add("hidden");
    deleteModal.classList.remove("open");
  }

  deleteButton.addEventListener("click", openDeleteModal);
  deleteCancel.addEventListener("click", (e) => {
    e.preventDefault();
    closeDeleteModal();
  });

  // 모달 배경 클릭 시 닫기
  deleteModal.addEventListener("click", (e) => {
    if (e.target === deleteModal) {
      closeDeleteModal();
    }
  });

  async function handleDelete() {
    if (!currentUser || isDeleting) return;
    isDeleting = true;

    try {
      const res = await fetch(`${API_BASE_URL}/users/${currentUser.user_id}`, {
        method: "DELETE",
      });

      if (res.status === 200 || res.status === 204) {
        localStorage.removeItem("currentUser");
        window.location.href = "./login.html";
        return;
      }

      alert("회원 탈퇴 중 오류가 발생했습니다.");
    } catch (error) {
      console.error(error);
      alert("서버와 통신 중 오류가 발생했습니다.");
    } finally {
      isDeleting = false;
      closeDeleteModal();
    }
  }

  deleteConfirm.addEventListener("click", handleDelete);

  // ==============================
  // 7. 초기 실행
  // ==============================
  loadCurrentUser();
});
