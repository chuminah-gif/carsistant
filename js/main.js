// 공통 UI 스크립트: 모바일 내비게이션 토글 + 상위/하위 드롭다운 메뉴 + 로그인 상태에 따른 내비 영역 표시
document.addEventListener("DOMContentLoaded", function () {
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      nav.classList.toggle("open");
      var expanded = nav.classList.contains("open");
      toggle.setAttribute("aria-expanded", expanded ? "true" : "false");
    });
  }

  document.querySelectorAll(".dropdown-toggle").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var item = btn.closest(".nav-item");
      var wasOpen = item.classList.contains("open");
      document.querySelectorAll(".nav-item.open").forEach(function (openItem) {
        openItem.classList.remove("open");
      });
      if (!wasOpen) item.classList.add("open");
    });
  });

  document.addEventListener("click", function () {
    document.querySelectorAll(".nav-item.open").forEach(function (item) {
      item.classList.remove("open");
    });
  });

  renderAuthNav();
});

// 헤더의 #authNavSlot에 로그인 상태에 따라 로그인/회원가입 또는 내 차고/로그아웃 링크를 채웁니다.
function renderAuthNav() {
  var slot = document.getElementById("authNavSlot");
  if (!slot || typeof supabaseClient === "undefined") return;

  var prefix = slot.getAttribute("data-prefix") || "";

  supabaseClient.auth.getSession().then(function (res) {
    var session = res.data && res.data.session;
    if (session) {
      slot.innerHTML =
        '<a href="' + prefix + 'dashboard.html">내 차고</a>' +
        '<a href="#" id="navSignOut">로그아웃</a>';
      var signOutLink = document.getElementById("navSignOut");
      if (signOutLink) {
        signOutLink.addEventListener("click", function (e) {
          e.preventDefault();
          supabaseClient.auth.signOut().then(function () {
            window.location.href = prefix + "index.html";
          });
        });
      }
    } else {
      slot.innerHTML =
        '<a href="' + prefix + 'login.html">로그인</a>' +
        '<a href="' + prefix + 'signup.html" class="btn-nav-signup">회원가입</a>';
    }
  });
}
