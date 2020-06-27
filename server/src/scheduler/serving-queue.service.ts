import { Injectable } from '@nestjs/common';
import { WaitQueueService } from './wait-queue.service';
import { WindSpeed, EventType, WindMode } from 'src/types';
import * as R from 'ramda';
import { RoomStatusService } from 'src/room-status/room-status.service';
import { LogService } from 'src/log/log.service';

@Injectable()
export class ServingQueueService {
  constructor(
    private roomStatusService: RoomStatusService,
    private logService: LogService,
    private waitQueueService: WaitQueueService) { }

  MAX_CAPACITY = 3;

  queue: Array<ServingRoom> = [];

  isFull(): boolean {
    return this.queue.length >= this.MAX_CAPACITY;
  }

  has(roomId: number): boolean {
    if (R.find(R.propEq('roomId', roomId), this.queue)) {
      return true;
    } else {
      return false;
    }
  }

  setMaxCapacity(max_capacity: number) {
    this.MAX_CAPACITY = max_capacity;
  }

  pushRoom(room: ServingRoom, mode: WindMode) {
    var targetTemp = this.roomStatusService.getTargetTempByRoomId(room.roomId);
    var time = new Date();
    this.logService.create(room.roomId, EventType.DISPATCH, mode,
      room.windSpeed, Number(targetTemp), time.getDate());

    this.removeIfExists(room.roomId);
    if (this.isFull()) {
      throw new Error('serving queue is full');
    }
    this.queue.push(room);
  }

  removeIfExists(roomId: number) {
    this.queue = R.reject(R.propEq('roomId', roomId), this.queue);
  }

  popLowestPriorityRoomWithWindSpeedBelow(windSpeed: WindSpeed) {
    const byWindSpeed = R.ascend(R.prop('windSpeed'));
    const byServedTime = R.descend(R.prop('servedTime'));
    this.queue = R.sortWith([byWindSpeed, byServedTime], this.queue);
    if (this.queue[0].windSpeed < windSpeed) {
      const roomToWait = this.queue.shift();
      return roomToWait;
    }
  }

  popLongestSevedTimeRoomWithWindSpeedBelowOrEqual(windSpeed: WindSpeed) {
    const byServedTime = R.descend(R.prop('servedTime'));
    const byWindSpeed = R.ascend(R.prop('windSpeed'));
    this.queue = R.sortWith([byServedTime, byWindSpeed], this.queue);
    if (this.queue[0].windSpeed <= windSpeed) {
      const roomToWait = this.queue.shift();
      return roomToWait;
    }
  }

  increaseServedTimeBy(time: number) {
    this.queue = R.map(
      room => ({ ...room, servedTime: room.servedTime + time }),
      this.queue,
    );
  }

  changeTemp() {
    var flag1, flag2 = false;
    var achieveRoom, achieveI, achieveWindMode;

    for (var i = 0; this.queue[i]; i++) {
      var room = this.queue[i];
      if (room.servedTime > 60 && room.servedTime % 60 == 0) {
        var windMode = this.roomStatusService.getWindModeByRoomId(room.roomId);

        flag1 = false;
        var curTemp = this.roomStatusService.getCurTempByRoomId(room.roomId);
        var targetTemp = this.roomStatusService.getTargetTempByRoomId(room.roomId);
        var changeTemp: number;

        windMode.then(windMode => { flag1 = (windMode == WindMode.COOLING) });
        if (flag1) {
          changeTemp = -0.5;
          if (curTemp <= targetTemp) {
            flag2 = true;
            achieveRoom = room;
            achieveI = i;
            achieveWindMode = WindMode.COOLING;
          }
        }
        else {
          changeTemp = 0.5;
          if (curTemp >= targetTemp) {
            flag2 = true;
            achieveRoom = room;
            achieveI = i;
            achieveWindMode = WindMode.HEATING;
          }
        }
        this.roomStatusService.setCurTempByRoomId(room.roomId, changeTemp);
      }
    }

    if (flag2 && achieveRoom && achieveWindMode) {
      var targetTemp = this.roomStatusService.getTargetTempByRoomId(achieveRoom.roomId);
      var time = new Date();
      this.logService.create(achieveRoom.roomId, EventType.ACHIEVETARGET, achieveWindMode,
        achieveRoom.windSpeed, Number(targetTemp), time.getDate());
      this.queue.splice(i, 1);
      return achieveRoom;
    }
  }
}


export class ServingRoom {
  roomId: number;
  windSpeed: WindSpeed;
  servedTime: number;
}
