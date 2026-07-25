// 정비/소모품 항목 메타데이터
// intervalMonths, intervalKm: 일반적으로 알려진 권장 교체 주기 (제조사/차종에 따라 다를 수 있음)
// avgCostMin/avgCostMax: 공임 포함 대략적인 시중 비용 범위(원), 없으면 null
var MAINTENANCE_ITEMS = [
  {
    key: "engine_oil",
    label: "엔진오일 교환",
    icon: "🛢️",
    intervalMonths: 6,
    intervalKm: 10000,
    avgCostMin: 40000,
    avgCostMax: 90000,
    note: "일반 오일 기준 6개월/1만km, 합성유는 최대 1.5만km까지 가능. 오일필터도 함께 교환하는 것이 일반적입니다."
  },
  {
    key: "cabin_filter",
    label: "에어컨(캐빈) 필터",
    icon: "🌬️",
    intervalMonths: 12,
    intervalKm: 15000,
    avgCostMin: 15000,
    avgCostMax: 35000,
    note: "미세먼지·냄새가 심해지면 주기와 상관없이 조기 교체를 권장합니다."
  },
  {
    key: "battery",
    label: "배터리 점검/교체",
    icon: "🔋",
    intervalMonths: 30,
    intervalKm: null,
    avgCostMin: 120000,
    avgCostMax: 250000,
    note: "2~3년 또는 시동 지연 등 이상 징후가 있을 때 점검·교체합니다."
  },
  {
    key: "wiper",
    label: "와이퍼 블레이드",
    icon: "🌧️",
    intervalMonths: 9,
    intervalKm: null,
    avgCostMin: 10000,
    avgCostMax: 30000,
    note: "고무날이 갈라지거나 물자국이 남으면 주기와 무관하게 교체하세요."
  },
  {
    key: "brake_pad",
    label: "브레이크 패드",
    icon: "🛑",
    intervalMonths: null,
    intervalKm: 35000,
    avgCostMin: 150000,
    avgCostMax: 320000,
    note: "주행 습관에 따라 마모 속도 차이가 큽니다. 제동 시 소음이 나면 조기 점검하세요."
  },
  {
    key: "tire",
    label: "타이어 교체",
    icon: "🛞",
    intervalMonths: 60,
    intervalKm: 50000,
    avgCostMin: 400000,
    avgCostMax: 900000,
    note: "4본 교체 기준 대략적인 비용이며, 제조사·타이어 등급에 따라 차이가 큽니다."
  },
  {
    key: "insurance",
    label: "자동차보험 갱신",
    icon: "📄",
    intervalMonths: 12,
    intervalKm: null,
    avgCostMin: null,
    avgCostMax: null,
    note: "만기 시점 전 여러 보험사 견적을 비교하면 보험료를 절약할 수 있습니다."
  },
  {
    key: "car_tax",
    label: "자동차세 납부",
    icon: "🧾",
    intervalMonths: 6,
    intervalKm: null,
    avgCostMin: null,
    avgCostMax: null,
    note: "정기분은 6월·12월에 부과되며, 1월 연납 시 할인을 받을 수 있습니다."
  },
  {
    key: "etc",
    label: "기타 점검/정비",
    icon: "🔧",
    intervalMonths: null,
    intervalKm: null,
    avgCostMin: null,
    avgCostMax: null,
    note: ""
  }
];

function getMaintenanceItem(key) {
  for (var i = 0; i < MAINTENANCE_ITEMS.length; i++) {
    if (MAINTENANCE_ITEMS[i].key === key) return MAINTENANCE_ITEMS[i];
  }
  return null;
}

// 정비 기록 시점(dateStr: "YYYY-MM-DD", mileage: number|null)을 기준으로
// 항목별 권장 주기를 적용해 다음 예정일/예정 주행거리를 추정합니다. (사용자가 폼에서 직접 수정 가능)
function suggestNextDue(itemKey, dateStr, mileage) {
  var item = getMaintenanceItem(itemKey);
  var result = { nextDueDate: null, nextDueMileage: null };
  if (!item || !dateStr) return result;

  if (item.intervalMonths) {
    var d = new Date(dateStr + "T00:00:00");
    d.setMonth(d.getMonth() + item.intervalMonths);
    result.nextDueDate = d.toISOString().slice(0, 10);
  }
  if (item.intervalKm && mileage) {
    result.nextDueMileage = mileage + item.intervalKm;
  }
  return result;
}

// 오늘 날짜/현재 주행거리를 기준으로 예정 정비의 임박 정도를 판단합니다.
// status: "due"(지남/임박 30일·1000km 이내), "soon"(90일·3000km 이내), "ok"(여유 있음), null(예정 정보 없음)
function getDueStatus(nextDueDate, nextDueMileage, currentMileage) {
  var daysLeft = null;
  var kmLeft = null;

  if (nextDueDate) {
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var due = new Date(nextDueDate + "T00:00:00");
    daysLeft = Math.round((due - today) / (1000 * 60 * 60 * 24));
  }
  if (nextDueMileage && currentMileage) {
    kmLeft = nextDueMileage - currentMileage;
  }

  if (daysLeft === null && kmLeft === null) return { status: null, daysLeft: daysLeft, kmLeft: kmLeft };

  var due1 = daysLeft !== null && daysLeft <= 30;
  var due2 = kmLeft !== null && kmLeft <= 1000;
  if (due1 || due2) return { status: "due", daysLeft: daysLeft, kmLeft: kmLeft };

  var soon1 = daysLeft !== null && daysLeft <= 90;
  var soon2 = kmLeft !== null && kmLeft <= 3000;
  if (soon1 || soon2) return { status: "soon", daysLeft: daysLeft, kmLeft: kmLeft };

  return { status: "ok", daysLeft: daysLeft, kmLeft: kmLeft };
}

// 연식(경과 연수)과 현재 주행거리를 바탕으로 연평균 주행거리를 추정하고,
// 이를 이용해 거리 기준 소모품의 실질 교체 주기(년)를 보정한 뒤 연간 환산 비용을 계산합니다.
// 자동차세/보험처럼 비용 범위가 없는 항목은 결과에서 제외합니다.
function estimateMaintenanceCosts(currentMileage, vehicleAgeYears) {
  var kmPerYear = currentMileage && vehicleAgeYears > 0 ? currentMileage / vehicleAgeYears : 12000;
  var results = [];

  MAINTENANCE_ITEMS.forEach(function (item) {
    if (item.avgCostMin == null || item.avgCostMax == null) return;

    var intervalYearsByTime = item.intervalMonths ? item.intervalMonths / 12 : null;
    var intervalYearsByDistance = item.intervalKm ? item.intervalKm / kmPerYear : null;

    var effectiveIntervalYears;
    if (intervalYearsByTime && intervalYearsByDistance) {
      effectiveIntervalYears = Math.min(intervalYearsByTime, intervalYearsByDistance);
    } else {
      effectiveIntervalYears = intervalYearsByTime || intervalYearsByDistance;
    }
    if (!effectiveIntervalYears) return;

    var avgCostMid = (item.avgCostMin + item.avgCostMax) / 2;
    var annualCost = avgCostMid / effectiveIntervalYears;

    results.push({
      item: item,
      effectiveIntervalYears: effectiveIntervalYears,
      avgCostMid: avgCostMid,
      annualCost: annualCost
    });
  });

  return results;
}

function formatWon(n) {
  if (n === null || n === undefined || isNaN(n)) return "-";
  return Math.round(n).toLocaleString("ko-KR") + "원";
}
