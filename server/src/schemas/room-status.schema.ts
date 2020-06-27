import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { WindSpeed, WindMode } from 'src/types';

export enum Status {
    ON = 'on',
    OFF = 'off',
}

@Schema()
export class RoomStatus extends Document {
    @Prop({ required: true })
    roomId: number;

    @Prop({ required: true })
    status: Status;

    @Prop({ required: true })
    windMode: WindMode;

    @Prop({ required: true })
    windSpeed: WindSpeed;

    @Prop({ required: true })
    curTemp: number;

    @Prop({ required: true })
    targetTemp: number;
}

export const RoomStatusSchema = SchemaFactory.createForClass(RoomStatus);