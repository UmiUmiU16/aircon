import { Injectable } from '@nestjs/common';
import { WindSpeed, EventType, WindMode } from 'src/types';
import * as R from 'ramda';
import { RoomStatusService } from 'src/room-status/room-status.service';
import { LogService } from 'src/log/log.service';
import { ClosedQueueService } from './closed-queue.service';

@Injectable()
export class WaitQueueService {
  constructor(
    private roomStatusService: RoomStatusService,
    private logService: LogService,) { }
  queue: Array<WaitRoom> = [];

  isEmpty(): boolean {
    return this.queue.length == 0;
  }

  has(roomId: number): boolean {
    if (R.find(R.propEq('roomId', roomId), this.queue)) {
      return true;
    } else {
      return false;
    }
  }

  popHighestPriorityRoom() {
    const byWindSpeed = R.descend(R.prop('windSpeed'));
    const byWaitTime = R.ascend(R.prop('waitTime'));
    this.queue = R.sortWith([byWindSpeed, byWaitTime], this.queue);
    const expired = this.queue.shift();
    return expired;
  }

  popZeroWaitTimeRoom() {
    const byWaitTime = R.ascend(R.prop('waitTime'));
    const byWindSpeed = R.descend(R.prop('windSpeed'));
    this.queue = R.sortWith([byWaitTime, byWindSpeed], this.queue);
    if (this.queue[0].waitTime <= 0) {
      const roomToServe = this.queue.shift();
      return roomToServe;
    }
  }

  pushRoom(room: WaitRoom, mode: WindMode, closedQueueService: ClosedQueueService) {
    var targetTemp = this.roomStatusService.getTargetTempByRoomId(room.roomId);
    var time = new Date();
    this.logService.create(room.roomId, EventType.WAIT, mode,
      room.windSpeed, Number(targetTemp), time.getDate());

    closedQueueService.pushRoom({
      roomId: room.roomId,
      windSpeed: room.windSpeed,
      closedTime: 0,
    });

    this.removeIfExists(room.roomId);
    this.queue.push(room);
  }

  removeIfExists(roomId: number) {
    this.queue = R.reject(R.propEq('roomId', roomId), this.queue);
  }

  decreaseWaitTimeBy(time: number) {
    this.queue = R.map(
      room => ({ ...room, waitTime: room.waitTime - time }),
      this.queue,
    );
  }

  changeTemp() {
    for (var i = 0; this.queue[i]; i++) {
      var room = this.queue[i];
      if (room.waitTime > 60 && room.waitTime % 60 == 0) {
        var roomStatus = this.roomStatusService.getRoomStatusByRoomId(room.roomId);
        var targetTemp, curTemp;
        roomStatus.then((roomStatus) => { curTemp = roomStatus?.curTemp; targetTemp = roomStatus?.targetTemp; })
        var changeTemp;
        if (curTemp && targetTemp) {
          var tempdif = targetTemp - curTemp;
          if (tempdif > 0.5) {
            changeTemp = 0.5;
          }
          else if (tempdif < -0.5) {
            changeTemp = -0.5;
          }
          else {
            changeTemp = tempdif;
          }
        }
        if (changeTemp) {
          this.roomStatusService.setCurTempByRoomId(room.roomId, changeTemp);
        }
      }
    }
  }
}

export class WaitRoom {
  roomId: number;
  windSpeed: WindSpeed;
  waitTime: number;
}
