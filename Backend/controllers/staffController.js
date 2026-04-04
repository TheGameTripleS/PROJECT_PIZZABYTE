import bcrypt from 'bcrypt';
import { sql } from '../../Database/db.js';

const ALLOWED_POSITIONS = ['waiter', 'chef', 'receptionist'];

export const getStaff = async (_req, res) => {
	try {
		const staff = await sql`
			SELECT
				s.staff_id,
				s.first_name,
				s.last_name,
				s.email,
				LOWER(s.position) AS position,
				s.hourly_rate,
				COUNT(DISTINCT r.rota_id) AS rota_count
			FROM staff s
			LEFT JOIN rota r ON r.staff_id = s.staff_id
			GROUP BY s.staff_id, s.first_name, s.last_name, s.email, LOWER(s.position), s.hourly_rate
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
			SELECT staff_id, first_name, last_name, email, LOWER(position) AS position, hourly_rate
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
	const { first_name, last_name, email, position, hourly_rate, password } = req.body;

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

	const normalizedPassword =
		typeof password === 'string' && password.trim() !== '' ? password.trim() : null;

	if (normalizedPosition === 'receptionist' && !normalizedPassword) {
		return res.status(400).json({
			success: false,
			message: 'password is required for receptionist accounts',
		});
	}

	if (normalizedPassword && normalizedPassword.length < 8) {
		return res.status(400).json({
			success: false,
			message: 'password must be at least 8 characters long',
		});
	}

	if (normalizedPassword && normalizedPosition !== 'receptionist') {
		return res.status(400).json({
			success: false,
			message: 'only receptionists can have login passwords from staff management',
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

		const hashedPassword = normalizedPassword ? await bcrypt.hash(normalizedPassword, 10) : null;

		const created = await sql`
			INSERT INTO staff (first_name, last_name, email, password, position, hourly_rate)
			VALUES (${first_name}, ${last_name}, ${email}, ${hashedPassword}, ${normalizedPosition}, ${hourly_rate})
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
	const { first_name, last_name, email, position, hourly_rate, password } = req.body;

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
		const existingStaff = await sql`
			SELECT staff_id, position, password
			FROM staff
			WHERE staff_id = ${staffId}
		`;

		if (existingStaff.length === 0) {
			return res.status(404).json({ success: false, message: 'Staff not found' });
		}

		const currentStaff = existingStaff[0];
		const nextPosition = position ? String(position).toLowerCase() : String(currentStaff.position).toLowerCase();
		const normalizedPassword =
			typeof password === 'string' && password.trim() !== '' ? password.trim() : null;

		if (nextPosition === 'receptionist' && !currentStaff.password && !normalizedPassword) {
			return res.status(400).json({
				success: false,
				message: 'password is required when assigning receptionist role',
			});
		}

		if (normalizedPassword && normalizedPassword.length < 8) {
			return res.status(400).json({
				success: false,
				message: 'password must be at least 8 characters long',
			});
		}

		if (normalizedPassword && nextPosition !== 'receptionist') {
			return res.status(400).json({
				success: false,
				message: 'only receptionists can have login passwords from staff management',
			});
		}

		if (email !== undefined && email !== null && String(email).trim() !== '') {
			const existing = await sql`
				SELECT staff_id FROM staff WHERE email = ${email} AND staff_id <> ${staffId}
			`;

			if (existing.length > 0) {
				return res.status(409).json({ success: false, message: 'Email already exists for another staff member' });
			}
		}

		const hashedPassword = normalizedPassword ? await bcrypt.hash(normalizedPassword, 10) : null;

		const updated = await sql`
			UPDATE staff
			SET
				first_name = COALESCE(${first_name || null}, first_name),
				last_name = COALESCE(${last_name || null}, last_name),
				email = COALESCE(${email || null}, email),
				position = COALESCE(${position ? String(position).toLowerCase() : null}, position),
				hourly_rate = COALESCE(${hourly_rate ?? null}, hourly_rate),
				password = COALESCE(${hashedPassword}, password)
			WHERE staff_id = ${staffId}
			RETURNING staff_id, first_name, last_name, email, position, hourly_rate
		`;

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
