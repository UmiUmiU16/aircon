import {
    Injectable,
    BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RoomStatus } from 'src/schemas/room-status.schema';
import { Status, WindSpeed } from 'src/types';
import { ChangeWindDto, PowerOnDto } from 'src/dto';

@Injectable()
export class RoomStatusService {
    constructor(
        @InjectModel(RoomStatus.name) private RoomStatusModel: Model<RoomStatus>,
    ) { }

    async getRoomStatus(): Promise<RoomStatus[]> {
        return this.RoomStatusModel.find().exec();
    }

    async getRoomStatusByRoomId(roomId: number): Promise<RoomStatus | null> {
        return this.RoomStatusModel
            .findOne({ 'roomId': roomId })
            .exec();
    }

    async getCurTempByRoomId(roomId: number): Promise<number | undefined> {
        return (
            await this.RoomStatusModel
                .findOne({ 'roomId': roomId })
                .exec()
        )?.curTemp;
    }

    async getTargetTempByRoomId(roomId: number): Promise<number | undefined> {
        return (
            await this.RoomStatusModel
                .findOne({ 'roomId': roomId })
                .exec()
        )?.targetTemp;
    }

    async getWindModeByRoomId(roomId: number) {
        return (
            await this.RoomStatusModel
                .findOne({ 'roomId': roomId })
                .exec()
        )?.windMode;
    }

    async getWindSpeedByRoomId(roomId: number) {
        return (
            await this.RoomStatusModel
                .findOne({ 'roomId': roomId })
                .exec()
        )?.windSpeed;
    }

    async setCurTempByRoomId(roomId: number, changeTemp: number) {
        await this.RoomStatusModel
            .updateOne({ 'roomId': roomId },
                { '$inc': { 'curTemp': changeTemp } }).exec()
    }

    async setStatusByRoomId(powerOnConf: PowerOnDto, roomId: number, status: Status) {
        const room = await this.RoomStatusModel.findOne({ 'roomId': roomId });
        if (room) {
            await this.RoomStatusModel.updateOne(
                { "roomId": roomId },
                { "$set": { "status": status } }
            );
        }
        else {
            const createdRoomStatus = new this.RoomStatusModel({
                roomId: roomId,
                targetTemp: 25,
                windMode: powerOnConf.mode,
                curTemp: powerOnConf.defaultTemperature,
                status: status,
                windSpeed: WindSpeed.MEDIUM,
            });
            return createdRoomStatus.save();
        }
    }

    async setWindByRoomId(powerOnConf: PowerOnDto, roomId: number, changeWind: ChangeWindDto) {
        const room = await this.RoomStatusModel.findOne({ 'roomId': roomId });
        if (room) {
            await this.RoomStatusModel.updateOne(
                { "roomId": roomId },
                { "$set": { "status": changeWind.action, "windSpeed": changeWind.speed } }
            );
        }
        else {
            const createdRoomStatus = new this.RoomStatusModel({
                roomId: roomId,
                targetTemp: 25,
                windMode: powerOnConf.mode,
                curTemp: powerOnConf.defaultTemperature,
                status: changeWind.action,
                windSpeed: changeWind.speed,
            });
            return createdRoomStatus.save();
        }
    }

    async setTargetTempByRoomId(powerOnConf: PowerOnDto, roomId: number, targetTemp: number) {
        if (powerOnConf.mode == 'cooling') {
            if (targetTemp > 25 || targetTemp < 18) {
                throw new BadRequestException(
                    `Cooling mode need target temp from 18 to 25, ${targetTemp} isn't satisfiable`,
                );
            }
        }
        else {
            if (targetTemp < 25 || targetTemp > 30) {
                throw new BadRequestException(
                    `heating mode need target temp from 25 to 30, ${targetTemp} isn't satisfiable`,
                );
            }
        }
        const room = await this.RoomStatusModel.findOne({ 'roomId': roomId });
        if (room) {
            await this.RoomStatusModel.updateOne(
                { "roomId": roomId },
                { "$set": { "targetTemp": targetTemp } }
            );
        }
        else {
            const createdRoomStatus = new this.RoomStatusModel({
                roomId: roomId,
                targetTemp: targetTemp,
                windMode: powerOnConf.mode,
                curTemp: powerOnConf.defaultTemperature,
                status: Status.OFF,
                windSpeed: WindSpeed.MEDIUM,
            });
            return createdRoomStatus.save();
        }
    }
}
