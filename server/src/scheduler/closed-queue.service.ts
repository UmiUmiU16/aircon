import { Injectable } from '@nestjs/common';
import { WaitQueueService } from './wait-queue.service';
import { WindSpeed } from 'src/types';
import * as R from 'ramda';
import { RoomStatusService } from 'src/room-status/room-status.service';

@Injectable()
export class ClosedQueueService {
    constructor(
        private roomStatusService: RoomStatusService,
        private waitQueueService: WaitQueueService) { }

    queue: Array<ClosedRoom> = [];

    pushRoom(room: ClosedRoom) {
        this.removeIfExists(room.roomId);
        this.queue.push(room);
    }

    removeIfExists(roomId: number) {
        this.queue = R.reject(R.propEq('roomId', roomId), this.queue);
    }

    increaseClosedTimeBy(time: number) {
        this.queue = R.map(
            room => ({ ...room, servedTime: room.closedTime + time }),
            this.queue,
        );
    }

    changeTemp() {
        for (var i = 0; this.queue[i]; i++) {
            var flag = false;
            var room = this.queue[i];
            if (room.closedTime > 60 && room.closedTime % 60 == 0) {
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
                        flag = true;
                        changeTemp = tempdif;
                    }
                }
                if (changeTemp) {
                    this.roomStatusService.setCurTempByRoomId(room.roomId, changeTemp);
                }
                if (flag) {
                    this.removeIfExists(room.roomId);
                }
            }
        }
    }
}
export class ClosedRoom {
    roomId: number;
    windSpeed: WindSpeed;
    closedTime: number;
}