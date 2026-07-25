// 내 차고(대시보드) / 차량 상세 페이지 공용 데이터 함수
// 모든 함수는 Supabase RLS 정책(auth.uid() = user_id)에 의존해 본인 소유 행만 오갑니다.

function listVehicles() {
  return supabaseClient.from("vehicles").select("*").order("created_at", { ascending: true });
}

function insertVehicle(userId, vehicle) {
  return supabaseClient.from("vehicles").insert({
    user_id: userId,
    nickname: vehicle.nickname || null,
    model_name: vehicle.modelName,
    model_year: vehicle.modelYear || null,
    current_mileage: vehicle.currentMileage || null,
    plate_number: vehicle.plateNumber || null
  }).select().single();
}

function updateVehicle(vehicleId, fields) {
  return supabaseClient.from("vehicles").update(fields).eq("id", vehicleId);
}

function deleteVehicle(vehicleId) {
  return supabaseClient.from("vehicles").delete().eq("id", vehicleId);
}

function getVehicle(vehicleId) {
  return supabaseClient.from("vehicles").select("*").eq("id", vehicleId).single();
}

function listRecordsForVehicles(vehicleIds) {
  if (!vehicleIds.length) return Promise.resolve({ data: [], error: null });
  return supabaseClient
    .from("maintenance_records")
    .select("*")
    .in("vehicle_id", vehicleIds)
    .order("service_date", { ascending: false });
}

function insertRecord(userId, vehicleId, record) {
  return supabaseClient.from("maintenance_records").insert({
    user_id: userId,
    vehicle_id: vehicleId,
    item_type: record.itemType,
    service_date: record.serviceDate,
    cost: record.cost || null,
    mileage_at_service: record.mileageAtService || null,
    next_due_date: record.nextDueDate || null,
    next_due_mileage: record.nextDueMileage || null,
    memo: record.memo || null
  }).select().single();
}

function deleteRecord(recordId) {
  return supabaseClient.from("maintenance_records").delete().eq("id", recordId);
}

// 차량별로 정비 항목당 가장 최근 기록만 골라 { vehicleId: { itemKey: record } } 형태로 정리합니다.
// records는 service_date desc로 정렬되어 있다고 가정합니다.
function latestRecordByItem(records) {
  var map = {};
  records.forEach(function (r) {
    if (!map[r.vehicle_id]) map[r.vehicle_id] = {};
    if (!map[r.vehicle_id][r.item_type]) map[r.vehicle_id][r.item_type] = r;
  });
  return map;
}

function badgeClass(status) {
  if (status === "due") return "badge-due";
  if (status === "soon") return "badge-soon";
  return "badge-ok";
}

function badgeText(itemLabel, dueInfo) {
  var text = itemLabel;
  if (dueInfo.status === "due") {
    if (dueInfo.daysLeft !== null && dueInfo.daysLeft < 0) text += " · 기한 지남";
    else text += " · 곧 도래";
  } else if (dueInfo.status === "soon") {
    text += " · 예정";
  } else {
    text += " · 여유";
  }
  return text;
}

// 모든 차량의 최신 정비/세금/보험 기록을 하나로 모아 예정일이 가까운 순으로 정렬한 목록을 만듭니다.
// 정비뿐 아니라 MAINTENANCE_ITEMS에 등록된 car_tax/insurance 항목도 동일하게 포함됩니다.
function buildScheduleList(vehicles, records) {
  var vehicleById = {};
  vehicles.forEach(function (v) { vehicleById[v.id] = v; });

  var latestMap = latestRecordByItem(records);
  var statusRank = { due: 0, soon: 1, ok: 2 };
  var list = [];

  Object.keys(latestMap).forEach(function (vehicleId) {
    var vehicle = vehicleById[vehicleId];
    if (!vehicle) return;

    Object.keys(latestMap[vehicleId]).forEach(function (itemKey) {
      var record = latestMap[vehicleId][itemKey];
      var item = getMaintenanceItem(itemKey);
      if (!item) return;

      var due = getDueStatus(record.next_due_date, record.next_due_mileage, vehicle.current_mileage);
      if (due.status === null) return;

      list.push({
        vehicleId: vehicleId,
        vehicleTitle: vehicle.nickname || vehicle.model_name,
        itemKey: itemKey,
        itemLabel: item.label,
        icon: item.icon,
        nextDueDate: record.next_due_date,
        nextDueMileage: record.next_due_mileage,
        status: due.status,
        daysLeft: due.daysLeft,
        kmLeft: due.kmLeft
      });
    });
  });

  list.sort(function (a, b) {
    var rankDiff = statusRank[a.status] - statusRank[b.status];
    if (rankDiff !== 0) return rankDiff;
    var aDays = a.daysLeft === null ? Infinity : a.daysLeft;
    var bDays = b.daysLeft === null ? Infinity : b.daysLeft;
    return aDays - bDays;
  });

  return list;
}

function vehicleYearlyCost(records, vehicleId) {
  var thisYear = new Date().getFullYear();
  var total = 0;
  records.forEach(function (r) {
    if (r.vehicle_id === vehicleId && r.cost && r.service_date && r.service_date.slice(0, 4) === String(thisYear)) {
      total += r.cost;
    }
  });
  return total;
}
