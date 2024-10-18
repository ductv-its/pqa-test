import { Schema, model, Document } from 'mongoose';
import dbCreatedConnection from '../database';
import { IStake } from '../interfaces/stake.interface';
import { ActionType } from '../enums/stake.enum';

const stakeSchema: Schema<IStake> = new Schema({
  block: { type: Number, required: true },
  transactionHash: { type: String, required: true, unique: true },
  totalAmount: { type: String, required: true },
  action: { type: String, required: true },
  timestamp: { type: Number, required: true },
  userAddress: { type: String, required: true },
  attributes: { type: Map, of: Schema.Types.Mixed, required: true },
});

const Stake = dbCreatedConnection.model<IStake>('Stake', stakeSchema);

export default Stake;
