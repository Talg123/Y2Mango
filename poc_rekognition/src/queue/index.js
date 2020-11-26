'use strict';
const amqp = require('amqplib');
const { promisify } = require('util');
const sleep = promisify(setTimeout);

const config = {
    protocol: process.env.RABBITMQ_PROTOCOL,
    password: process.env.RABBITMQ_PASSWORD,
    port: process.env.RABBITMQ_PORT,
    vhost: process.env.RABBITMQ_VHOST,
    hostname: process.env.RABBITMQ_HOSTNAME,
    username: process.env.RABBITMQ_USERNAME
}

const failOnError = (channel, fn) => {
	return new Promise(async (resolve, reject) => {
		channel.on('error', (e) => reject(e));

		try {
			resolve(await fn());
		} catch (e) {
			reject(e);
		}
	});
};

const rabbitConnection = async (retry = 0) => {
	try {
		return await amqp.connect(
            config,
            { servername: config.hostname }
		);
	} catch (err) {
        console.warn( `rabbitmq failed connecting to host: ${config.hostname}`);
        console.log(err);
		if (retry < 10) {
			await sleep(500);

			return await rabbitConnection(retry + 1);
		} else {
			console.error(`rabbitmq connection error for all hosts:`,err.stack);
		}
	}
};

const produce = async ({ exchange, validate }, message) => {
	if (validate) {
		validate(message);
	}
	const connection = await rabbitConnection();
	const channel = await connection.createConfirmChannel();

	try {
		await failOnError(channel, async () => {
			console.info(
				{ exchange, message },
				`Publishing to exchange ${exchange}...`,
			);
			channel.publish(
				exchange,
				'',
				Buffer.from(JSON.stringify(message)),
				{
					mandatory: true,
					persistent: true,
				},
			);
			await channel.waitForConfirms();
			console.info(
				{ exchange, message },
				`Successfully published to exchange ${exchange}.`,
			);
		});
	} finally {
		closeConnection(connection, channel);
	}
};

const closeConnection = (connection, channel) => {
	try {
		channel.close().catch(() => {});
	} catch (e) {
		// Ignored
	}

	try {
		connection.close().catch(() => {});
	} catch (e) {
		// Ignored
	}
};

const cfg = {
	exchange: 'rekognition.exchange',
	logMessageContent: false,
	queue: 'rekognition.queue',
	retryAttempts: 5,
	subscribeOptions: {
		prefetchCount: 1
	}
};
export {
    produce,
    cfg
}
