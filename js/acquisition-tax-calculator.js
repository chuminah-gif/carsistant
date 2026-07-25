// 자동차 취득세 계산 로직 (비영업용/영업용 승용차 기준)
// 근거: 취득세율 - 비영업용 승용차 7%, 영업용 승용차 4%
//   전기차·수소차: 취득세액이 140만원 이하이면 전액 면제, 140만원을 초과하면 140만원을 공제한 나머지만 과세 (2026.12.31까지)
//   하이브리드: 취득세 감면은 2024.12.31로 종료되어 현재는 별도 감면이 없습니다.
// 실제 세액은 지방세법 개정 사항, 신차/중고차 여부, 경차 특례 등에 따라 달라질 수 있어 참고용입니다.

var EV_ACQUISITION_TAX_DEDUCTION = 1400000;

function calcAcquisitionTax(input) {
  var price = input.price;
  var fuelType = input.fuelType;
  var isCommercial = !!input.isCommercial;

  if (!price || price <= 0) {
    return { error: "차량 가격을 정확히 입력해 주세요." };
  }

  var rate = isCommercial ? 0.04 : 0.07;
  var baseTax = Math.round(price * rate);

  var deduction = 0;
  var isEcoDeductible = fuelType === "ev" || fuelType === "hydrogen";
  if (isEcoDeductible) {
    deduction = Math.min(baseTax, EV_ACQUISITION_TAX_DEDUCTION);
  }

  var finalTax = baseTax - deduction;

  return {
    rate: rate,
    baseTax: baseTax,
    deduction: deduction,
    finalTax: finalTax,
    isEcoDeductible: isEcoDeductible
  };
}
