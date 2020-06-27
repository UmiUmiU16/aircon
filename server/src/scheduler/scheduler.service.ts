import { Injectable, Logger, } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { WaitQueueService } from './wait-queue.service';
import { ServingQueueService } from './serving-queue.service';
import { ClosedQueueService } from './closed-queue.service';
import { WindSpeed, EventType } from 'src/types';
import { ConfigService } from '@nestjs/config';
import { StatisticsService } from 'src/statistics/statistics.service';
import { LogService } from 'src/log/log.service';
import { RoomStatusService } from 'src/room-status/room-status.service'
import { PowerOnDto, ChangeWindDto } from 'src/dto'

@Injectable()
export class SchedulerService {
  constructor(
    private configService: ConfigService,
    private servingQueueService: ServingQueueService,
    private waitQueueService: WaitQueueService,
    private closedQueueService: ClosedQueueService,
    private statisticsService: StatisticsService,
    private logService: LogService,
    private roomStatusService: RoomStatusService,
  ) {
    this.initialWaitTime =
      this.configService.get<number>('initialWaitTime') ?? 120;

    this.rebootWaitTime = [150, 120, 100];
  }

  private powerOnConf: PowerOnDto;

  private readonly logger = new Logger(SchedulerService.name);

  private initialWaitTime: number;

  private rebootWaitTime: number[];

  /**
   * 温度控制
   */
  @Interval('tempControl', 1000)
  tempControl() {
    this.logger.debug('ChangeingTemp');
    const roomId = this.servingQueueService.changeTemp();
    this.closedQueueService.changeTemp();

    if (roomId) {
      this.waitQueueService.pushRoom({
        roomId: roomId.roomId,
        windSpeed: roomId.windSpeed,
        waitTime: this.rebootWaitTime[roomId.windSpeed],
      }, this.powerOnConf.mode, this.closedQueueService);
    }
  }

  /**
   * 基于时间片的调度
   */
  @Interval('schedule', 1000)
  schedule() {
    this.logger.debug('Scheduling');
    this.servingQueueService.increaseServedTimeBy(1);
    this.waitQueueService.decreaseWaitTimeBy(1);
    this.closedQueueService.increaseClosedTimeBy(1);

    if (!this.waitQueueService.isEmpty()) {
      const roomToServer = this.waitQueueService.popZeroWaitTimeRoom();
      if (roomToServer) {
        const roomToWait = this.servingQueueService.popLongestSevedTimeRoomWithWindSpeedBelowOrEqual(roomToServer.windSpeed);
        if (roomToWait) {
          this.servingQueueService.pushRoom({
            roomId: roomToServer.roomId,
            windSpeed: roomToServer.windSpeed,
            servedTime: 0,
          }, this.powerOnConf.mode);
          this.waitQueueService.pushRoom({
            roomId: roomToWait.roomId,
            windSpeed: roomToWait.windSpeed,
            waitTime: this.initialWaitTime,
          }, this.powerOnConf.mode, this.closedQueueService);
        }
      }
    }

  }

  /**
   * 基于优先级的调度
   *
   * ## 请求过程
   *
   * 变风速请求 -> 删除服务队列中原对象 -> 选择等待队列中一个对象到服务队列 -> 处理新请求
   *
   * @param roomId
   * @param windSpeed
   */
  changeWind(powerOnConf: PowerOnDto, roomId: number, windSpeed: WindSpeed) {
    var targetTemp = this.roomStatusService.getTargetTempByRoomId(roomId);
    var time = new Date();
    this.logService.create(roomId, EventType.CHANGEWIND, this.powerOnConf.mode,
      windSpeed, Number(targetTemp), time.getDate());

    // 删除服务队列中原对象
    this.removeIfExists(roomId);
    this.powerOnConf = powerOnConf
    this.servingQueueService.setMaxCapacity(powerOnConf.maxCapacity);

    // 选择等待队列中一个对象到服务队列
    while (
      !this.servingQueueService.isFull() &&
      !this.waitQueueService.isEmpty()
    ) {
      const room = this.waitQueueService.popHighestPriorityRoom();
      if (room) {
        this.servingQueueService.pushRoom({
          roomId: room.roomId,
          windSpeed: room.windSpeed,
          servedTime: 0,
        }, this.powerOnConf.mode);
      }
    }

    // 处理新请求
    if (!this.servingQueueService.isFull()) {
      this.servingQueueService.pushRoom({
        roomId,
        windSpeed,
        servedTime: 0,
      }, this.powerOnConf.mode);
      return;
    }

    const roomToWait = this.servingQueueService.popLowestPriorityRoomWithWindSpeedBelow(
      windSpeed,
    );

    if (roomToWait) {
      this.waitQueueService.pushRoom({
        roomId: roomToWait.roomId,
        windSpeed: roomToWait.windSpeed,
        waitTime: this.initialWaitTime,
      }, this.powerOnConf.mode, this.closedQueueService);
      this.servingQueueService.pushRoom({
        roomId,
        windSpeed,
        servedTime: 0,
      }, this.powerOnConf.mode);
    } else {
      this.waitQueueService.pushRoom({
        roomId,
        windSpeed,
        waitTime: this.initialWaitTime,
      }, this.powerOnConf.mode, this.closedQueueService);
    }
  }


  /**
   * 主动关机
   * @param roomId
   */
  turnOff(roomId: number) {
    var targetTemp = this.roomStatusService.getTargetTempByRoomId(roomId);
    var windSpeed: WindSpeed = WindSpeed.MEDIUM;
    this.roomStatusService.getWindSpeedByRoomId(roomId).then((data) => { if (data) windSpeed = data });
    var time = new Date();
    this.logService.create(roomId, EventType.CLOSE, this.powerOnConf.mode,
      windSpeed, Number(targetTemp), time.getDate());

    this.closedQueueService.pushRoom({
      roomId: roomId,
      windSpeed: windSpeed,
      closedTime: 0,
    });

    this.removeIfExists(roomId);
    while (
      !this.servingQueueService.isFull() &&
      !this.waitQueueService.isEmpty()
    ) {
      const room = this.waitQueueService.popHighestPriorityRoom();
      if (room) {
        this.servingQueueService.pushRoom({
          roomId: room.roomId,
          windSpeed: room.windSpeed,
          servedTime: 0,
        }, this.powerOnConf.mode);
      }
    }
  }

  getStatus(roomId: number) {
    if (this.servingQueueService.has(roomId)) {
      return 'serving';
    } else if (this.waitQueueService.has(roomId)) {
      return 'waiting';
    } else {
      return 'off';
    }
  }

  removeIfExists(roomId: number) {
    this.servingQueueService.removeIfExists(roomId);
    this.waitQueueService.removeIfExists(roomId);
  }

  turnOn(powerOnConf: PowerOnDto, roomId: number, windSpeed: WindSpeed) {
    var targetTemp = this.roomStatusService.getTargetTempByRoomId(roomId);
    var time = new Date();
    this.logService.create(roomId, EventType.OPEN, powerOnConf.mode,
      windSpeed, Number(targetTemp), time.getDate());

    this.changeWind(powerOnConf, roomId, windSpeed);
  }
}
