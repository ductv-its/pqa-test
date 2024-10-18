import { Schema } from 'mongoose';
import dbCreatedConnection from '../database';

const lastBlockSchema: Schema<{
  block: number;
  contractName: string;
}> = new Schema({
  block: { type: Number, required: true },
  contractName: { type: String, required: true, unique: true },
});

const LastBlock = dbCreatedConnection.model<{
  contractName: string;
  block: number;
}>('LastBlock', lastBlockSchema);

export default LastBlock;
