export class ReportDto {
  type: 'day' | 'week' | 'month';
  timeOfUse: number[];
  usedMostTemp: number[];
  usedMostWind: number[];
  timeOfAchieveTarget: number[];
  timeOfDispatch: number[];
  numOfRDR: number[];
  totalFee: number[];
}
