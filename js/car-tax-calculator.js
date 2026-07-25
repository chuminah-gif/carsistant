// 자동차세 계산 로직 (비영업용 승용차 기준)
// 근거:
//   - 가솔린/경유/LPG/하이브리드(내연기관 탑재 차종): 배기량(cc) x cc당 세액 x 차령 경감률
//     cc당 세액: 1,000cc 이하 80원 / 1,000~1,600cc 140원 / 1,600cc 초과 200원
//     하이브리드는 자동차세 자체에는 별도 감면이 없어 배기량 기준 일반 승용차와 동일하게 계산합니다.
//   - 전기차·수소차: 배기량이 없어 정액 과세 (기준세액 10만원)
//   - 위 기준세액에 30%의 지방교육세를 더해 연세액이 결정됩니다.
//   - 차령 경감: 등록(구입) 후 3년차부터 5%, 이후 매년 5%p씩 증가, 12년 이상 최대 50%
//   - 연납(주로 1월) 할인: 약 5% 내외 (매년 위택스 공고에 따라 변동)
// 실제 세액은 시·군·구 조례 등에 따라 달라질 수 있어 참고용입니다.

var FLAT_RATE_FUEL_TYPES = ["ev", "hydrogen"];
var FLAT_RATE_BASE_TAX = 100000;

function getCcRate(displacementCc) {
  if (displacementCc <= 1000) return 80;
  if (displacementCc <= 1600) return 140;
  return 200;
}

function getAgeReductionRate(vehicleAgeYears) {
  if (vehicleAgeYears < 3) return 0;
  return Math.min(50, (vehicleAgeYears - 2) * 5);
}

// 구입일(YYYY-MM-DD) 기준으로 오늘까지 만으로 몇 년이 지났는지 계산합니다. (생일 개념과 동일)
function calcElapsedYears(dateStr) {
  var start = new Date(dateStr + "T00:00:00");
  var today = new Date();
  today.setHours(0, 0, 0, 0);

  var years = today.getFullYear() - start.getFullYear();
  var reachedAnniversary =
    today.getMonth() > start.getMonth() ||
    (today.getMonth() === start.getMonth() && today.getDate() >= start.getDate());
  if (!reachedAnniversary) years -= 1;

  return Math.max(years, 0);
}

function calcCarTax(input) {
  var fuelType = input.fuelType;
  var displacementCc = input.displacementCc;
  var purchaseDate = input.purchaseDate;
  var applyAnnualPrepay = !!input.applyAnnualPrepay;
  var isFlatRate = FLAT_RATE_FUEL_TYPES.indexOf(fuelType) !== -1;

  if (!purchaseDate) {
    return { error: "구입일(최초 등록일)을 입력해 주세요." };
  }
  var purchaseDateObj = new Date(purchaseDate + "T00:00:00");
  if (isNaN(purchaseDateObj.getTime()) || purchaseDateObj > new Date()) {
    return { error: "구입일을 정확히 입력해 주세요." };
  }
  if (!isFlatRate && (!displacementCc || displacementCc <= 0)) {
    return { error: "배기량을 정확히 입력해 주세요." };
  }

  var vehicleAgeYears = calcElapsedYears(purchaseDate);
  var reductionRate = getAgeReductionRate(vehicleAgeYears);

  var ccRate = null;
  var baseTax;
  if (isFlatRate) {
    baseTax = FLAT_RATE_BASE_TAX;
  } else {
    ccRate = getCcRate(displacementCc);
    baseTax = displacementCc * ccRate;
  }

  var carTax = Math.round(baseTax * (1 - reductionRate / 100));
  var educationTax = Math.round(carTax * 0.3);
  var totalAnnual = carTax + educationTax;

  var prepayDiscount = 0;
  var finalAmount = totalAnnual;
  if (applyAnnualPrepay) {
    prepayDiscount = Math.round(totalAnnual * 0.05);
    finalAmount = totalAnnual - prepayDiscount;
  }

  return {
    isFlatRate: isFlatRate,
    vehicleAgeYears: vehicleAgeYears,
    ccRate: ccRate,
    reductionRate: reductionRate,
    carTax: carTax,
    educationTax: educationTax,
    totalAnnual: totalAnnual,
    prepayDiscount: prepayDiscount,
    finalAmount: finalAmount,
    halfYear: Math.round(totalAnnual / 2)
  };
}
