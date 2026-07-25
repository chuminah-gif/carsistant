// 연료비/전기충전비 계산 로직 - 모든 연료 종류 공통 (연비 기준 단순 비례 계산)
// 단가는 매일 변동하므로 기본값은 참고용 시세이며, 사용자가 직접 수정할 수 있습니다.

var FUEL_UNIT_DEFAULTS = {
  gasoline: { price: 1880, unit: "L", label: "가솔린" },
  diesel: { price: 1870, unit: "L", label: "경유" },
  lpg: { price: 1100, unit: "L", label: "LPG" },
  ev: { price: 300, unit: "kWh", label: "전기(완속충전 기준)" },
  hydrogen: { price: 8800, unit: "kg", label: "수소" }
};

function calcFuelCost(input) {
  var fuelType = input.fuelType;
  var efficiency = input.efficiency;
  var monthlyDistanceKm = input.monthlyDistanceKm;
  var unitPrice = input.unitPrice;

  if (!efficiency || efficiency <= 0) {
    return { error: "연비(1리터·1kWh·1kg당 주행거리)를 정확히 입력해 주세요." };
  }
  if (!monthlyDistanceKm || monthlyDistanceKm <= 0) {
    return { error: "월평균 주행거리를 정확히 입력해 주세요." };
  }
  if (!unitPrice || unitPrice <= 0) {
    return { error: "단가를 정확히 입력해 주세요." };
  }

  var monthlyUsage = monthlyDistanceKm / efficiency;
  var monthlyCost = monthlyUsage * unitPrice;
  var yearlyCost = monthlyCost * 12;

  return {
    fuelType: fuelType,
    monthlyUsage: monthlyUsage,
    monthlyCost: monthlyCost,
    yearlyCost: yearlyCost
  };
}
