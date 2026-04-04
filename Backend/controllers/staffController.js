import { sql } from '../../Database/db.js';
import bcrypt from 'bcrypt';

const ALLOWED_POSITIONS = ['waiter', 'chef', 'receptionist'];

const isReceptionist = async (staffId) => {
	const staff = await sql`
		SELECT staff_id, position
		FROM staff
		WHERE staff_id = ${staffId}
	`;

	if (staff.length === 0) {
		return { exists: false, receptionist: false };
	}

	const receptionist = String(staff[0].position || '').toLowerCase() === 'receptionist';
	return { exists: true, receptionist };
};

export const getStaff = async (_req, res) => {
	try {
		const staff = await sql`
			SELECT
				s.staff_id,
				s.first_name,
				s.last_name,
				s.email,
				s.position,
				s.hourly_rate,
				COUNT(DISTINCT r.rota_id) AS rota_count
			FROM staff s
			LEFT JOIN rota r ON r.staff_id = s.staff_id
			GROUP BY s.staff_id, s.first_name, s.last_name, s.email, s.position, s.hourly_rate
			ORDER BY staff_id DESC
		`;

		res.status(200).json({ success: true, data: staff });
	} catch (error) {
		console.error('Error in getStaff function:', error);
		res.status(500).json({ success: false, message: 'Internal server error' });
	}
};

export const getStaffRota = async (req, res) => {
	const { staffId } = req.params;

	try {
		const rota = await sql`
			SELECT rota_id, staff_id, start_time, end_time, work_date
			FROM rota
			WHERE staff_id = ${staffId}
			ORDER BY work_date DESC, start_time DESC
		`;

		res.status(200).json({ success: true, data: rota });
	} catch (error) {
		console.error('Error in getStaffRota function:', error);
		res.status(500).json({ success: false, message: 'Internal server error' });
	}
};

export const getStaffRelations = async (req, res) => {
	const { staffId } = req.params;

	try {
		const staff = await sql`
			SELECT staff_id, first_name, last_name, email, position, hourly_rate
			FROM staff
			WHERE staff_id = ${staffId}
		`;

		if (staff.length === 0) {
			return res.status(404).json({ success: false, message: 'Staff not found' });
		}

		const rota = await sql`
			SELECT rota_id, staff_id, start_time, end_time, work_date
			FROM rota
			WHERE staff_id = ${staffId}
			ORDER BY work_date DESC, start_time DESC
		`;

		res.status(200).json({
			success: true,
			data: {
				staff: staff[0],
				rota,
				summary: {
					rota_count: rota.length,
				},
			},
		});
	} catch (error) {
		console.error('Error in getStaffRelations function:', error);
		res.status(500).json({ success: false, message: 'Internal server error' });
	}
};

export const createStaff = async (req, res) => {
	const { first_name, last_name, email, position, hourly_rate } = req.body;

	if (!first_name || !last_name || !email || !position || hourly_rate === undefined || hourly_rate === null) {
		return res.status(400).json({
			success: false,
			message: 'first_name, last_name, email, position and hourly_rate are required',
		});
	}

	const normalizedPosition = String(position).toLowerCase();
	if (!ALLOWED_POSITIONS.includes(normalizedPosition)) {
		return res.status(400).json({
			success: false,
			message: 'position must be one of: waiter, chef, receptionist',
		});
	}

	try {
		await sql`
			SELECT setval(
				pg_get_serial_sequence('staff', 'staff_id'),
				COALESCE((SELECT MAX(staff_id) FROM staff), 1),
				true
			)
		`;

		const existing = await sql`
			SELECT staff_id FROM staff WHERE email = ${email}
		`;

		if (existing.length > 0) {
			return res.status(409).json({ success: false, message: 'Email already exists for another staff member' });
		}

		const created = await sql`
			INSERT INTO staff (first_name, last_name, email, password, position, hourly_rate)
			VALUES (${first_name}, ${last_name}, ${email}, NULL, ${normalizedPosition}, ${hourly_rate})
			RETURNING staff_id, first_name, last_name, email, position, hourly_rate
		`;

		res.status(201).json({ success: true, data: created[0] });
	} catch (error) {
		console.error('Error in createStaff function:', error);
		res.status(500).json({ success: false, message: 'Internal server error' });
	}
};

