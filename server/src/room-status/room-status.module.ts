import { Module } from '@nestjs/common';
import { RoomStatusService } from './room-status.service';
import { MongooseModule } from '@nestjs/mongoose';
import { RoomStatus, RoomStatusSchema } from 'src/schemas/room-status.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: RoomStatus.name, schema: RoomStatusSchema }])
    ],
    providers: [RoomStatusService],
    exports: [RoomStatusService],
})
export class RoomStatusModule { }
