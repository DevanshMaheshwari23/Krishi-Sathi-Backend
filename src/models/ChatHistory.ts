import { Schema, model, Document, Types } from 'mongoose';

export interface IMessage {
  role: 'user' | 'model';
  parts: string;
  timestamp: Date;
  audioUrl?: string;
}

export interface IChatHistory extends Document {
  userId: Types.ObjectId;
  messages: IMessage[];
  language: string;
  metadata?: {
    cropContext?: string;
    location?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>({
  role: {
    type: String,
    enum: ['user', 'model'],
    required: true
  },
  parts: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  audioUrl: String
});

const chatHistorySchema = new Schema<IChatHistory>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  messages: [messageSchema],
  language: {
    type: String,
    default: 'en',
    enum: ['en', 'hi']
  },
  metadata: {
    cropContext: String,
    location: String
  }
}, {
  timestamps: true
});

// Index for efficient querying
chatHistorySchema.index({ userId: 1, updatedAt: -1 });

export default model<IChatHistory>('ChatHistory', chatHistorySchema);