export const updateStaff = async (req, res) => {
	const { staffId } = req.params;
	const { first_name, last_name, email, position, hourly_rate } = req.body;

	if (position !== undefined && position !== null) {
		const normalizedPosition = String(position).toLowerCase();
		if (!ALLOWED_POSITIONS.includes(normalizedPosition)) {
			return res.status(400).json({
				success: false,
				message: 'position must be one of: waiter, chef, receptionist',
			});
		}
	}

	try {
		if (email !== undefined && email !== null && String(email).trim() !== '') {
			const existing = await sql`
				SELECT staff_id FROM staff WHERE email = ${email} AND staff_id <> ${staffId}
			`;

			if (existing.length > 0) {
				return res.status(409).json({ success: false, message: 'Email already exists for another staff member' });
			}
		}

		const updated = await sql`
			UPDATE staff
			SET
				first_name = COALESCE(${first_name || null}, first_name),
				last_name = COALESCE(${last_name || null}, last_name),
				email = COALESCE(${email || null}, email),
				position = COALESCE(${position ? String(position).toLowerCase() : null}, position),
				hourly_rate = COALESCE(${hourly_rate ?? null}, hourly_rate)
			WHERE staff_id = ${staffId}
			RETURNING staff_id, first_name, last_name, email, position, hourly_rate
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
			RETURNING staff_id, first_name, last_name, email, position, hourly_rate
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

export const getReceptionists = async (_req, res) => {
	try {
		const receptionists = await sql`
			SELECT
				s.staff_id,
				s.first_name,
				s.last_name,
				s.email,
				s.position,
				COUNT(DISTINCT r.rota_id) AS rota_count
			FROM staff s
			LEFT JOIN rota r ON r.staff_id = s.staff_id
			WHERE LOWER(COALESCE(s.position, '')) = 'receptionist'
			GROUP BY s.staff_id, s.first_name, s.last_name, s.email, s.position
			ORDER BY s.staff_id DESC
		`;

		res.status(200).json({ success: true, data: receptionists });
	} catch (error) {
		console.error('Error in getReceptionists function:', error);
		res.status(500).json({ success: false, message: 'Internal server error' });
	}
};

export const setReceptionistPassword = async (req, res) => {
	const { staffId } = req.params;
	const { password } = req.body;

	if (!password || String(password).trim().length < 6) {
		return res.status(400).json({
			success: false,
			message: 'Password is required and must be at least 6 characters',
		});
	}

	try {
		const staffStatus = await isReceptionist(staffId);
		if (!staffStatus.exists) {
			return res.status(404).json({ success: false, message: 'Staff not found' });
		}

		if (!staffStatus.receptionist) {
			return res.status(400).json({ success: false, message: 'Password can only be set for receptionists' });
		}

		const hashedPassword = await bcrypt.hash(String(password), 10);

		await sql`
			UPDATE staff
			SET password = ${hashedPassword}
			WHERE staff_id = ${staffId}
		`;

		return res.status(200).json({ success: true, message: 'Receptionist password updated successfully' });
	} catch (error) {
		console.error('Error in setReceptionistPassword function:', error);
		return res.status(500).json({ success: false, message: 'Internal server error' });
	}
};

export const assignReceptionistRota = async (req, res) => {
	const { staffId } = req.params;
	const { work_date, start_time, end_time } = req.body;

	if (!work_date || !start_time || !end_time) {
		return res.status(400).json({
			success: false,
			message: 'work_date, start_time and end_time are required',
		});
	}

	const startTimestampText = `${work_date} ${start_time}`;
	const endTimestampText = `${work_date} ${end_time}`;

	try {
		const staffStatus = await isReceptionist(staffId);
		if (!staffStatus.exists) {
			return res.status(404).json({ success: false, message: 'Staff not found' });
		}

		if (!staffStatus.receptionist) {
			return res.status(400).json({ success: false, message: 'Rota can only be assigned to receptionists' });
		}

		const timeValidity = await sql`
			SELECT (${startTimestampText}::timestamp < ${endTimestampText}::timestamp) AS is_valid
		`;

		if (!timeValidity[0]?.is_valid) {
			return res.status(400).json({ success: false, message: 'start_time must be earlier than end_time' });
		}

		const overlap = await sql`
			SELECT rota_id
			FROM rota
			WHERE staff_id = ${staffId}
			  AND work_date = ${work_date}
			  AND (${startTimestampText}::timestamp < end_time)
			  AND (${endTimestampText}::timestamp > start_time)
			LIMIT 1
		`;

		if (overlap.length > 0) {
			return res.status(409).json({
				success: false,
				message: 'This shift overlaps with an existing rota for the receptionist',
			});
		}

		const created = await sql`
			INSERT INTO rota (staff_id, start_time, end_time, work_date)
			VALUES (
				${staffId},
				${startTimestampText}::timestamp,
				${endTimestampText}::timestamp,
				${work_date}
			)
			RETURNING rota_id, staff_id, start_time, end_time, work_date
		`;

		return res.status(201).json({ success: true, data: created[0] });
	} catch (error) {
		console.error('Error in assignReceptionistRota function:', error);
		return res.status(500).json({ success: false, message: 'Internal server error' });
	}
};