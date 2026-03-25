import { sql } from '../../Database/db.js';

export const getStaff = async (_req, res) => {
	try {
		const staff = await sql`
			SELECT staff_id, first_name, last_name, position, hourly_rate
			FROM staff
			ORDER BY staff_id DESC
		`;

		res.status(200).json({ success: true, data: staff });
	} catch (error) {
		console.error('Error in getStaff function:', error);
		res.status(500).json({ success: false, message: 'Internal server error' });
	}
};

export const createStaff = async (req, res) => {
	const { first_name, last_name, position, hourly_rate } = req.body;

	if (!first_name || !last_name || !position || hourly_rate === undefined || hourly_rate === null) {
		return res.status(400).json({
			success: false,
			message: 'first_name, last_name, position and hourly_rate are required',
		});
	}

	try {
		const created = await sql`
			INSERT INTO staff (first_name, last_name, position, hourly_rate)
			VALUES (${first_name}, ${last_name}, ${position}, ${hourly_rate})
			RETURNING staff_id, first_name, last_name, position, hourly_rate
		`;

		res.status(201).json({ success: true, data: created[0] });
	} catch (error) {
		console.error('Error in createStaff function:', error);
		res.status(500).json({ success: false, message: 'Internal server error' });
	}
};

export const updateStaff = async (req, res) => {
	const { staffId } = req.params;
	const { first_name, last_name, position, hourly_rate } = req.body;

	try {
		const updated = await sql`
			UPDATE staff
			SET
				first_name = COALESCE(${first_name || null}, first_name),
				last_name = COALESCE(${last_name || null}, last_name),
				position = COALESCE(${position || null}, position),
				hourly_rate = COALESCE(${hourly_rate ?? null}, hourly_rate)
			WHERE staff_id = ${staffId}
			RETURNING staff_id, first_name, last_name, position, hourly_rate
		`;

		if (updated.length === 0) {
			return res.status(404).json({ success: false, message: 'Staff not found' });
		}

		res.status(200).json({ success: true, data: updated[0] });
	} catch (error) {
		console.error('Error in updateStaff function:', error);
		res.status(500).json({ success: false, message: 'Internal server error' });
	}
};

export const deleteStaff = async (req, res) => {
	const { staffId } = req.params;

	try {
		const deleted = await sql`
			DELETE FROM staff
			WHERE staff_id = ${staffId}
			RETURNING staff_id, first_name, last_name, position, hourly_rate
		`;

		if (deleted.length === 0) {
			return res.status(404).json({ success: false, message: 'Staff not found' });
		}

		res.status(200).json({ success: true, data: deleted[0] });
	} catch (error) {
		console.error('Error in deleteStaff function:', error);
		res.status(500).json({ success: false, message: 'Internal server error' });
	}
};
