import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { ServingQueueService } from './serving-queue.service';
import { WaitQueueService } from './wait-queue.service';
import { StatisticsModule } from 'src/statistics/statistics.module';
import { ClosedQueueService } from './closed-queue.service';
import { RoomStatusModule } from 'src/room-status/room-status.module';
import { LogModule } from 'src/log/log.module';

@Module({
  imports: [StatisticsModule, RoomStatusModule, LogModule],
  providers: [SchedulerService, ServingQueueService, WaitQueueService, ClosedQueueService],
  exports: [SchedulerService],
})
export class SchedulerModule { }
