const router = require('express').Router();
const { getOrgRecognitions } = require('./liveFeedModel');
const { emitterOutput } = require('./liveFeedEmitter');
const { validateId } = require('../../middleware/authMiddleWare');

router.get('/', validateId, (req, res) => {
	getOrgRecognitions(req.profile.org_id).then(data => res.json(data));
});

router.get('/live', validateId, (req, res) => {
	res.writeHead(200, {
		'Content-Type': 'text/event-stream',
		'Cache-Control': 'no-cache',
		Connection: 'keep-alive',
	});

	const sendEvent = event => {
		res.write(`event: ${event.type}\n`);
		res.write(`data: ${JSON.stringify(event.payload)}\n\n`);
	};

	const i = setInterval(
		() =>
			sendEvent({
				type: 'HEARTBEAT',
				payload: { message: 'stay-alive' },
			}),
		5000,
	);

	emitterOutput.on(req.profile.org_name, sendEvent);

	res.on('close', () => {
		emitterOutput.removeListener(req.profile.org_name, sendEvent);
		clearInterval(i);
	});
});

module.exports = router;
