export enum WindSpeed {
  LOW = 0,
  MEDIUM = 1,
  HIGH = 2,
}

export enum WindMode {
  COOLING = 'cooling',
  HEATING = 'heating',
}

export enum EventType {
  OPEN = 'open',
  CHANGEWIND = 'changewind',
  ACHIEVETARGET = 'achieveTarget',
  DISPATCH = 'dispatch',
  WAIT = 'wait',
  CLOSE = 'close',
}

export enum Status {
  ON = 'on',
  OFF = 'off',
}