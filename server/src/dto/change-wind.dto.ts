import { WindSpeed, Status } from '../types';

export class ChangeWindDto {
  action: Status = Status.ON;
  speed: WindSpeed = WindSpeed.MEDIUM;
}
