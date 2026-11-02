export function siteVisitFromDoc(data, id) {
  return {
    id,
    mapId: data.mapId ?? '',
    projectName: data.projectName ?? '',
    plotNo: data.plotNo ?? '',
    plotStatus: data.plotStatus ?? '',
    selfieUrl: data.selfieUrl ?? '',
    selfieBase64: data.selfieBase64 ?? '', // legacy inline field
    address: data.address ?? '',
    latitude: Number(data.latitude) || 0,
    longitude: Number(data.longitude) || 0,
    employeeUid: data.employeeUid ?? '',
    employeeName: data.employeeName ?? '',
    visitDate: data.visitDate ? new Date(data.visitDate) : new Date(),
  };
}
