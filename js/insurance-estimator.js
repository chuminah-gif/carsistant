// 자동차보험료 "참고용" 추정 로직
// 실제 보험료는 보험사별 언더라이팅 기준, 할인할증등급, 특약 구성에 따라 크게 달라지며
// 이 계산기는 공식 요율이 아니라 일반적으로 알려진 요인들을 반영한 지수 기반 추정치입니다.
// 반드시 실제 보험사 다이렉트 견적과 비교해 참고용으로만 사용해야 합니다.

var INSURANCE_BASE_BY_PRICE = {
  under2000: 550000,
  "2000to3000": 650000,
  "3000to5000": 800000,
  over5000: 1000000
};

var INSURANCE_AGE_MULTIPLIER = {
  under26: 1.35,
  "30s": 1.05,
  "40s": 0.95,
  "50s": 0.9,
  over60: 1.0
};

var INSURANCE_MILEAGE_MULTIPLIER = {
  under5000: 0.85,
  "5000to10000": 0.92,
  "10000to15000": 1.0,
  over15000: 1.1
};

function insuranceExperienceMultiplier(years) {
  if (years >= 10) return 0.85;
  if (years >= 5) return 0.92;
  if (years >= 3) return 0.97;
  if (years >= 1) return 1.0;
  return 1.15;
}

function insuranceAccidentMultiplier(accidentCount) {
  if (accidentCount >= 2) return 1.6;
  if (accidentCount === 1) return 1.25;
  return 1.0;
}

function estimateInsurance(input) {
  var priceRange = input.priceRange;
  var ageGroup = input.ageGroup;
  var experienceYears = input.experienceYears;
  var accidentCount = input.accidentCount;
  var mileageBand = input.mileageBand;
  var hasBlackbox = !!input.hasBlackbox;

  var basePremium = INSURANCE_BASE_BY_PRICE[priceRange];
  var ageMultiplier = INSURANCE_AGE_MULTIPLIER[ageGroup];
  var mileageMultiplier = INSURANCE_MILEAGE_MULTIPLIER[mileageBand];

  if (!basePremium || !ageMultiplier || !mileageMultiplier || experienceYears === null || experienceYears === undefined || accidentCount === null || accidentCount === undefined) {
    return { error: "모든 항목을 선택·입력해 주세요." };
  }

  var experienceMultiplier = insuranceExperienceMultiplier(experienceYears);
  var accidentMultiplier = insuranceAccidentMultiplier(accidentCount);
  var blackboxMultiplier = hasBlackbox ? 0.97 : 1.0;

  var estimated = basePremium * ageMultiplier * experienceMultiplier * accidentMultiplier * mileageMultiplier * blackboxMultiplier;

  var roundTo = 10000;
  var mid = Math.round(estimated / roundTo) * roundTo;
  var min = Math.round((estimated * 0.85) / roundTo) * roundTo;
  var max = Math.round((estimated * 1.15) / roundTo) * roundTo;

  return {
    min: min,
    max: max,
    mid: mid,
    factors: {
      ageMultiplier: ageMultiplier,
      experienceMultiplier: experienceMultiplier,
      accidentMultiplier: accidentMultiplier,
      mileageMultiplier: mileageMultiplier,
      blackboxMultiplier: blackboxMultiplier
    }
  };
}
