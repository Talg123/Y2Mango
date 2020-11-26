const { Schema, model } = require('mongoose');

const schema = new Schema(
	{
		awsDecision: { type: Boolean, default: false },
		faceDetection: { type: Schema.Types.Mixed, required: true },
		humanDecision: { type: Boolean, default: false },
		id: { type: String, unique: true, required: true },
		moderationsDetection: { type: Schema.Types.Mixed, required: true },
		textDetection: { type: Schema.Types.Mixed, required: true }
	},
	{
		timestamps: true
	}
);

export const rekognition = model('rekognition-secondhand', schema);
