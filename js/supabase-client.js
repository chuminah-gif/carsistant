// Supabase 프로젝트 연결 설정
// 카시스턴트는 연금랩과 별도의 Supabase 프로젝트를 사용합니다.
// 아래 두 값을 Supabase 대시보드(Project Settings > API)에서 발급받은
// 실제 프로젝트 URL과 publishable(anon) key로 교체해야 로그인/저장 기능이 동작합니다.
var SUPABASE_URL = "https://xaazwlivmsnyesdhzkba.supabase.co";
var SUPABASE_PUBLISHABLE_KEY = "sb_publishable_bH8NZ-L2VoebtxY5yZoT0w_9KlT6wv2";

var supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// 로그인이 필요한 페이지 상단에서 호출합니다. 세션이 없으면 로그인 페이지로 보냅니다.
// prefix는 하위 폴더에서 호출할 때 "../" 등 루트까지의 상대 경로를 지정합니다.
function requireLogin(prefix) {
  prefix = prefix || "";
  return supabaseClient.auth.getSession().then(function (res) {
    var session = res.data && res.data.session;
    if (!session) {
      window.location.href = prefix + "login.html";
      return null;
    }
    return session;
  });
}

// 로그인한 본인 계정을 완전히 삭제합니다(회원 탈퇴). 서버(Supabase)의 delete_own_account()
// RPC 함수가 auth.uid() 기준으로만 동작하므로 다른 사용자의 계정에는 영향을 주지 않으며,
// auth.users 삭제 시 vehicles/maintenance_records도 FK cascade로 함께 삭제됩니다.
function deleteOwnAccount() {
  return supabaseClient.rpc("delete_own_account");
}

// 특정 계산기가 사용되었다는 사실만 익명으로 기록합니다.
// 배기량, 연식, 주행거리 등 사용자가 입력한 구체적인 값은 절대 전송하지 않습니다.
function logCalculatorUsage(calcType) {
  try {
    supabaseClient.from("calc_usage").insert({ calc_type: calcType }).then(function () {});
  } catch (e) {
    // 통계 수집 실패는 사용자 경험에 영향을 주지 않도록 조용히 무시합니다.
  }
}
