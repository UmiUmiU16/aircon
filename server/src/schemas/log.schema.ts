import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { EventType } from 'src/types';
import { WindMode, WindSpeed } from 'src/types';

@Schema()
export class Log extends Document {
    @Prop({ required: true })
    roomId: number;

    @Prop({ required: true })
    eventType: EventType;

    @Prop({ required: true })
    windMode: WindMode;

    @Prop({ required: true })
    windSpeed: WindSpeed;

    @Prop({ required: true })
    targetTemp: number;

    @Prop({ required: true })
    time: number;
}

export const LogSchema = SchemaFactory.createForClass(Log);
