import mongoose from 'mongoose';
import { getEnv } from '../utils/env';

export const dbConnection = {
  url: getEnv.MONGO_URI,
};

mongoose.set('strictQuery', true);
mongoose.set('debug', true);

var dbCreatedConnection = mongoose.createConnection(dbConnection.url);

dbCreatedConnection.on('connected', () => {
  console.log('Connected to Database');
});

dbCreatedConnection.on('error', (e) => {
  console.error(e);
});

export default dbCreatedConnection;
