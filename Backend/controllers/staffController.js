import { sql } from '../../Database/db.js';

export const getStaff = async (_req, res) => {
	try {
		const staff = await sql`
			SELECT
				s.staff_id,
				s.first_name,
				s.last_name,
				s.position,
				s.hourly_rate,
				COUNT(DISTINCT r.rota_id) AS rota_count,
				COUNT(DISTINCT os.row_id) AS order_count
			FROM staff s
			LEFT JOIN rota r ON r.staff_id = s.staff_id
			LEFT JOIN order_staff os ON os.staff_id = s.staff_id
			GROUP BY s.staff_id, s.first_name, s.last_name, s.position, s.hourly_rate
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

export const getStaffOrders = async (req, res) => {
	const { staffId } = req.params;

	try {
		const orders = await sql`
			SELECT
				os.row_id,
				os.order_id,
				os.staff_id,
				os.role,
				o.created_at,
				o.status,
				o.service_type
			FROM order_staff os
			LEFT JOIN orders o ON o.order_id = os.order_id
			WHERE os.staff_id = ${staffId}
			ORDER BY o.created_at DESC
		`;

		res.status(200).json({ success: true, data: orders });
	} catch (error) {
		console.error('Error in getStaffOrders function:', error);
		res.status(500).json({ success: false, message: 'Internal server error' });
	}
};

export const getStaffRelations = async (req, res) => {
	const { staffId } = req.params;

	try {
		const staff = await sql`
			SELECT staff_id, first_name, last_name, position, hourly_rate
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

		const orders = await sql`
			SELECT
				os.row_id,
				os.order_id,
				os.staff_id,
				os.role,
				o.created_at,
				o.status,
				o.service_type
			FROM order_staff os
			LEFT JOIN orders o ON o.order_id = os.order_id
			WHERE os.staff_id = ${staffId}
			ORDER BY o.created_at DESC
		`;

		res.status(200).json({
			success: true,
			data: {
				staff: staff[0],
				rota,
				orders,
				summary: {
					rota_count: rota.length,
					order_count: orders.length,
				},
			},
		});
	} catch (error) {
		console.error('Error in getStaffRelations function:', error);
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
